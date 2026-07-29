import { calculateScore, emptyScoringFacts } from "./scoring.mjs";

const yesNoUnknown = ["yes", "no", "unknown"];
const scoringFactsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    sessionsCompleted: { type: "integer", minimum: 0, maximum: 4 },
    hasWeekdayPeak: { type: "boolean" },
    moduleComplete: {
      type: "object", additionalProperties: false,
      properties: Object.fromEntries(["price", "equipment", "crowd", "hygiene", "sales", "beginner"].map(key => [key, { type: "boolean" }])),
      required: ["price", "equipment", "crowd", "hygiene", "sales", "beginner"]
    },
    priceCards: {
      type: "array", maxItems: 5,
      items: {
        type: "object", additionalProperties: false,
        properties: {
          name: { type: "string", enum: ["单次", "周卡", "月卡", "季卡", "年卡"] },
          provided: { type: "boolean" }, amountKnown: { type: "boolean" }, validityKnown: { type: "boolean" },
          source: { type: "string", enum: ["价目表", "合同", "前台", "其他清楚", "其他不明", "未填写"] }
        },
        required: ["name", "provided", "amountKnown", "validityKnown", "source"]
      }
    },
    feeRules: {
      type: "array", minItems: 8, maxItems: 8,
      items: {
        type: "object", additionalProperties: false,
        properties: {
          name: { type: "string", enum: ["停卡费", "转卡费", "押金", "储物柜", "淋浴", "门禁卡", "自动续费", "其他"] },
          clarity: { type: "string", enum: ["full", "partial", "vague", "noneOrNA"] },
          disclosed: { type: "string", enum: ["yes", "no", "na"] }
        },
        required: ["name", "clarity", "disclosed"]
      }
    },
    equipment: {
      type: "object", additionalProperties: false,
      properties: {
        coverage: {
          type: "object", additionalProperties: false,
          properties: {
            cardioKinds: { type: "integer", minimum: 0 }, backKinds: { type: "integer", minimum: 0 },
            chestKinds: { type: "integer", minimum: 0 }, legKinds: { type: "integer", minimum: 0 },
            armKinds: { type: "integer", minimum: 0 }, shoulderKinds: { type: "integer", minimum: 0 }, coreKinds: { type: "integer", minimum: 0 },
            dumbbells: {
              type: "object", additionalProperties: false,
              properties: { hasDumbbells: { type: "boolean" }, hasBench: { type: "boolean" }, hasSpace: { type: "boolean" } },
              required: ["hasDumbbells", "hasBench", "hasSpace"]
            },
            stretch: {
              type: "object", additionalProperties: false,
              properties: { hasSpace: { type: "boolean" }, hasTool: { type: "boolean" } },
              required: ["hasSpace", "hasTool"]
            }
          },
          required: ["cardioKinds", "backKinds", "chestKinds", "legKinds", "armKinds", "shoulderKinds", "coreKinds", "dumbbells", "stretch"]
        },
        uniqueTotal: { type: "integer", minimum: 0 }, uniqueAvailable: { type: "integer", minimum: 0 }, conditionComplete: { type: "boolean" }
      },
      required: ["coverage", "uniqueTotal", "uniqueAvailable", "conditionComplete"]
    },
    crowd: {
      type: "array", maxItems: 4,
      items: {
        type: "object", additionalProperties: false,
        properties: { isWeekdayPeak: { type: "boolean" }, state: { type: "string", enum: ["宽松", "一般", "高峰", "未填写"] }, maxWaitMinutes: { type: "number", minimum: -1 } },
        required: ["isWeekdayPeak", "state", "maxWaitMinutes"]
      }
    },
    hygiene: {
      type: "array", maxItems: 7,
      items: {
        type: "object", additionalProperties: false,
        properties: {
          area: { type: "string", enum: ["更衣区", "卫生间", "淋浴间", "训练区地面", "器械表面", "瑜伽垫/泡沫轴", "通风与气味"] },
          status: { type: "string", enum: ["好", "一般", "差", "无", "未填写"] }
        }, required: ["area", "status"]
      }
    },
    sales: {
      type: "object", additionalProperties: false,
      properties: {
        priceValidity: { type: "string", enum: yesNoUnknown }, pauseTransferRefund: { type: "string", enum: yesNoUnknown },
        autoRenew: { type: "string", enum: ["yes", "no", "na", "unknown"] }, contractCopy: { type: "string", enum: yesNoUnknown },
        repeatedPressure: { type: "string", enum: yesNoUnknown }, ptBundling: { type: "string", enum: yesNoUnknown }
      }, required: ["priceValidity", "pauseTransferRefund", "autoRenew", "contractCopy", "repeatedPressure", "ptBundling"]
    },
    beginner: {
      type: "object", additionalProperties: false,
      properties: {
        entry: { type: "string", enum: ["清楚", "需询问", "难理解", "未填写"] },
        zones: { type: "string", enum: ["清楚", "一般", "难寻找", "未填写"] },
        safety: { type: "string", enum: ["充分", "部分", "缺少", "未填写"] },
        staff: { type: "string", enum: ["主动帮助", "简单回应", "未帮助", "未填写"] },
        basicHelpFee: { type: "string", enum: ["免费", "要求购私教", "未确认", "未填写"] }
      }, required: ["entry", "zones", "safety", "staff", "basicHelpFee"]
    },
    evidenceStatus: {
      type: "object", additionalProperties: false,
      properties: Object.fromEntries(["price", "equipment", "crowd", "hygiene", "sales", "beginner"].map(key => [key, { type: "string", enum: ["full", "partial", "none"] }])),
      required: ["price", "equipment", "crowd", "hygiene", "sales", "beginner"]
    },
    seriousRisk: { type: "boolean" },
    riskReviewNeededReasons: { type: "array", items: { type: "string" }, maxItems: 8 }
  },
  required: ["sessionsCompleted", "hasWeekdayPeak", "moduleComplete", "priceCards", "feeRules", "equipment", "crowd", "hygiene", "sales", "beginner", "evidenceStatus", "seriousRisk", "riskReviewNeededReasons"]
};

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
    confidence: { type: "integer", minimum: 0, maximum: 100 },
    scoringFacts: scoringFactsSchema
  },
  required: ["venueName", "district", "venueType", "category", "monthlyPrice", "trialPrice", "hours", "summary", "highlights", "fit", "caution", "evidence", "missingItems", "riskTags", "suggestedFlags", "equipmentLevel", "crowdEvening", "confidence", "scoringFacts"]
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
    confidence: 20,
    scoringFacts: emptyScoringFacts()
  };
}

export function createTestAnalysis(metadata = {}) {
  const evidenceStatus = { price: "full", equipment: "full", crowd: "full", hygiene: "full", sales: "full", beginner: "full" };
  return {
    venueName: "星湾测试训练馆（虚构）",
    district: "天河区测试区域",
    venueType: "商业健身房",
    category: "商业健身房",
    monthlyPrice: 399,
    trialPrice: 39,
    hours: "06:30–23:00（测试数据）",
    summary: `这是系统生成的测试审核草稿，用于验证报告上传、评分、审核与发布隔离流程。体验官：${metadata.evaluatorName || "测试体验官"}。所有场馆与体验信息均为虚构，不得作为消费建议。`,
    highlights: ["四次到店记录完整（含工作日晚高峰）", "54 台器械均可用", "价格与收费规则已按测试场景填写"],
    fit: "仅供后台流程测试，不面向真实用户推荐。",
    caution: "全部内容为虚构测试数据；即使完成审核发布，也只会进入隔离的测试记录，不会在用户网站展示。",
    evidence: ["系统测试报告 P01–P07", "四次虚构到店记录", "仅供后台测试"],
    missingItems: [],
    riskTags: [],
    suggestedFlags: { beginner: true, lowSales: true, shower: true, cleanEnvironment: true, open24: false, womenFriendly: true, nightSafety: true },
    equipmentLevel: 10,
    crowdEvening: "拥挤",
    confidence: 100,
    scoringFacts: {
      sessionsCompleted: 4,
      hasWeekdayPeak: true,
      moduleComplete: { price: true, equipment: true, crowd: true, hygiene: true, sales: true, beginner: true },
      priceCards: [
        ["单次", 39, 1], ["周卡", 129, 7], ["月卡", 399, 30], ["季卡", 1099, 90], ["年卡", 3599, 365]
      ].map(([name]) => ({ name, provided: true, amountKnown: true, validityKnown: true, source: "价目表" })),
      feeRules: ["停卡费", "转卡费", "押金", "储物柜", "淋浴", "门禁卡", "自动续费", "其他"]
        .map(name => ({ name, clarity: "full", disclosed: name === "自动续费" || name === "其他" ? "na" : "yes" })),
      equipment: {
        coverage: {
          cardioKinds: 2, backKinds: 2, chestKinds: 3, legKinds: 4, armKinds: 2, shoulderKinds: 2, coreKinds: 2,
          dumbbells: { hasDumbbells: true, hasBench: true, hasSpace: true },
          stretch: { hasSpace: true, hasTool: true }
        },
        uniqueTotal: 54,
        uniqueAvailable: 54,
        conditionComplete: true
      },
      crowd: [
        { isWeekdayPeak: false, state: "宽松", maxWaitMinutes: 2 },
        { isWeekdayPeak: false, state: "一般", maxWaitMinutes: 3 },
        { isWeekdayPeak: true, state: "高峰", maxWaitMinutes: 6 },
        { isWeekdayPeak: false, state: "宽松", maxWaitMinutes: 2 }
      ],
      hygiene: ["更衣区", "卫生间", "淋浴间", "训练区地面", "器械表面", "瑜伽垫/泡沫轴", "通风与气味"]
        .map(area => ({ area, status: "好" })),
      sales: { priceValidity: "yes", pauseTransferRefund: "yes", autoRenew: "na", contractCopy: "yes", repeatedPressure: "no", ptBundling: "no" },
      beginner: { entry: "清楚", zones: "清楚", safety: "充分", staff: "主动帮助", basicHelpFee: "免费" },
      evidenceStatus,
      seriousRisk: false,
      riskReviewNeededReasons: []
    }
  };
}

function completionText(response) {
  const content = response?.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim()) return content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  if (Array.isArray(content)) {
    const text = content.map(item => item?.text || "").join("").trim();
    if (text) return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  throw new Error("AI 没有返回可解析的分析结果");
}

export async function analyzeReport({ text, metadata = {}, apiKey = process.env.OPENAI_API_KEY, model = process.env.OPENAI_MODEL || "gpt-4o" }) {
  if (!apiKey) return { mode: "local-preview", model: null, analysis: localPreview(text, metadata) };

  const instructions = [
    "你是有间好馆平台的体验报告整理助手。只根据报告中的明确事实提取和概括，不得补造价格、设施或体验结论。",
    "不知道的信息使用空字符串、0、false、未确认或放入 missingItems。",
    "总结需中性、简洁，明确区分事实、风险和适合人群。评分绝对不由你计算；你只把《体验官7天测评表V1.1》中的事实准确填入 scoringFacts，后台会按《评分机制V1.2》固定计算。",
    "勾选项只按报告中明确勾选的结果提取；空白、冲突或无法确认均按未填写/unknown处理，并将对应 moduleComplete 设为 false。",
    "equipment.uniqueTotal 与 uniqueAvailable 必须按同一台器械跨区域去重；数量不一致且没有原因时 conditionComplete=false。",
    "evidenceStatus 将表格里的充分映射为 full、部分/仅口头映射为 partial、无映射为 none。seriousRisk 只用于明显安全、隐藏收费、合同或严重卫生问题。",
    "venueName 优先使用上传者提供的场馆名；confidence 表示AI文字提取把握，不是证据可信度，也不是场馆评分。",
    "只输出符合指定 JSON Schema 的 JSON，不要添加 Markdown 代码块或解释。"
  ].join("\n");

  const response = await fetch("https://api.gptsapi.net/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: instructions },
        { role: "user", content: `上传信息：${JSON.stringify(metadata)}\n\n体验官报告正文：\n${text.slice(0, 90_000)}` }
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "gym_report_analysis", strict: true, schema: analysisSchema }
      }
    })
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error?.message || `OpenAI API 请求失败（${response.status}）`);
  return { mode: "openai", model: body.model || model, responseId: body.id, analysis: JSON.parse(completionText(body)) };
}

export function analysisToVenue(report, analysis) {
  const scoring = calculateScore(analysis.scoringFacts || emptyScoringFacts());
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
    equipment: scoring.modules.find(module => module.key === "equipment")?.score10 ?? 0,
    shower: Boolean(flags.shower),
    cleanEnvironment: Boolean(flags.cleanEnvironment),
    open24: Boolean(flags.open24),
    womenFriendly: Boolean(flags.womenFriendly),
    nightSafety: Boolean(flags.nightSafety),
    highlights: analysis.highlights || [],
    rating: scoring.score10 ?? 0,
    experienceScore: scoring.score,
    scoreModules: scoring.modules,
    evidenceConfidence: scoring.confidence,
    confidenceGrade: scoring.confidenceGrade,
    scoringVersion: scoring.version,
    publicationGates: {
      trainingComplete: scoring.trainingComplete,
      requiredComplete: scoring.allModulesComplete,
      confidencePassed: scoring.confidence >= 70,
      riskReviewRequired: scoring.riskReviewRequired,
      blockers: scoring.blockers
    },
    riskReviewed: false,
    image: "https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=1200",
    gallery: [],
    fit: analysis.fit || "待审核",
    caution: analysis.caution || "待审核",
    evidence: analysis.evidence || ["体验官报告"],
    testerCount: 1,
    testedAt: now,
    updated: now,
    contact: { phone: "待核实", address: "待核实", nearestStation: "待核实", booking: "到店前请先联系场馆确认开放和试练安排。" },
    reportId: report.id,
    verificationStatus: "experience_verified"
  };
}
