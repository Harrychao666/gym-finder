import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("ships the public, evaluator, scoped-reviewer, and platform-admin surfaces", async () => {
  const [home, upload, uploadJs, admin, adminJs, adminCss] = await Promise.all([
    readFile(new URL("../public/index.html", import.meta.url), "utf8"),
    readFile(new URL("../public/report-upload.html", import.meta.url), "utf8"),
    readFile(new URL("../public/report-upload.js", import.meta.url), "utf8"),
    readFile(new URL("../public/admin.html", import.meta.url), "utf8"),
    readFile(new URL("../public/admin.js", import.meta.url), "utf8"),
    readFile(new URL("../public/admin.css", import.meta.url), "utf8"),
  ]);

  assert.match(home, /有间好馆/);
  assert.match(upload, /体验官/);
  assert.match(upload, /venueName/);
  assert.match(upload, /自动建立场馆草稿档案/);
  assert.match(uploadJs, /venueDistrict/);
  assert.match(uploadJs, /上传并自动建档/);
  assert.match(admin, /报告处理记录/);
  assert.match(admin, /场馆资料库/);
  assert.doesNotMatch(admin, /手动补建档案/);
  assert.match(admin, /platformCardPreview/);
  assert.match(admin, /crowd\.morning/);
  assert.match(admin, /data-pricing-editor/);
  assert.match(admin, /data-crowd-editor/);
  assert.match(admin, /data-equipment-editor/);
  assert.match(admin, /fullReport\.conclusion/);
  assert.match(admin, /venueImageInput/);
  assert.match(admin, /platformImageInput/);
  assert.match(adminJs, /platform_admin/);
  assert.match(adminJs, /审核员/);
  assert.match(adminJs, /单馆审核工作台/);
  assert.match(adminJs, /自动打开|nextReport/);
  assert.match(adminCss, /\.reviewer-mode #venueWorkspace aside\s*\{\s*display:none/);
  assert.match(adminJs, /setupReviewerAssignment/);
  assert.match(admin, /分配单馆审核员/);
  assert.match(admin, /copyReviewerLinkButton/);
  assert.match(admin, /生成测试审核草稿/);
  assert.match(adminJs, /test-analyze/);
  assert.match(adminJs, /测试发布完成：记录已隔离/);
  assert.match(adminJs, /本页刷新前会一直保留/);
  assert.match(adminJs, /严重差异|明显差异/);
  assert.match(adminCss, /\[hidden\]\s*\{\s*display:\s*none\s*!important;/);
});

test("build output and server-side authorization routes exist", async () => {
  const [api, worker, schema, migration] = await Promise.all([
    readFile(new URL("../worker/api.ts", import.meta.url), "utf8"),
    readFile(new URL("../worker/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0001_slow_marvel_zombies.sql", import.meta.url), "utf8"),
  ]);

  assert.match(api, /PLATFORM_ADMIN_TOKEN/);
  assert.match(api, /\/api\/admin\/media/);
  assert.match(api, /\/api\/platform\/venues/);
  assert.match(api, /venue_reviewers/);
  assert.match(api, /WHERE venue_id = \?/);
  assert.match(api, /canAccessVenue/);
  assert.match(api, /reviewerUrl/);
  assert.match(schema, /venueReviewers/);
  assert.match(migration, /ALTER TABLE `reports` ADD `venue_id`/);
  assert.match(api, /manualVenueMissing/);
  assert.match(api, /verificationStatus/);
  assert.match(api, /severeConflict/);
  assert.match(api, /test-analyze/);
  assert.match(api, /testMode \? 0 : 1/);
  assert.match(api, /evaluator_upload/);
  assert.match(api, /pending_analysis/);
  assert.match(api, /INSERT INTO published_venues/);
  assert.match(worker, /handleApiRequest/);
  await access(new URL("../dist/server/index.js", import.meta.url));
});
