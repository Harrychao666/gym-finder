export const FORM_VERSION = "experience-v1.1";
export const SCORING_VERSION = "scoring-v1.2";
export const REPORT_SCHEMA_VERSION = "experience-report-v2.0";

export const cardTypes = ["单次", "周卡", "月卡", "季卡", "年卡"];
export const extraFeeTypes = ["停卡费", "转卡费", "押金", "储物柜", "淋浴", "门禁卡", "自动续费", "其他"];

export const equipmentCategories = [
  {
    id: "cardio",
    label: "03A 有氧器械",
    items: ["跑步机", "楼梯机", "椭圆机", "直立式健身车", "卧式健身车", "可自由使用的动感单车", "划船机", "风阻自行车/空中单车", "滑雪机（SkiErg）", "弧步训练机/登山机"]
  },
  {
    id: "back",
    label: "03B 背部器械",
    items: ["高位下拉机", "坐姿划船机", "低位划船机", "高位划船机", "T 杆划船机", "上拉机/背部伸展机（Pullover）", "反向蝴蝶机/后束飞鸟机", "辅助引体向上机", "山羊挺身凳/背部伸展凳"]
  },
  {
    id: "chest",
    label: "03C 胸部器械",
    items: ["坐姿推胸机", "上斜推胸机", "下斜推胸机", "片装式水平推胸机", "片装式上斜推胸机", "双臂独立推胸机", "蝴蝶机夹胸/飞鸟机", "龙门架夹胸训练位", "史密斯机", "杠铃卧推架", "双杠臂屈伸/辅助双杠"]
  },
  {
    id: "legs",
    label: "03D 腿部器械",
    items: ["45°倒蹬机/腿举机", "水平式/坐式腿举机", "哈克深蹲机", "钟摆深蹲机", "腰带深蹲机", "腿屈伸机", "坐姿腿弯举机", "俯卧腿弯举机", "站姿单腿弯举机", "髋外展机", "髋内收机", "臀推机/臀桥机", "站姿提踵机", "坐姿提踵机", "深蹲架/力量架", "史密斯机"]
  },
  {
    id: "dumbbells",
    label: "03E 哑铃区",
    items: ["固定重量哑铃", "缺失或不成对的重量", "平板训练凳", "可调节训练凳", "哑铃架/摆放状态", "可正常训练的空位"]
  },
  {
    id: "arms",
    label: "03F 手臂器械",
    items: ["二头弯举机", "坐姿臂屈伸机/三头训练机", "牧师凳/二头弯举凳", "双杠臂屈伸/辅助双杠"]
  },
  {
    id: "shoulders",
    label: "03G 肩部器械",
    items: ["坐姿肩推机", "侧平举机", "反向蝴蝶机/后束飞鸟机"]
  },
  {
    id: "core",
    label: "03H 核心器械",
    items: ["腹肌卷腹机", "躯干旋转机", "悬垂举腿/垂直举膝架", "山羊挺身凳/背部伸展凳"]
  },
  {
    id: "stretch",
    label: "03I 拉伸区",
    items: ["独立拉伸空间", "瑜伽垫/拉伸垫", "泡沫轴", "按摩球/筋膜球", "弹力带/迷你圈", "拉伸带/瑜伽带", "瑜伽砖", "平衡垫", "BOSU 平衡球", "肋木架/拉伸架", "拉伸笼/多功能拉伸架", "镜面或动作观察区域"]
  }
];

const equipmentReferenceFiles = {
  cardio: [
    "03A-01-treadmill.png", "03A-02-stair-climber.png", "03A-03-elliptical.png", "03A-04-upright-bike.png",
    "03A-05-recumbent-bike.png", "03A-06-spin-bike.png", "03A-07-rower.png", "03A-08-air-bike.png",
    "03A-09-skierg.png", "03A-10-arc-trainer.png"
  ],
  back: [
    "03B-01-lat-pulldown.png", "03B-02-seated-row-v2.png", "03B-03-low-row-v2.png", "03B-04-high-row-v2.png",
    "03B-07-tbar-row-v2.png", "03B-09-pullover.png", "03B-10-rear-delt-v2.png", "03B-11-assisted-pullup.png",
    "03B-12-hyperextension-bench.png"
  ],
  chest: [
    "03C-01-seated-chest-press.png", "03C-02-incline-chest-press.png", "03C-03-decline-chest-press.png",
    "03C-04-plate-horizontal-press.png", "03C-05-plate-incline-press-v2.png", "03C-06-iso-chest-press.png",
    "03C-07-pec-fly-v2.png", "03C-08-cable-crossover.png", "03C-09-smith-machine.png",
    "03C-10-bench-press-rack.png", "03C-11-assisted-dip.png"
  ],
  legs: [
    "03D-01-45-leg-press.png", "03D-02-horizontal-leg-press.png", "03D-03-hack-squat.png",
    "03D-04-pendulum-squat-v2.png", "03D-05-belt-squat.png", "03D-06-leg-extension.png",
    "03D-07-seated-leg-curl.png", "03D-08-prone-leg-curl.png", "03D-09-standing-leg-curl.png",
    "03D-10-hip-abduction.png", "03D-11-hip-adduction.png", "03D-12-hip-thrust.png",
    "03D-13-standing-calf.png", "03D-14-seated-calf.png", "03D-15-power-rack.png", "03C-09-smith-machine.png"
  ],
  dumbbells: [
    "03E-01-fixed-dumbbells.png", "03E-03-missing-dumbbells.png", "03E-04-flat-bench.png",
    "03E-05-adjustable-bench.png", "03E-06-dumbbell-rack.png", "03E-07-dumbbell-space.png"
  ],
  arms: [
    "03F-01-biceps-curl.png", "03F-02-triceps-extension-v2.png", "03F-03-preacher-curl-bench.png",
    "03C-11-assisted-dip.png"
  ],
  shoulders: ["03G-01-shoulder-press.png", "03G-02-lateral-raise.png", "03B-10-rear-delt-v2.png"],
  core: ["03H-01-ab-crunch.png", "03H-02-torso-rotation.png", "03H-03-vertical-knee-raise.png", "03B-12-hyperextension-bench.png"],
  stretch: [
    "03I-01-stretching-area.png", "03I-02-yoga-mat.png", "03I-03-foam-roller.png", "03I-04-massage-ball.png",
    "03I-05-resistance-band.png", "03I-06-yoga-strap.png", "03I-07-yoga-block.png", "03I-08-balance-pad.png",
    "03I-09-bosu.png", "03I-10-stall-bars.png", "03I-11-stretching-cage.png", "03I-12-mirror-area.png"
  ]
};

const equipmentCategoryNumbers = {
  cardio: "03A", back: "03B", chest: "03C", legs: "03D", dumbbells: "03E",
  arms: "03F", shoulders: "03G", core: "03H", stretch: "03I"
};

function equipmentCode(file, categoryNumber, index) {
  const match = file.match(/^(03[A-I]-\d{2})-/);
  if (match && match[1].startsWith(categoryNumber)) return match[1];
  return `${categoryNumber}-${String(index + 1).padStart(2, "0")}`;
}

/**
 * Canonical equipment catalog used by the report-analysis and published-card
 * data models. `equipmentCategories` above intentionally keeps its legacy shape
 * so the V1.1 pilot form remains backwards compatible.
 */
export const equipmentReferenceCatalog = equipmentCategories.map(category => {
  const number = equipmentCategoryNumbers[category.id];
  const files = equipmentReferenceFiles[category.id];
  return {
    id: number,
    key: category.id,
    label: category.label.replace(/^03[A-I]\s+/, ""),
    items: category.items.map((name, index) => {
      const file = files[index];
      return {
        name,
        code: equipmentCode(file, number, index),
        referenceImage: `/assets/equipment-reference/${file}`
      };
    })
  };
});

export function createEmptyEquipmentInventory() {
  return equipmentReferenceCatalog.map(category => ({
    id: category.id,
    label: category.label,
    total: 0,
    available: 0,
    maxWaitMinutes: -1,
    summary: "",
    items: category.items.map(item => ({
      ...item,
      total: 0,
      available: 0,
      maxWaitMinutes: -1,
      status: "unknown",
      issueSummary: "",
      issuePhotos: [],
      note: "",
      evidence: []
    }))
  }));
}

export const hygieneAreas = ["更衣区", "卫生间", "淋浴间", "训练区地面", "器械表面", "瑜伽垫/泡沫轴", "通风与气味"];

export const salesQuestions = [
  { id: "priceValidity", label: "主动说明价格和有效期", options: ["是", "否"] },
  { id: "pauseTransferRefund", label: "主动说明停卡、转卡和退款", options: ["是", "否"] },
  { id: "autoRenew", label: "明确说明自动续费", options: ["是", "否", "不适用"] },
  { id: "contractCopy", label: "允许带走或拍摄合同", options: ["是", "否"] },
  { id: "repeatedPressure", label: "出现反复催促办卡", options: ["是", "否"] },
  { id: "ptBundling", label: "出现捆绑私教或模糊报价", options: ["是", "否"] }
];

export const beginnerQuestions = [
  { id: "entry", label: "首次入场/签到流程", options: ["清楚", "需询问", "难理解"] },
  { id: "zones", label: "训练区域和器械分区", options: ["清楚", "一般", "难寻找"] },
  { id: "safety", label: "器械调节和安全提示", options: ["充分", "部分", "缺少"] },
  { id: "staff", label: "向工作人员询问时的回应", options: ["主动帮助", "简单回应", "未帮助"] },
  { id: "basicHelpFee", label: "基础帮助是否额外收费", options: ["免费", "要求购私教", "未确认"] }
];

export function createEmptyAnswers() {
  return {
    profile: { venueName: "", evaluatorName: "", periodStart: "", periodEnd: "", contact: "" },
    sessions: Array.from({ length: 4 }, () => ({ date: "", start: "", end: "", duration: "", isPeak: false, content: "" })),
    prices: Object.fromEntries(cardTypes.map(name => [name, { provided: false, amount: "", validity: "", source: "", note: "" }])),
    extraFees: Object.fromEntries(extraFeeTypes.map(name => [name, { rule: "", disclosed: "", note: "" }])),
    equipment: Object.fromEntries(equipmentCategories.map(category => [category.id, Object.fromEntries(category.items.map(name => [name, { total: "", available: "", wait: "", note: "" }]))])),
    crowd: Array.from({ length: 4 }, () => ({ observedAt: "", cardioVacancies: "", cableVacancies: "", maxWait: "", state: "" })),
    hygiene: Object.fromEntries(hygieneAreas.map(name => [name, { status: "", note: "" }])),
    sales: Object.fromEntries(salesQuestions.map(question => [question.id, { result: "", note: "" }])),
    beginner: Object.fromEntries(beginnerQuestions.map(question => [question.id, { result: "", fact: "" }])),
    final: { conclusion: "", recommendations: "", cautions: "", fit: "", unfit: "" }
  };
}

export function publicFormSchema() {
  return {
    formVersion: FORM_VERSION,
    scoringVersion: SCORING_VERSION,
    reportSchemaVersion: REPORT_SCHEMA_VERSION,
    cardTypes,
    extraFeeTypes,
    equipmentCategories,
    equipmentReferenceCatalog,
    hygieneAreas,
    salesQuestions,
    beginnerQuestions,
    emptyAnswers: createEmptyAnswers()
  };
}
