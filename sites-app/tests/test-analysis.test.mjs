import assert from "node:assert/strict";
import test from "node:test";
import { createTestAnalysis, analysisToVenue } from "../lib/report-analysis.mjs";
import { calculateScore } from "../lib/scoring.mjs";

test("test analysis creates a complete, isolated review fixture", () => {
  const analysis = createTestAnalysis({ evaluatorName: "测试体验官" });
  const score = calculateScore(analysis.scoringFacts);
  const draft = analysisToVenue({ id: "report-test-123456" }, analysis);

  assert.equal(score.trainingComplete, true);
  assert.equal(score.allModulesComplete, true);
  assert.equal(score.confidenceGrade, "A");
  assert.equal(score.blockers.length, 0);
  assert.ok(score.score > 0);
  assert.equal(draft.experienceScore, score.score);
  assert.equal(draft.name, "星湾测试训练馆（虚构）");
  assert.equal(draft.reportSchemaVersion, "experience-report-v2.0");
  assert.equal(draft.pricing.plans.length, 5);
  assert.equal(draft.pricing.plans.find(plan => plan.name === "月卡").amount, 399);
  assert.equal(draft.crowdObservations.length, 5);
  assert.equal(Math.max(...draft.crowdObservations.map(record => record.maxWaitMinutes)), 12);
  assert.deepEqual(draft.equipmentInventory.map(category => category.id), ["03A", "03B", "03C", "03D", "03E", "03F", "03G", "03H", "03I"]);
  assert.ok(draft.equipmentInventory.every(category => category.items.every(item => item.referenceImage.startsWith("/assets/equipment-reference/"))));
  assert.ok(draft.fullReport.conclusion);
  assert.ok(draft.fullReport.recommendations.length);
});
