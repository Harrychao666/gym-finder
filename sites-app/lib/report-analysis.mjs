import { calculateScore, emptyScoringFacts } from "./scoring.mjs";
import {
  REPORT_SCHEMA_VERSION,
  cardTypes,
  equipmentReferenceCatalog,
  extraFeeTypes
} from "./form-schema.mjs";

const yesNoUnknown = ["yes", "no", "unknown"];
const pricingSourceValues = ["价目表", "合同", "前台", "其他清楚", "其他不明", "未填写"];
const equipmentCategoryIds = equipmentReferenceCatalog.map(category => category.id);
const equipmentCodes = equipmentReferenceCatalog.flatMap(category => category.items.map(item => item.code));

const pricingSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    plans: {
      type: "array",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string", enum: cardTypes },
          provided: { type: "boolean" },
          amount: { type: "number", minimum: 0 },
          validity: { type: "string" },
          source: { type: "string", enum: pricingSourceValues },
          note: { type: "string" }
        },
        required: ["name", "provided", "amount", "validity", "source", "note"]
      }
    },
    fees: {
      type: "array",
      minItems: 8,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string", enum: extraFeeTypes },
          rule: { type: "string" },
          disclosed: { type: "string", enum: ["yes", "no", "na", "unknown"] },
          note: { type: "string" }
        },
        required: ["name", "rule", "disclosed", "note"]
      }
    }
  },
  required: ["plans", "fees"]
};

const crowdObservationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    observedAt: { type: "string" },
    date: { type: "string" },
    start: { type: "string" },
    end: { type: "string" },
    dayType: { type: "string", enum: ["weekday", "weekend", "unknown"] },
    isWeekdayPeak: { type: "boolean" },
    cardioVacancies: { type: "integer", minimum: -1 },
    cardioWaitMinutes: { type: "number", minimum: -1 },
    cableVacancies: { type: "integer", minimum: -1 },
    cableWaitMinutes: { type: "number", minimum: -1 },
    queuePeople: { type: "integer", minimum: -1 },
    approxPeople: { type: "integer", minimum: -1 },
    maxWaitMinutes: { type: "number", minimum: -1 },
    state: { type: "string", enum: ["宽松", "一般", "高峰", "未填写"] },
    description: { type: "string" },
    evidence: { type: "array", items: { type: "string" }, maxItems: 6 }
  },
  required: [
    "observedAt", "date", "start", "end", "dayType", "isWeekdayPeak", "cardioVacancies",
    "cardioWaitMinutes", "cableVacancies", "cableWaitMinutes", "queuePeople", "approxPeople",
    "maxWaitMinutes", "state", "description", "evidence"
  ]
};

const equipmentInventorySchema = {
  type: "array",
  maxItems: 9,
  items: {
    type: "object",
    additionalProperties: false,
    properties: {
      id: { type: "string", enum: equipmentCategoryIds },
      label: { type: "string" },
      total: { type: "integer", minimum: 0 },
      available: { type: "integer", minimum: 0 },
      maxWaitMinutes: { type: "number", minimum: -1 },
      summary: { type: "string" },
      items: {
        type: "array",
        maxItems: 20,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            code: { type: "string", enum: equipmentCodes },
            total: { type: "integer", minimum: 0 },
            available: { type: "integer", minimum: 0 },
            maxWaitMinutes: { type: "number", minimum: -1 },
            status: { type: "string", enum: ["ok", "issue", "unknown"] },
            issueSummary: { type: "string" },
            issuePhotos: {
              type: "array",
              maxItems: 6,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  src: { type: "string" },
                  caption: { type: "string" },
                  date: { type: "string" }
                },
                required: ["src", "caption", "date"]
              }
            },
            note: { type: "string" },
            evidence: { type: "array", items: { type: "string" }, maxItems: 6 }
          },
          required: [
            "name", "code", "total", "available", "maxWaitMinutes", "status",
            "issueSummary", "issuePhotos", "note", "evidence"
          ]
        }
      }
    },
    required: ["id", "label", "total", "available", "maxWaitMinutes", "summary", "items"]
  }
};

const fullReportSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    conclusion: { type: "string" },
    recommendations: { type: "array", items: { type: "string" }, maxItems: 6 },
    cautions: { type: "array", items: { type: "string" }, maxItems: 6 },
    fit: { type: "string" },
    unfit: { type: "string" },
    sessionSummary: { type: "string" },
    sections: {
      type: "array",
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          summary: { type: "string" },
          facts: { type: "array", items: { type: "string" }, maxItems: 12 },
          evidence: { type: "array", items: { type: "string" }, maxItems: 8 }
        },
        required: ["id", "title", "summary", "facts", "evidence"]
      }
    }
  },
  required: ["conclusion", "recommendations", "cautions", "fit", "unfit", "sessionSummary", "sections"]
};

const scoringFactsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    sessionsCompleted: { type: "integer", minimum: 0, maximum: 5 },
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
    reportSchemaVersion: { type: "string", enum: [REPORT_SCHEMA_VERSION] },
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
    pricing: pricingSchema,
    crowdObservations: {
      type: "array",
      maxItems: 5,
      items: crowdObservationSchema
    },
    equipmentInventory: equipmentInventorySchema,
    fullReport: fullReportSchema,
    scoringFacts: scoringFactsSchema
  },
  required: [
    "reportSchemaVersion", "venueName", "district", "venueType", "category", "monthlyPrice", "trialPrice",
    "hours", "summary", "highlights", "fit", "caution", "evidence", "missingItems", "riskTags",
    "suggestedFlags", "equipmentLevel", "crowdEvening", "confidence", "pricing", "crowdObservations",
    "equipmentInventory", "fullReport", "scoringFacts"
  ]
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

function emptyPricing() {
  return {
    plans: cardTypes.map(name => ({ name, provided: false, amount: 0, validity: "", source: "未填写", note: "" })),
    fees: extraFeeTypes.map(name => ({ name, rule: "", disclosed: "unknown", note: "" }))
  };
}

function textList(value, limit = 12) {
  if (Array.isArray(value)) return value.map(item => String(item || "").trim()).filter(Boolean).slice(0, limit);
  const text = String(value || "").trim();
  return text ? text.split(/\r?\n|[；;]/).map(item => item.replace(/^[\s•·\-\d.、]+/, "").trim()).filter(Boolean).slice(0, limit) : [];
}

function nonNegative(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function waitMinutes(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= -1 ? number : -1;
}

function normalizePricing(value = {}) {
  const empty = emptyPricing();
  const sourcePlans = Array.isArray(value?.plans) ? value.plans : [];
  const sourceFees = Array.isArray(value?.fees) ? value.fees : [];
  return {
    plans: empty.plans.map(fallback => {
      const item = sourcePlans.find(plan => plan?.name === fallback.name) || {};
      const amount = nonNegative(item.amount);
      return {
        name: fallback.name,
        provided: Boolean(item.provided || amount > 0),
        amount,
        validity: String(item.validity || "").trim(),
        source: pricingSourceValues.includes(item.source) ? item.source : "未填写",
        note: String(item.note || "").trim()
      };
    }),
    fees: empty.fees.map(fallback => {
      const item = sourceFees.find(fee => fee?.name === fallback.name) || {};
      return {
        name: fallback.name,
        rule: String(item.rule || "").trim(),
        disclosed: ["yes", "no", "na", "unknown"].includes(item.disclosed) ? item.disclosed : "unknown",
        note: String(item.note || "").trim()
      };
    })
  };
}

function normalizeCrowdObservations(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 5).map(item => {
    const cardioWaitMinutes = waitMinutes(item?.cardioWaitMinutes);
    const cableWaitMinutes = waitMinutes(item?.cableWaitMinutes);
    const statedMax = waitMinutes(item?.maxWaitMinutes);
    const knownWaits = [cardioWaitMinutes, cableWaitMinutes, statedMax].filter(number => number >= 0);
    return {
      observedAt: String(item?.observedAt || "").trim(),
      date: String(item?.date || "").trim(),
      start: String(item?.start || "").trim(),
      end: String(item?.end || "").trim(),
      dayType: ["weekday", "weekend", "unknown"].includes(item?.dayType) ? item.dayType : "unknown",
      isWeekdayPeak: Boolean(item?.isWeekdayPeak),
      cardioVacancies: Math.trunc(waitMinutes(item?.cardioVacancies)),
      cardioWaitMinutes,
      cableVacancies: Math.trunc(waitMinutes(item?.cableVacancies)),
      cableWaitMinutes,
      queuePeople: Math.trunc(waitMinutes(item?.queuePeople)),
      approxPeople: Math.trunc(waitMinutes(item?.approxPeople)),
      maxWaitMinutes: knownWaits.length ? Math.max(...knownWaits) : -1,
      state: ["宽松", "一般", "高峰", "未填写"].includes(item?.state) ? item.state : "未填写",
      description: String(item?.description || "").trim(),
      evidence: textList(item?.evidence, 6)
    };
  });
}

function normalizedIssuePhotos(value) {
  if (!Array.isArray(value)) return [];
  return value.map(photo => ({
    src: String(photo?.src || "").trim(),
    caption: String(photo?.caption || "器械问题现场反馈").trim(),
    date: String(photo?.date || "").trim()
  })).filter(photo => photo.src).slice(0, 6);
}

function normalizeEquipmentInventory(value) {
  const source = Array.isArray(value) ? value : [];
  return equipmentReferenceCatalog.map(category => {
    const incomingCategory = source.find(item => item?.id === category.id) || {};
    const incomingItems = Array.isArray(incomingCategory.items) ? incomingCategory.items : [];
    const items = category.items.map(reference => {
      const incoming = incomingItems.find(item => item?.code === reference.code || item?.name === reference.name) || {};
      const total = Math.trunc(nonNegative(incoming.total));
      const available = Math.min(total, Math.trunc(nonNegative(incoming.available)));
      const status = ["ok", "issue", "unknown"].includes(incoming.status)
        ? incoming.status
        : (total > available || incoming.issueSummary ? "issue" : total > 0 ? "ok" : "unknown");
      return {
        ...reference,
        total,
        available,
        maxWaitMinutes: waitMinutes(incoming.maxWaitMinutes),
        status,
        issueSummary: String(incoming.issueSummary || "").trim(),
        issuePhotos: normalizedIssuePhotos(incoming.issuePhotos),
        note: String(incoming.note || "").trim(),
        evidence: textList(incoming.evidence, 6)
      };
    });
    const itemTotal = items.reduce((sum, item) => sum + item.total, 0);
    const itemAvailable = items.reduce((sum, item) => sum + item.available, 0);
    return {
      id: category.id,
      label: category.label,
      total: Math.trunc(nonNegative(incomingCategory.total, itemTotal)) || itemTotal,
      available: Math.trunc(nonNegative(incomingCategory.available, itemAvailable)) || itemAvailable,
      maxWaitMinutes: waitMinutes(incomingCategory.maxWaitMinutes),
      summary: String(incomingCategory.summary || "").trim(),
      items
    };
  });
}

function normalizeFullReport(value = {}, analysis = {}) {
  const sections = Array.isArray(value?.sections)
    ? value.sections.slice(0, 12).map((section, index) => ({
      id: String(section?.id || `section-${index + 1}`).trim(),
      title: String(section?.title || `报告第 ${index + 1} 部分`).trim(),
      summary: String(section?.summary || "").trim(),
      facts: textList(section?.facts, 12),
      evidence: textList(section?.evidence, 8)
    }))
    : [];
  return {
    conclusion: String(value?.conclusion || analysis.summary || "").trim(),
    recommendations: textList(value?.recommendations, 6),
    cautions: textList(value?.cautions || analysis.caution, 6),
    fit: String(value?.fit || analysis.fit || "").trim(),
    unfit: String(value?.unfit || "").trim(),
    sessionSummary: String(value?.sessionSummary || "").trim(),
    sections
  };
}

function localPreview(text, metadata) {
  const venueName = metadata.venueName || firstMatch(text, [/(?:场馆名称|健身房名称)[：:\s]+([^\n\t]+)/, /体验场馆[：:\s]+([^\n\t]+)/], "待审核场馆");
  const district = firstMatch(text, [/(?:所在区域|行政区|区域)[：:\s]+([^\n\t]+)/], "待补充区域");
  const hasShower = /淋浴/.test(text) && !/无淋浴|不提供淋浴/.test(text);
  const open24 = /24\s*小时|24H/i.test(text);
  const risks = [];
  if (/隐藏收费|强制|捆绑|严重|安全风险/.test(text)) risks.push("报告中出现需要复核的风险描述");
  return {
    reportSchemaVersion: REPORT_SCHEMA_VERSION,
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
    pricing: emptyPricing(),
    crowdObservations: [],
    equipmentInventory: normalizeEquipmentInventory([]),
    fullReport: normalizeFullReport({
      conclusion: "报告已完成文字提取，等待 AI 分析与人工审核。",
      cautions: risks,
      fit: "待AI分析后确认适合人群。",
      sessionSummary: "",
      sections: []
    }),
    scoringFacts: emptyScoringFacts()
  };
}

export function createTestAnalysis(metadata = {}) {
  const evidenceStatus = { price: "full", equipment: "full", crowd: "full", hygiene: "full", sales: "full", beginner: "full" };
  const pricing = {
    plans: [
      { name: "单次", provided: true, amount: 39, validity: "当日一次", source: "价目表", note: "测试数据" },
      { name: "周卡", provided: true, amount: 129, validity: "7天", source: "价目表", note: "测试数据" },
      { name: "月卡", provided: true, amount: 399, validity: "30天", source: "价目表", note: "测试数据" },
      { name: "季卡", provided: true, amount: 1099, validity: "90天", source: "价目表", note: "测试数据" },
      { name: "年卡", provided: true, amount: 3599, validity: "365天", source: "价目表", note: "测试数据" }
    ],
    fees: extraFeeTypes.map(name => ({
      name,
      rule: ["自动续费", "其他"].includes(name) ? "不适用" : "测试场景已明确",
      disclosed: ["自动续费", "其他"].includes(name) ? "na" : "yes",
      note: "系统测试"
    }))
  };
  const crowdObservations = [
    ["2026-07-20", "10:10", "10:20", "weekday", false, 12, 0, 2, 1, 0, 28, "宽松", "有氧区空位充足，龙门架短暂轮换。"],
    ["2026-07-21", "19:00", "19:10", "weekday", true, 2, 4, 0, 12, 4, 82, "高峰", "晚高峰龙门架排队最明显，现场约82人。"],
    ["2026-07-23", "15:30", "15:40", "weekday", false, 8, 0, 1, 3, 1, 45, "一般", "自由力量区有人轮换，其余区域可直接使用。"],
    ["2026-07-25", "18:40", "18:50", "weekend", false, 5, 2, 1, 5, 2, 61, "一般", "周末晚间有氧区仍有空位，龙门架需等候。"],
    ["2026-07-26", "20:00", "20:10", "weekend", false, 7, 0, 2, 2, 1, 52, "一般", "周日晚间客流回落，主要器械可轮换使用。"]
  ].map(([date, start, end, dayType, isWeekdayPeak, cardioVacancies, cardioWaitMinutes, cableVacancies, cableWaitMinutes, queuePeople, approxPeople, state, description]) => ({
    observedAt: `${date}T${start}:00`,
    date,
    start,
    end,
    dayType,
    isWeekdayPeak,
    cardioVacancies,
    cardioWaitMinutes,
    cableVacancies,
    cableWaitMinutes,
    queuePeople,
    approxPeople,
    maxWaitMinutes: Math.max(Number(cardioWaitMinutes), Number(cableWaitMinutes)),
    state,
    description,
    evidence: ["系统测试现场记录"]
  }));
  let fixtureEquipmentCount = 0;
  const equipmentInventory = normalizeEquipmentInventory(equipmentReferenceCatalog.map(category => ({
    id: category.id,
    label: category.label,
    maxWaitMinutes: category.id === "03C" ? 12 : 3,
    summary: category.id === "03C" ? "晚高峰龙门架最长等待12分钟。" : "测试场景器械状态正常。",
    items: category.items.map(item => {
      const included = fixtureEquipmentCount < 54;
      fixtureEquipmentCount += 1;
      return {
        name: item.name,
        code: item.code,
        total: included ? 1 : 0,
        available: included ? 1 : 0,
        maxWaitMinutes: item.code === "03C-08" ? 12 : included ? 3 : -1,
        status: included ? "ok" : "unknown",
        issueSummary: "",
        issuePhotos: [],
        note: included ? "系统测试器械" : "测试场景未配置",
        evidence: included ? ["系统测试器械清单"] : []
      };
    })
  })));
  const fullReport = {
    conclusion: "测试场馆五次训练记录与五次客流观察完整，价格、器械、卫生、销售与新手友好模块均已填写。本报告只用于验证正式上传、审核、发布和卡片展示流程。",
    recommendations: ["价格规则说明完整", "九类器械清单可逐项查看", "新手可获得基础帮助"],
    cautions: ["晚高峰龙门架最长等待12分钟", "全部数据为系统虚构测试", "测试场馆不接受真实预约"],
    fit: "仅供后台流程测试，不面向真实用户推荐。",
    unfit: "任何希望据此做真实消费决策的用户。",
    sessionSummary: "7天内完成5次训练，覆盖工作日晚高峰与周末晚高峰。",
    sections: [
      { id: "pricing", title: "价格与额外费用", summary: "五种卡项和八类额外费用均已填写。", facts: ["月卡399元", "年卡3599元"], evidence: ["系统测试价目表"] },
      { id: "crowd", title: "客流与等待", summary: "工作日晚高峰龙门架最长等待12分钟。", facts: ["五次10分钟观察", "现场最多约82人"], evidence: ["系统测试现场记录"] },
      { id: "equipment", title: "器械与问题反馈", summary: "九类器械均按统一目录展示。", facts: ["54台测试器械可用"], evidence: ["系统测试器械清单"] }
    ]
  };
  return {
    reportSchemaVersion: REPORT_SCHEMA_VERSION,
    venueName: "星湾测试训练馆（虚构）",
    district: "天河区测试区域",
    venueType: "商业健身房",
    category: "商业健身房",
    monthlyPrice: 399,
    trialPrice: 39,
    hours: "06:30–23:00（测试数据）",
    summary: `这是系统生成的测试审核草稿，用于验证报告上传、评分、审核与发布隔离流程。体验官：${metadata.evaluatorName || "测试体验官"}。所有场馆与体验信息均为虚构，不得作为消费建议。`,
    highlights: ["五次到店记录完整（含工作日晚高峰）", "54 台器械均可用", "价格与收费规则已按测试场景填写"],
    fit: "仅供后台流程测试，不面向真实用户推荐。",
    caution: "全部内容为虚构测试数据；即使完成审核发布，也只会进入隔离的测试记录，不会在用户网站展示。",
    evidence: ["系统测试报告 P01–P07", "四次虚构到店记录", "仅供后台测试"],
    missingItems: [],
    riskTags: [],
    suggestedFlags: { beginner: true, lowSales: true, shower: true, cleanEnvironment: true, open24: false, womenFriendly: true, nightSafety: true },
    equipmentLevel: 10,
    crowdEvening: "拥挤",
    confidence: 100,
    pricing,
    crowdObservations,
    equipmentInventory,
    fullReport,
    scoringFacts: {
      sessionsCompleted: 5,
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
    `reportSchemaVersion 固定填写 ${REPORT_SCHEMA_VERSION}。总结需中性、简洁，明确区分事实、风险和适合人群。评分绝对不由你计算；你只把报告事实准确填入 scoringFacts，后台会按《评分机制V1.2》固定计算。`,
    "勾选项只按报告中明确勾选的结果提取；空白、冲突或无法确认均按未填写/unknown处理，并将对应 moduleComplete 设为 false。",
    "equipment.uniqueTotal 与 uniqueAvailable 必须按同一台器械跨区域去重；数量不一致且没有原因时 conditionComplete=false。",
    "pricing.plans 必须依次输出单次、周卡、月卡、季卡、年卡五项；未提供的卡项 provided=false、amount=0。pricing.fees 必须依次输出八类费用，未填写时 rule 留空且 disclosed=unknown。",
    "crowdObservations 按报告中的五次10分钟现场观察逐条提取；未知数字填-1。必须分别提取有氧空位/等待、龙门架空位/等待、排队人数、现场约人数、判断和具体描述；maxWaitMinutes 取该次明确记录的最长等待，不得凭空推测。",
    "equipmentInventory 只输出报告中九类目录对应的数据；id 使用03A至03I，器械 code 使用目录编号。器械问题用 status=issue 并填写 issueSummary。正文无法提供可访问图片地址时 issuePhotos 必须为空数组，留给审核员通过媒体接口补充。",
    "fullReport 要保留综合结论、推荐点、注意事项、适合与不适合人群、五次训练覆盖摘要，并用 sections 结构化归纳价格、器械、客流、卫生、销售和新手友好等原报告内容。",
    "scoringFacts.crowd 仍严格按V1.2评分机制选择四条记录，其中必须包含工作日晚高峰；详细的第五条只保留在 crowdObservations，不改变现有评分公式。",
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
  const pricing = normalizePricing(analysis.pricing || {});
  const planAmount = name => Number(pricing.plans.find(plan => plan.name === name)?.amount) || 0;
  const crowdObservations = normalizeCrowdObservations(analysis.crowdObservations);
  const equipmentInventory = normalizeEquipmentInventory(analysis.equipmentInventory);
  const fullReport = normalizeFullReport(analysis.fullReport, analysis);
  const additionalFees = pricing.fees
    .filter(fee => fee.rule || fee.note)
    .map(fee => `${fee.name}：${fee.rule || fee.note}`);
  return {
    id: `${slug}-${report.id.slice(-6)}`,
    reportSchemaVersion: REPORT_SCHEMA_VERSION,
    name: analysis.venueName || report.venueName || "待命名场馆",
    district: analysis.district || "待补充区域",
    type: analysis.venueType || "健身房",
    category: analysis.category === "铁馆" ? "铁馆" : "商业健身房",
    monthlyPrice: Number(analysis.monthlyPrice) || planAmount("月卡"),
    trialPrice: Number(analysis.trialPrice) || planAmount("单次"),
    weeklyPrice: planAmount("周卡"),
    quarterlyPrice: planAmount("季卡"),
    annualPrice: planAmount("年卡"),
    additionalFees,
    pricing,
    coordinates: [113.2644, 23.1291],
    hours: analysis.hours || "待确认",
    crowd: { evening: analysis.crowdEvening === "未确认" ? "一般" : analysis.crowdEvening, morning: "一般", weekend: "一般", flexible: "一般" },
    crowdObservations,
    beginner: Boolean(flags.beginner),
    lowSales: Boolean(flags.lowSales),
    equipment: scoring.modules.find(module => module.key === "equipment")?.score10 ?? 0,
    equipmentInventory,
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
    fullReport,
    reportSections: fullReport.sections,
    evidence: analysis.evidence || ["体验官报告"],
    testerCount: 1,
    testedAt: now,
    updated: now,
    contact: { phone: "待核实", address: "待核实", nearestStation: "待核实", booking: "到店前请先联系场馆确认开放和试练安排。" },
    reportId: report.id,
    verificationStatus: "experience_verified"
  };
}
