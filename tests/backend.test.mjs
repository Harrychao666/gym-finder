import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { startPilotServer } from "../server.mjs";
import { extractDocxText } from "../backend/docx.mjs";

test("体验官任务支持鉴权、草稿、证据和提交校验", async t => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), "liannar-pilot-"));
  const app = await startPilotServer({ port: 0, host: "127.0.0.1", dataDir });
  t.after(async () => {
    await new Promise(resolve => app.server.close(resolve));
    await rm(dataDir, { recursive: true, force: true });
  });

  const health = await fetch(`${app.url}/api/health`).then(response => response.json());
  assert.equal(health.ok, true);
  assert.equal(health.formVersion, "experience-v1.1");

  const privateStore = await fetch(`${app.url}/runtime-data/store.json`);
  assert.equal(privateStore.status, 404);
  const serverSource = await fetch(`${app.url}/server.mjs`);
  assert.equal(serverSource.status, 404);

  const unauthorized = await fetch(`${app.url}/api/tasks/pilot-001`);
  assert.equal(unauthorized.status, 401);

  const headers = { "x-task-token": app.task.accessToken };
  const taskResponse = await fetch(`${app.url}/api/tasks/pilot-001`, { headers });
  assert.equal(taskResponse.status, 200);
  const task = await taskResponse.json();
  task.answers.profile.venueName = "测试场馆";

  const draftResponse = await fetch(`${app.url}/api/tasks/pilot-001/draft`, {
    method: "PUT",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ formVersion: task.formVersion, answers: task.answers })
  });
  assert.equal(draftResponse.status, 200);

  const uploadResponse = await fetch(`${app.url}/api/tasks/pilot-001/evidence?name=test.png&module=器械情况`, {
    method: "POST",
    headers: { ...headers, "content-type": "image/png" },
    body: Buffer.from("fake-png-for-api-test")
  });
  assert.equal(uploadResponse.status, 201);

  const submitResponse = await fetch(`${app.url}/api/tasks/pilot-001/submit`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ answers: task.answers })
  });
  assert.equal(submitResponse.status, 422);
  const submitResult = await submitResponse.json();
  assert.equal(submitResult.error, "仍有必填内容未完成");
  assert.ok(submitResult.missing.length > 10);

  const store = JSON.parse(await readFile(path.join(dataDir, "store.json"), "utf8"));
  assert.equal(store.tasks["pilot-001"].answers.profile.venueName, "测试场馆");
  assert.equal(store.tasks["pilot-001"].evidence.length, 1);
});

test("DOCX 报告可以提取正文和表格文字", async () => {
  let report;
  try {
    report = await readFile(new URL("../练哪儿_体验官7天测评表_V1.1.docx", import.meta.url));
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
  const text = extractDocxText(report);
  assert.match(text, /体验官/);
  assert.match(text, /器械/);
  assert.ok(text.length > 2_000);
});

test("报告上传后进入审核，批准后才出现在公开前端接口", async t => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), "liannar-report-"));
  const app = await startPilotServer({ port: 0, host: "127.0.0.1", dataDir });
  t.after(async () => {
    await new Promise(resolve => app.server.close(resolve));
    await rm(dataDir, { recursive: true, force: true });
  });

  const reportText = `
场馆名称：测试健身房天河店
所在区域：天河区
体验官完成四次训练，其中一次为工作日晚高峰。
月卡价格：399元，体验价：39元。
器械、卫生、销售和新手友好情况均已按表格记录。
淋浴设施可正常使用，营业时间为 07:00–23:00。
`;
  const uploadQuery = new URLSearchParams({ name: "测试报告.txt", venue: "测试健身房天河店", evaluator: "TYG-001" });
  const upload = await fetch(`${app.url}/api/reports?${uploadQuery}`, {
    method: "POST",
    headers: { "x-upload-token": app.secrets.uploadToken, "content-type": "text/plain" },
    body: reportText
  });
  assert.equal(upload.status, 201);
  const uploaded = await upload.json();
  assert.equal(uploaded.report.status, "needs_review");
  assert.equal(uploaded.report.analysisMode, "local-preview");

  const beforePublish = await fetch(`${app.url}/api/venues`).then(response => response.json());
  assert.deepEqual(beforePublish.venues, []);

  const adminHeaders = { "x-admin-token": app.secrets.adminToken, "content-type": "application/json" };
  const reportId = uploaded.report.id;
  const update = await fetch(`${app.url}/api/admin/reports/${reportId}`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({ venueDraft: { district: "天河区", rating: 8.6, fit: "适合希望进行基础训练的人。", caution: "办卡前核对附加费用。" } })
  });
  assert.equal(update.status, 200);

  const publish = await fetch(`${app.url}/api/admin/reports/${reportId}/publish`, { method: "POST", headers: { "x-admin-token": app.secrets.adminToken } });
  assert.equal(publish.status, 200);

  const afterPublish = await fetch(`${app.url}/api/venues`).then(response => response.json());
  assert.equal(afterPublish.venues.length, 1);
  assert.equal(afterPublish.venues[0].name, "测试健身房天河店");
  assert.equal(afterPublish.venues[0].rating, 8.6);

  const hide = await fetch(`${app.url}/api/admin/venues/${afterPublish.venues[0].id}`, { method: "DELETE", headers: { "x-admin-token": app.secrets.adminToken } });
  assert.equal(hide.status, 200);
  const afterHide = await fetch(`${app.url}/api/venues`).then(response => response.json());
  assert.deepEqual(afterHide.venues, []);
});
