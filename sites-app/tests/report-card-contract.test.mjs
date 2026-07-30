import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createTestAnalysis, analysisToVenue } from "../lib/report-analysis.mjs";
import { equipmentReferenceCatalog } from "../lib/form-schema.mjs";

test("a reviewed V2 report contains every published-card data section", () => {
  const analysis = createTestAnalysis({ evaluatorName: "合同测试体验官" });
  const venue = analysisToVenue({ id: "report-contract-123456", venueName: "合同测试馆" }, analysis);

  assert.equal(venue.reportSchemaVersion, "experience-report-v2.0");
  assert.equal(venue.pricing.plans.length, 5);
  assert.equal(venue.pricing.fees.length, 8);
  assert.equal(venue.crowdObservations.length, 5);
  assert.equal(venue.equipmentInventory.length, 9);
  assert.ok(venue.equipmentInventory.every(category => category.items.length > 0));
  assert.ok(venue.equipmentInventory.flatMap(category => category.items).every(item => Array.isArray(item.issuePhotos)));
  assert.equal(venue.scoreModules.length, 6);
  assert.ok(venue.fullReport.conclusion);
  assert.ok(venue.fullReport.recommendations.length > 0);
  assert.ok(venue.fullReport.cautions.length > 0);
  assert.ok(venue.fullReport.sessionSummary);
});

test("every canonical equipment reference image ships with the public site", async () => {
  const publicRoot = fileURLToPath(new URL("../public", import.meta.url));
  await Promise.all(equipmentReferenceCatalog.flatMap(category => category.items).map(item => {
    assert.match(item.referenceImage, /^\/assets\/equipment-reference\//);
    return access(`${publicRoot}${item.referenceImage}`);
  }));
});

test("upload, review, publish, and public-card surfaces share the V2 contract", async () => {
  const [upload, admin, publicApp, api] = await Promise.all([
    readFile(new URL("../public/report-upload.js", import.meta.url), "utf8"),
    readFile(new URL("../public/admin.js", import.meta.url), "utf8"),
    readFile(new URL("../public/app.js", import.meta.url), "utf8"),
    readFile(new URL("../worker/api.ts", import.meta.url), "utf8"),
  ]);

  for (const field of ["pricing", "crowdObservations", "equipmentInventory"]) {
    assert.match(upload, new RegExp(field));
    assert.match(admin, new RegExp(field));
    assert.match(publicApp, new RegExp(field));
    assert.match(api, new RegExp(field));
  }
  assert.match(admin, /fullReport/);
  assert.match(publicApp, /fullReport/);
  assert.match(api, /detailedCardMissing/);
  assert.match(publicApp, /不会用演示场馆填充结果/);
});
