import test from "node:test";
import assert from "node:assert/strict";
import { calculateScore, emptyScoringFacts } from "../lib/scoring.mjs";

function completeFacts() {
  const facts = emptyScoringFacts();
  facts.sessionsCompleted = 4;
  facts.hasWeekdayPeak = true;
  facts.moduleComplete = { price: true, equipment: true, crowd: true, hygiene: true, sales: true, beginner: true };
  facts.priceCards = [{ name: "月卡", provided: true, amountKnown: true, validityKnown: true, source: "价目表" }];
  facts.feeRules = ["停卡费", "转卡费", "押金", "储物柜", "淋浴", "门禁卡", "自动续费", "其他"].map(name => ({ name, clarity: "noneOrNA", disclosed: "na" }));
  facts.equipment = {
    coverage: {
      cardioKinds: 2, backKinds: 2, chestKinds: 3, legKinds: 4, armKinds: 2, shoulderKinds: 2, coreKinds: 2,
      dumbbells: { hasDumbbells: true, hasBench: true, hasSpace: true },
      stretch: { hasSpace: true, hasTool: true }
    },
    uniqueTotal: 50, uniqueAvailable: 50, conditionComplete: true
  };
  facts.crowd = [
    { isWeekdayPeak: true, state: "宽松", maxWaitMinutes: 2 },
    { isWeekdayPeak: false, state: "宽松", maxWaitMinutes: 0 },
    { isWeekdayPeak: false, state: "宽松", maxWaitMinutes: 0 },
    { isWeekdayPeak: false, state: "宽松", maxWaitMinutes: 0 }
  ];
  facts.hygiene = ["更衣区", "卫生间", "淋浴间", "训练区地面", "器械表面", "瑜伽垫/泡沫轴", "通风与气味"].map(area => ({ area, status: "好" }));
  facts.sales = { priceValidity: "yes", pauseTransferRefund: "yes", autoRenew: "na", contractCopy: "yes", repeatedPressure: "no", ptBundling: "no" };
  facts.beginner = { entry: "清楚", zones: "清楚", safety: "充分", staff: "主动帮助", basicHelpFee: "免费" };
  facts.evidenceStatus = { price: "full", equipment: "full", crowd: "full", hygiene: "full", sales: "full", beginner: "full" };
  return facts;
}

test("V1.2 perfect facts produce 100 points and A confidence", () => {
  const result = calculateScore(completeFacts());
  assert.equal(result.score, 100);
  assert.equal(result.score10, 10);
  assert.equal(result.confidence, 100);
  assert.equal(result.confidenceGrade, "A");
  assert.equal(result.publishableBeforeRiskReview, true);
  assert.deepEqual(result.modules.map(module => module.max), [15, 30, 15, 15, 15, 10]);
});

test("incomplete facts do not generate an overall score", () => {
  const facts = completeFacts();
  facts.moduleComplete.beginner = false;
  facts.evidenceStatus = { price: "partial", equipment: "partial", crowd: "partial", hygiene: "none", sales: "none", beginner: "none" };
  const result = calculateScore(facts);
  assert.equal(result.score, null);
  assert.equal(result.confidenceGrade, "C");
  assert.equal(result.allModulesComplete, false);
  assert.ok(result.blockers.some(item => item.includes("必填项未完成")));
});

test("serious risk blocks publication without changing score", () => {
  const facts = completeFacts();
  facts.seriousRisk = true;
  const result = calculateScore(facts);
  assert.equal(result.score, 100);
  assert.equal(result.riskReviewRequired, true);
  assert.equal(result.publishableBeforeRiskReview, false);
});
