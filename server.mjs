import http from "node:http";
import { createReadStream } from "node:fs";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { randomBytes } from "node:crypto";
import { PilotStore } from "./backend/store.mjs";
import { FORM_VERSION, publicFormSchema } from "./backend/form-schema.mjs";
import { validateSubmission } from "./backend/validation.mjs";
import { extractDocxText } from "./backend/docx.mjs";
import { analyzeReport, analysisToVenue } from "./backend/report-analysis.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const JSON_LIMIT = 6 * 1024 * 1024;
const UPLOAD_LIMIT = 12 * 1024 * 1024;
const REPORT_LIMIT = 20 * 1024 * 1024;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".json": "application/json; charset=utf-8"
};

const PUBLIC_FILES = new Set([
  "/index.html", "/styles.css", "/enhancements.css", "/app.js", "/enhancements-data.js", "/enhancements-ui.js", "/config.js",
  "/pilot-form.html", "/pilot-form.css", "/pilot-form.js",
  "/report-upload.html", "/report-upload.css", "/report-upload.js",
  "/admin.html", "/admin.css", "/admin.js"
]);

const ALLOWED_ORIGINS = new Set((process.env.ALLOWED_ORIGINS || "https://gym-finder.netlify.app,http://127.0.0.1:4173,http://localhost:4173").split(",").map(value => value.trim()).filter(Boolean));

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "content-length": Buffer.byteLength(body), "cache-control": "no-store" });
  res.end(body);
}

function publicTask(task) {
  const { accessToken, ...safe } = task;
  return safe;
}

async function readBody(req, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) {
      const error = new Error("请求内容过大");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function tokenFrom(req, url) {
  return req.headers["x-task-token"] || url.searchParams.get("token") || "";
}

function requireToken(task, req, url) {
  return task && task.accessToken === tokenFrom(req, url);
}

function secretFrom(req, url, header) {
  return req.headers[header] || url.searchParams.get("token") || "";
}

function exposeReport(report, { includeText = false } = {}) {
  const safe = { ...report };
  if (!includeText) delete safe.extractedText;
  return safe;
}

function normalizeVenueDraft(current, patch) {
  const next = { ...current, ...patch };
  next.crowd = { ...current.crowd, ...(patch.crowd || {}) };
  next.contact = { ...current.contact, ...(patch.contact || {}) };
  for (const key of ["monthlyPrice", "trialPrice", "equipment", "rating", "testerCount"]) {
    if (patch[key] !== undefined) next[key] = Number(patch[key]);
  }
  for (const key of ["beginner", "lowSales", "shower", "cleanEnvironment", "open24", "womenFriendly", "nightSafety"]) {
    if (patch[key] !== undefined) next[key] = Boolean(patch[key]);
  }
  return next;
}

function safeFileName(name) {
  const parsed = path.parse(name || "evidence");
  const base = parsed.name.replace(/[^\p{L}\p{N}._-]+/gu, "-").slice(0, 60) || "evidence";
  const ext = parsed.ext.toLowerCase().replace(/[^a-z0-9.]/g, "").slice(0, 10);
  return `${base}${ext}`;
}

async function serveStatic(req, res, url) {
  const requested = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const isPublicAsset = requested.startsWith("/assets/") || requested.startsWith("/video/");
  if (!PUBLIC_FILES.has(requested) && !isPublicAsset) return sendJson(res, 404, { error: "页面不存在" });
  const fullPath = path.resolve(ROOT, `.${requested}`);
  if (!fullPath.startsWith(`${ROOT}${path.sep}`)) return sendJson(res, 403, { error: "路径无效" });
  try {
    const info = await stat(fullPath);
    if (!info.isFile()) throw Object.assign(new Error("not file"), { code: "ENOENT" });
    res.writeHead(200, { "content-type": MIME[path.extname(fullPath).toLowerCase()] || "application/octet-stream", "content-length": info.size });
    createReadStream(fullPath).pipe(res);
  } catch (error) {
    if (error.code === "ENOENT") return sendJson(res, 404, { error: "页面不存在" });
    throw error;
  }
}

export async function createPilotServer({ dataDir = process.env.DATA_DIR || path.join(ROOT, "runtime-data") } = {}) {
  const store = new PilotStore(path.resolve(dataDir));
  await store.init();

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      const origin = req.headers.origin;
      if (origin && ALLOWED_ORIGINS.has(origin)) {
        res.setHeader("access-control-allow-origin", origin);
        res.setHeader("vary", "Origin");
        res.setHeader("access-control-allow-headers", "content-type,x-admin-token,x-upload-token,x-task-token");
        res.setHeader("access-control-allow-methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      }
      if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
      if (url.pathname === "/api/health" && req.method === "GET") return sendJson(res, 200, { ok: true, formVersion: FORM_VERSION });
      if (url.pathname === `/api/form-versions/${FORM_VERSION}` && req.method === "GET") return sendJson(res, 200, publicFormSchema());
      if (url.pathname === "/api/venues" && req.method === "GET") {
        const venues = await store.listPublishedVenues();
        return sendJson(res, 200, { venues, updatedAt: new Date().toISOString() });
      }

      if (url.pathname === "/api/reports" && req.method === "POST") {
        const secrets = await store.getSecrets();
        if (secretFrom(req, url, "x-upload-token") !== secrets.uploadToken) return sendJson(res, 401, { error: "体验官上传口令无效" });
        const originalName = safeFileName(url.searchParams.get("name") || "report.docx");
        const extension = path.extname(originalName).toLowerCase();
        if (![".docx", ".txt"].includes(extension)) return sendJson(res, 415, { error: "第一版仅支持 DOCX 或 TXT 报告" });
        const data = await readBody(req, REPORT_LIMIT);
        if (!data.length) return sendJson(res, 400, { error: "报告文件为空" });

        const now = new Date().toISOString();
        const reportId = `report-${Date.now()}-${randomBytes(4).toString("hex")}`;
        const reportDir = path.join(store.uploadDir, "reports", reportId);
        await mkdir(reportDir, { recursive: true });
        await writeFile(path.join(reportDir, originalName), data);
        const extractedText = extension === ".docx" ? extractDocxText(data) : data.toString("utf8").trim();
        if (extractedText.length < 30) return sendJson(res, 422, { error: "报告中没有提取到足够文字，请确认文件已经填写" });
        const report = {
          id: reportId,
          venueName: (url.searchParams.get("venue") || "").trim(),
          evaluatorName: (url.searchParams.get("evaluator") || "").trim(),
          status: "analyzing",
          originalName,
          storedName: originalName,
          fileSize: data.length,
          extractedText,
          analysis: null,
          analysisMode: null,
          analysisModel: null,
          analysisError: null,
          venueDraft: null,
          createdAt: now,
          updatedAt: now,
          publishedAt: null
        };
        await store.createReport(report);
        try {
          const result = await analyzeReport({ text: extractedText, metadata: { venueName: report.venueName, evaluatorName: report.evaluatorName, originalName } });
          await store.updateReport(reportId, current => {
            current.status = "needs_review";
            current.analysis = result.analysis;
            current.analysisMode = result.mode;
            current.analysisModel = result.model;
            current.openaiResponseId = result.responseId || null;
            current.venueDraft = analysisToVenue(current, result.analysis);
          });
        } catch (error) {
          await store.updateReport(reportId, current => { current.status = "analysis_failed"; current.analysisError = error.message; });
        }
        return sendJson(res, 201, { ok: true, report: exposeReport(await store.getReport(reportId)) });
      }

      const adminReportMatch = url.pathname.match(/^\/api\/admin\/reports(?:\/([^/]+)(?:\/(publish|reanalyze))?)?$/);
      if (adminReportMatch) {
        const secrets = await store.getSecrets();
        if (secretFrom(req, url, "x-admin-token") !== secrets.adminToken) return sendJson(res, 401, { error: "管理员口令无效" });
        const reportId = adminReportMatch[1];
        const action = adminReportMatch[2] || "read";
        if (!reportId && req.method === "GET") return sendJson(res, 200, { reports: (await store.listReports()).map(item => exposeReport(item)) });
        const report = reportId ? await store.getReport(reportId) : null;
        if (!report) return sendJson(res, 404, { error: "没有找到这份报告" });
        if (action === "read" && req.method === "GET") return sendJson(res, 200, { report: exposeReport(report, { includeText: true }) });
        if (action === "read" && req.method === "DELETE") {
          if (report.status === "published") return sendJson(res, 409, { error: "已发布报告需先下架对应场馆，不能直接删除" });
          await store.update(data => { delete data.reports[reportId]; });
          await rm(path.join(store.uploadDir, "reports", reportId), { recursive: true, force: true });
          return sendJson(res, 200, { ok: true });
        }
        if (action === "read" && req.method === "PATCH") {
          const body = JSON.parse((await readBody(req, JSON_LIMIT)).toString("utf8") || "{}");
          await store.updateReport(reportId, current => {
            if (body.venueDraft) current.venueDraft = normalizeVenueDraft(current.venueDraft || {}, body.venueDraft);
            if (body.reviewNotes !== undefined) current.reviewNotes = String(body.reviewNotes);
            if (current.status === "published") current.status = "needs_review";
          });
          return sendJson(res, 200, { ok: true, report: exposeReport(await store.getReport(reportId), { includeText: true }) });
        }
        if (action === "reanalyze" && req.method === "POST") {
          try {
            const result = await analyzeReport({ text: report.extractedText, metadata: { venueName: report.venueName, evaluatorName: report.evaluatorName, originalName: report.originalName } });
            await store.updateReport(reportId, current => {
              current.status = "needs_review";
              current.analysis = result.analysis;
              current.analysisMode = result.mode;
              current.analysisModel = result.model;
              current.analysisError = null;
              current.openaiResponseId = result.responseId || null;
              current.venueDraft = analysisToVenue(current, result.analysis);
            });
            return sendJson(res, 200, { ok: true, report: exposeReport(await store.getReport(reportId), { includeText: true }) });
          } catch (error) {
            return sendJson(res, 502, { error: error.message });
          }
        }
        if (action === "publish" && req.method === "POST") {
          const draft = report.venueDraft;
          const missing = [];
          if (!draft?.name?.trim()) missing.push("场馆名称");
          if (!draft?.district?.trim() || draft.district.includes("待补充")) missing.push("区域");
          if (!Number.isFinite(Number(draft?.rating)) || Number(draft.rating) <= 0 || Number(draft.rating) > 10) missing.push("0–10 分的审核评分");
          if (!draft?.fit?.trim()) missing.push("适合人群");
          if (!draft?.caution?.trim()) missing.push("注意事项");
          if (missing.length) return sendJson(res, 422, { error: "发布前仍需完成审核", missing });
          const publishedAt = new Date().toISOString();
          await store.updateReport(reportId, (current, data) => {
            current.status = "published";
            current.publishedAt = publishedAt;
            current.venueDraft.updated = publishedAt.slice(0, 10);
            const previous = data.publishedVenues[current.venueDraft.id];
            data.publishedVenues[current.venueDraft.id] = {
              venue: current.venueDraft,
              visible: true,
              version: (previous?.version || 0) + 1,
              reportId,
              publishedAt
            };
          });
          return sendJson(res, 200, { ok: true, publishedAt, venue: (await store.getReport(reportId)).venueDraft });
        }
      }

      const adminVenueMatch = url.pathname.match(/^\/api\/admin\/venues\/([^/]+)$/);
      if (adminVenueMatch) {
        const secrets = await store.getSecrets();
        if (secretFrom(req, url, "x-admin-token") !== secrets.adminToken) return sendJson(res, 401, { error: "管理员口令无效" });
        const venueId = decodeURIComponent(adminVenueMatch[1]);
        if (req.method === "DELETE") {
          const changed = await store.update(data => {
            if (!data.publishedVenues[venueId]) return false;
            data.publishedVenues[venueId].visible = false;
            data.publishedVenues[venueId].hiddenAt = new Date().toISOString();
            return true;
          });
          if (!changed) return sendJson(res, 404, { error: "没有找到已发布场馆" });
          return sendJson(res, 200, { ok: true });
        }
      }

      const taskMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)(?:\/(draft|submit|evidence))?$/);
      if (taskMatch) {
        const taskId = taskMatch[1];
        const action = taskMatch[2] || "read";
        const task = await store.getTask(taskId);
        if (!task) return sendJson(res, 404, { error: "未找到测评任务" });
        if (!requireToken(task, req, url)) return sendJson(res, 401, { error: "任务链接或访问口令无效" });

        if (action === "read" && req.method === "GET") return sendJson(res, 200, publicTask(task));

        if (action === "draft" && req.method === "PUT") {
          if (task.status === "submitted") return sendJson(res, 409, { error: "任务已提交，不能继续修改" });
          const body = JSON.parse((await readBody(req, JSON_LIMIT)).toString("utf8") || "{}");
          if (body.formVersion !== task.formVersion) return sendJson(res, 409, { error: "表单版本不一致，请刷新页面" });
          await store.updateTask(taskId, current => { current.answers = body.answers; });
          return sendJson(res, 200, { ok: true, savedAt: new Date().toISOString() });
        }

        if (action === "submit" && req.method === "POST") {
          if (task.status === "submitted") return sendJson(res, 200, { ok: true, alreadySubmitted: true, submittedAt: task.submittedAt });
          const body = JSON.parse((await readBody(req, JSON_LIMIT)).toString("utf8") || "{}");
          const answers = body.answers || task.answers;
          const validation = validateSubmission(answers);
          if (!validation.valid) return sendJson(res, 422, { error: "仍有必填内容未完成", missing: validation.missing });
          const submittedAt = new Date().toISOString();
          await store.updateTask(taskId, current => {
            current.answers = answers;
            current.status = "submitted";
            current.submittedAt = submittedAt;
          });
          return sendJson(res, 200, { ok: true, submittedAt });
        }

        if (action === "evidence" && req.method === "POST") {
          if (task.status === "submitted") return sendJson(res, 409, { error: "任务已提交，不能继续上传" });
          const fileName = safeFileName(url.searchParams.get("name"));
          const mimeType = (req.headers["content-type"] || "application/octet-stream").split(";")[0];
          const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
          if (!allowed.includes(mimeType)) return sendJson(res, 415, { error: "仅支持 JPG、PNG、WebP 或 PDF" });
          const data = await readBody(req, UPLOAD_LIMIT);
          if (!data.length) return sendJson(res, 400, { error: "文件为空" });
          const evidenceId = `ev-${Date.now()}-${randomBytes(4).toString("hex")}`;
          const taskDir = path.join(store.uploadDir, taskId);
          await mkdir(taskDir, { recursive: true });
          const storedName = `${evidenceId}-${fileName}`;
          await writeFile(path.join(taskDir, storedName), data);
          const record = { id: evidenceId, originalName: fileName, storedName, mimeType, size: data.length, module: url.searchParams.get("module") || "其他", note: url.searchParams.get("note") || "", uploadedAt: new Date().toISOString() };
          await store.updateTask(taskId, current => { current.evidence.push(record); });
          return sendJson(res, 201, { ok: true, evidence: record });
        }
      }

      if (url.pathname.startsWith("/api/")) return sendJson(res, 404, { error: "接口不存在" });
      return serveStatic(req, res, url);
    } catch (error) {
      console.error(error);
      return sendJson(res, error.status || 500, { error: error.status ? error.message : "服务器处理失败" });
    }
  });

  return { server, store };
}

export async function startPilotServer({ port = Number(process.env.PORT || 4173), host = process.env.HOST || (process.env.RENDER ? "0.0.0.0" : "127.0.0.1"), dataDir } = {}) {
  const { server, store } = await createPilotServer({ dataDir });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, resolve);
  });
  const address = server.address();
  const actualPort = typeof address === "object" ? address.port : port;
  const task = await store.getTask("pilot-001");
  const secrets = await store.getSecrets();
  const base = `http://${host}:${actualPort}`;
  console.log(`练哪儿本地服务已启动：${base}`);
  if (process.env.NODE_ENV === "production") {
    console.log("生产环境已启用；上传口令和管理员口令不会写入日志。");
  } else {
    console.log(`首轮体验官入口：${base}/pilot-form.html?task=pilot-001&token=${task.accessToken}`);
    console.log(`报告上传入口：${base}/report-upload.html?token=${secrets.uploadToken}`);
    console.log(`管理员审核入口：${base}/admin.html?token=${secrets.adminToken}`);
  }
  return { server, store, url: base, task, secrets };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  startPilotServer().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
