const analysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    venueName: { type: "string" },
    district: { type: "string" },
    venueType: { type: "string" },
    category: { type: "string", enum: ["商业健身房", "铁馆", "其他"] },
    monthlyPrice: { type: "number", minimum: 0 },
    trialPrice: { type: "number", minimum: 0 },
    hours: { type: "string" },
    summary: { type: "string" },
    highlights: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
    fit: { type: "string" },
    caution: { type: "string" },
    evidence: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 6 },
    missingItems: { type: "array", items: { type: "string" }, maxItems: 12 },
    riskTags: { type: "array", items: { type: "string" }, maxItems: 8 },
    suggestedFlags: {
      type: "object",
      additionalProperties: false,
      properties: {
        beginner: { type: "boolean" },
        lowSales: { type: "boolean" },
        shower: { type: "boolean" },
        cleanEnvironment: { type: "boolean" },
        open24: { type: "boolean" },
        womenFriendly: { type: "boolean" },
        nightSafety: { type: "boolean" }
      },
      required: ["beginner", "lowSales", "shower", "cleanEnvironment", "open24", "womenFriendly", "nightSafety"]
    },
    equipmentLevel: { type: "integer", minimum: 0, maximum: 10 },
    crowdEvening: { type: "string", enum: ["宽松", "一般", "拥挤", "未确认"] },
    confidence: { type: "integer", minimum: 0, maximum: 100 }
  },
  required: ["venueName", "district", "venueType", "category", "monthlyPrice", "trialPrice", "hours", "summary", "highlights", "fit", "caution", "evidence", "missingItems", "riskTags", "suggestedFlags", "equipmentLevel", "crowdEvening", "confidence"]
};

function firstMatch(text, patterns, fallback = "") {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return fallback;
}

function moneyAfter(text, labels) {
  for (const label of labels) {
    const match = text.match(new RegExp(`${label}[^\\d]{0,18}(\\d+(?:\\.\\d+)?)`, "i"));
    if (match) return Number(match[1]);
  }
  return 0;
}

function localPreview(text, metadata) {
  const venueName = metadata.venueName || firstMatch(text, [/(?:场馆名称|健身房名称)[：:\s]+([^\n\t]+)/, /体验场馆[：:\s]+([^\n\t]+)/], "待审核场馆");
  const district = firstMatch(text, [/(?:所在区域|行政区|区域)[：:\s]+([^\n\t]+)/], "待补充区域");
  const hasShower = /淋浴/.test(text) && !/无淋浴|不提供淋浴/.test(text);
  const open24 = /24\s*小时|24H/i.test(text);
  const risks = [];
  if (/隐藏收费|强制|捆绑|严重|安全风险/.test(text)) risks.push("报告中出现需要复核的风险描述");
  return {
    venueName,
    district,
    venueType: firstMatch(text, [/(?:场馆类型|健身房类型)[：:\s]+([^\n\t]+)/], "待确认类型"),
    category: /铁馆/.test(text) ? "铁馆" : "商业健身房",
    monthlyPrice: moneyAfter(text, ["月卡", "月费"]),
    trialPrice: moneyAfter(text, ["单次", "体验价", "试练"]),
    hours: open24 ? "24 小时" : firstMatch(text, [/(?:营业时间|开放时间)[：:\s]+([^\n\t]+)/], "待确认"),
    summary: "报告已完成文字提取，等待接入 OpenAI API 后生成正式总结。当前内容仅供后台预览，发布前请人工核对。",
    highlights: ["报告已成功上传", "原始内容已完成提取", "等待人工审核"],
    fit: "待AI分析后确认适合人群。",
    caution: risks[0] || "发布前请核对价格、器械、拥挤与收费信息。",
    evidence: ["体验官上传的原始报告"],
    missingItems: ["尚未配置 OPENAI_API_KEY，当前为本地预览分析"],
    riskTags: risks,
    suggestedFlags: { beginner: false, lowSales: false, shower: hasShower, cleanEnvironment: false, open24, womenFriendly: false, nightSafety: false },
    equipmentLevel: 0,
    crowdEvening: "未确认",
    confidence: 20
  };
}

function outputText(response) {
  for (const output of response.output || []) {
    for (const content of output.content || []) {
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  throw new Error("AI 没有返回可解析的分析结果");
}

export async function analyzeReport({ text, metadata = {}, apiKey = process.env.OPENAI_API_KEY, model = process.env.OPENAI_MODEL || "gpt-5.6-luna" }) {
  if (!apiKey) return { mode: "local-preview", model: null, analysis: localPreview(text, metadata) };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      store: false,
      instructions: [
        "你是练哪儿平台的体验报告整理助手。只根据报告中的明确事实提取和概括，不得补造价格、设施或体验结论。",
        "不知道的信息使用空字符串、0、false、未确认或放入 missingItems。",
        "总结需中性、简洁，明确区分事实、风险和适合人群。评分不由你计算，后台会使用固定规则处理。",
        "venueName 优先使用上传者提供的场馆名；confidence 表示本次提取可靠程度，不是场馆评分。"
      ].join("\n"),
      input: `上传信息：${JSON.stringify(metadata)}\n\n体验官报告正文：\n${text.slice(0, 90_000)}`,
      text: { format: { type: "json_schema", name: "gym_report_analysis", strict: true, schema: analysisSchema } }
    })
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error?.message || `OpenAI API 请求失败（${response.status}）`);
  return { mode: "openai", model: body.model || model, responseId: body.id, analysis: JSON.parse(outputText(body)) };
}

export function analysisToVenue(report, analysis) {
  const now = new Date().toISOString().slice(0, 10);
  const slug = (analysis.venueName || report.venueName || `venue-${report.id}`)
    .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 42) || `venue-${report.id}`;
  const flags = analysis.suggestedFlags || {};
  return {
    id: `${slug}-${report.id.slice(-6)}`,
    name: analysis.venueName || report.venueName || "待命名场馆",
    district: analysis.district || "待补充区域",
    type: analysis.venueType || "健身房",
    category: analysis.category === "铁馆" ? "铁馆" : "商业健身房",
    monthlyPrice: Number(analysis.monthlyPrice) || 0,
    trialPrice: Number(analysis.trialPrice) || 0,
    coordinates: [113.2644, 23.1291],
    hours: analysis.hours || "待确认",
    crowd: { evening: analysis.crowdEvening === "未确认" ? "一般" : analysis.crowdEvening, morning: "一般", weekend: "一般", flexible: "一般" },
    beginner: Boolean(flags.beginner),
    lowSales: Boolean(flags.lowSales),
    equipment: Number(analysis.equipmentLevel) || 0,
    shower: Boolean(flags.shower),
    cleanEnvironment: Boolean(flags.cleanEnvironment),
    open24: Boolean(flags.open24),
    womenFriendly: Boolean(flags.womenFriendly),
    nightSafety: Boolean(flags.nightSafety),
    highlights: analysis.highlights || [],
    rating: 0,
    image: "https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=1200",
    gallery: [],
    fit: analysis.fit || "待审核",
    caution: analysis.caution || "待审核",
    evidence: analysis.evidence || ["体验官报告"],
    testerCount: 1,
    testedAt: now,
    updated: now,
    contact: { phone: "待核实", address: "待核实", nearestStation: "待核实", booking: "到店前请先联系场馆确认开放和试练安排。" },
    reportId: report.id
  };
}
