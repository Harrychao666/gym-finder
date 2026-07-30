// @ts-ignore - migrated JavaScript modules are bundled by Vite.
import { analyzeReport, analysisToVenue, createTestAnalysis } from "../lib/report-analysis.mjs";
// @ts-ignore - migrated JavaScript modules are bundled by Vite.
import {
  REPORT_SCHEMA_VERSION,
  cardTypes,
  equipmentReferenceCatalog,
  extraFeeTypes
} from "../lib/form-schema.mjs";
// @ts-ignore - migrated JavaScript modules are bundled by Vite.
import { extractDocxText } from "../lib/docx.mjs";

interface Env {
  DB: D1Database;
  FILES: R2Bucket | KVNamespace;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  ADMIN_TOKEN?: string;
  PLATFORM_ADMIN_TOKEN?: string;
  UPLOAD_TOKEN?: string;
  ALLOWED_ORIGINS?: string;
  TENCENT_LBS_KEY?: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

type JsonObject = Record<string, any>;

type StoredFileOptions = {
  contentType?: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
};

type StoredFile = {
  body: ReadableStream;
  httpEtag?: string;
  writeHttpMetadata(headers: Headers): void;
};

function isKvNamespace(store: R2Bucket | KVNamespace): store is KVNamespace {
  return "getWithMetadata" in store;
}

async function putStoredFile(env: Env, key: string, value: ArrayBufferView, options: StoredFileOptions = {}) {
  if (isKvNamespace(env.FILES)) {
    await env.FILES.put(key, value, {
      metadata: {
        ...(options.metadata || {}),
        ...(options.contentType ? { contentType: options.contentType } : {}),
        ...(options.cacheControl ? { cacheControl: options.cacheControl } : {})
      }
    });
    return;
  }
  await env.FILES.put(key, value, {
    httpMetadata: {
      contentType: options.contentType,
      cacheControl: options.cacheControl
    },
    customMetadata: options.metadata
  });
}

async function getStoredFile(env: Env, key: string): Promise<StoredFile | null> {
  if (!isKvNamespace(env.FILES)) return env.FILES.get(key);
  const result = await env.FILES.getWithMetadata(key, { type: "stream" });
  if (!result.value) return null;
  const metadata = result.metadata || {};
  return {
    body: result.value,
    writeHttpMetadata(headers: Headers) {
      if (metadata.contentType) headers.set("content-type", metadata.contentType);
      if (metadata.cacheControl) headers.set("cache-control", metadata.cacheControl);
    }
  };
}

async function deleteStoredFile(env: Env, key: string) {
  await env.FILES.delete(key);
}

type ReportRow = {
  id: string;
  venue_id: string | null;
  venue_name: string;
  evaluator_name: string;
  status: string;
  original_name: string;
  r2_key: string;
  file_size: number;
  extracted_text: string;
  analysis_json: string | null;
  analysis_mode: string | null;
  analysis_model: string | null;
  analysis_error: string | null;
  openai_response_id: string | null;
  report_schema_version: string | null;
  venue_draft_json: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

let schemaReady: Promise<void> | null = null;

function ensureSchema(env: Env): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await env.DB.prepare(`CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        venue_id TEXT,
        venue_name TEXT NOT NULL DEFAULT '',
        evaluator_name TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL,
        original_name TEXT NOT NULL,
        r2_key TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        extracted_text TEXT NOT NULL,
        analysis_json TEXT,
        analysis_mode TEXT,
        analysis_model TEXT,
        analysis_error TEXT,
        openai_response_id TEXT,
        report_schema_version TEXT,
        venue_draft_json TEXT,
        review_notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        published_at TEXT
      )`).run();
      const columns = await env.DB.prepare("PRAGMA table_info(reports)").all<{ name: string }>();
      if (!(columns.results || []).some(column => column.name === "venue_id")) {
        await env.DB.prepare("ALTER TABLE reports ADD COLUMN venue_id TEXT").run();
      }
      if (!(columns.results || []).some(column => column.name === "report_schema_version")) {
        await env.DB.prepare("ALTER TABLE reports ADD COLUMN report_schema_version TEXT").run();
      }
      await env.DB.batch([
        env.DB.prepare("CREATE INDEX IF NOT EXISTS reports_created_at_idx ON reports(created_at DESC)"),
        env.DB.prepare("CREATE INDEX IF NOT EXISTS reports_venue_id_idx ON reports(venue_id, created_at DESC)"),
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS published_venues (
        id TEXT PRIMARY KEY,
        venue_json TEXT NOT NULL,
        visible INTEGER NOT NULL DEFAULT 1,
        version INTEGER NOT NULL DEFAULT 1,
        report_id TEXT NOT NULL,
        published_at TEXT NOT NULL,
        hidden_at TEXT
      )`),
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS venue_reviewers (
          venue_id TEXT PRIMARY KEY,
          reviewer_name TEXT NOT NULL,
          token_hash TEXT NOT NULL UNIQUE,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )`),
        env.DB.prepare(`CREATE TABLE IF NOT EXISTS venue_change_log (
          id TEXT PRIMARY KEY,
          venue_id TEXT NOT NULL,
          report_id TEXT,
          actor_role TEXT NOT NULL,
          actor_name TEXT NOT NULL,
          action TEXT NOT NULL,
          changes_json TEXT NOT NULL,
          note TEXT,
          created_at TEXT NOT NULL
        )`),
        env.DB.prepare("CREATE INDEX IF NOT EXISTS venue_change_log_venue_created_idx ON venue_change_log(venue_id, created_at DESC)")
      ]);
    })().catch((error: unknown) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady!;
}

function parseJson(value: string | null) {
  if (!value) return null;
  try { return JSON.parse(value); } catch { return null; }
}

function rowToSchemaVersion(venue: JsonObject | null) {
  return String(venue?.reportSchemaVersion || "legacy-v1");
}

function rowToReport(row: ReportRow): JsonObject {
  return {
    id: row.id,
    venueId: row.venue_id,
    venueName: row.venue_name,
    evaluatorName: row.evaluator_name,
    status: row.status,
    originalName: row.original_name,
    storedName: row.original_name,
    r2Key: row.r2_key,
    fileSize: row.file_size,
    extractedText: row.extracted_text,
    analysis: parseJson(row.analysis_json),
    analysisMode: row.analysis_mode,
    analysisModel: row.analysis_model,
    analysisError: row.analysis_error,
    openaiResponseId: row.openai_response_id,
    reportSchemaVersion: row.report_schema_version || rowToSchemaVersion(parseJson(row.venue_draft_json)),
    venueDraft: parseJson(row.venue_draft_json),
    reviewNotes: row.review_notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at
  };
}

async function getReport(env: Env, id: string) {
  const row = await env.DB.prepare("SELECT * FROM reports WHERE id = ?").bind(id).first<ReportRow>();
  return row ? rowToReport(row) : null;
}

async function saveReport(env: Env, report: JsonObject) {
  report.updatedAt = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO reports (
    id, venue_id, venue_name, evaluator_name, status, original_name, r2_key, file_size,
    extracted_text, analysis_json, analysis_mode, analysis_model, analysis_error,
    openai_response_id, report_schema_version, venue_draft_json, review_notes, created_at, updated_at, published_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    venue_id=excluded.venue_id,
    venue_name=excluded.venue_name,
    evaluator_name=excluded.evaluator_name,
    status=excluded.status,
    original_name=excluded.original_name,
    r2_key=excluded.r2_key,
    file_size=excluded.file_size,
    extracted_text=excluded.extracted_text,
    analysis_json=excluded.analysis_json,
    analysis_mode=excluded.analysis_mode,
    analysis_model=excluded.analysis_model,
    analysis_error=excluded.analysis_error,
    openai_response_id=excluded.openai_response_id,
    report_schema_version=excluded.report_schema_version,
    venue_draft_json=excluded.venue_draft_json,
    review_notes=excluded.review_notes,
    updated_at=excluded.updated_at,
    published_at=excluded.published_at`).bind(
      report.id,
      report.venueId || null,
      report.venueName || "",
      report.evaluatorName || "",
      report.status,
      report.originalName,
      report.r2Key,
      Number(report.fileSize) || 0,
      report.extractedText || "",
      report.analysis ? JSON.stringify(report.analysis) : null,
      report.analysisMode || null,
      report.analysisModel || null,
      report.analysisError || null,
      report.openaiResponseId || null,
      report.reportSchemaVersion || report.venueDraft?.reportSchemaVersion || null,
      report.venueDraft ? JSON.stringify(report.venueDraft) : null,
      report.reviewNotes || null,
      report.createdAt,
      report.updatedAt,
      report.publishedAt || null
    ).run();
  return report;
}

function allowedOrigin(request: Request, env: Env) {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const current = new URL(request.url).origin;
  const configured = (env.ALLOWED_ORIGINS || "https://youjian-haoguan.harry88767.chatgpt.site")
    .split(",").map(value => value.trim()).filter(Boolean);
  return origin === current || configured.includes(origin) ? origin : null;
}

function responseHeaders(request: Request, env: Env) {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  const origin = allowedOrigin(request, env);
  if (origin) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-headers", "content-type,x-admin-token,x-upload-token");
    headers.set("access-control-allow-methods", "GET,POST,PATCH,DELETE,OPTIONS");
    headers.set("vary", "Origin");
  }
  return headers;
}

function json(request: Request, env: Env, status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), { status, headers: responseHeaders(request, env) });
}

function publicReport(report: JsonObject, includeText = false) {
  const safe = { ...report };
  delete safe.r2Key;
  if (!includeText) delete safe.extractedText;
  return safe;
}

function token(request: Request, header: string) {
  return request.headers.get(header) || new URL(request.url).searchParams.get("token") || "";
}

type AdminRole = "reviewer" | "platform_admin";
type AdminAuth = { role: AdminRole; venueId: string | null; reviewerName: string };

async function tokenHash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function adminAuth(request: Request, env: Env): Promise<AdminAuth | null> {
  const supplied = token(request, "x-admin-token");
  if (env.PLATFORM_ADMIN_TOKEN && supplied === env.PLATFORM_ADMIN_TOKEN) {
    return { role: "platform_admin", venueId: null, reviewerName: "平台管理员" };
  }
  if (!supplied) return null;
  const assignment = await env.DB.prepare("SELECT venue_id, reviewer_name FROM venue_reviewers WHERE token_hash = ?")
    .bind(await tokenHash(supplied)).first<{ venue_id: string; reviewer_name: string }>();
  if (assignment) return { role: "reviewer", venueId: assignment.venue_id, reviewerName: assignment.reviewer_name };
  return null;
}

function canAccessVenue(auth: AdminAuth, venueId: unknown) {
  return auth.role === "platform_admin" || Boolean(auth.venueId && auth.venueId === String(venueId || ""));
}

function requireUploadSecret(request: Request, env: Env) {
  return Boolean(env.UPLOAD_TOKEN && token(request, "x-upload-token") === env.UPLOAD_TOKEN);
}

function safeFileName(value: string) {
  const name = value.split(/[\\/]/).pop() || "report.docx";
  return name.replace(/[^\p{L}\p{N}._-]+/gu, "-").slice(0, 90) || "report.docx";
}

function extension(name: string) {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index).toLowerCase() : "";
}

const planAliasKeys: Record<string, string> = {
  "单次": "single",
  "周卡": "weekly",
  "月卡": "monthly",
  "季卡": "quarterly",
  "年卡": "annual"
};

const planFlatKeys: Record<string, string> = {
  "单次": "trialPrice",
  "周卡": "weeklyPrice",
  "月卡": "monthlyPrice",
  "季卡": "quarterlyPrice",
  "年卡": "annualPrice"
};

function hasOwn(value: unknown, key: string) {
  return Boolean(value && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, key));
}

function cleanText(value: unknown, limit = 500) {
  return String(value || "").trim().slice(0, limit);
}

function textItems(value: unknown, limit = 12) {
  if (Array.isArray(value)) return value.map(item => cleanText(item)).filter(Boolean).slice(0, limit);
  const text = cleanText(value, 4000);
  return text ? text.split(/\r?\n|[；;]/).map(item => item.replace(/^[\s•·\-\d.、]+/, "").trim()).filter(Boolean).slice(0, limit) : [];
}

function finiteNonNegative(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function unknownNumber(value: unknown, integer = false) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < -1) return -1;
  return integer ? Math.trunc(number) : number;
}

function normalizeMedia(value: unknown, limit = 12, fallbackCaption = "场馆实拍") {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item: unknown) => item && typeof item === "object")
    .map((item: JsonObject) => ({
      src: cleanText(item.src, 1200),
      caption: cleanText(item.caption || fallbackCaption, 160),
      date: cleanText(item.date || new Date().toISOString().slice(0, 10), 32)
    }))
    .filter((item: JsonObject) => item.src)
    .slice(0, limit);
}

function normalizePricing(venue: JsonObject, pricingInput: JsonObject = {}) {
  const planRows = Array.isArray(pricingInput.plans) ? pricingInput.plans : [];
  const plans = cardTypes.map((name: string) => {
    const alias = planAliasKeys[name];
    const flatKey = planFlatKeys[name];
    const listed = planRows.find((item: JsonObject) =>
      item?.name === name || item?.label === name || [item?.id, item?.key, item?.type].includes(alias)
    );
    const raw = hasOwn(pricingInput, alias) ? pricingInput[alias] : listed;
    const rawObject = raw && typeof raw === "object" ? raw : {};
    const amountValue = raw && typeof raw !== "object" ? raw : rawObject.amount ?? rawObject.price;
    const flatAmount = venue[flatKey];
    const amount = finiteNonNegative(amountValue, finiteNonNegative(flatAmount));
    const provided = hasOwn(rawObject, "provided") ? Boolean(rawObject.provided) : amount > 0;
    return {
      id: alias,
      key: alias,
      label: name,
      name,
      provided,
      amount,
      validity: cleanText(rawObject.validity, 120),
      source: cleanText(rawObject.source || "未填写", 40),
      note: cleanText(rawObject.note, 300),
      evidenceStatus: cleanText(rawObject.evidenceStatus || rawObject.status || (provided ? "reported" : "not_offered"), 40)
    };
  });

  const feeSource = Array.isArray(pricingInput.fees)
    ? pricingInput.fees
    : Array.isArray(pricingInput.additionalFees)
      ? pricingInput.additionalFees
      : Array.isArray(venue.additionalFees)
        ? venue.additionalFees
        : [];
  const fees = extraFeeTypes.map((name: string) => {
    const item = feeSource.find((entry: unknown) => typeof entry === "object" && entry && [(entry as JsonObject).name, (entry as JsonObject).label].includes(name));
    const stringItem = feeSource.find((entry: unknown) => typeof entry === "string" && entry.includes(name));
    const row = item && typeof item === "object" ? item as JsonObject : {};
    const proactivelyDisclosed = typeof row.proactivelyDisclosed === "boolean"
      ? row.proactivelyDisclosed
      : row.disclosed === "yes"
        ? true
        : row.disclosed === "no"
          ? false
          : null;
    return {
      id: cleanText(row.id || row.key || `fee-${extraFeeTypes.indexOf(name) + 1}`, 80),
      key: cleanText(row.key || row.id || `fee-${extraFeeTypes.indexOf(name) + 1}`, 80),
      label: name,
      name,
      rule: cleanText(row.rule ?? row.value ?? stringItem ?? "", 300).replace(new RegExp(`^${name}[：:]?\\s*`), ""),
      disclosed: ["yes", "no", "na", "unknown"].includes(String(row.disclosed))
        ? String(row.disclosed)
        : proactivelyDisclosed === true
          ? "yes"
          : proactivelyDisclosed === false
            ? "no"
            : "unknown",
      proactivelyDisclosed,
      note: cleanText(row.note, 300),
      source: cleanText(row.source, 80),
      evidenceStatus: cleanText(row.evidenceStatus || row.status || (row.rule || stringItem ? "reported" : "unknown"), 40)
    };
  });
  return {
    plans,
    fees,
    feesReviewed: Boolean(pricingInput.feesReviewed || pricingInput.additionalFeesReviewed)
  };
}

function normalizeCrowdObservations(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 5).map((record: JsonObject) => {
    const range = cleanText(record.timeRange, 80);
    const rangeMatch = range.match(/(\d{1,2}:\d{2})\s*(?:[-–—~至])\s*(\d{1,2}:\d{2})/);
    const date = cleanText(record.date || String(record.observedAt || "").slice(0, 10), 32);
    const start = cleanText(record.start || rangeMatch?.[1], 16);
    const end = cleanText(record.end || rangeMatch?.[2], 16);
    const cardioWaitMinutes = unknownNumber(record.cardioWaitMinutes);
    const cableWaitMinutes = unknownNumber(record.cableWaitMinutes ?? record.cableWait);
    const statedMax = unknownNumber(record.maxWaitMinutes ?? record.maxWait);
    const waits = [cardioWaitMinutes, cableWaitMinutes, statedMax].filter(number => number >= 0);
    const rawState = cleanText(record.state || record.judgment, 20);
    const state = rawState === "拥挤" ? "高峰" : ["宽松", "一般", "高峰", "未填写"].includes(rawState) ? rawState : "未填写";
    const rawDayType = cleanText(record.dayType, 20);
    const dayType = ["weekday", "工作日"].includes(rawDayType) ? "weekday"
      : ["weekend", "周末"].includes(rawDayType) ? "weekend" : "unknown";
    return {
      observedAt: cleanText(record.observedAt || (date && start ? `${date}T${start}:00` : ""), 64),
      date,
      start,
      end,
      dayType,
      isWeekdayPeak: Boolean(record.isWeekdayPeak),
      cardioVacancies: unknownNumber(record.cardioVacancies, true),
      cardioWaitMinutes,
      cableVacancies: unknownNumber(record.cableVacancies, true),
      cableWaitMinutes,
      queuePeople: unknownNumber(record.queuePeople, true),
      approxPeople: unknownNumber(record.approxPeople ?? record.peopleCount, true),
      maxWaitMinutes: waits.length ? Math.max(...waits) : -1,
      state,
      description: cleanText(record.description || record.note, 1200),
      evidence: textItems(record.evidence, 6)
    };
  });
}

function normalizeEquipmentInventory(value: unknown, currentValue: unknown = []) {
  if (!Array.isArray(value) || (!value.length && !Array.isArray(currentValue))) return [];
  const current = Array.isArray(currentValue) ? currentValue : [];
  const source = value.length ? value : current;
  if (!source.length) return [];
  return equipmentReferenceCatalog.map((referenceCategory: JsonObject) => {
    const incoming = source.find((category: JsonObject) => {
      const rawId = cleanText(category?.id || category?.code, 20);
      return rawId === referenceCategory.id || rawId === referenceCategory.key;
    }) || {};
    const previous = current.find((category: JsonObject) => category?.id === referenceCategory.id) || {};
    const incomingItems = Array.isArray(incoming.items) ? incoming.items : [];
    const previousItems = Array.isArray(previous.items) ? previous.items : [];
    const items = referenceCategory.items.map((reference: JsonObject) => {
      const item = incomingItems.find((candidate: JsonObject) => candidate?.code === reference.code || candidate?.name === reference.name) || {};
      const oldItem = previousItems.find((candidate: JsonObject) => candidate?.code === reference.code || candidate?.name === reference.name) || {};
      const total = Math.trunc(finiteNonNegative(item.total ?? item.totalCount, finiteNonNegative(oldItem.total)));
      const available = Math.min(total, Math.trunc(finiteNonNegative(item.available ?? item.availableCount, finiteNonNegative(oldItem.available))));
      const issuePhotos = hasOwn(item, "issuePhotos")
        ? normalizeMedia(item.issuePhotos, 6, "器械问题现场反馈")
        : normalizeMedia(oldItem.issuePhotos, 6, "器械问题现场反馈");
      const rawStatus = cleanText(item.status || oldItem.status, 20);
      const issueSummary = cleanText(item.issueSummary ?? oldItem.issueSummary, 600);
      const status = ["ok", "issue", "unknown"].includes(rawStatus)
        ? rawStatus
        : (total > available || issueSummary || issuePhotos.length ? "issue" : total > 0 ? "ok" : "unknown");
      return {
        name: reference.name,
        code: reference.code,
        referenceImage: reference.referenceImage,
        total,
        available,
        maxWaitMinutes: unknownNumber(item.maxWaitMinutes ?? item.wait ?? oldItem.maxWaitMinutes),
        status,
        issueSummary,
        issuePhotos,
        note: cleanText(item.note ?? oldItem.note, 600),
        evidence: textItems(item.evidence ?? oldItem.evidence, 6)
      };
    });
    const summedTotal = items.reduce((sum: number, item: JsonObject) => sum + item.total, 0);
    const summedAvailable = items.reduce((sum: number, item: JsonObject) => sum + item.available, 0);
    const total = Math.trunc(finiteNonNegative(incoming.total ?? incoming.totalCount, finiteNonNegative(previous.total, summedTotal))) || summedTotal;
    const available = Math.min(total, Math.trunc(finiteNonNegative(incoming.available ?? incoming.availableCount, finiteNonNegative(previous.available, summedAvailable))) || summedAvailable);
    return {
      id: referenceCategory.id,
      label: referenceCategory.label,
      total,
      available,
      maxWaitMinutes: unknownNumber(incoming.maxWaitMinutes ?? previous.maxWaitMinutes),
      summary: cleanText(incoming.summary ?? previous.summary, 900),
      items
    };
  });
}

function normalizeFullReport(value: unknown, venue: JsonObject) {
  const report = value && typeof value === "object" ? value as JsonObject : {};
  const sectionsSource = Array.isArray(report.sections)
    ? report.sections
    : Array.isArray(venue.reportSections)
      ? venue.reportSections
      : [];
  const sections = sectionsSource.slice(0, 12).map((section: JsonObject, index: number) => ({
    id: cleanText(section.id || `section-${index + 1}`, 80),
    title: cleanText(section.title || `报告第 ${index + 1} 部分`, 120),
    summary: cleanText(section.summary, 1600),
    facts: textItems(section.facts, 12),
    evidence: textItems(section.evidence, 8)
  }));
  return {
    conclusion: cleanText(report.conclusion || venue.summary, 2400),
    recommendations: textItems(report.recommendations, 6),
    cautions: textItems(report.cautions || venue.caution, 6),
    fit: cleanText(report.fit || venue.fit, 900),
    unfit: cleanText(report.unfit, 900),
    sessionSummary: cleanText(report.sessionSummary, 1200),
    sections
  };
}

function upgradeVenueForRead(input: JsonObject) {
  const venue = { ...(input || {}) };
  venue.reportSchemaVersion = cleanText(venue.reportSchemaVersion || "legacy-v1", 80);
  venue.pricing = normalizePricing(venue, venue.pricing || {});
  venue.crowdObservations = normalizeCrowdObservations(venue.crowdObservations || []);
  venue.equipmentInventory = normalizeEquipmentInventory(venue.equipmentInventory || []);
  venue.fullReport = normalizeFullReport(venue.fullReport || {}, venue);
  venue.reportSections = venue.fullReport.sections;
  venue.reportSummary = {
    conclusion: venue.fullReport.conclusion,
    recommendations: venue.fullReport.recommendations,
    cautions: venue.fullReport.cautions
  };
  return venue;
}

function normalizeVenueDraft(current: JsonObject, patch: JsonObject) {
  const base = upgradeVenueForRead(current || {});
  const next = { ...base, ...patch };
  next.crowd = { ...(base.crowd || {}), ...(patch.crowd || {}) };
  next.contact = { ...(base.contact || {}), ...(patch.contact || {}) };
  next.reportSchemaVersion = cleanText(patch.reportSchemaVersion || base.reportSchemaVersion || REPORT_SCHEMA_VERSION, 80);
  if (Array.isArray(patch.coordinates)) next.coordinates = patch.coordinates.map(Number).slice(0, 2);
  if (Array.isArray(patch.gallery)) next.gallery = normalizeMedia(patch.gallery, 12);
  for (const key of ["monthlyPrice", "trialPrice", "weeklyPrice", "quarterlyPrice", "annualPrice", "equipment", "rating", "experienceScore", "evidenceConfidence", "testerCount"]) {
    if (patch[key] !== undefined) next[key] = Number(patch[key]);
  }
  for (const key of ["beginner", "lowSales", "shower", "cleanEnvironment", "open24", "womenFriendly", "nightSafety", "riskReviewed"]) {
    if (patch[key] !== undefined) next[key] = Boolean(patch[key]);
  }
  for (const key of ["highlights", "evidence", "additionalFees"]) {
    if (Array.isArray(patch[key])) next[key] = textItems(patch[key], 12);
  }

  const pricingPatch = patch.pricing && typeof patch.pricing === "object" ? patch.pricing : {};
  const pricingInput = {
    ...(base.pricing || {}),
    ...pricingPatch,
    plans: Array.isArray(pricingPatch.plans) ? pricingPatch.plans : base.pricing?.plans,
    fees: Array.isArray(pricingPatch.fees)
      ? pricingPatch.fees
      : Array.isArray(pricingPatch.additionalFees)
        ? pricingPatch.additionalFees
        : Array.isArray(patch.additionalFees)
          ? patch.additionalFees
          : base.pricing?.fees
  };
  for (const name of cardTypes) {
    const alias = planAliasKeys[name];
    const flatKey = planFlatKeys[name];
    if (patch[flatKey] !== undefined && !hasOwn(pricingPatch, alias)) {
      const listed = pricingInput.plans?.find((item: JsonObject) => item?.name === name) || {};
      pricingInput[alias] = { ...listed, amount: patch[flatKey], provided: Number(patch[flatKey]) > 0 };
    }
  }
  next.pricing = normalizePricing(next, pricingInput);
  for (const plan of next.pricing.plans) next[planFlatKeys[plan.name]] = Number(plan.amount) || 0;
  next.additionalFees = next.pricing.fees
    .filter((fee: JsonObject) => fee.rule || fee.note)
    .map((fee: JsonObject) => `${fee.name}：${fee.rule || fee.note}`);

  if (Array.isArray(patch.crowdObservations)) next.crowdObservations = normalizeCrowdObservations(patch.crowdObservations);
  else next.crowdObservations = base.crowdObservations;

  if (Array.isArray(patch.equipmentInventory)) {
    next.equipmentInventory = normalizeEquipmentInventory(patch.equipmentInventory, base.equipmentInventory);
  } else {
    next.equipmentInventory = base.equipmentInventory;
  }

  let fullReportInput = patch.fullReport && typeof patch.fullReport === "object"
    ? patch.fullReport
    : Array.isArray(patch.reportSections)
      ? { ...(base.fullReport || {}), sections: patch.reportSections }
      : base.fullReport;
  if (patch.reportSummary && typeof patch.reportSummary === "object") {
    fullReportInput = {
      ...(fullReportInput || {}),
      conclusion: patch.reportSummary.conclusion ?? fullReportInput?.conclusion,
      recommendations: patch.reportSummary.recommendations ?? fullReportInput?.recommendations,
      cautions: patch.reportSummary.cautions ?? patch.reportSummary.mustKnow ?? fullReportInput?.cautions,
      fit: patch.fit ?? fullReportInput?.fit
    };
  }
  next.fullReport = normalizeFullReport(fullReportInput, next);
  next.reportSections = next.fullReport.sections;
  next.reportSummary = {
    conclusion: next.fullReport.conclusion,
    recommendations: next.fullReport.recommendations,
    cautions: next.fullReport.cautions
  };
  return next;
}

const scoreManagedKeys = new Set([
  "id", "reportId", "rating", "experienceScore", "equipment", "scoreModules", "evidenceConfidence",
  "confidenceGrade", "scoringVersion", "publicationGates", "verificationStatus", "source", "testerCount", "testMode",
  "reportSchemaVersion"
]);

function auditSnapshot(venue: JsonObject) {
  return {
    name: String(venue?.name || ""),
    district: String(venue?.district || ""),
    type: String(venue?.type || ""),
    category: String(venue?.category || ""),
    pricing: {
      trialPrice: Number(venue?.trialPrice) || 0,
      weeklyPrice: Number(venue?.weeklyPrice) || 0,
      monthlyPrice: Number(venue?.monthlyPrice) || 0,
      quarterlyPrice: Number(venue?.quarterlyPrice) || 0,
      annualPrice: Number(venue?.annualPrice) || 0,
      additionalFees: Array.isArray(venue?.additionalFees) ? venue.additionalFees : [],
      plans: Array.isArray(venue?.pricing?.plans) ? venue.pricing.plans : [],
      fees: Array.isArray(venue?.pricing?.fees) ? venue.pricing.fees : []
    },
    crowd: venue?.crowd || {},
    crowdObservations: Array.isArray(venue?.crowdObservations) ? venue.crowdObservations : [],
    equipmentInventory: Array.isArray(venue?.equipmentInventory)
      ? venue.equipmentInventory.map((category: JsonObject) => ({
        id: category.id,
        label: category.label,
        total: category.total,
        available: category.available,
        maxWaitMinutes: category.maxWaitMinutes,
        summary: category.summary,
        items: Array.isArray(category.items) ? category.items.map((item: JsonObject) => ({
          code: item.code,
          name: item.name,
          total: item.total,
          available: item.available,
          maxWaitMinutes: item.maxWaitMinutes,
          status: item.status,
          issueSummary: item.issueSummary,
          issuePhotos: item.issuePhotos,
          note: item.note
        })) : []
      }))
      : [],
    tags: ["beginner", "lowSales", "shower", "cleanEnvironment", "open24", "womenFriendly", "nightSafety"]
      .reduce((result: JsonObject, key) => ({ ...result, [key]: Boolean(venue?.[key]) }), {}),
    hours: String(venue?.hours || ""),
    testedAt: String(venue?.testedAt || ""),
    contact: {
      address: String(venue?.contact?.address || ""),
      nearestStation: String(venue?.contact?.nearestStation || ""),
      booking: String(venue?.contact?.booking || "")
    },
    highlights: Array.isArray(venue?.highlights) ? venue.highlights : [],
    fit: String(venue?.fit || ""),
    caution: String(venue?.caution || ""),
    fullReport: venue?.fullReport || {},
    evidence: Array.isArray(venue?.evidence) ? venue.evidence : [],
    gallery: Array.isArray(venue?.gallery) ? venue.gallery.map((item: JsonObject) => ({ src: item?.src || "", caption: item?.caption || "" })) : []
  };
}

function valueForAudit(value: unknown) {
  return JSON.stringify(value ?? null);
}

function diffAuditSnapshots(before: JsonObject, after: JsonObject, prefix = ""): JsonObject[] {
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  const changes: JsonObject[] = [];
  for (const key of keys) {
    const path = prefix ? `${prefix}.${key}` : key;
    const oldValue = before?.[key];
    const newValue = after?.[key];
    if (oldValue && newValue && typeof oldValue === "object" && typeof newValue === "object" && !Array.isArray(oldValue) && !Array.isArray(newValue)) {
      changes.push(...diffAuditSnapshots(oldValue, newValue, path));
    } else if (valueForAudit(oldValue) !== valueForAudit(newValue)) {
      changes.push({ field: path, before: oldValue ?? null, after: newValue ?? null });
    }
  }
  return changes;
}

async function recordVenueChange(env: Env, args: {
  venueId: string;
  reportId?: string | null;
  auth: AdminAuth;
  action: string;
  before?: JsonObject;
  after?: JsonObject;
  note?: string;
}) {
  const changes = args.before && args.after
    ? diffAuditSnapshots(auditSnapshot(args.before), auditSnapshot(args.after))
    : [];
  await env.DB.prepare(`INSERT INTO venue_change_log (
    id, venue_id, report_id, actor_role, actor_name, action, changes_json, note, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      `change-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      args.venueId,
      args.reportId || null,
      args.auth.role,
      args.auth.reviewerName || "未标记审核人",
      args.action,
      JSON.stringify(changes.slice(0, 60)),
      args.note || null,
      new Date().toISOString()
    ).run();
  return changes;
}

async function listVenueChanges(env: Env, venueId: string, limit = 30) {
  const result = await env.DB.prepare(`SELECT id, report_id, actor_role, actor_name, action, changes_json, note, created_at
    FROM venue_change_log WHERE venue_id = ? ORDER BY created_at DESC LIMIT ?`).bind(venueId, limit).all<JsonObject>();
  return (result.results || []).map(row => ({
    id: row.id,
    reportId: row.report_id,
    actorRole: row.actor_role,
    actorName: row.actor_name,
    action: row.action,
    changes: parseJson(row.changes_json) || [],
    note: row.note || "",
    createdAt: row.created_at
  }));
}

async function analyzeAndSave(env: Env, report: JsonObject) {
  try {
    const result = await analyzeReport({
      text: report.extractedText,
      metadata: {
        venueName: report.venueName,
        evaluatorName: report.evaluatorName,
        originalName: report.originalName
      },
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL || "gpt-4o"
    });
    report.status = "needs_review";
    report.analysis = result.analysis;
    report.analysisMode = result.mode;
    report.analysisModel = result.model;
    report.analysisError = null;
    report.openaiResponseId = result.responseId || null;
    report.reportSchemaVersion = result.analysis?.reportSchemaVersion || REPORT_SCHEMA_VERSION;
    const analyzedDraft = analysisToVenue(report, result.analysis);
    const venueRow = report.venueId
      ? await env.DB.prepare("SELECT venue_json FROM published_venues WHERE id = ?").bind(report.venueId).first<{ venue_json: string }>()
      : null;
    const baseVenue = venueRow ? parseJson(venueRow.venue_json) : null;
    report.venueDraft = baseVenue ? mergeReportWithVenue(baseVenue, analyzedDraft) : analyzedDraft;
  } catch (error) {
    report.status = "analysis_failed";
    report.analysisError = error instanceof Error ? error.message : "自动分析失败";
  }
  if (report.status === "needs_review" && report.venueId && report.venueDraft) {
    const archive = await env.DB.prepare("SELECT visible, report_id FROM published_venues WHERE id = ?")
      .bind(report.venueId).first<{ visible: number; report_id: string }>();
    if (archive && !Boolean(archive.visible) && archive.report_id === report.id) {
      report.venueDraft.id = report.venueId;
      await env.DB.prepare("UPDATE published_venues SET venue_json = ?, version = version + 1, published_at = ? WHERE id = ?")
        .bind(JSON.stringify(report.venueDraft), new Date().toISOString(), report.venueId).run();
    }
  }
  await saveReport(env, report);
  return report;
}

async function createTestDraftAndSave(env: Env, report: JsonObject) {
  const analysis = createTestAnalysis({ evaluatorName: report.evaluatorName, originalName: report.originalName });
  const draft = analysisToVenue(report, analysis);
  draft.id = `test-${report.id}`;
  draft.source = "system_test";
  draft.verificationStatus = "test_only";
  draft.testMode = true;
  draft.contact = {
    phone: "020-0000-0000（测试）",
    address: "广州市天河区测试路 100 号（虚构）",
    nearestStation: "测试站",
    booking: "这是系统测试记录，不接受预约。"
  };
  report.venueId = null;
  report.venueName = analysis.venueName;
  report.status = "needs_review";
  report.analysis = analysis;
  report.analysisMode = "test-fixture";
  report.analysisModel = null;
  report.analysisError = null;
  report.openaiResponseId = null;
  report.reportSchemaVersion = REPORT_SCHEMA_VERSION;
  report.venueDraft = draft;
  await saveReport(env, report);
  return report;
}

function confirmedText(value: unknown, fallback: unknown, placeholders: RegExp) {
  const text = String(value || "").trim();
  return text && !placeholders.test(text) ? text : String(fallback || "").trim();
}

function mergeReportWithVenue(base: JsonObject, analyzed: JsonObject) {
  const normalizedBase = upgradeVenueForRead(base);
  const basePlans = new Map((normalizedBase.pricing?.plans || []).map((plan: JsonObject) => [plan.name, plan]));
  const analyzedPlans = Array.isArray(analyzed.pricing?.plans) ? analyzed.pricing.plans : [];
  const mergedPricing = {
    plans: cardTypes.map((name: string) => {
      const incoming = analyzedPlans.find((plan: JsonObject) => plan?.name === name) || {};
      const existing = basePlans.get(name) as JsonObject | undefined;
      return Number(incoming.amount) > 0 || incoming.provided
        ? incoming
        : existing || incoming;
    }),
    fees: Array.isArray(analyzed.pricing?.fees)
      ? analyzed.pricing.fees.map((fee: JsonObject) => {
        const existing = normalizedBase.pricing?.fees?.find((item: JsonObject) => item?.name === fee?.name);
        return fee?.rule || fee?.note ? fee : existing || fee;
      })
      : normalizedBase.pricing?.fees || []
  };
  const merged = normalizeVenueDraft(normalizedBase, { ...analyzed, pricing: mergedPricing });
  return {
    ...merged,
    id: normalizedBase.id,
    name: confirmedText(analyzed.name, normalizedBase.name, /待命名|待确认/),
    district: confirmedText(analyzed.district, normalizedBase.district, /待补充|待确认/),
    type: confirmedText(analyzed.type, normalizedBase.type, /待确认/),
    hours: confirmedText(analyzed.hours, normalizedBase.hours, /待确认/),
    coordinates: Array.isArray(normalizedBase.coordinates) ? normalizedBase.coordinates : [],
    image: String(normalizedBase.image || analyzed.image || ""),
    gallery: Array.isArray(normalizedBase.gallery) ? normalizedBase.gallery : [],
    contact: {
      ...(normalizedBase.contact || {}),
      ...(analyzed.contact || {}),
      address: normalizedBase.contact?.address || "",
      phone: normalizedBase.contact?.phone || "",
      nearestStation: normalizedBase.contact?.nearestStation || "",
      booking: normalizedBase.contact?.booking || analyzed.contact?.booking || ""
    },
    source: normalizedBase.source || "platform_admin",
    verificationStatus: "experience_verified"
  };
}

async function uploadReport(request: Request, env: Env) {
  if (!requireUploadSecret(request, env)) return json(request, env, 401, { error: "体验官上传口令无效" });
  const url = new URL(request.url);
  let venueId = (url.searchParams.get("venueId") || "").trim();
  const submittedVenueName = (url.searchParams.get("venue") || "").trim();
  const submittedDistrict = (url.searchParams.get("district") || "").trim();
  let linkedVenue: JsonObject | null = null;
  if (venueId) {
    const venueRow = await env.DB.prepare("SELECT venue_json FROM published_venues WHERE id = ?").bind(venueId).first<{ venue_json: string }>();
    if (!venueRow) return json(request, env, 422, { error: "所选健身房档案不存在，请联系平台管理员" });
    linkedVenue = parseJson(venueRow.venue_json) || {};
  } else if (!submittedVenueName) {
    return json(request, env, 422, { error: "请填写体验场馆的完整名称" });
  }
  const originalName = safeFileName(url.searchParams.get("name") || "report.docx");
  const ext = extension(originalName);
  if (![".docx", ".txt"].includes(ext)) return json(request, env, 415, { error: "第一版仅支持 DOCX 或 TXT 报告" });
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (!bytes.length) return json(request, env, 400, { error: "报告文件为空" });
  if (bytes.length > 20 * 1024 * 1024) return json(request, env, 413, { error: "报告文件不能超过 20 MB" });

  const reportId = `report-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const r2Key = `reports/${reportId}/${originalName}`;
  await putStoredFile(env, r2Key, bytes, {
    contentType: request.headers.get("content-type") || "application/octet-stream",
    metadata: { reportId, originalName }
  });

  let extractedText = "";
  try {
    extractedText = ext === ".docx"
      ? extractDocxText(Buffer.from(bytes))
      : new TextDecoder().decode(bytes).trim();
  } catch (error) {
    await deleteStoredFile(env, r2Key);
    return json(request, env, 422, { error: error instanceof Error ? error.message : "无法读取报告" });
  }
  if (extractedText.length < 30) {
    await deleteStoredFile(env, r2Key);
    return json(request, env, 422, { error: "报告中没有提取到足够文字，请确认文件已经填写" });
  }

  const now = new Date().toISOString();
  if (!linkedVenue) {
    linkedVenue = manualVenueDraft({
      name: submittedVenueName,
      district: submittedDistrict,
      source: "evaluator_upload",
      verificationStatus: "pending_analysis",
      fit: "等待审核员核对体验报告后确认。",
      caution: "该档案尚未完成审核，暂不可公开。",
      evidence: ["体验官上传报告后自动建档"]
    });
    venueId = linkedVenue.id;
    await env.DB.prepare("INSERT INTO published_venues (id, venue_json, visible, version, report_id, published_at, hidden_at) VALUES (?, ?, 0, 1, ?, ?, ?)")
      .bind(venueId, JSON.stringify(linkedVenue), reportId, now, now).run();
  }
  const report: JsonObject = {
    id: reportId,
    venueId,
    venueName: String(linkedVenue.name || submittedVenueName).trim(),
    evaluatorName: (url.searchParams.get("evaluator") || "").trim(),
    status: "analyzing",
    originalName,
    r2Key,
    fileSize: bytes.length,
    extractedText,
    analysis: null,
    analysisMode: null,
    analysisModel: null,
    analysisError: null,
    openaiResponseId: null,
    reportSchemaVersion: REPORT_SCHEMA_VERSION,
    venueDraft: null,
    reviewNotes: "",
    createdAt: now,
    updatedAt: now,
    publishedAt: null
  };
  await saveReport(env, report);
  await analyzeAndSave(env, report);
  return json(request, env, 201, { ok: true, report: publicReport(report) });
}

async function listPublished(request: Request, env: Env) {
  const result = await env.DB.prepare("SELECT venue_json FROM published_venues WHERE visible = 1 ORDER BY published_at DESC").all<{ venue_json: string }>();
  const venues = (result.results || [])
    .map((row: { venue_json: string }) => parseJson(row.venue_json))
    .filter(Boolean)
    .map((venue: JsonObject) => upgradeVenueForRead(venue));
  return json(request, env, 200, { venues, updatedAt: new Date().toISOString() });
}

type RouteMode = "walking" | "transit" | "driving";

function numberInRange(value: unknown, min: number, max: number) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

function routePoint(value: unknown) {
  const point = value as { latitude?: unknown; longitude?: unknown } | null;
  if (!point) return null;
  const latitude = numberInRange(point.latitude, -90, 90);
  const longitude = numberInRange(point.longitude, -180, 180);
  return latitude === null || longitude === null ? null : { latitude, longitude };
}

function venueRoutePoint(value: unknown) {
  const venue = value as { id?: unknown; coordinates?: unknown } | null;
  const coordinates = Array.isArray(venue?.coordinates) ? venue.coordinates : [];
  const longitude = numberInRange(coordinates[0], -180, 180);
  const latitude = numberInRange(coordinates[1], -90, 90);
  const id = String(venue?.id || "").trim();
  return !id || latitude === null || longitude === null ? null : { id, latitude, longitude };
}

async function commuteForVenue(origin: { latitude: number; longitude: number }, destination: { id: string; latitude: number; longitude: number }, mode: RouteMode, key: string) {
  const params = new URLSearchParams({
    from: `${origin.latitude},${origin.longitude}`,
    to: `${destination.latitude},${destination.longitude}`,
    key
  });
  const response = await fetch(`https://apis.map.qq.com/ws/direction/v1/${mode}/?${params.toString()}`);
  if (!response.ok) throw new Error("路线服务暂不可用");
  const payload = await response.json() as { status?: number; message?: string; result?: { routes?: Array<{ duration?: number; distance?: number }> } };
  const route = payload?.result?.routes?.[0];
  if (payload.status !== 0 || !route || !Number.isFinite(Number(route.duration))) throw new Error(payload.message || "未能计算路线");
  return {
    id: destination.id,
    minutes: Math.max(1, Math.round(Number(route.duration) / 60)),
    distanceMeters: Number.isFinite(Number(route.distance)) ? Number(route.distance) : null
  };
}

async function calculateCommute(request: Request, env: Env) {
  if (!env.TENCENT_LBS_KEY) return json(request, env, 503, { error: "路线服务尚未配置" });
  const body = await request.json().catch(() => null) as { origin?: unknown; venues?: unknown; mode?: unknown } | null;
  const origin = routePoint(body?.origin);
  const mode = body?.mode;
  const allowedModes: RouteMode[] = ["walking", "transit", "driving"];
  const venues = Array.isArray(body?.venues) ? body!.venues.map(venueRoutePoint).filter(Boolean).slice(0, 3) as Array<{ id: string; latitude: number; longitude: number }> : [];
  if (!origin || !allowedModes.includes(mode as RouteMode) || !venues.length) return json(request, env, 422, { error: "通勤参数不完整或不合法" });

  const settled = await Promise.allSettled(venues.map(venue => commuteForVenue(origin, venue, mode as RouteMode, env.TENCENT_LBS_KEY!)));
  const commutes: Record<string, { minutes: number; distanceMeters: number | null }> = {};
  for (const item of settled) {
    if (item.status === "fulfilled") commutes[item.value.id] = { minutes: item.value.minutes, distanceMeters: item.value.distanceMeters };
  }
  if (!Object.keys(commutes).length) return json(request, env, 503, { error: "暂时无法计算通勤时间" });
  return json(request, env, 200, { mode, commutes, calculatedAt: new Date().toISOString() });
}

function normalizedVenueName(value: unknown) {
  return String(value || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

function compareDrafts(current: JsonObject, others: JsonObject[]) {
  const issues: string[] = [];
  const currentName = normalizedVenueName(current?.name);
  const matches = others.filter(item => normalizedVenueName(item?.venueDraft?.name || item?.venueName) === currentName && currentName);
  for (const item of matches) {
    const other = item.venueDraft || {};
    const label = item.evaluatorName || "另一位体验官";
    const currentModules = new Map((current.scoreModules || []).map((module: JsonObject) => [module.key, module]));
    for (const otherModule of other.scoreModules || []) {
      const currentModule = currentModules.get(otherModule.key) as JsonObject | undefined;
      if (currentModule?.points === null || otherModule?.points === null || currentModule?.points === undefined || otherModule?.points === undefined) continue;
      const gap = Math.abs(Number(currentModule.points) - Number(otherModule.points));
      if (gap > 5) issues.push(`${label}的“${otherModule.label || otherModule.key}”模块相差 ${gap.toFixed(1)} 分`);
    }
    const a = Number(current.monthlyPrice);
    const b = Number(other.monthlyPrice);
    if (a > 0 && b > 0 && Math.abs(a - b) / Math.max(a, b) >= 0.25) issues.push(`${label}记录的月卡价格差异超过 25%`);
    const crowdPair = new Set([current?.crowd?.evening, other?.crowd?.evening]);
    if (crowdPair.has("宽松") && crowdPair.has("拥挤")) issues.push(`${label}记录的晚高峰客流结论相反`);
  }
  return {
    hasComparison: matches.length > 0,
    comparedReports: matches.map(item => ({
      id: item.id,
      evaluatorName: item.evaluatorName,
      status: item.status,
      experienceScore: item.venueDraft?.experienceScore ?? null,
      scoreModules: item.venueDraft?.scoreModules ?? [],
      monthlyPrice: item.venueDraft?.monthlyPrice ?? null,
      crowdEvening: item.venueDraft?.crowd?.evening ?? "未确认"
    })),
    severeConflict: issues.length > 0,
    issues
  };
}

async function comparisonForReport(env: Env, report: JsonObject) {
  const result = report.venueId
    ? await env.DB.prepare("SELECT * FROM reports WHERE id != ? AND venue_id = ? ORDER BY created_at DESC").bind(report.id, report.venueId).all<ReportRow>()
    : await env.DB.prepare("SELECT * FROM reports WHERE id != ? ORDER BY created_at DESC").bind(report.id).all<ReportRow>();
  return compareDrafts(report.venueDraft || {}, (result.results || []).map((row: ReportRow) => rowToReport(row)));
}

function detailedCardMissing(draft: JsonObject) {
  if (draft?.reportSchemaVersion !== REPORT_SCHEMA_VERSION) return [];
  const missing: string[] = [];
  const plans = Array.isArray(draft?.pricing?.plans) ? draft.pricing.plans : [];
  if (!plans.some((plan: JsonObject) => plan.provided && Number(plan.amount) > 0 && cleanText(plan.validity))) {
    missing.push("至少一项可核验的卡项价格、有效期和来源");
  }
  const observations = Array.isArray(draft?.crowdObservations) ? draft.crowdObservations : [];
  if (observations.length < 5 || observations.some((record: JsonObject) => !record.date || !record.start || !record.end || record.state === "未填写" || Number(record.maxWaitMinutes) < 0)) {
    missing.push("5次客流观察的时间、等待、人数判断和现场描述");
  }
  const inventory = Array.isArray(draft?.equipmentInventory) ? draft.equipmentInventory : [];
  const categoryIds = new Set(inventory.map((category: JsonObject) => category.id));
  if (equipmentReferenceCatalog.some((category: JsonObject) => !categoryIds.has(category.id)) || inventory.some((category: JsonObject) => !Array.isArray(category.items))) {
    missing.push("03A至03I九类器械清单和可用情况");
  }
  const fullReport = draft?.fullReport || {};
  if (!cleanText(fullReport.conclusion)) missing.push("完整实测报告的综合结论");
  if (!Array.isArray(fullReport.recommendations) || !fullReport.recommendations.length) missing.push("完整实测报告的推荐要点");
  if (!Array.isArray(fullReport.cautions) || !fullReport.cautions.length) missing.push("完整实测报告的办卡注意事项");
  if (!cleanText(fullReport.fit) || !cleanText(fullReport.unfit) || !cleanText(fullReport.sessionSummary)) {
    missing.push("完整实测报告的适合/不适合人群和训练覆盖摘要");
  }
  return missing;
}

async function adminReports(request: Request, env: Env, url: URL) {
  const auth = await adminAuth(request, env);
  if (!auth) return json(request, env, 401, { error: "管理口令无效或审核员尚未分配场馆" });
  const role = auth.role;
  const match = url.pathname.match(/^\/api\/admin\/reports(?:\/([^/]+)(?:\/(publish|reanalyze|test-analyze|reject|comparison|file))?)?$/);
  if (!match) return json(request, env, 404, { error: "接口不存在" });
  const reportId = match[1] ? decodeURIComponent(match[1]) : "";
  const action = match[2] || "read";

  if (!reportId && request.method === "GET") {
    const result = role === "platform_admin"
      ? await env.DB.prepare("SELECT * FROM reports ORDER BY created_at DESC").all<ReportRow>()
      : await env.DB.prepare("SELECT * FROM reports WHERE venue_id = ? ORDER BY created_at DESC").bind(auth.venueId).all<ReportRow>();
    return json(request, env, 200, { role, venueId: auth.venueId, reviewerName: auth.reviewerName, reports: (result.results || []).map((row: ReportRow) => publicReport(rowToReport(row))) });
  }
  const report = reportId ? await getReport(env, reportId) : null;
  if (!report) return json(request, env, 404, { error: "没有找到这份报告" });
  if (!canAccessVenue(auth, report.venueId)) return json(request, env, 403, { error: "你只能处理被分配场馆的报告" });

  if (action === "read" && request.method === "GET") {
    return json(request, env, 200, {
      role,
      venueId: auth.venueId,
      reviewerName: auth.reviewerName,
      report: publicReport(report, true),
      comparison: await comparisonForReport(env, report),
      auditTrail: report.venueId ? await listVenueChanges(env, report.venueId) : []
    });
  }
  if (action === "file" && request.method === "GET") {
    const object = await getStoredFile(env, report.r2Key);
    if (!object) return json(request, env, 404, { error: "原始报告文件不存在" });
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("content-type", headers.get("content-type") || "application/octet-stream");
    headers.set("content-disposition", `attachment; filename*=UTF-8''${encodeURIComponent(report.originalName || "report.docx")}`);
    headers.set("cache-control", "private, no-store");
    return new Response(object.body, { headers });
  }
  if (action === "read" && request.method === "DELETE") {
    if (role !== "platform_admin") return json(request, env, 403, { error: "只有平台管理员可以删除报告" });
    if (report.status === "published" && !report.venueDraft?.testMode) return json(request, env, 409, { error: "已发布报告需先下架对应场馆，不能直接删除" });
    const archive = await env.DB.prepare("SELECT id, visible, venue_json FROM published_venues WHERE report_id = ?")
      .bind(reportId).first<{ id: string; visible: number; venue_json: string }>();
    const archiveVenue = archive ? parseJson(archive.venue_json) || {} : {};
    if (archive && !Boolean(archive.visible) && (report.venueDraft?.testMode || archiveVenue.source === "evaluator_upload")) {
      await env.DB.batch([
        env.DB.prepare("DELETE FROM venue_reviewers WHERE venue_id = ?").bind(archive.id),
        env.DB.prepare("DELETE FROM venue_change_log WHERE venue_id = ?").bind(archive.id),
        env.DB.prepare("DELETE FROM published_venues WHERE id = ?").bind(archive.id),
        env.DB.prepare("DELETE FROM reports WHERE id = ?").bind(reportId)
      ]);
    } else {
      await env.DB.prepare("DELETE FROM reports WHERE id = ?").bind(reportId).run();
    }
    await deleteStoredFile(env, report.r2Key);
    return json(request, env, 200, { ok: true });
  }
  if (action === "read" && request.method === "PATCH") {
    const body = (await request.json()) as JsonObject;
    if (body.venueDraft) {
      const current = report.venueDraft || {};
      report.venueDraft = normalizeVenueDraft(current, body.venueDraft);
      if (role === "reviewer") {
        for (const key of scoreManagedKeys) {
          report.venueDraft[key] = current[key];
        }
      }
      if (report.venueId) report.venueDraft.id = report.venueId;
      if (report.venueId) {
        await recordVenueChange(env, {
          venueId: report.venueId,
          reportId: report.id,
          auth,
          action: "审核草稿修改",
          before: current,
          after: report.venueDraft,
          note: body.reviewNotes !== undefined ? String(body.reviewNotes || "").trim() : ""
        });
      }
    }
    if (body.reviewNotes !== undefined) report.reviewNotes = String(body.reviewNotes);
    if (report.status === "published") report.status = "needs_review";
    await saveReport(env, report);
    return json(request, env, 200, {
      ok: true,
      report: publicReport(report, true),
      auditTrail: report.venueId ? await listVenueChanges(env, report.venueId) : []
    });
  }
  if (action === "reanalyze" && request.method === "POST") {
    if (role !== "platform_admin") return json(request, env, 403, { error: "只有平台管理员可以重新调用 AI 分析" });
    await analyzeAndSave(env, report);
    if (report.status === "analysis_failed") return json(request, env, 502, { error: report.analysisError });
    return json(request, env, 200, { ok: true, report: publicReport(report, true) });
  }
  if (action === "test-analyze" && request.method === "POST") {
    if (role !== "platform_admin") return json(request, env, 403, { error: "只有平台管理员可以生成测试审核草稿" });
    if (report.status === "published" && !report.venueDraft?.testMode) return json(request, env, 409, { error: "不能把已公开发布的真实报告改成测试数据" });
    await createTestDraftAndSave(env, report);
    return json(request, env, 200, { ok: true, report: publicReport(report, true) });
  }
  if (action === "comparison" && request.method === "GET") {
    return json(request, env, 200, { comparison: await comparisonForReport(env, report) });
  }
  if (action === "reject" && request.method === "POST") {
    const body = (await request.json().catch(() => ({}))) as JsonObject;
    const notes = String(body.notes || "").trim();
    if (!notes) return json(request, env, 422, { error: "请填写退回原因" });
    report.status = "rejected";
    report.reviewNotes = notes;
    await saveReport(env, report);
    return json(request, env, 200, { ok: true, report: publicReport(report, true) });
  }
  if (action === "publish" && request.method === "POST") {
    const draft = report.venueDraft;
    const missing: string[] = [];
    if (!draft?.name?.trim()) missing.push("场馆名称");
    if (!draft?.district?.trim() || draft.district.includes("待补充")) missing.push("区域");
    if (!Number.isFinite(Number(draft?.experienceScore)) || Number(draft.experienceScore) < 0 || Number(draft.experienceScore) > 100) missing.push("按V1.2自动生成的体验总分");
    if (!draft?.publicationGates?.trainingComplete) missing.push("4次真实训练与工作日晚高峰记录");
    if (!draft?.publicationGates?.requiredComplete) missing.push("六个评分模块的全部必填项");
    if (!draft?.publicationGates?.confidencePassed) missing.push("B级及以上证据可信度");
    if (draft?.publicationGates?.riskReviewRequired && !draft?.riskReviewed) missing.push("严重风险的二次核验确认");
    if (!draft?.hours?.trim()) missing.push("营业时间");
    if (!draft?.contact?.address?.trim() || draft.contact.address.includes("待核实")) missing.push("详细地址");
    if (!draft?.image?.trim()) missing.push("场馆主图");
    if (!draft?.fit?.trim()) missing.push("适合人群");
    if (!draft?.caution?.trim()) missing.push("注意事项");
    missing.push(...detailedCardMissing(draft || {}));
    if (missing.length) return json(request, env, 422, { error: "发布前仍需完成审核", missing });
    const comparison = await comparisonForReport(env, report);
    const body = (await request.json().catch(() => ({}))) as JsonObject;
    if (comparison.severeConflict && !(role === "platform_admin" && body.overrideConflict === true)) {
      return json(request, env, 409, { error: "同一场馆的体验结果存在明显差异，暂不能发布", missing: comparison.issues, comparison });
    }

    const publishedAt = new Date().toISOString();
    draft.id = report.venueId || draft.id;
    draft.updated = publishedAt.slice(0, 10);
    const previous = await env.DB.prepare("SELECT version FROM published_venues WHERE id = ?").bind(draft.id).first<{ version: number }>();
    const testMode = Boolean(draft.testMode);
    await env.DB.prepare(`INSERT INTO published_venues (id, venue_json, visible, version, report_id, published_at, hidden_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET venue_json=excluded.venue_json, visible=excluded.visible, version=excluded.version,
      report_id=excluded.report_id, published_at=excluded.published_at, hidden_at=excluded.hidden_at`).bind(
        draft.id, JSON.stringify(draft), testMode ? 0 : 1, (previous?.version || 0) + 1, report.id, publishedAt, testMode ? publishedAt : null
      ).run();
    report.status = "published";
    report.publishedAt = publishedAt;
    await saveReport(env, report);
    await recordVenueChange(env, {
      venueId: draft.id,
      reportId: report.id,
      auth,
      action: "审核发布",
      after: draft,
      note: report.reviewNotes || ""
    });
    return json(request, env, 200, { ok: true, publishedAt, venue: draft, comparison, testPublication: testMode });
  }
  return json(request, env, 405, { error: "不支持的操作" });
}

async function adminVenue(request: Request, env: Env, url: URL) {
  const auth = await adminAuth(request, env);
  if (!auth) return json(request, env, 401, { error: "管理口令无效" });
  if (auth.role !== "platform_admin") return json(request, env, 403, { error: "只有平台管理员可以下架场馆" });
  const match = url.pathname.match(/^\/api\/admin\/venues\/([^/]+)$/);
  if (!match || request.method !== "DELETE") return json(request, env, 405, { error: "不支持的操作" });
  const venueId = decodeURIComponent(match[1]);
  const result = await env.DB.prepare("UPDATE published_venues SET visible = 0, hidden_at = ? WHERE id = ?").bind(new Date().toISOString(), venueId).run();
  if (!result.meta.changes) return json(request, env, 404, { error: "没有找到已发布场馆" });
  return json(request, env, 200, { ok: true });
}

function contentTypeForImage(name: string, supplied: string | null) {
  const normalized = (supplied || "").toLowerCase().split(";")[0];
  if (["image/jpeg", "image/png", "image/webp"].includes(normalized)) return normalized;
  const ext = extension(name);
  return ({ ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" } as Record<string, string>)[ext] || "";
}

async function adminMedia(request: Request, env: Env, url: URL) {
  const auth = await adminAuth(request, env);
  if (!auth) return json(request, env, 401, { error: "管理口令无效" });
  if (request.method !== "POST") return json(request, env, 405, { error: "不支持的操作" });
  const originalName = safeFileName(url.searchParams.get("name") || "venue-photo.jpg");
  const contentType = contentTypeForImage(originalName, request.headers.get("content-type"));
  if (!contentType) return json(request, env, 415, { error: "图片仅支持 JPG、PNG 或 WebP" });
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (!bytes.length) return json(request, env, 400, { error: "图片文件为空" });
  if (bytes.length > 10 * 1024 * 1024) return json(request, env, 413, { error: "单张图片不能超过 10 MB" });
  const scope = safeFileName(url.searchParams.get("scope") || "manual").replace(/\./g, "-");
  if (auth.role === "reviewer" && scope !== auth.venueId) {
    const scopedReport = await getReport(env, scope);
    if (!scopedReport || scopedReport.venueId !== auth.venueId) return json(request, env, 403, { error: "你只能为被分配的场馆上传图片" });
  }
  const key = `venue-images/${scope}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${originalName}`;
  await putStoredFile(env, key, bytes, {
    contentType,
    cacheControl: "public, max-age=31536000, immutable",
    metadata: { uploadedBy: auth.role, originalName }
  });
  return json(request, env, 201, { ok: true, image: { src: new URL(`/api/media/${key}`, request.url).href, caption: "场馆实拍", date: new Date().toISOString().slice(0, 10) } });
}

async function publicMedia(request: Request, env: Env, url: URL) {
  if (request.method !== "GET") return json(request, env, 405, { error: "不支持的操作" });
  const key = decodeURIComponent(url.pathname.slice("/api/media/".length));
  if (!key.startsWith("venue-images/")) return json(request, env, 404, { error: "图片不存在" });
  const object = await getStoredFile(env, key);
  if (!object) return json(request, env, 404, { error: "图片不存在" });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  if (object.httpEtag) headers.set("etag", object.httpEtag);
  headers.set("cache-control", headers.get("cache-control") || "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}

function manualVenueDraft(input: JsonObject, id?: string) {
  const now = new Date().toISOString().slice(0, 10);
  const name = String(input.name || "").trim();
  const slug = name.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 42) || "venue";
  const base: JsonObject = {
    id: id || `${slug}-${crypto.randomUUID().slice(0, 6)}`,
    reportSchemaVersion: REPORT_SCHEMA_VERSION,
    name,
    district: "",
    type: "健身房",
    category: "商业健身房",
    monthlyPrice: 0,
    trialPrice: 0,
    weeklyPrice: 0,
    annualPrice: 0,
    additionalFees: [],
    coordinates: [],
    hours: "",
    crowd: { evening: "一般", morning: "一般", weekend: "一般", flexible: "一般" },
    crowdObservations: [],
    beginner: false,
    lowSales: false,
    equipment: 0,
    equipmentInventory: [],
    shower: false,
    cleanEnvironment: false,
    open24: false,
    womenFriendly: false,
    nightSafety: false,
    highlights: [],
    rating: 0,
    image: "",
    gallery: [],
    fit: "待体验官报告补充",
    caution: "基础资料已录入，体验结论待审核。",
    fullReport: {
      conclusion: "",
      recommendations: [],
      cautions: [],
      fit: "待体验官报告补充",
      unfit: "",
      sessionSummary: "",
      sections: []
    },
    evidence: ["平台基础资料录入"],
    testerCount: 0,
    testedAt: now,
    updated: now,
    contact: { phone: "", address: "", nearestStation: "", booking: "到店前请联系场馆确认开放和试练安排。" },
    source: "platform_admin",
    verificationStatus: "base_only"
  };
  return normalizeVenueDraft(base, input);
}

function manualVenueMissing(venue: JsonObject) {
  const coordinates = Array.isArray(venue.coordinates) ? venue.coordinates.map(Number) : [];
  return [
    !venue.name?.trim() && "场馆名称",
    !venue.district?.trim() && "所在区域",
    !venue.type?.trim() && "场馆类型",
    !venue.category?.trim() && "场馆分类",
    !venue.hours?.trim() && "营业时间",
    !(Number(venue.monthlyPrice) > 0) && "月卡价格",
    !venue.contact?.address?.trim() && "详细地址",
    !(coordinates.length === 2 && Number.isFinite(coordinates[0]) && Number.isFinite(coordinates[1]) && Math.abs(coordinates[0]) <= 180 && Math.abs(coordinates[1]) <= 90) && "有效经纬度",
    !venue.image?.trim() && "场馆主图",
    !(Array.isArray(venue.highlights) && venue.highlights.length) && "至少一个卡片亮点",
    !venue.fit?.trim() && "适合人群或基础介绍",
    !venue.caution?.trim() && "办卡前注意事项",
    !(Array.isArray(venue.evidence) && venue.evidence.length) && "至少一个基础信息来源"
  ].filter(Boolean);
}

async function platformVenues(request: Request, env: Env, url: URL) {
  const auth = await adminAuth(request, env);
  if (!auth) return json(request, env, 401, { error: "管理口令无效或审核员尚未分配场馆" });
  const match = url.pathname.match(/^\/api\/platform\/venues(?:\/([^/]+)(?:\/(publish|unpublish|reviewer))?)?$/);
  if (!match) return json(request, env, 404, { error: "接口不存在" });
  const venueId = match[1] ? decodeURIComponent(match[1]) : "";
  const action = match[2] || "read";

  if (!venueId && request.method === "GET") {
    const result = auth.role === "platform_admin"
      ? await env.DB.prepare("SELECT * FROM published_venues ORDER BY published_at DESC").all<JsonObject>()
      : await env.DB.prepare("SELECT * FROM published_venues WHERE id = ?").bind(auth.venueId).all<JsonObject>();
    const assignments = auth.role === "platform_admin"
      ? await env.DB.prepare("SELECT venue_id, reviewer_name, updated_at FROM venue_reviewers").all<{ venue_id: string; reviewer_name: string; updated_at: string }>()
      : { results: [{ venue_id: auth.venueId || "", reviewer_name: auth.reviewerName, updated_at: "" }] };
    const reviewerByVenue = new Map((assignments.results || []).map(item => [item.venue_id, { name: item.reviewer_name, updatedAt: item.updated_at }]));
    return json(request, env, 200, {
      role: auth.role,
      venueId: auth.venueId,
      venues: (result.results || []).map((row: JsonObject) => ({
        ...upgradeVenueForRead(parseJson(row.venue_json) || {}),
        visible: Boolean(row.visible),
        version: row.version,
        reportId: row.report_id,
        publishedAt: row.published_at,
        reviewer: reviewerByVenue.get(row.id) || null
      }))
    });
  }
  if (!canAccessVenue(auth, venueId)) return json(request, env, 403, { error: "你只能修改被分配的健身房" });

  if (action === "reviewer") {
    if (auth.role !== "platform_admin") return json(request, env, 403, { error: "只有平台管理员可以分配审核员" });
    const venueExists = await env.DB.prepare("SELECT id FROM published_venues WHERE id = ?").bind(venueId).first<{ id: string }>();
    if (!venueExists) return json(request, env, 404, { error: "没有找到这个场馆" });
    if (request.method === "GET") {
      const assignment = await env.DB.prepare("SELECT reviewer_name, created_at, updated_at FROM venue_reviewers WHERE venue_id = ?").bind(venueId).first<JsonObject>();
      return json(request, env, 200, { assignment: assignment ? { name: assignment.reviewer_name, createdAt: assignment.created_at, updatedAt: assignment.updated_at } : null });
    }
    if (request.method === "DELETE") {
      await env.DB.prepare("DELETE FROM venue_reviewers WHERE venue_id = ?").bind(venueId).run();
      return json(request, env, 200, { ok: true });
    }
    if (request.method === "POST") {
      const body = (await request.json().catch(() => ({}))) as JsonObject;
      const reviewerName = String(body.reviewerName || "").trim();
      if (!reviewerName) return json(request, env, 422, { error: "请填写审核员姓名或编号" });
      const reviewerToken = `${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;
      const now = new Date().toISOString();
      await env.DB.prepare(`INSERT INTO venue_reviewers (venue_id, reviewer_name, token_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(venue_id) DO UPDATE SET reviewer_name=excluded.reviewer_name, token_hash=excluded.token_hash, updated_at=excluded.updated_at`)
        .bind(venueId, reviewerName, await tokenHash(reviewerToken), now, now).run();
      const reviewerUrl = new URL(`/admin.html?token=${encodeURIComponent(reviewerToken)}`, request.url).href;
      return json(request, env, 201, { ok: true, assignment: { name: reviewerName, updatedAt: now }, reviewerUrl });
    }
    return json(request, env, 405, { error: "不支持的操作" });
  }

  const row = await env.DB.prepare("SELECT * FROM published_venues WHERE id = ?").bind(venueId).first<JsonObject>();
  if (!row) return json(request, env, 404, { error: "没有找到这个场馆" });
  if (action === "read" && request.method === "PATCH") {
    const body = (await request.json()) as JsonObject;
    const current = parseJson(row.venue_json) || {};
    const next = manualVenueDraft(normalizeVenueDraft(current, body.venue || body), venueId);
    next.id = venueId;
    if (auth.role === "reviewer") {
      for (const key of scoreManagedKeys) next[key] = current[key];
    }
    next.updated = new Date().toISOString().slice(0, 10);
    await env.DB.prepare("UPDATE published_venues SET venue_json = ?, version = version + 1, published_at = ? WHERE id = ?")
      .bind(JSON.stringify(next), new Date().toISOString(), venueId).run();
    await recordVenueChange(env, {
      venueId,
      auth,
      action: "场馆资料修改",
      before: current,
      after: next
    });
    return json(request, env, 200, { ok: true, venue: { ...next, visible: Boolean(row.visible), version: Number(row.version) + 1 } });
  }
  if (action === "publish" && request.method === "POST") {
    if (auth.role !== "platform_admin") return json(request, env, 403, { error: "审核员请在报告审核页完成发布" });
    const venue = parseJson(row.venue_json) || {};
    const missing = manualVenueMissing(venue);
    if (missing.length) return json(request, env, 422, { error: "发布前请补齐前端卡片信息", missing });
    await env.DB.prepare("UPDATE published_venues SET visible = 1, hidden_at = NULL, published_at = ? WHERE id = ?").bind(new Date().toISOString(), venueId).run();
    await recordVenueChange(env, { venueId, auth, action: "上线基础资料", after: venue });
    return json(request, env, 200, { ok: true });
  }
  if (action === "unpublish" && request.method === "POST") {
    if (auth.role !== "platform_admin") return json(request, env, 403, { error: "只有平台管理员可以下架场馆" });
    await env.DB.prepare("UPDATE published_venues SET visible = 0, hidden_at = ? WHERE id = ?").bind(new Date().toISOString(), venueId).run();
    await recordVenueChange(env, { venueId, auth, action: "下架场馆" });
    return json(request, env, 200, { ok: true });
  }
  if (action === "read" && request.method === "DELETE") {
    if (auth.role !== "platform_admin") return json(request, env, 403, { error: "只有平台管理员可以删除场馆" });
    await env.DB.prepare("DELETE FROM published_venues WHERE id = ?").bind(venueId).run();
    return json(request, env, 200, { ok: true });
  }
  return json(request, env, 405, { error: "不支持的操作" });
}

export async function handleApiRequest(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
  try {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: responseHeaders(request, env) });
    await ensureSchema(env);
    const url = new URL(request.url);
    if (url.pathname === "/api/health" && request.method === "GET") {
      return json(request, env, 200, { ok: true, storage: "d1-r2", aiConfigured: Boolean(env.OPENAI_API_KEY) });
    }
    if (url.pathname === "/api/venues" && request.method === "GET") return listPublished(request, env);
    if (url.pathname === "/api/commute" && request.method === "POST") return calculateCommute(request, env);
    if (url.pathname.startsWith("/api/media/")) return publicMedia(request, env, url);
    if (url.pathname === "/api/reports" && request.method === "POST") return uploadReport(request, env);
    if (url.pathname === "/api/admin/session" && request.method === "GET") {
      const auth = await adminAuth(request, env);
      return auth ? json(request, env, 200, { ok: true, role: auth.role, venueId: auth.venueId, reviewerName: auth.reviewerName }) : json(request, env, 401, { error: "管理口令无效或审核员尚未分配场馆" });
    }
    if (url.pathname === "/api/admin/media") return adminMedia(request, env, url);
    if (url.pathname.startsWith("/api/admin/reports")) return adminReports(request, env, url);
    if (url.pathname.startsWith("/api/admin/venues/")) return adminVenue(request, env, url);
    if (url.pathname.startsWith("/api/platform/venues")) return platformVenues(request, env, url);
    return json(request, env, 404, { error: "接口不存在" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "服务器处理失败";
    return json(request, env, 500, { error: message });
  }
}
