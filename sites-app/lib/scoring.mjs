const MODULES = [
  ["price", "价格与费用透明", 15],
  ["equipment", "器械情况", 30],
  ["crowd", "拥挤情况", 15],
  ["hygiene", "环境与卫生", 15],
  ["sales", "销售与办卡", 15],
  ["beginner", "新手友好", 10]
];

const round = (value, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));

function moduleResult(key, points, complete, note) {
  const definition = MODULES.find(item => item[0] === key);
  const max = definition[2];
  const safePoints = complete ? round(clamp(points, 0, max), 2) : null;
  return {
    key,
    label: definition[1],
    weight: max,
    points: safePoints,
    max,
    score10: safePoints === null ? null : round(safePoints / max * 10, 1),
    complete: Boolean(complete),
    note
  };
}

function priceScore(facts, complete) {
  const cards = (facts.priceCards || []).filter(card => card.provided);
  const sourceCoefficient = { "价目表": 1, "合同": 0.8, "前台": 0.5, "其他清楚": 0.5, "其他不明": 0, "未填写": 0 };
  const cardsComplete = cards.length > 0 && cards.every(card => card.amountKnown && card.validityKnown && card.source !== "未填写");
  const disclosure = cards.length
    ? cards.reduce((sum, card) => sum + (sourceCoefficient[card.source] ?? 0), 0) / cards.length * 5
    : 0;

  const rules = facts.feeRules || [];
  const clarityCoefficient = { full: 1, partial: 0.5, vague: 0, noneOrNA: 1 };
  const clarity = rules.length
    ? rules.reduce((sum, rule) => sum + (clarityCoefficient[rule.clarity] ?? 0), 0) / rules.length * 6
    : 0;
  const applicable = rules.filter(rule => rule.clarity !== "noneOrNA");
  const activeDisclosure = applicable.length
    ? applicable.filter(rule => rule.disclosed === "yes").length / applicable.length * 4
    : (rules.length ? 4 : 0);
  const isComplete = complete && cardsComplete && rules.length === 8;
  return moduleResult("price", disclosure + clarity + activeDisclosure, isComplete,
    `价格公开 ${round(disclosure, 1)}/5 · 收费规则 ${round(clarity, 1)}/6 · 主动告知 ${round(activeDisclosure, 1)}/4`);
}

function coveragePoints(coverage = {}) {
  const kindPoints = (count, fullAt, max) => count >= fullAt ? max : count > 0 ? max / 2 : 0;
  let points = 0;
  points += kindPoints(coverage.cardioKinds, 2, 2);
  points += kindPoints(coverage.backKinds, 2, 2);
  points += kindPoints(coverage.chestKinds, 3, 3);
  points += kindPoints(coverage.legKinds, 4, 4);
  const dumbbells = coverage.dumbbells || {};
  points += dumbbells.hasDumbbells
    ? (dumbbells.hasBench && dumbbells.hasSpace ? 3 : 1.5)
    : 0;
  points += kindPoints(coverage.armKinds, 2, 2);
  points += kindPoints(coverage.shoulderKinds, 2, 2);
  points += kindPoints(coverage.coreKinds, 2, 2);
  const stretch = coverage.stretch || {};
  points += stretch.hasSpace && stretch.hasTool ? 2 : (stretch.hasSpace || stretch.hasTool ? 1 : 0);
  return points;
}

function equipmentScore(facts, complete) {
  const equipment = facts.equipment || {};
  const coverage = coveragePoints(equipment.coverage);
  const total = clamp(equipment.uniqueTotal, 0, 10000);
  const available = clamp(equipment.uniqueAvailable, 0, total);
  const availability = total > 0 ? available / total * 8 : 0;
  const isComplete = complete && equipment.conditionComplete;
  return moduleResult("equipment", coverage + availability, isComplete,
    `九类训练覆盖 ${round(coverage, 1)}/22 · 设备可用率 ${total ? round(available / total * 100, 0) : 0}%`);
}

function crowdScore(facts, complete) {
  const records = Array.isArray(facts.crowd) ? facts.crowd : [];
  const stateCoefficient = { "宽松": 1, "一般": 0.6, "高峰": 0.2 };
  const stateRank = { "宽松": 0, "一般": 1, "高峰": 2 };
  const peakCandidates = records.map((record, index) => ({ record, index })).filter(item => item.record.isWeekdayPeak);
  peakCandidates.sort((a, b) => (stateRank[b.record.state] ?? -1) - (stateRank[a.record.state] ?? -1) || Number(b.record.maxWaitMinutes) - Number(a.record.maxWaitMinutes));
  const chosenPeak = peakCandidates[0];
  const others = records.filter((_, index) => index !== chosenPeak?.index).slice(0, 3);
  const weightedCoefficient = chosenPeak
    ? (stateCoefficient[chosenPeak.record.state] ?? 0) * 0.4 + others.reduce((sum, record) => sum + (stateCoefficient[record.state] ?? 0) * 0.2, 0)
    : 0;
  const statePoints = weightedCoefficient * 9;
  const wait = Number(chosenPeak?.record.maxWaitMinutes);
  const waitPoints = !Number.isFinite(wait) ? 0 : wait <= 2 ? 6 : wait <= 5 ? 5 : wait <= 10 ? 3 : wait <= 15 ? 1 : 0;
  const isComplete = complete && records.length === 4 && records.every(record => ["宽松", "一般", "高峰"].includes(record.state) && Number.isFinite(Number(record.maxWaitMinutes))) && Boolean(chosenPeak);
  return moduleResult("crowd", statePoints + waitPoints, isComplete,
    `四次现场判断 ${round(statePoints, 1)}/9 · 晚高峰等待 ${round(waitPoints, 1)}/6`);
}

function hygieneScore(facts, complete) {
  const records = Array.isArray(facts.hygiene) ? facts.hygiene : [];
  const cleaning = records.filter(item => item.area !== "通风与气味" && item.status !== "无");
  const coefficient = { "好": 1, "一般": 0.6, "差": 0 };
  const cleaningPoints = cleaning.length
    ? cleaning.reduce((sum, item) => sum + (coefficient[item.status] ?? 0), 0) / cleaning.length * 12
    : 0;
  const ventilation = records.find(item => item.area === "通风与气味");
  const ventilationPoints = ventilation?.status === "好" ? 3 : ventilation?.status === "一般" ? 1.5 : 0;
  const isComplete = complete && records.length === 7 && records.every(item => item.status !== "未填写") && Boolean(ventilation) && cleaning.length > 0;
  return moduleResult("hygiene", cleaningPoints + ventilationPoints, isComplete,
    `适用区域清洁 ${round(cleaningPoints, 1)}/12 · 通风气味 ${round(ventilationPoints, 1)}/3`);
}

function salesScore(facts, complete) {
  const sales = facts.sales || {};
  const points =
    (sales.priceValidity === "yes" ? 3 : 0) +
    (sales.pauseTransferRefund === "yes" ? 3 : 0) +
    (["yes", "na"].includes(sales.autoRenew) ? 2 : 0) +
    (sales.contractCopy === "yes" ? 2 : 0) +
    (sales.repeatedPressure === "no" ? 2.5 : 0) +
    (sales.ptBundling === "no" ? 2.5 : 0);
  const answered = ["priceValidity", "pauseTransferRefund", "autoRenew", "contractCopy", "repeatedPressure", "ptBundling"]
    .every(key => ["yes", "no", "na"].includes(sales[key]));
  return moduleResult("sales", points, complete && answered, "按六项标准咨询结果固定换算，不采用主观加减分");
}

function beginnerScore(facts, complete) {
  const beginner = facts.beginner || {};
  const tri = (value, high, middle, low, max) => value === high ? max : value === middle ? max / 2 : value === low ? 0 : 0;
  const points =
    tri(beginner.entry, "清楚", "需询问", "难理解", 1) +
    tri(beginner.zones, "清楚", "一般", "难寻找", 1) +
    tri(beginner.safety, "充分", "部分", "缺少", 3) +
    tri(beginner.staff, "主动帮助", "简单回应", "未帮助", 3) +
    (beginner.basicHelpFee === "免费" ? 2 : 0);
  const answered = ["entry", "zones", "safety", "staff", "basicHelpFee"].every(key => Boolean(beginner[key]) && beginner[key] !== "未填写");
  const isComplete = complete && answered && beginner.basicHelpFee !== "未确认";
  return moduleResult("beginner", points, isComplete, "按入场、分区、安全提示、员工回应和基础帮助收费固定换算");
}

export function calculateScore(facts = {}) {
  const completeness = facts.moduleComplete || {};
  const modules = [
    priceScore(facts, completeness.price),
    equipmentScore(facts, completeness.equipment),
    crowdScore(facts, completeness.crowd),
    hygieneScore(facts, completeness.hygiene),
    salesScore(facts, completeness.sales),
    beginnerScore(facts, completeness.beginner)
  ];
  const allModulesComplete = modules.every(module => module.complete);
  const trainingComplete = Number(facts.sessionsCompleted) >= 4 && Boolean(facts.hasWeekdayPeak);
  const score = allModulesComplete && trainingComplete
    ? round(modules.reduce((sum, module) => sum + module.points, 0), 1)
    : null;

  const evidence = facts.evidenceStatus || {};
  const evidenceCoefficient = { full: 1, partial: 0.6, none: 0 };
  const confidence = round(MODULES.reduce((sum, [key, , weight]) => sum + weight * (evidenceCoefficient[evidence[key]] ?? 0), 0), 0);
  const confidenceGrade = confidence >= 85 ? "A" : confidence >= 70 ? "B" : "C";
  const riskReviewRequired = Boolean(facts.seriousRisk);
  const blockers = [];
  if (!trainingComplete) blockers.push("未完成4次真实训练或未覆盖工作日晚高峰");
  if (!allModulesComplete) blockers.push(`必填项未完成：${modules.filter(module => !module.complete).map(module => module.label).join("、")}`);
  if (confidence < 70) blockers.push(`证据可信度为${confidence}%（${confidenceGrade}级），低于公开门槛`);
  if (riskReviewRequired) blockers.push("存在需二次核验的安全、收费或卫生风险");

  return {
    version: "scoring-v1.2",
    score,
    score10: score === null ? null : round(score / 10, 1),
    modules,
    confidence,
    confidenceGrade,
    trainingComplete,
    allModulesComplete,
    riskReviewRequired,
    publishableBeforeRiskReview: trainingComplete && allModulesComplete && confidence >= 70 && !riskReviewRequired,
    blockers
  };
}

export function emptyScoringFacts() {
  return {
    sessionsCompleted: 0,
    hasWeekdayPeak: false,
    moduleComplete: { price: false, equipment: false, crowd: false, hygiene: false, sales: false, beginner: false },
    priceCards: [],
    feeRules: [],
    equipment: {
      coverage: {
        cardioKinds: 0, backKinds: 0, chestKinds: 0, legKinds: 0, armKinds: 0, shoulderKinds: 0, coreKinds: 0,
        dumbbells: { hasDumbbells: false, hasBench: false, hasSpace: false },
        stretch: { hasSpace: false, hasTool: false }
      },
      uniqueTotal: 0,
      uniqueAvailable: 0,
      conditionComplete: false
    },
    crowd: [],
    hygiene: [],
    sales: { priceValidity: "unknown", pauseTransferRefund: "unknown", autoRenew: "unknown", contractCopy: "unknown", repeatedPressure: "unknown", ptBundling: "unknown" },
    beginner: { entry: "", zones: "", safety: "", staff: "", basicHelpFee: "" },
    evidenceStatus: { price: "none", equipment: "none", crowd: "none", hygiene: "none", sales: "none", beginner: "none" },
    seriousRisk: false,
    riskReviewNeededReasons: []
  };
}
