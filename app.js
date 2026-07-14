const venues = [
  {
    id: "luma",
    name: "Luma 24H 珠江训练仓",
    district: "珠江新城",
    type: "24小时健身房",
    category: "铁馆",
    monthlyPrice: 399,
    trialPrice: 39,
    coordinates: [113.3272, 23.1197],
    hours: "24 小时",
    crowd: { evening: "一般", morning: "宽松", weekend: "一般", flexible: "一般" },
    beginner: true,
    lowSales: true,
    equipment: 8,
    shower: true,
    cleanEnvironment: true,
    open24: true,
    womenFriendly: true,
    nightSafety: false,
    highlights: ["24小时开放", "低推销", "月卡灵活"],
    rating: 8.8,
    image: "https://images.pexels.com/photos/29639963/pexels-photo-29639963.jpeg?auto=compress&cs=tinysrgb&w=1200",
    gallery: [
      {
        src: "https://images.pexels.com/photos/29639963/pexels-photo-29639963.jpeg?auto=compress&cs=tinysrgb&w=1600",
        caption: "力量训练区"
      },
      {
        src: "https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=1600",
        caption: "有氧训练区"
      },
      {
        src: "https://images.pexels.com/photos/4162487/pexels-photo-4162487.jpeg?auto=compress&cs=tinysrgb&w=1600",
        caption: "自由训练空间"
      }
    ],
    fit: "适合想自由安排时间、又不希望被频繁推销的新手。",
    caution: "夜间工作人员较少，第一次建议白天到店熟悉器械和门禁。",
    evidence: ["公开价目表", "工作日晚间试练", "达人现场照片"],
    testerCount: 3,
    testedAt: "2026-05-29",
    updated: "2026-05-28"
  },
  {
    id: "fither",
    name: "FitHer 珠江女子馆",
    district: "珠江新城",
    type: "女性训练空间",
    category: "商业健身房",
    monthlyPrice: 499,
    trialPrice: 59,
    coordinates: [113.3228, 23.1173],
    hours: "07:00–22:30",
    crowd: { evening: "宽松", morning: "宽松", weekend: "一般", flexible: "宽松" },
    beginner: true,
    lowSales: false,
    equipment: 6,
    shower: true,
    cleanEnvironment: true,
    open24: false,
    womenFriendly: true,
    nightSafety: true,
    highlights: ["女性专属", "新手入门支持", "晚高峰宽松"],
    rating: 9.0,
    image: "https://images.pexels.com/photos/30021732/pexels-photo-30021732.jpeg?auto=compress&cs=tinysrgb&w=1200",
    gallery: [
      {
        src: "https://images.pexels.com/photos/30021732/pexels-photo-30021732.jpeg?auto=compress&cs=tinysrgb&w=1600",
        caption: "女性训练空间"
      },
      {
        src: "https://images.pexels.com/photos/6456300/pexels-photo-6456300.jpeg?auto=compress&cs=tinysrgb&w=1600",
        caption: "器械训练区"
      },
      {
        src: "https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&w=1600",
        caption: "基础指导区"
      }
    ],
    fit: "适合在意训练氛围、希望获得基础器械讲解的女性新手。",
    caution: "会推荐私教小课包，先确认自由训练会员是否包含入门指导。",
    evidence: ["门店报价截图", "周末下午试练", "更衣区现场记录"],
    testerCount: 2,
    testedAt: "2026-05-25",
    updated: "2026-05-24"
  },
  {
    id: "startfit",
    name: "StartFit 天体旗舰",
    district: "天河体育中心",
    type: "商业健身房",
    category: "商业健身房",
    monthlyPrice: 459,
    trialPrice: 49,
    coordinates: [113.3214, 23.1364],
    hours: "06:30–23:00",
    crowd: { evening: "拥挤", morning: "宽松", weekend: "一般", flexible: "一般" },
    beginner: true,
    lowSales: false,
    equipment: 9,
    shower: true,
    cleanEnvironment: true,
    open24: false,
    womenFriendly: true,
    nightSafety: true,
    highlights: ["器械丰富", "淋浴齐全", "场地宽敞"],
    rating: 8.6,
    image: "https://images.pexels.com/photos/17227606/pexels-photo-17227606.jpeg?auto=compress&cs=tinysrgb&w=1200",
    gallery: [
      {
        src: "https://images.pexels.com/photos/17227606/pexels-photo-17227606.jpeg?auto=compress&cs=tinysrgb&w=1600",
        caption: "综合器械区"
      },
      {
        src: "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1600",
        caption: "自由重量区"
      },
      {
        src: "https://images.pexels.com/photos/4162451/pexels-photo-4162451.jpeg?auto=compress&cs=tinysrgb&w=1600",
        caption: "有氧设备区"
      }
    ],
    fit: "适合重视器械种类、能避开工作日晚高峰的人。",
    caution: "体验课后会持续跟进私教，办卡前要确认退转卡条款。",
    evidence: ["门店合同样本", "工作日晚高峰试练", "器械数量记录"],
    testerCount: 4,
    testedAt: "2026-05-31",
    updated: "2026-05-30"
  },
  {
    id: "lightgym",
    name: "Light Gym 天河",
    district: "天河体育中心",
    type: "社区健身房",
    category: "商业健身房",
    monthlyPrice: 299,
    trialPrice: 29,
    coordinates: [113.3278, 23.1412],
    hours: "07:00–23:00",
    crowd: { evening: "一般", morning: "宽松", weekend: "宽松", flexible: "宽松" },
    beginner: true,
    lowSales: true,
    equipment: 7,
    shower: false,
    cleanEnvironment: false,
    open24: false,
    womenFriendly: true,
    nightSafety: true,
    highlights: ["月费较低", "低推销", "早间宽松"],
    rating: 8.3,
    image: "https://images.pexels.com/photos/4959807/pexels-photo-4959807.jpeg?auto=compress&cs=tinysrgb&w=1200",
    gallery: [
      {
        src: "https://images.pexels.com/photos/4959807/pexels-photo-4959807.jpeg?auto=compress&cs=tinysrgb&w=1600",
        caption: "基础训练区"
      },
      {
        src: "https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=1600",
        caption: "力量器械区"
      },
      {
        src: "https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=1600",
        caption: "自由训练区"
      }
    ],
    fit: "适合预算有限、以基础力量和有氧训练为主的新手。",
    caution: "没有独立淋浴区，重训器械数量也不算多。",
    evidence: ["前台公开报价", "工作日早晨试练", "达人现场记录"],
    testerCount: 2,
    testedAt: "2026-05-21",
    updated: "2026-05-20"
  },
  {
    id: "powerbox",
    name: "PowerBox 琶洲",
    district: "琶洲",
    type: "力量训练馆",
    category: "铁馆",
    monthlyPrice: 520,
    trialPrice: 68,
    coordinates: [113.3697, 23.0988],
    hours: "08:00–23:30",
    crowd: { evening: "一般", morning: "宽松", weekend: "拥挤", flexible: "一般" },
    beginner: false,
    lowSales: true,
    equipment: 10,
    shower: true,
    cleanEnvironment: true,
    open24: false,
    womenFriendly: false,
    nightSafety: true,
    highlights: ["力量器械全", "自由重量强", "低推销"],
    rating: 8.7,
    image: "https://images.pexels.com/photos/29639963/pexels-photo-29639963.jpeg?auto=compress&cs=tinysrgb&w=1200",
    gallery: [
      {
        src: "https://images.pexels.com/photos/29639963/pexels-photo-29639963.jpeg?auto=compress&cs=tinysrgb&w=1600",
        caption: "固定器械区"
      },
      {
        src: "https://images.pexels.com/photos/949126/pexels-photo-949126.jpeg?auto=compress&cs=tinysrgb&w=1600",
        caption: "自由重量区"
      },
      {
        src: "https://images.pexels.com/photos/2261485/pexels-photo-2261485.jpeg?auto=compress&cs=tinysrgb&w=1600",
        caption: "重训空间"
      }
    ],
    fit: "适合已经掌握基础动作、重视自由重量设备的人。",
    caution: "训练氛围偏硬核，完全零基础建议有人陪同试练。",
    evidence: ["公开月卡价格", "周末试练", "自由重量区盘点"],
    testerCount: 3,
    testedAt: "2026-05-19",
    updated: "2026-05-18"
  },
  {
    id: "airfit",
    name: "AirFit 北京路 24",
    district: "北京路",
    type: "24小时健身房",
    category: "铁馆",
    monthlyPrice: 329,
    trialPrice: 35,
    coordinates: [113.2708, 23.1251],
    hours: "24 小时",
    crowd: { evening: "拥挤", morning: "宽松", weekend: "一般", flexible: "一般" },
    beginner: false,
    lowSales: true,
    equipment: 7,
    shower: true,
    cleanEnvironment: true,
    open24: true,
    womenFriendly: true,
    nightSafety: false,
    highlights: ["24小时开放", "月费较低", "自助门禁"],
    rating: 8.2,
    image: "https://images.pexels.com/photos/4959807/pexels-photo-4959807.jpeg?auto=compress&cs=tinysrgb&w=1200",
    gallery: [
      {
        src: "https://images.pexels.com/photos/4959807/pexels-photo-4959807.jpeg?auto=compress&cs=tinysrgb&w=1600",
        caption: "24 小时训练区"
      },
      {
        src: "https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=1600",
        caption: "跑步机区域"
      },
      {
        src: "https://images.pexels.com/photos/4162488/pexels-photo-4162488.jpeg?auto=compress&cs=tinysrgb&w=1600",
        caption: "基础力量区"
      }
    ],
    fit: "适合有基本训练计划、需要深夜或清晨训练的人。",
    caution: "自助运营为主，新手器械指导有限，晚高峰跑步机较紧张。",
    evidence: ["线上价目表", "晚间实地观察", "门禁流程记录"],
    testerCount: 2,
    testedAt: "2026-05-27",
    updated: "2026-05-26"
  }
];

const pricingPlans = {
  luma: { single: 39, weekly: 129, monthly: 399, annual: 3599 },
  fither: { single: 59, weekly: 169, monthly: 499, annual: 4599 },
  startfit: { single: 49, weekly: 159, monthly: 459, annual: 4199 },
  lightgym: { single: 29, weekly: 99, monthly: 299, annual: 2699 },
  powerbox: { single: 68, weekly: 188, monthly: 520, annual: 4888 },
  airfit: { single: 35, weekly: 109, monthly: 329, annual: 2999 }
};

const additionalFeePlans = {
  luma: [
    ["停卡费", "¥30 / 次"], ["转卡费", "¥100 / 次"], ["门禁卡补办", "¥50 / 张"],
    ["储物柜", "¥30 / 月"], ["淋浴", "免费"], ["入会押金", "¥100"]
  ],
  fither: [
    ["停卡费", "¥50 / 次"], ["转卡费", "¥150 / 次"], ["门禁卡补办", "¥50 / 张"],
    ["储物柜", "¥50 / 月"], ["淋浴", "免费"], ["体态评估", "¥99 / 次"]
  ],
  startfit: [
    ["停卡费", "¥30 / 次"], ["转卡费", "¥100 / 次"], ["门禁卡补办", "¥30 / 张"],
    ["储物柜", "¥40 / 月"], ["淋浴", "免费"], ["毛巾租用", "¥5 / 次"]
  ],
  lightgym: [
    ["停卡费", "¥20 / 次"], ["转卡费", "¥80 / 次"], ["门禁卡补办", "¥30 / 张"],
    ["储物柜", "¥20 / 月"], ["淋浴", "未提供"], ["入会押金", "¥50"]
  ],
  powerbox: [
    ["停卡费", "¥50 / 次"], ["转卡费", "¥120 / 次"], ["门禁卡补办", "¥50 / 张"],
    ["储物柜", "¥50 / 月"], ["淋浴", "免费"], ["毛巾租用", "¥8 / 次"]
  ],
  airfit: [
    ["停卡费", "¥30 / 次"], ["转卡费", "¥100 / 次"], ["门禁卡补办", "¥40 / 张"],
    ["储物柜", "¥30 / 月"], ["淋浴", "免费"], ["自动续费", "到期前关闭"]
  ]
};

const venueContacts = {
  luma: {
    phone: "020-8000-1201",
    address: "广州市天河区珠江新城花城大道演示点 A 座 3 层",
    nearestStation: "珠江新城地铁站 A1 口步行约 10 分钟",
    booking: "建议先预约 30 分钟试练，第一次白天到店熟悉门禁。"
  },
  fither: {
    phone: "020-8000-1202",
    address: "广州市天河区珠江新城兴民路演示点 2 层",
    nearestStation: "珠江新城地铁站 B1 口步行约 8 分钟",
    booking: "建议确认自由训练会员是否包含入门指导。"
  },
  startfit: {
    phone: "020-8000-1203",
    address: "广州市天河区体育西路演示商业中心 5 层",
    nearestStation: "体育西路地铁站 C 口步行约 12 分钟",
    booking: "建议避开工作日晚高峰试练，并提前问清退转卡规则。"
  },
  lightgym: {
    phone: "020-8000-1204",
    address: "广州市天河区体育东路社区演示点 负一层",
    nearestStation: "天河体育中心地铁站 D 口步行约 18 分钟",
    booking: "建议早晨试练一次，确认淋浴、更衣和器械数量是否够用。"
  },
  powerbox: {
    phone: "020-8000-1205",
    address: "广州市海珠区琶洲大道训练演示仓 1 层",
    nearestStation: "万胜围地铁站步行约 16 分钟",
    booking: "建议已有基础动作经验后再试练，或找熟人陪同。"
  },
  airfit: {
    phone: "020-8000-1206",
    address: "广州市越秀区北京路演示点 4 层",
    nearestStation: "公园前地铁站步行约 14 分钟",
    booking: "建议夜间到店前先确认值班人员和门禁流程。"
  }
};

const crowdProfiles = {
  luma: {
    levels: [12, 9, 7, 6, 8, 14, 28, 42, 36, 24, 20, 25, 39, 35, 27, 25, 31, 52, 78, 92, 83, 61, 37, 21],
    busiest: "18:00–21:00",
    quietest: "02:00–06:00"
  },
  fither: {
    levels: [0, 0, 0, 0, 0, 0, 0, 22, 34, 24, 18, 20, 31, 28, 22, 19, 27, 43, 66, 74, 61, 38, 18, 0],
    busiest: "18:00–20:00",
    quietest: "10:00–12:00"
  },
  startfit: {
    levels: [0, 0, 0, 0, 0, 0, 18, 37, 45, 29, 24, 31, 52, 48, 36, 30, 39, 68, 91, 96, 86, 57, 31, 0],
    busiest: "18:00–21:00",
    quietest: "09:00–11:00"
  },
  lightgym: {
    levels: [0, 0, 0, 0, 0, 0, 0, 19, 31, 25, 17, 20, 37, 33, 24, 21, 29, 48, 72, 79, 66, 42, 24, 0],
    busiest: "18:00–20:00",
    quietest: "10:00–12:00"
  },
  powerbox: {
    levels: [0, 0, 0, 0, 0, 0, 0, 0, 16, 23, 19, 25, 38, 34, 26, 22, 31, 49, 67, 81, 88, 73, 46, 21],
    busiest: "19:00–22:00",
    quietest: "08:00–11:00"
  },
  airfit: {
    levels: [18, 13, 10, 8, 9, 16, 31, 47, 39, 26, 22, 28, 43, 38, 29, 25, 34, 58, 84, 95, 90, 69, 44, 27],
    busiest: "18:00–21:00",
    quietest: "02:00–05:00"
  }
};

const ratingProfiles = {
  luma: [
    { label: "价格透明", score: 9.0, weight: 20, note: "月卡和短周期价格较清楚" },
    { label: "器械配置", score: 8.8, weight: 25, note: "基础力量与有氧器械较完整" },
    { label: "拥挤体验", score: 8.2, weight: 20, note: "晚八点力量区偶尔需要等位" },
    { label: "新手友好", score: 9.2, weight: 20, note: "门禁和器械容易上手，推销较少" },
    { label: "卫生环境", score: 8.8, weight: 15, note: "训练区和淋浴维护稳定" }
  ],
  fither: [
    { label: "价格透明", score: 8.5, weight: 20, note: "自由训练与小课包需分别确认" },
    { label: "器械配置", score: 8.4, weight: 25, note: "器械够用，自由重量相对有限" },
    { label: "拥挤体验", score: 9.2, weight: 20, note: "晚高峰训练空间仍较宽松" },
    { label: "新手友好", score: 9.6, weight: 20, note: "女性氛围友好并提供基础讲解" },
    { label: "卫生环境", score: 9.6, weight: 15, note: "更衣区和公共区域反馈较好" }
  ],
  startfit: [
    { label: "价格透明", score: 8.2, weight: 20, note: "退转卡和私教条款需要细看" },
    { label: "器械配置", score: 9.5, weight: 25, note: "器械种类多，力量区配置完整" },
    { label: "拥挤体验", score: 7.4, weight: 20, note: "工作日晚高峰热门器械需排队" },
    { label: "新手友好", score: 8.8, weight: 20, note: "有基础指导，但销售跟进较积极" },
    { label: "卫生环境", score: 9.0, weight: 15, note: "淋浴与更衣空间整体够用" }
  ],
  lightgym: [
    { label: "价格透明", score: 9.2, weight: 20, note: "短周期价格清楚，月费压力较低" },
    { label: "器械配置", score: 7.4, weight: 25, note: "基础训练够用，重训器械较少" },
    { label: "拥挤体验", score: 8.5, weight: 20, note: "早晨宽松，晚间偶尔需要等位" },
    { label: "新手友好", score: 8.4, weight: 20, note: "工作人员较少推销，指导有限" },
    { label: "卫生环境", score: 8.2, weight: 15, note: "训练区整洁，但没有独立淋浴" }
  ],
  powerbox: [
    { label: "价格透明", score: 8.0, weight: 20, note: "月卡信息明确，试练规则需确认" },
    { label: "器械配置", score: 9.8, weight: 25, note: "自由重量和重训器械非常完整" },
    { label: "拥挤体验", score: 8.0, weight: 20, note: "周末深蹲架等热门器械较紧张" },
    { label: "新手友好", score: 8.2, weight: 20, note: "氛围直接，完全新手建议有人陪同" },
    { label: "卫生环境", score: 9.4, weight: 15, note: "训练区域维护和清洁反馈较好" }
  ],
  airfit: [
    { label: "价格透明", score: 8.8, weight: 20, note: "月卡规则简单，线上价格较清楚" },
    { label: "器械配置", score: 8.0, weight: 25, note: "基础器械完整，热门有氧数量一般" },
    { label: "拥挤体验", score: 8.0, weight: 20, note: "晚高峰跑步机偶尔需要等待" },
    { label: "新手友好", score: 8.0, weight: 20, note: "自助流程清楚，但现场指导较少" },
    { label: "卫生环境", score: 8.3, weight: 15, note: "整体整洁，深夜维护频率较低" }
  ]
};

const venueReviews = {
  luma: [
    { name: "阿琳", profile: "健身 4 个月", time: "工作日晚间", rating: 9.0, date: "2026-05-26", photos: 2, text: "门禁和器械都容易上手，晚上八点力量区会稍微等位，没人一直推销办课。" },
    { name: "Mia", profile: "跑步为主", time: "工作日早晨", rating: 8.6, date: "2026-05-18", photos: 2, text: "早上人少，跑步机充足。夜间值班人员不多，第一次来建议白天熟悉环境。" }
  ],
  fither: [
    { name: "小乔", profile: "健身新手", time: "周末下午", rating: 9.2, date: "2026-05-23", photos: 2, text: "女性训练氛围很放松，更衣区干净，工作人员会简单讲器械怎么调。" },
    { name: "Yuki", profile: "力量训练 1 年", time: "工作日晚间", rating: 8.8, date: "2026-05-16", photos: 2, text: "自由重量不算特别多，但高峰期也不压迫。体验后会介绍小课包，可以直接拒绝。" }
  ],
  startfit: [
    { name: "Ken", profile: "健身 2 年", time: "工作日晚间", rating: 8.4, date: "2026-05-28", photos: 2, text: "器械种类确实多，但七点后热门器械要排队，销售跟进比较积极。" },
    { name: "夏夏", profile: "健身新手", time: "周末上午", rating: 8.7, date: "2026-05-21", photos: 2, text: "上午体验不错，淋浴和更衣空间够用，合同中的退转卡条件需要仔细问。" }
  ],
  lightgym: [
    { name: "陈同学", profile: "预算型用户", time: "工作日早晨", rating: 8.5, date: "2026-05-19", photos: 2, text: "价格轻松，早晨基本不用等器械。没有独立淋浴，训练后直接回家更合适。" },
    { name: "丸子", profile: "健身 6 个月", time: "工作日晚间", rating: 8.1, date: "2026-05-13", photos: 2, text: "基础训练够用，重训器械数量一般，工作人员不会频繁推销。" }
  ],
  powerbox: [
    { name: "Leo", profile: "力量训练 3 年", time: "周末下午", rating: 9.0, date: "2026-05-17", text: "自由重量配置很好，周末深蹲架比较抢手，更适合已经会自己安排训练的人。" },
    { name: "嘉欣", profile: "健身 8 个月", time: "工作日晚间", rating: 8.3, date: "2026-05-10", text: "氛围偏硬核但没有不友好，完全新手最好第一次找熟人陪同。" }
  ],
  airfit: [
    { name: "Allen", profile: "夜间训练", time: "22:00 后", rating: 8.4, date: "2026-05-25", text: "深夜能练很方便，自助流程顺畅，不过这个时间基本没有动作指导。" },
    { name: "晴天", profile: "有氧为主", time: "工作日晚间", rating: 8.0, date: "2026-05-20", text: "晚高峰跑步机偶尔要等，其他时段不错。月卡规则简单，适合有训练计划的人。" }
  ]
};

const reviewTemplates = [
  { name: "小周", profile: "健身新手", time: "工作日晚间", rating: 8.5, photos: 1, text: "第一次去主要看器械和人流，整体能练，但晚高峰热门器械还是要稍微等一下。" },
  { name: "Nina", profile: "有氧为主", time: "工作日早晨", rating: 8.7, photos: 2, text: "早上人少很多，跑步机和椭圆机基本不用排队，适合上班前快速练。" },
  { name: "阿泽", profile: "力量训练 1 年", time: "周末下午", rating: 8.2, photos: 1, text: "器械够基础训练使用，但热门区域人多的时候需要轮流，建议先试练再办卡。" },
  { name: "林同学", profile: "刚办月卡", time: "工作日中午", rating: 8.9, photos: 2, text: "中午体验比晚上舒服，工作人员没有一直推销，问价格时能直接说清楚。" },
  { name: "Echo", profile: "女性用户", time: "工作日晚间", rating: 8.6, photos: 2, text: "更衣和训练氛围还可以，晚间安全感主要看门禁和值班人员，建议到店确认。" },
  { name: "Jason", profile: "器械训练", time: "工作日晚间", rating: 8.1, photos: 1, text: "力量区高峰期会拥挤，基础器械维护还行，办卡前要问清停卡和转卡费用。" },
  { name: "可可", profile: "体验后观望", time: "周末上午", rating: 8.4, photos: 2, text: "周末上午人不算多，环境比预期好，主要担心后续续费和私教推荐频率。" },
  { name: "Ben", profile: "短期训练", time: "工作日夜间", rating: 8.0, photos: 1, text: "夜间训练方便，但现场工作人员较少，新手第一次最好不要太晚去。" },
  { name: "Sisi", profile: "办卡前试练", time: "工作日傍晚", rating: 8.3, photos: 2, text: "试练流程比较顺，器械讲解不算特别细，适合自己已经有一点训练计划的人。" },
  { name: "老陈", profile: "恢复训练", time: "工作日午后", rating: 8.8, photos: 1, text: "午后很安静，适合慢慢练。价格透明度还可以，但附加费用一定要单独问。" }
];

Object.values(venueReviews).forEach((reviews) => {
  const existingCount = reviews.length;
  reviewTemplates.forEach((template, index) => {
    reviews.push({
      ...template,
      name: index % 3 === 0 ? `${template.name}${existingCount + index + 1}` : template.name,
      rating: Math.max(7.8, Math.min(9.4, template.rating + ((index % 4) - 1) * 0.1)),
      date: `2026-05-${String(12 + index).padStart(2, "0")}`
    });
  });
});

const equipmentCatalog = {
  treadmill: {
    name: "跑步机",
    description: "适合热身、快走和持续有氧",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Treadmill-gym.jpg?width=900"
  },
  elliptical: {
    name: "椭圆机",
    description: "冲击较低，适合新手有氧",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Elliptical_machine.jpg?width=900"
  },
  bike: {
    name: "动感单车",
    description: "适合间歇训练和下肢耐力",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Stationary_bicycle.jpg?width=900"
  },
  stairClimber: {
    name: "登阶机",
    description: "偏高强度的下肢有氧训练",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Man_on_stair_machine.jpg?width=900"
  },
  chestPress: {
    name: "坐姿推胸机",
    description: "固定轨迹，对新手较友好",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Chest_Incline.jpg?width=900"
  },
  benchPress: {
    name: "卧推架",
    description: "适合杠铃卧推和进阶训练",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Bench_press_Machine.jpg?width=900"
  },
  pecDeck: {
    name: "蝴蝶机",
    description: "用于胸部夹胸和后束训练",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Pec_deck_Fly.jpg?width=900"
  },
  cable: {
    name: "龙门架",
    description: "可完成夹胸、下压等多种动作",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Sz%C3%A9kesfeh%C3%A9rv%C3%A1r%2C_Cutler_Gym%2C_Combined_cable_machine.jpg?width=900"
  },
  latPulldown: {
    name: "高位下拉机",
    description: "适合练习背阔肌发力",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Lat_pulldown_machine_20180112.jpg?width=900"
  },
  seatedRow: {
    name: "坐姿划船机",
    description: "固定轨迹训练中背部",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Multifunctional_cable_and_row_machines_in_a_gym.jpg?width=900"
  },
  assistedPullup: {
    name: "助力引体机",
    description: "降低引体向上的入门难度",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Dip_and_pull-up_machine.jpg?width=900"
  },
  backExtension: {
    name: "罗马椅",
    description: "用于下背和后链基础训练",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/RomanChairBackExtension.JPG?width=900"
  }
};

const venueEquipment = {
  luma: {
    cardio: [["treadmill", "6 台"], ["elliptical", "3 台"], ["bike", "4 台"]],
    chest: [["chestPress", "2 台"], ["benchPress", "2 组"], ["cable", "1 组"]],
    back: [["latPulldown", "2 台"], ["seatedRow", "2 台"], ["assistedPullup", "1 台"]]
  },
  fither: {
    cardio: [["treadmill", "4 台"], ["elliptical", "2 台"], ["bike", "4 台"]],
    chest: [["chestPress", "2 台"], ["pecDeck", "1 台"], ["cable", "1 组"]],
    back: [["latPulldown", "2 台"], ["seatedRow", "1 台"], ["assistedPullup", "1 台"]]
  },
  startfit: {
    cardio: [["treadmill", "10 台"], ["elliptical", "6 台"], ["stairClimber", "2 台"]],
    chest: [["chestPress", "3 台"], ["benchPress", "4 组"], ["pecDeck", "2 台"]],
    back: [["latPulldown", "3 台"], ["seatedRow", "3 台"], ["assistedPullup", "2 台"]]
  },
  lightgym: {
    cardio: [["treadmill", "4 台"], ["elliptical", "2 台"], ["bike", "2 台"]],
    chest: [["chestPress", "1 台"], ["benchPress", "1 组"], ["pecDeck", "1 台"]],
    back: [["latPulldown", "1 台"], ["seatedRow", "1 台"], ["backExtension", "1 台"]]
  },
  powerbox: {
    cardio: [["treadmill", "3 台"], ["bike", "4 台"], ["stairClimber", "1 台"]],
    chest: [["benchPress", "6 组"], ["chestPress", "2 台"], ["cable", "2 组"]],
    back: [["latPulldown", "3 台"], ["seatedRow", "3 台"], ["backExtension", "2 台"]]
  },
  airfit: {
    cardio: [["treadmill", "5 台"], ["elliptical", "2 台"], ["bike", "3 台"]],
    chest: [["chestPress", "1 台"], ["benchPress", "2 组"], ["cable", "1 组"]],
    back: [["latPulldown", "2 台"], ["seatedRow", "1 台"], ["assistedPullup", "1 台"]]
  }
};

const equipmentSections = [
  { key: "cardio", title: "有氧", description: "热身、心肺和耐力训练" },
  { key: "chest", title: "胸部", description: "推举、夹胸和自由重量" },
  { key: "back", title: "背部", description: "下拉、划船和后链训练" }
];

const state = {
  recommendations: [],
  compareIds: new Set(),
  userCoordinates: null,
  galleryIndex: 0,
  galleryVenue: null,
  priorityOrder: []
};

const districtCenters = {
  "珠江新城": [113.3219, 23.1192],
  "天河体育中心": [113.3244, 23.1349],
  "琶洲": [113.3667, 23.0987],
  "北京路": [113.2703, 23.1255],
  "番禺万博": [113.3475, 23.0051]
};

const priorityFeatureLabels = {
  cleanliness: { label: "环境干净", field: "cleanEnvironment" },
  women: { label: "女性友好", field: "womenFriendly" },
  nightSafety: { label: "夜间安全", field: "nightSafety" }
};

const els = {
  form: document.querySelector("#preferenceForm"),
  locationInput: document.querySelector("#locationInput"),
  locateButton: document.querySelector("#locateButton"),
  locationStatus: document.querySelector("#locationStatus"),
  trainingTime: document.querySelector("#trainingTime"),
  recommendationPanel: document.querySelector("#recommendationPanel"),
  resultTitle: document.querySelector("#resultTitle"),
  resultSummary: document.querySelector("#resultSummary"),
  venueList: document.querySelector("#venueList"),
  compareBar: document.querySelector("#compareBar"),
  compareCount: document.querySelector("#compareCount"),
  compareNames: document.querySelector("#compareNames"),
  openCompare: document.querySelector("#openCompare"),
  detailDialog: document.querySelector("#detailDialog"),
  detailContent: document.querySelector("#detailContent"),
  galleryDialog: document.querySelector("#galleryDialog"),
  galleryTitle: document.querySelector("#galleryTitle"),
  galleryCounter: document.querySelector("#galleryCounter"),
  galleryTrack: document.querySelector("#galleryTrack"),
  galleryPrevious: document.querySelector("#galleryPrevious"),
  galleryNext: document.querySelector("#galleryNext"),
  crowdDialog: document.querySelector("#crowdDialog"),
  crowdTitle: document.querySelector("#crowdTitle"),
  crowdContent: document.querySelector("#crowdContent"),
  pricingDialog: document.querySelector("#pricingDialog"),
  pricingTitle: document.querySelector("#pricingTitle"),
  pricingContent: document.querySelector("#pricingContent"),
  ratingDialog: document.querySelector("#ratingDialog"),
  ratingTitle: document.querySelector("#ratingTitle"),
  ratingContent: document.querySelector("#ratingContent"),
  commuteDialog: document.querySelector("#commuteDialog"),
  commuteTitle: document.querySelector("#commuteTitle"),
  commuteContent: document.querySelector("#commuteContent"),
  compareDialog: document.querySelector("#compareDialog"),
  compareContent: document.querySelector("#compareContent"),
  openTrust: document.querySelector("#openTrust"),
  trustDialog: document.querySelector("#trustDialog"),
  introScreen: document.querySelector("#introScreen"),
  introHero: document.querySelector("#introHero"),
  introNotice: document.querySelector("#introNotice"),
  enterApp: document.querySelector("#enterApp"),
  confirmIntro: document.querySelector("#confirmIntro"),
  introReadStatus: document.querySelector("#introReadStatus"),
  introCountdown: document.querySelector("#introCountdown"),
  introReadProgress: document.querySelector("#introReadProgress")
};

function getPreferences() {
  const formData = new FormData(els.form);
  const location = String(formData.get("location") || "").trim();
  const district = state.userCoordinates
    ? findNearestDistrict(state.userCoordinates)
    : inferDistrict(location);
  const selectedPriorities = formData.getAll("priority");
  const orderedPriorities = state.priorityOrder
    .filter((priority) => selectedPriorities.includes(priority));
  selectedPriorities.forEach((priority) => {
    if (!orderedPriorities.includes(priority)) orderedPriorities.push(priority);
  });
  return {
    location: location || "当前位置",
    district,
    coordinates: state.userCoordinates || districtCenters[district],
    commute: Number(formData.get("commute")),
    budget: Number(formData.get("budget")),
    trainingTime: formData.get("trainingTime"),
    gymCategory: formData.get("gymCategory") || "all",
    priorities: orderedPriorities
  };
}

function renderPriorityRanks() {
  els.form.querySelectorAll('input[name="priority"]').forEach((input) => {
    const choice = input.closest(".choice");
    const label = choice.querySelector("span").textContent.trim();
    const rank = state.priorityOrder.indexOf(input.value);
    choice.classList.toggle("is-ranked", rank >= 0);
    if (rank >= 0) {
      choice.dataset.rank = String(rank + 1).padStart(2, "0");
      input.setAttribute("aria-label", `${label}，优先级 ${rank + 1}`);
    } else {
      delete choice.dataset.rank;
      input.setAttribute("aria-label", label);
    }
  });
}

function updatePriorityOrder(input) {
  state.priorityOrder = state.priorityOrder.filter((priority) => priority !== input.value);
  if (input.checked) state.priorityOrder.push(input.value);
  renderPriorityRanks();
}

function findNearestDistrict(coordinates) {
  return Object.entries(districtCenters)
    .map(([district, center]) => ({ district, distance: distanceInKm(coordinates, center) }))
    .sort((a, b) => a.distance - b.distance)[0].district;
}

function inferDistrict(location) {
  const matched = Object.keys(districtCenters).find((district) => location.includes(district));
  if (matched) return matched;
  if (location.includes("体育西") || location.includes("天环") || location.includes("正佳")) return "天河体育中心";
  if (location.includes("会展") || location.includes("万胜围")) return "琶洲";
  if (location.includes("公园前") || location.includes("海珠广场")) return "北京路";
  if (location.includes("南村") || location.includes("万达")) return "番禺万博";
  return "珠江新城";
}

function distanceInKm(from, to) {
  const toRadians = (degree) => degree * Math.PI / 180;
  const earthRadius = 6371;
  const latitudeDelta = toRadians(to[1] - from[1]);
  const longitudeDelta = toRadians(to[0] - from[0]);
  const latitude1 = toRadians(from[1]);
  const latitude2 = toRadians(to[1]);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateCommute(origin, destination) {
  const distance = distanceInKm(origin, destination);
  return Math.max(8, Math.round((distance * 4.2 + 7) / 2) * 2);
}

function getPriorityWeight(preferences, priority) {
  const rank = preferences.priorities.indexOf(priority);
  if (rank < 0) return 0;
  return Math.max(0.7, 1.6 - rank * 0.15);
}

function getRatingDimensionScore(venue, dimension) {
  return ratingProfiles[venue.id]
    ?.find((item) => item.label === dimension)?.score ?? 0;
}

function scoreVenue(venue, preferences) {
  let score = 0;
  if (venue.district === preferences.district) score += 35;
  else if (venue.estimatedCommute <= preferences.commute) score += 18;
  if (venue.monthlyPrice <= preferences.budget) score += 24;
  else score -= Math.min(18, Math.ceil((venue.monthlyPrice - preferences.budget) / 30));
  if (venue.estimatedCommute <= preferences.commute) score += 14;
  if (venue.crowd[preferences.trainingTime] === "宽松") score += 10;
  if (venue.crowd[preferences.trainingTime] === "拥挤") score -= 6;
  const beginnerWeight = getPriorityWeight(preferences, "beginner");
  const salesWeight = getPriorityWeight(preferences, "sales");
  const crowdWeight = getPriorityWeight(preferences, "crowd");
  const equipmentWeight = getPriorityWeight(preferences, "equipment");
  const cleanlinessWeight = getPriorityWeight(preferences, "cleanliness");
  const open24Weight = getPriorityWeight(preferences, "open24");
  const womenWeight = getPriorityWeight(preferences, "women");
  const nightSafetyWeight = getPriorityWeight(preferences, "nightSafety");
  if (beginnerWeight && venue.beginner) score += 12 * beginnerWeight;
  if (salesWeight && venue.lowSales) score += 12 * salesWeight;
  if (crowdWeight) {
    score += venue.crowd[preferences.trainingTime] !== "拥挤"
      ? 10 * crowdWeight
      : -8 * crowdWeight;
  }
  if (equipmentWeight) score += venue.equipment * equipmentWeight;
  if (cleanlinessWeight && venue.cleanEnvironment) score += 8 * cleanlinessWeight;
  if (open24Weight && venue.open24) score += 12 * open24Weight;
  if (womenWeight) score += venue.womenFriendly ? 14 * womenWeight : -10 * womenWeight;
  if (nightSafetyWeight) score += venue.nightSafety ? 14 * nightSafetyWeight : -12 * nightSafetyWeight;
  return score;
}

function getPriorityMatch(venue, preferences, priority) {
  const beginnerScore = getRatingDimensionScore(venue, "新手友好");
  const equipmentScore = getRatingDimensionScore(venue, "器械配置");
  const cleanlinessScore = getRatingDimensionScore(venue, "卫生环境");
  const matches = {
    beginner: { matched: beginnerScore >= 9, label: "新手入门支持" },
    sales: { matched: venue.lowSales, label: "低推销" },
    crowd: {
      matched: venue.crowd[preferences.trainingTime] === "宽松",
      label: "常练时段宽松"
    },
    equipment: { matched: equipmentScore >= 8.8, label: "力量器械充足" },
    cleanliness: { matched: cleanlinessScore >= 8.8, label: "环境干净" },
    open24: { matched: venue.open24, label: "24小时开放" },
    women: { matched: venue.womenFriendly, label: "女性友好" },
    nightSafety: { matched: venue.nightSafety, label: "夜间安全" }
  };
  return matches[priority] || { matched: false, label: priority };
}

function getMatchSummary(venue, preferences) {
  const conditions = preferences.priorities.map((priority) => (
    getPriorityMatch(venue, preferences, priority)
  ));

  conditions.push(
    {
      matched: venue.estimatedCommute <= preferences.commute,
      label: `${venue.estimatedCommute}分钟通勤`
    },
    {
      matched: venue.monthlyPrice <= preferences.budget,
      label: "月费预算内"
    }
  );

  if (preferences.gymCategory !== "all") {
    conditions.push({
      matched: venue.category === preferences.gymCategory,
      label: preferences.gymCategory
    });
  }

  const matchedConditions = conditions.filter((condition) => condition.matched);
  return {
    matched: matchedConditions.length,
    total: conditions.length,
    reasons: matchedConditions.slice(0, 3).map((condition) => condition.label)
  };
}

function getVenueFeatureTags(venue, preferences) {
  const priorityTags = preferences.priorities
    .filter((priority) => priorityFeatureLabels[priority] && venue[priorityFeatureLabels[priority].field])
    .map((priority) => priorityFeatureLabels[priority].label);
  return [...new Set([...priorityTags, ...venue.highlights])].slice(0, 3);
}

function getEvidenceClass(item) {
  if (item.includes("报价") || item.includes("价格") || item.includes("价目") || item.includes("合同")) return "is-price";
  if (item.includes("试练") || item.includes("试训") || item.includes("体验")) return "is-visit";
  if (item.includes("现场") || item.includes("记录") || item.includes("照片") || item.includes("门禁")) return "is-proof";
  return "is-note";
}

function getMatchReason(venue, preferences, index) {
  if (index === 0) return "最符合你的条件";
  if (venue.monthlyPrice <= Math.min(preferences.budget, 350)) return "预算更轻松";
  if (venue.estimatedCommute <= 15) return "通勤更方便";
  if (venue.crowd[preferences.trainingTime] === "宽松") return "常练时段更舒适";
  return "设备与服务更均衡";
}

function crowdClass(value) {
  if (value === "宽松") return "good";
  if (value === "拥挤") return "risk";
  return "neutral";
}

function crowdSummaryLabel(value) {
  if (value === "宽松") return "高峰拥挤度低";
  if (value === "拥挤") return "高峰拥挤度高";
  return "高峰拥挤度中等";
}

function crowdLevelClass(level) {
  if (level >= 65) return "is-busy";
  if (level >= 35) return "is-normal";
  return "is-quiet";
}

function formatTestRecency(dateString) {
  const testedDate = new Date(`${dateString}T00:00:00+08:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.max(0, Math.floor((today - testedDate) / 86400000));
  return days === 0 ? "今天" : `${days} 天前`;
}

function generateRecommendations() {
  const preferences = getPreferences();
  const categoryVenues = preferences.gymCategory === "all"
    ? venues
    : venues.filter((venue) => venue.category === preferences.gymCategory);
  state.recommendations = [...categoryVenues]
    .map((venue) => ({
      ...venue,
      estimatedCommute: estimateCommute(preferences.coordinates, venue.coordinates)
    }))
    .map((venue) => ({ ...venue, matchScore: scoreVenue(venue, preferences) }))
    .sort((a, b) => (
      b.matchScore - a.matchScore
      || a.estimatedCommute - b.estimatedCommute
      || a.monthlyPrice - b.monthlyPrice
    ))
    .slice(0, 3);

  state.compareIds.clear();
  const categorySummary = preferences.gymCategory === "all" ? "不限类型" : preferences.gymCategory;
  els.resultTitle.textContent = `按匹配度推荐 ${state.recommendations.length} 家`;
  els.resultSummary.textContent = `从${preferences.location}出发 · ${preferences.commute}分钟内 · 每月¥${preferences.budget}内 · ${categorySummary}`;
  renderRecommendations(preferences);
  renderCompareBar();
}

function hideRecommendations() {
  els.recommendationPanel.hidden = true;
  document.querySelector(".workspace").classList.remove("has-results");
  state.compareIds.clear();
  renderCompareBar();
}

function renderRecommendations(preferences) {
  els.venueList.innerHTML = "";
  state.recommendations.forEach((venue, index) => {
    const evaluatorScore = ratingProfiles[venue.id]
      .reduce((total, item) => total + item.score * item.weight / 100, 0) / 2;
    const crowdProfile = crowdProfiles[venue.id];
    const matchSummary = getMatchSummary(venue, preferences);
    const article = document.createElement("article");
    article.className = "venue-card";
    article.innerHTML = `
      <button class="venue-image" data-gallery="${venue.id}" type="button" aria-label="查看 ${venue.name} 的场馆照片">
        <img src="${venue.image}" alt="${venue.type}训练空间场景图" loading="lazy" referrerpolicy="no-referrer" />
        <span class="rank-label">推荐第 ${index + 1} 名</span>
        <span class="photo-count"><span aria-hidden="true">▣</span> 查看照片 · ${venue.gallery.length} 张</span>
      </button>
      <div class="venue-card-body">
        <div class="venue-title-row">
          <div class="venue-heading-copy">
            <div class="match-summary-line">
              <p class="match-reason">${getMatchReason(venue, preferences, index)}</p>
              <span class="match-count">匹配 ${matchSummary.matched}/${matchSummary.total} 项</span>
            </div>
            <p class="match-basis"><strong>推荐依据</strong>${matchSummary.reasons.join(" · ")}</p>
            <div class="venue-name-line">
              <h3>${venue.name}</h3>
              <button class="rating-link" data-rating="${venue.id}" type="button" aria-label="查看 ${venue.name} 的评分与评价">
                <strong>${evaluatorScore.toFixed(1)} 分</strong>
                <span>查看实测依据</span>
              </button>
            </div>
            <div class="venue-meta-row">
              <p class="venue-meta">${venue.district} · ${venue.type}</p>
              <span class="venue-category ${venue.category === "铁馆" ? "is-iron" : "is-commercial"}">${venue.category}</span>
            </div>
          </div>
          <label class="compare-toggle">
            <input type="checkbox" data-compare="${venue.id}" />
            <span class="compare-action">
              <span class="compare-action-icon" aria-hidden="true">
                <b class="compare-icon-add">＋</b>
                <b class="compare-icon-added">✓</b>
              </span>
              <span class="compare-action-copy">
                <strong class="compare-copy-add">加入对比</strong>
                <strong class="compare-copy-added">已加入</strong>
                <small class="compare-hint-add">点击选择</small>
                <small class="compare-hint-added">再次点击取消</small>
              </span>
            </span>
          </label>
        </div>

        <div class="venue-support-row">
          <div class="venue-features" aria-label="${venue.name}的突出特点">
            ${getVenueFeatureTags(venue, preferences).map((highlight) => `<span class="venue-feature">${highlight}</span>`).join("")}
          </div>
          <p class="test-proof">
            <span aria-hidden="true"></span>
            实测：${venue.testerCount} 人 · ${formatTestRecency(venue.testedAt)}
          </p>
        </div>

        <div class="facts-row">
          <button class="price-fact" data-pricing="${venue.id}" type="button" aria-label="查看 ${venue.name} 的具体收费">
            <strong>¥${venue.monthlyPrice}</strong><span>看价格明细</span><em aria-hidden="true">›</em>
          </button>
          <button class="commute-fact" data-commute="${venue.id}" type="button" aria-label="查看从 ${preferences.location} 到 ${venue.name} 的通勤时间">
            <strong>${venue.estimatedCommute} 分钟</strong><span>看通勤说明</span><em aria-hidden="true">›</em>
          </button>
          <button class="crowd-fact" data-crowd="${venue.id}" type="button" aria-label="查看 ${venue.name} 全天客流；最拥挤时段 ${crowdProfile.busiest}">
            <strong class="${crowdClass(venue.crowd[preferences.trainingTime])}">${crowdSummaryLabel(venue.crowd[preferences.trainingTime])}</strong>
            <span>最拥挤 ${crowdProfile.busiest}</span><em aria-hidden="true">›</em>
          </button>
        </div>

        <div class="card-footer">
          <button class="text-button detail-button" data-detail="${venue.id}" type="button">查看器械和点评</button>
        </div>
      </div>
    `;
    els.venueList.append(article);
  });

  document.querySelectorAll("[data-compare]").forEach((input) => {
    input.addEventListener("change", handleCompareSelection);
  });
  document.querySelectorAll("[data-detail]").forEach((button) => {
    button.addEventListener("click", () => showDetail(button.dataset.detail));
  });
  document.querySelectorAll("[data-gallery]").forEach((button) => {
    button.addEventListener("click", () => showGallery(button.dataset.gallery));
  });
  document.querySelectorAll("[data-crowd]").forEach((button) => {
    button.addEventListener("click", () => showCrowd(button.dataset.crowd));
  });
  document.querySelectorAll("[data-pricing]").forEach((button) => {
    button.addEventListener("click", () => showPricing(button.dataset.pricing));
  });
  document.querySelectorAll("[data-rating]").forEach((button) => {
    button.addEventListener("click", () => showRating(button.dataset.rating));
  });
  document.querySelectorAll("[data-commute]").forEach((button) => {
    button.addEventListener("click", () => showCommute(button.dataset.commute));
  });
}

function handleCompareSelection(event) {
  const id = event.target.dataset.compare;
  if (event.target.checked) {
    if (state.compareIds.size >= 3) {
      event.target.checked = false;
      return;
    }
    state.compareIds.add(id);
  } else {
    state.compareIds.delete(id);
  }
  renderCompareBar();
}

function renderCompareBar() {
  const selected = state.recommendations.filter((venue) => state.compareIds.has(venue.id));
  els.compareBar.hidden = selected.length === 0;
  els.compareCount.textContent = selected.length;
  els.compareNames.textContent = selected.length
    ? selected.map((venue) => venue.name).join("、")
    : "选择 2 家即可比较";
  els.openCompare.disabled = selected.length < 2;
}

function renderAdditionalFeeDisclosure(id, context) {
  const additionalFees = additionalFeePlans[id];
  const panelId = `${context}AdditionalFees-${id}`;
  return `
    <button class="pricing-reminder" data-toggle-additional-fees type="button" aria-expanded="false" aria-controls="${panelId}">
      <span class="pricing-reminder-icon" aria-hidden="true">!</span>
      <span class="pricing-reminder-copy">
        <strong>可能的额外费用</strong>
        <small>已整理 ${additionalFees.length} 项，点击查看具体金额</small>
      </span>
      <span class="pricing-reminder-action"><span data-fee-action-label>查看明细</span><b aria-hidden="true">⌄</b></span>
    </button>
    <div class="additional-fee-list" id="${panelId}" hidden>
      ${additionalFees.map(([label, amount]) => `
        <div>
          <span>${label}</span>
          <strong>${amount}</strong>
          <small>访谈参考 · 待门店核验</small>
        </div>
      `).join("")}
    </div>
  `;
}

function bindAdditionalFeeDisclosure(container) {
  container.querySelectorAll("[data-toggle-additional-fees]").forEach((button) => {
    button.addEventListener("click", () => {
      const feeList = container.querySelector(`#${button.getAttribute("aria-controls")}`);
      const isExpanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!isExpanded));
      feeList.hidden = isExpanded;
      button.querySelector("[data-fee-action-label]").textContent = isExpanded ? "查看明细" : "收起明细";
    });
  });
}

function showDetail(id) {
  const venue = venues.find((item) => item.id === id);
  const inventory = venueEquipment[venue.id];
  const prices = pricingPlans[venue.id];
  const reviews = venueReviews[venue.id];
  const evaluatorDimensions = ratingProfiles[venue.id];
  const evaluatorScore = evaluatorDimensions
    .reduce((total, item) => total + item.score * item.weight / 100, 0);
  els.detailContent.innerHTML = `
    <header class="topbar detail-dialog-topbar" aria-label="详情页导航">
      <button class="brand detail-dialog-home" type="button" aria-label="返回练哪儿选馆列表">
        <span class="brand-mark" aria-hidden="true">练</span>
        <span>
          <strong>练哪儿</strong>
          <small class="brand-slogan">只做真实的评分</small>
        </span>
      </button>
      <button class="trust-trigger detail-dialog-trust" type="button">
        <span class="status-dot" aria-hidden="true"></span>
        <span class="trust-trigger-copy">
          <strong>我们如何保证真实</strong>
          <small>点击查看实测依据</small>
        </span>
        <span class="trust-info-icon" aria-hidden="true">i</span>
      </button>
    </header>
    <div class="detail-hero" style="background-image: linear-gradient(rgba(16, 25, 29, 0.1), rgba(16, 25, 29, 0.78)), url('${venue.image}')">
      <button class="icon-button detail-close" type="button" aria-label="关闭">×</button>
      <div>
        <p>${venue.district} · ${venue.type}</p>
        <h2>${venue.name}</h2>
      </div>
    </div>
    <div class="detail-body">
      <section>
        <p class="eyebrow">快速判断</p>
        <h3>${venue.fit}</h3>
        <div class="detail-facts">
          <div><span>营业时间</span><strong>${venue.hours}</strong></div>
            <div><span>体验官评分</span><strong>${venue.rating} / 10</strong></div>
          <div><span>女性友好</span><strong>${venue.womenFriendly ? "是" : "待确认"}</strong></div>
          <div><span>价格核验</span><strong>${venue.updated}</strong></div>
        </div>
      </section>
      <section class="pricing-section">
        <div class="equipment-heading">
          <div>
            <p class="eyebrow">参考价格</p>
            <h3>不同周期怎么收费？</h3>
          </div>
          <span>到店前再次确认</span>
        </div>
        <div class="pricing-grid">
          <div><span>单次</span><strong>¥${prices.single}</strong></div>
          <div><span>周卡</span><strong>¥${prices.weekly}</strong></div>
          <div class="pricing-primary"><span>月卡</span><strong>¥${prices.monthly}</strong></div>
          <div><span>年卡</span><strong>¥${prices.annual}</strong></div>
        </div>
        ${renderAdditionalFeeDisclosure(venue.id, "detail")}
        <p class="source-note">以上均为访谈原型演示价格，实际收费请以门店最新书面报价和合同为准。</p>
      </section>
      <section class="detail-explore">
        <div class="detail-choice-heading">
          <p class="eyebrow">继续了解</p>
          <h3>你想先看哪一项？</h3>
        </div>
        <div class="detail-tabs" role="tablist" aria-label="${venue.name}详情选项">
          <button type="button" role="tab" aria-selected="false" data-detail-tab="equipment">器械清单</button>
          <button type="button" role="tab" aria-selected="false" data-detail-tab="reviews">点评</button>
        </div>
      </section>
      <section class="equipment-section detail-tab-panel" data-detail-panel="equipment" hidden>
        <div class="equipment-heading">
          <div>
            <p class="eyebrow">器材清单</p>
            <h3>这里有什么器械？</h3>
          </div>
          <span>按训练部位查看</span>
        </div>
        <div class="equipment-groups">
          ${equipmentSections.map((section) => `
            <section class="equipment-group">
              <header>
                <div>
                  <h4>${section.title}</h4>
                  <p>${section.description}</p>
                </div>
                <span>${inventory[section.key].length} 类</span>
              </header>
              <div class="equipment-list">
                ${inventory[section.key].map(([equipmentId, quantity]) => {
                  const item = equipmentCatalog[equipmentId];
                  return `
                    <article class="equipment-item">
                      <img src="${item.image}" alt="${item.name}" loading="lazy" referrerpolicy="no-referrer" />
                      <div>
                        <div class="equipment-name">
                          <strong>${item.name}</strong>
                          <span>${quantity}</span>
                        </div>
                        <p>${item.description}</p>
                      </div>
                    </article>
                  `;
                }).join("")}
              </div>
            </section>
          `).join("")}
        </div>
        <p class="source-note">器材图片来自 Wikimedia Commons，仅用于准确识别器械；数量为访谈原型演示，正式数据需经门店或实地核验。</p>
      </section>
      <section class="reviews-section detail-tab-panel" data-detail-panel="reviews" hidden>
        <div class="equipment-heading">
          <div>
            <p class="eyebrow">点评</p>
            <h3>不同来源怎么评价？</h3>
          </div>
          <span>实测与用户反馈分开呈现</span>
        </div>
        <div class="review-source-tabs" role="tablist" aria-label="${venue.name}点评来源">
          <button type="button" role="tab" aria-selected="true" data-review-source="evaluator">
            体验官点评 <span>${venue.testerCount}</span>
          </button>
          <button type="button" role="tab" aria-selected="false" data-review-source="consumer">
            用户点评 <span>${reviews.length}</span>
          </button>
        </div>
        <div class="review-source-panel" data-review-panel="evaluator">
          <article class="review-item evaluator-review-item">
            <header>
              <div class="review-avatar evaluator-avatar" aria-hidden="true">测</div>
              <div>
                <strong>体验官综合点评</strong>
                <p>${venue.testerCount} 人实测 · ${venue.hours}</p>
              </div>
              <span>${(evaluatorScore / 2).toFixed(1)}</span>
            </header>
            <p>${venue.caution} 综合来看，${evaluatorDimensions[1].note}，${evaluatorDimensions[3].note}。</p>
            <div class="evaluator-review-meta">
              <span>平台承担体验费用</span>
              <span>按统一标准测评</span>
              <span>不接受场馆改分</span>
            </div>
            <small>实测记录于 ${venue.testedAt}</small>
          </article>
        </div>
        <div class="review-source-panel" data-review-panel="consumer" hidden>
          <div class="review-list" id="consumerReviewList-${id}">
            ${reviews.map((review, reviewIndex) => `
              <article class="review-item ${reviewIndex >= 2 ? "is-extra-review" : ""}" ${reviewIndex >= 2 ? "hidden" : ""}>
                <header>
                  <div class="review-avatar" aria-hidden="true">${review.name.slice(0, 1)}</div>
                  <div>
                    <strong>${review.name}</strong>
                    <p>${review.profile} · ${review.time}</p>
                  </div>
                  <span>${review.rating.toFixed(1)}</span>
                </header>
                <p>${review.text}</p>
                <div class="review-photos" aria-label="${review.name} 的体验照片演示位">
                  ${Array.from({ length: review.photos || 2 }, (_, index) => `
                    <div class="review-photo-placeholder" role="img" aria-label="体验照片 ${index + 1} 占位">
                      <span aria-hidden="true">▧</span>
                      <strong>体验照片 ${index + 1}</strong>
                      <small>正式版展示用户实拍</small>
                    </div>
                  `).join("")}
                </div>
                <small>体验记录于 ${review.date}</small>
              </article>
            `).join("")}
          </div>
          ${reviews.length > 2 ? `<button class="load-more-reviews" data-load-more-reviews type="button" aria-expanded="false" aria-controls="consumerReviewList-${id}" data-hidden-review-count="${reviews.length - 2}">查看更多 ${reviews.length - 2} 条用户点评</button>` : ""}
          <p class="source-note">用户点评用于补充不同时间段和使用场景，不参与体验官主评分核算。</p>
        </div>
      </section>
      <section class="warning-panel">
        <p class="eyebrow">办卡前留意</p>
        <strong>${venue.caution}</strong>
      </section>
      <section>
        <p class="eyebrow">信息依据</p>
        <div class="evidence-list">${venue.evidence.map((item) => `<span class="${getEvidenceClass(item)}">${item}</span>`).join("")}</div>
        <p class="source-note">最近核验：${venue.updated}。当前为访谈演示数据，不构成真实消费建议。</p>
      </section>
    </div>
  `;
  bindAdditionalFeeDisclosure(els.detailContent);
  els.detailContent.querySelector(".detail-close").addEventListener("click", () => els.detailDialog.close());
  els.detailContent.querySelector(".detail-dialog-home").addEventListener("click", () => els.detailDialog.close());
  els.detailContent.querySelector(".detail-dialog-trust").addEventListener("click", () => {
    els.detailDialog.close();
    requestAnimationFrame(() => els.openTrust.click());
  });
  els.detailContent.querySelectorAll("[data-detail-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const selected = button.dataset.detailTab;
      els.detailContent.querySelectorAll("[data-detail-tab]").forEach((tab) => {
        tab.setAttribute("aria-selected", String(tab === button));
      });
      els.detailContent.querySelectorAll("[data-detail-panel]").forEach((panel) => {
        panel.hidden = panel.dataset.detailPanel !== selected;
      });
    });
  });
  els.detailContent.querySelectorAll("[data-review-source]").forEach((button) => {
    button.addEventListener("click", () => {
      const selected = button.dataset.reviewSource;
      els.detailContent.querySelectorAll("[data-review-source]").forEach((tab) => {
        tab.setAttribute("aria-selected", String(tab === button));
      });
      els.detailContent.querySelectorAll("[data-review-panel]").forEach((panel) => {
        panel.hidden = panel.dataset.reviewPanel !== selected;
      });
    });
  });
  els.detailContent.querySelector("[data-load-more-reviews]")?.addEventListener("click", (event) => {
    const button = event.currentTarget;
    const isExpanded = button.getAttribute("aria-expanded") === "true";
    els.detailContent.querySelectorAll(".is-extra-review").forEach((review) => {
      review.hidden = isExpanded;
    });
    button.setAttribute("aria-expanded", String(!isExpanded));
    button.textContent = isExpanded
      ? `查看更多 ${button.dataset.hiddenReviewCount} 条用户点评`
      : "收起用户点评";
    if (isExpanded) {
      button.closest("[data-review-panel]")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
  els.detailDialog.showModal();
}

function updateGalleryPosition(index, smooth = true) {
  const photos = state.galleryVenue?.gallery || [];
  if (!photos.length) return;
  state.galleryIndex = Math.max(0, Math.min(index, photos.length - 1));
  els.galleryTrack.scrollTo({
    left: els.galleryTrack.clientWidth * state.galleryIndex,
    behavior: smooth ? "smooth" : "auto"
  });
  els.galleryCounter.textContent = `${state.galleryIndex + 1} / ${photos.length}`;
  els.galleryPrevious.disabled = state.galleryIndex === 0;
  els.galleryNext.disabled = state.galleryIndex === photos.length - 1;
}

function showGallery(id) {
  const venue = venues.find((item) => item.id === id);
  state.galleryVenue = venue;
  state.galleryIndex = 0;
  els.galleryTitle.textContent = venue.name;
  els.galleryTrack.innerHTML = venue.gallery.map((photo, index) => `
    <figure class="gallery-slide">
      <img src="${photo.src}" alt="${venue.name}：${photo.caption}" ${index === 0 ? "" : 'loading="lazy"'} referrerpolicy="no-referrer" />
      <figcaption>
        <span>${photo.caption}</span>
        <small>拍摄核验于 ${photo.date || venue.testedAt}</small>
      </figcaption>
    </figure>
  `).join("");
  els.galleryDialog.showModal();
  requestAnimationFrame(() => updateGalleryPosition(0, false));
}

function showCrowd(id) {
  const venue = venues.find((item) => item.id === id);
  const profile = crowdProfiles[id];
  els.crowdTitle.textContent = venue.name;
  els.crowdContent.innerHTML = `
    <div class="crowd-summary">
      <div class="is-busy"><span>最拥挤</span><strong>${profile.busiest}</strong></div>
      <div class="is-quiet"><span>最宽松</span><strong>${profile.quietest}</strong></div>
    </div>
    <div class="crowd-legend" aria-label="客流颜色说明">
      <span><i class="is-quiet"></i>宽松</span>
      <span><i class="is-normal"></i>一般</span>
      <span><i class="is-busy"></i>拥挤</span>
    </div>
    <div class="crowd-chart" aria-label="${venue.name} 0到24点客流图">
      ${profile.levels.map((level, hour) => `
        <div class="crowd-hour ${crowdLevelClass(level)}" title="${String(hour).padStart(2, "0")}:00 · 客流指数 ${level}">
          <span style="height:${Math.max(4, level)}%"></span>
        </div>
      `).join("")}
    </div>
    <div class="crowd-axis" aria-label="时间刻度">
      <span><b>0点</b><small>深夜</small></span>
      <span><b>6点</b><small>早晨</small></span>
      <span><b>12点</b><small>中午</small></span>
      <span><b>18点</b><small>晚高峰</small></span>
      <span><b>24点</b><small>夜间</small></span>
    </div>
    <p class="source-note">客流为访谈原型演示值，用于判断相对高峰；正式数据需通过分时到店记录持续核验。</p>
  `;
  els.crowdDialog.showModal();
}

function showPricing(id) {
  const venue = venues.find((item) => item.id === id);
  const prices = pricingPlans[id];
  els.pricingTitle.textContent = venue.name;
  els.pricingContent.innerHTML = `
    <p class="pricing-intro">目前收集到的公开及访谈参考价格</p>
    <div class="pricing-grid pricing-dialog-grid">
      <div><span>单次</span><strong>¥${prices.single}</strong></div>
      <div><span>周卡</span><strong>¥${prices.weekly}</strong></div>
      <div class="pricing-primary"><span>月卡</span><strong>¥${prices.monthly}</strong></div>
      <div><span>年卡</span><strong>¥${prices.annual}</strong></div>
    </div>
    ${renderAdditionalFeeDisclosure(id, "dialog")}
    <p class="source-note">以上均为访谈原型演示价格，实际收费请以门店最新书面报价和合同为准。</p>
  `;
  bindAdditionalFeeDisclosure(els.pricingContent);
  els.pricingDialog.showModal();
}

function renderDumbbells(score) {
  const activeCount = Math.round(score / 2);
  return Array.from({ length: 5 }, (_, index) => `
    <span class="dumbbell ${index < activeCount ? "is-active" : ""}" aria-hidden="true">
      <i></i><b></b><i></i>
    </span>
  `).join("");
}

function getConsumerDimensions(dimensions, consumerScore) {
  const adjustments = [-0.2, 0.1, -0.3, 0.2, 0.1];
  const adjusted = dimensions.map((item, index) => ({
    ...item,
    weight: null,
    score: Math.min(10, Math.max(0, item.score + adjustments[index]))
  }));
  const average = adjusted.reduce((total, item) => total + item.score, 0) / adjusted.length;
  const correction = consumerScore - average;
  return adjusted.map((item) => ({
    ...item,
    score: Math.min(10, Math.max(0, item.score + correction))
  }));
}

function renderRatingDimensions(dimensions, source) {
  return `
    <section class="rating-dimensions" aria-label="${source === "evaluator" ? "体验官" : "消费者"}评分维度">
      <header class="rating-section-heading">
        <div>
          <span>${source === "evaluator" ? "体验官实测" : "消费者反馈"}</span>
          <h3>不同维度的评分</h3>
        </div>
        <small>满分 10 分</small>
      </header>
      ${dimensions.map((item) => `
        <article class="rating-dimension">
          <div class="rating-dimension-heading">
            <div>
              <strong>${item.label}</strong>
              ${item.weight ? `<span>权重 ${item.weight}%</span>` : ""}
            </div>
            <b>${item.score.toFixed(1)}</b>
          </div>
          <div class="rating-bar" aria-label="${item.label} ${item.score.toFixed(1)} 分">
            <span style="width:${item.score * 10}%"></span>
          </div>
          <p>${item.note}</p>
        </article>
      `).join("")}
    </section>
  `;
}

function renderEvaluatorFeedback(venue, dimensions) {
  const strengths = [...dimensions]
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((item) => item.note)
    .join("；");
  const watchouts = dimensions
    .filter((item) => item.score < 8.4)
    .map((item) => item.note)
    .slice(0, 2)
    .join("；");
  return `
    <article class="rating-feedback rating-feedback-evaluator">
      <div>
        <strong>体验官综合结论</strong>
        <span>${venue.testedAt} · ${venue.hours}</span>
      </div>
      <div class="feedback-points">
        <section class="feedback-point is-risk">
          <span>重点留意</span>
          <p>${venue.caution}</p>
        </section>
        <section class="feedback-point is-good">
          <span>实测优势</span>
          <p>${strengths}</p>
        </section>
        <section class="feedback-point is-note">
          <span>综合判断</span>
          <p>${watchouts ? `整体可选，但需要确认：${watchouts}。` : "整体体验稳定，适合作为优先试练候选。"}</p>
        </section>
      </div>
    </article>
  `;
}

function renderRatingOverview(id) {
  const venue = venues.find((item) => item.id === id);
  const dimensions = ratingProfiles[id];
  const reviews = venueReviews[id];
  const weightedScore = dimensions.reduce((total, item) => total + item.score * item.weight / 100, 0);
  const consumerScore = reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;
  els.ratingContent.innerHTML = `
    <section class="rating-origin-note">
      <span>我们的核心评分</span>
      <strong>体验官费用由平台承担，并按统一标准到店实测。</strong>
      <p>消费者评价用于补充不同时间段和使用场景，不计入体验官主评分。</p>
    </section>
    <section class="rating-sources" aria-label="两类评分来源">
      <button class="rating-source rating-source-primary" data-rating-source="evaluator" data-venue-id="${id}" type="button">
        <span class="rating-source-tag">核心依据</span>
        <h3>体验官评分</h3>
        <div class="rating-source-score">
          <strong>${(weightedScore / 2).toFixed(1)}</strong><small>/ 5</small>
        </div>
        <p>统一查看价格、器械、拥挤、新手体验和卫生环境。</p>
        <span class="rating-source-update">信息更新于 ${venue.testedAt}</span>
        <span class="rating-source-action">查看体验官打分与评价 <b aria-hidden="true">›</b></span>
      </button>
      <button class="rating-source" data-rating-source="consumer" data-venue-id="${id}" type="button">
        <span class="rating-source-tag">补充参考</span>
        <h3>消费者评分</h3>
        <div class="rating-source-score">
          <strong>${(consumerScore / 2).toFixed(1)}</strong><small>/ 5</small>
        </div>
        <p>来自 ${reviews.length} 条体验样本，仅作为真实使用感受的补充，不参与主评分核算。</p>
        <span class="rating-source-update">信息更新于 ${reviews[0].date}</span>
        <span class="rating-source-action">查看消费者打分与评价 <b aria-hidden="true">›</b></span>
      </button>
    </section>
    <p class="rating-overview-help">选择一种评分来源，查看对应的分项打分与评价。</p>
  `;
}

function renderRatingDetail(id, source) {
  const venue = venues.find((item) => item.id === id);
  const dimensions = ratingProfiles[id];
  const reviews = venueReviews[id];
  const weightedScore = dimensions.reduce((total, item) => total + item.score * item.weight / 100, 0);
  const consumerScore = reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;
  const isEvaluator = source === "evaluator";
  const detailDimensions = isEvaluator
    ? dimensions
    : getConsumerDimensions(dimensions, consumerScore);

  els.ratingContent.innerHTML = `
    <div class="rating-detail-toolbar">
      <button class="rating-back-button" data-rating-back="${id}" type="button">
        <span aria-hidden="true">‹</span> 返回评分来源
      </button>
      <span>信息更新于 ${isEvaluator ? venue.testedAt : reviews[0].date}</span>
    </div>
    <section class="rating-detail-summary ${isEvaluator ? "is-evaluator" : ""}">
      <span>${isEvaluator ? "核心依据" : "补充参考"}</span>
      <h3>${isEvaluator ? "体验官评分" : "消费者评分"}</h3>
      <div>
        <strong>${((isEvaluator ? weightedScore : consumerScore) / 2).toFixed(1)}</strong>
        <small>/ 5</small>
      </div>
      <p>${isEvaluator
        ? `由平台自费邀请 ${venue.testerCount} 名体验官，在真实训练时段按统一标准完成实测。`
        : `来自 ${reviews.length} 条消费者体验样本，仅作为使用感受补充，不参与体验官主评分。`
      }</p>
    </section>
    ${isEvaluator ? `
      <section class="rating-feedback-section">
        <header class="rating-section-heading">
          <div><span>体验官评价</span><h3>实测后的判断</h3></div>
          <small>${venue.testerCount} 人参与</small>
        </header>
        ${renderEvaluatorFeedback(venue, dimensions)}
      </section>
      ${renderRatingDimensions(detailDimensions, source)}
      <section class="rating-method">
        <strong>主评分怎么核算？</strong>
        <p>五项体验官实测得分按权重相加，再除以 2 转换为 5 分制。消费者评分不会混入这个结果。</p>
        <code>${dimensions.map((item) => `${item.score.toFixed(1)}×${item.weight}%`).join(" + ")} = ${weightedScore.toFixed(1)}</code>
      </section>
    ` : `
      ${renderRatingDimensions(detailDimensions, source)}
      <section class="rating-feedback-section">
        <header class="rating-section-heading">
          <div><span>消费者评价</span><h3>去过的人怎么说？</h3></div>
          <small>${reviews.length} 条样本</small>
        </header>
        <div class="rating-review-list">
          ${reviews.map((review) => `
            <article class="rating-feedback">
              <div>
                <strong>${review.name} · ${review.rating.toFixed(1)} 分</strong>
                <span>${review.profile} · ${review.time}</span>
              </div>
              <p>${review.text}</p>
              <small>体验记录于 ${review.date}</small>
            </article>
          `).join("")}
        </div>
      </section>
    `}
  `;
}

function showRating(id) {
  const venue = venues.find((item) => item.id === id);
  els.ratingTitle.textContent = venue.name;
  renderRatingOverview(id);
  els.ratingDialog.showModal();
}

function showCommute(id) {
  const venue = state.recommendations.find((item) => item.id === id);
  const preferences = getPreferences();
  const distance = distanceInKm(preferences.coordinates, venue.coordinates);
  els.commuteTitle.textContent = venue.name;
  els.commuteContent.innerHTML = `
    <section class="commute-route" aria-label="通勤路线">
      <div class="commute-point">
        <span aria-hidden="true">A</span>
        <div><small>从这里出发</small><strong>${preferences.location}</strong></div>
      </div>
      <div class="commute-line"><span></span><b>${venue.estimatedCommute} 分钟</b></div>
      <div class="commute-point">
        <span aria-hidden="true">B</span>
        <div><small>到达场馆</small><strong>${venue.name}</strong><p>${venue.district} · ${venue.type}</p></div>
      </div>
    </section>
    <section class="commute-summary">
      <div><span>预计单程</span><strong>${venue.estimatedCommute} 分钟</strong></div>
      <div><span>直线距离</span><strong>${distance.toFixed(1)} 公里</strong></div>
    </section>
    <section class="commute-method">
      <strong>目前怎么估算？</strong>
      <p>根据你选择的位置与场馆坐标的直线距离，结合广州市内短途通勤速度和固定进出场时间估算。</p>
    </section>
    <p class="source-note">当前不是实时导航结果。正式上线后建议接入地图服务，分别显示步行、骑行、公交和驾车的实时预计时间。</p>
  `;
  els.commuteDialog.showModal();
}

function renderFinalChoiceCard(venue) {
  const contact = venueContacts[venue.id];
  return `
    <section class="final-contact-card">
      <div>
        <p class="eyebrow">你选择的是</p>
        <h3>${venue.name}</h3>
        <span>${venue.district} · ${venue.type}</span>
      </div>
      <div class="contact-grid">
        <div><span>联系电话</span><strong>${contact.phone}</strong></div>
        <div><span>最近地铁</span><strong>${contact.nearestStation}</strong></div>
        <div class="is-wide"><span>场馆位置</span><strong>${contact.address}</strong></div>
      </div>
      <div class="contact-note">
        <strong>到店前建议</strong>
        <p>${contact.booking}</p>
      </div>
      <button class="contact-copy-button" data-copy-contact="${venue.id}" type="button">复制联系信息</button>
      <p class="source-note">以上为访谈原型演示联系方式，正式上线前需由场馆核验。</p>
    </section>
  `;
}

function renderComparison() {
  const selected = state.recommendations.filter((venue) => state.compareIds.has(venue.id));
  const preferences = getPreferences();
  const rows = [
    ["参考月费", ...selected.map((venue) => `¥${venue.monthlyPrice}`)],
    ["通勤估算", ...selected.map((venue) => `${venue.estimatedCommute} 分钟`)],
    ["常练时段", ...selected.map((venue) => venue.crowd[preferences.trainingTime])],
    ["营业时间", ...selected.map((venue) => venue.hours)],
    ["新手入门支持", ...selected.map((venue) => venue.beginner ? "有" : "较少")],
    ["女性友好", ...selected.map((venue) => venue.womenFriendly ? "是" : "待确认")],
    ["推销压力", ...selected.map((venue) => venue.lowSales ? "较低" : "需留意")],
    ["淋浴", ...selected.map((venue) => venue.shower ? "有" : "无")],
    ["力量器械", ...selected.map((venue) => `${venue.equipment}/10`)]
  ];

  els.compareContent.innerHTML = `
    <div class="compare-table" style="--venue-count:${selected.length}">
      <div class="compare-cell compare-label"></div>
      ${selected.map((venue) => `<div class="compare-cell compare-name"><strong>${venue.name}</strong><span>${venue.type}</span></div>`).join("")}
      ${rows.map((row) => row.map((cell, index) => `<div class="compare-cell ${index === 0 ? "compare-label" : ""}">${cell}</div>`).join("")).join("")}
    </div>
    <p class="compare-advice">建议：先试练最符合你常用时段的一家，不要只按最低价格决定。</p>
    <section class="final-choice-section">
      <div class="equipment-heading">
        <div>
          <p class="eyebrow">最后一步</p>
          <h3>你准备先看哪一家？</h3>
        </div>
        <span>选定后查看联系与位置</span>
      </div>
      <div class="final-choice-list">
        ${selected.map((venue) => `
          <button class="final-choice-button" data-final-choice="${venue.id}" type="button">
            <strong>${venue.name}</strong>
            <span>${venue.estimatedCommute} 分钟 · ¥${venue.monthlyPrice}/月</span>
          </button>
        `).join("")}
      </div>
      <div id="finalChoiceResult" class="final-choice-result" hidden></div>
    </section>
  `;
  els.compareContent.querySelectorAll("[data-final-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const venue = selected.find((item) => item.id === button.dataset.finalChoice);
      els.compareContent.querySelectorAll("[data-final-choice]").forEach((item) => {
        item.setAttribute("aria-selected", String(item === button));
      });
      const result = els.compareContent.querySelector("#finalChoiceResult");
      result.hidden = false;
      result.innerHTML = renderFinalChoiceCard(venue);
    });
  });
  els.compareContent.onclick = async (event) => {
    const copyButton = event.target.closest("[data-copy-contact]");
    if (!copyButton) return;
    const venue = selected.find((item) => item.id === copyButton.dataset.copyContact);
    const contact = venueContacts[venue.id];
    const text = `${venue.name}\n电话：${contact.phone}\n地址：${contact.address}\n交通：${contact.nearestStation}`;
    try {
      await navigator.clipboard.writeText(text);
      copyButton.textContent = "已复制";
    } catch {
      copyButton.textContent = "复制失败，请手动复制";
    }
  };
  els.compareDialog.showModal();
}

function enterSelectionFlow() {
  document.body.classList.remove("is-intro-active");
  window.scrollTo(0, 0);
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
  });
}

let introCountdownTimer;

function startIntroReadCountdown() {
  let secondsRemaining = 5;
  window.clearInterval(introCountdownTimer);
  els.confirmIntro.disabled = true;
  els.introReadStatus.classList.remove("is-ready");
  els.introReadProgress.style.width = "0%";
  els.introCountdown.textContent = `请完整阅读，${secondsRemaining} 秒后可继续`;
  els.confirmIntro.textContent = `请阅读，${secondsRemaining} 秒后继续`;

  introCountdownTimer = window.setInterval(() => {
    secondsRemaining -= 1;
    els.introReadProgress.style.width = `${((5 - secondsRemaining) / 5) * 100}%`;
    if (secondsRemaining > 0) {
      els.introCountdown.textContent = `请完整阅读，${secondsRemaining} 秒后可继续`;
      els.confirmIntro.textContent = `请阅读，${secondsRemaining} 秒后继续`;
      return;
    }
    window.clearInterval(introCountdownTimer);
    els.confirmIntro.disabled = false;
    els.confirmIntro.textContent = "了解，开始选馆";
    els.introCountdown.textContent = "阅读完成，可以继续";
    els.introReadStatus.classList.add("is-ready");
  }, 1000);
}

els.enterApp?.addEventListener("click", () => {
  els.introHero.hidden = true;
  els.introNotice.hidden = false;
  els.introNotice.focus?.();
  startIntroReadCountdown();
});

els.confirmIntro?.addEventListener("click", () => {
  enterSelectionFlow();
});

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  generateRecommendations();
  els.recommendationPanel.hidden = false;
  document.querySelector(".workspace").classList.add("has-results");
  if (window.innerWidth < 900) {
    document.querySelector(".recommendation-panel").scrollIntoView({ behavior: "smooth" });
  }
});

els.locationInput.addEventListener("input", () => {
  state.userCoordinates = null;
  els.locationStatus.textContent = "将根据你输入的位置估算通勤时间";
  els.locationStatus.className = "field-help";
  hideRecommendations();
});

state.priorityOrder = Array.from(
  els.form.querySelectorAll('input[name="priority"]:checked'),
  (input) => input.value
);
renderPriorityRanks();

els.form.addEventListener("change", (event) => {
  if (event.target.matches('input[name="priority"]')) {
    updatePriorityOrder(event.target);
  }
  hideRecommendations();
});

els.locateButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    els.locationStatus.textContent = "当前浏览器不支持定位，请手动输入位置";
    els.locationStatus.className = "field-help is-error";
    return;
  }

  els.locateButton.disabled = true;
  els.locationStatus.textContent = "正在获取当前位置…";
  els.locationStatus.className = "field-help";
  navigator.geolocation.getCurrentPosition(
    (position) => {
      state.userCoordinates = [position.coords.longitude, position.coords.latitude];
      els.locationInput.value = "已获取当前位置";
      els.locationStatus.textContent = "定位成功，将据此估算通勤时间";
      els.locationStatus.className = "field-help is-success";
      els.locateButton.disabled = false;
      hideRecommendations();
    },
    () => {
      els.locationStatus.textContent = "定位未成功，请允许定位或手动输入位置";
      els.locationStatus.className = "field-help is-error";
      els.locateButton.disabled = false;
    },
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
  );
});

els.openCompare.addEventListener("click", renderComparison);
els.openTrust.classList.remove("is-acknowledged");
els.openTrust.addEventListener("click", () => {
  els.openTrust.classList.add("is-acknowledged");
  els.trustDialog.showModal();
});
els.ratingContent.addEventListener("click", (event) => {
  const sourceButton = event.target.closest("[data-rating-source]");
  if (sourceButton) {
    renderRatingDetail(sourceButton.dataset.venueId, sourceButton.dataset.ratingSource);
    return;
  }
  const backButton = event.target.closest("[data-rating-back]");
  if (backButton) renderRatingOverview(backButton.dataset.ratingBack);
});
els.galleryPrevious.addEventListener("click", () => updateGalleryPosition(state.galleryIndex - 1));
els.galleryNext.addEventListener("click", () => updateGalleryPosition(state.galleryIndex + 1));

let galleryScrollTimer;
els.galleryTrack.addEventListener("scroll", () => {
  window.clearTimeout(galleryScrollTimer);
  galleryScrollTimer = window.setTimeout(() => {
    if (!els.galleryTrack.clientWidth || !state.galleryVenue) return;
    const index = Math.round(els.galleryTrack.scrollLeft / els.galleryTrack.clientWidth);
    if (index !== state.galleryIndex) updateGalleryPosition(index, false);
  }, 80);
});

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => document.querySelector(`#${button.dataset.close}`).close());
});

[els.detailDialog, els.galleryDialog, els.crowdDialog, els.pricingDialog, els.ratingDialog, els.commuteDialog, els.compareDialog, els.trustDialog].forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});
