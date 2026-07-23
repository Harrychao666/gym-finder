import { beginnerQuestions, equipmentCategories, hygieneAreas, salesQuestions } from "./form-schema.mjs";

const hasText = value => typeof value === "string" && value.trim().length > 0;

export function validateSubmission(answers) {
  const missing = [];
  const profile = answers?.profile || {};
  if (!hasText(profile.venueName)) missing.push("填写场馆名称");
  if (!hasText(profile.evaluatorName)) missing.push("填写体验官姓名或编号");
  if (!profile.periodStart || !profile.periodEnd) missing.push("填写完整体验周期");

  const sessions = Array.isArray(answers?.sessions) ? answers.sessions : [];
  if (sessions.length !== 4) {
    missing.push("保留4次训练记录");
  } else {
    sessions.forEach((session, index) => {
      if (!session.date || !session.start || !session.end || !hasText(session.content)) missing.push(`补全第${index + 1}次训练记录`);
    });
    if (!sessions.some(session => session.isPeak)) missing.push("至少标记一次工作日18:00–21:00晚高峰训练");
  }

  const providedCards = Object.entries(answers?.prices || {}).filter(([, value]) => value.provided);
  if (!providedCards.length) missing.push("至少完整核验一种卡项");
  providedCards.forEach(([name, value]) => {
    if (!hasText(value.amount) || !hasText(value.validity) || !hasText(value.source)) missing.push(`补全${name}的金额、有效期和来源`);
  });

  for (const category of equipmentCategories) {
    for (const name of category.items) {
      const item = answers?.equipment?.[category.id]?.[name] || {};
      const total = Number(item.total);
      const available = Number(item.available);
      if (item.total === "" || item.available === "" || !Number.isFinite(total) || !Number.isFinite(available)) {
        missing.push(`填写${name}的总数和可用数`);
        continue;
      }
      if (total < 0 || available < 0 || available > total) missing.push(`检查${name}的数量关系`);
      if (available !== total && !hasText(item.note)) missing.push(`说明${name}总数与可用数不同的原因`);
    }
  }

  const crowd = Array.isArray(answers?.crowd) ? answers.crowd : [];
  crowd.forEach((record, index) => {
    if (!record.observedAt || record.cardioVacancies === "" || record.cableVacancies === "" || record.maxWait === "" || !record.state) missing.push(`补全第${index + 1}次拥挤观察`);
  });

  hygieneAreas.forEach(name => {
    if (!answers?.hygiene?.[name]?.status) missing.push(`选择${name}的状态`);
  });
  salesQuestions.forEach(question => {
    if (!answers?.sales?.[question.id]?.result) missing.push(`回答“${question.label}”`);
  });
  beginnerQuestions.forEach(question => {
    if (!answers?.beginner?.[question.id]?.result) missing.push(`回答“${question.label}”`);
  });

  const final = answers?.final || {};
  const conclusionLength = [...(final.conclusion || "").trim()].length;
  if (conclusionLength < 80 || conclusionLength > 150) missing.push("综合结论需控制在80–150字");
  if (!hasText(final.recommendations)) missing.push("填写最推荐的三点");
  if (!hasText(final.cautions)) missing.push("填写办卡前必须知道的三点");

  return { valid: missing.length === 0, missing: [...new Set(missing)] };
}
