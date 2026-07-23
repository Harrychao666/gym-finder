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
});
