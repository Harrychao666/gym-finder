const venues = [
  {
    id: "luma",
    name: "Luma 24H 珠江训练仓",
    district: "珠江新城",
    type: "24小时健身房",
    monthlyPrice: 399,
    trialPrice: 39,
    coordinates: [113.3272, 23.1197],
    hours: "24 小时",
    crowd: { evening: "一般", morning: "宽松", weekend: "一般", flexible: "一般" },
    beginner: true,
    lowSales: true,
    equipment: 8,
    shower: true,
    open24: true,
    womenFriendly: true,
    image: "https://images.pexels.com/photos/29639963/pexels-photo-29639963.jpeg?auto=compress&cs=tinysrgb&w=1200",
    fit: "适合想自由安排时间、又不希望被频繁推销的新手。",
    caution: "夜间工作人员较少，第一次建议白天到店熟悉器械和门禁。",
    evidence: ["公开价目表", "工作日晚间试练", "达人现场照片"],
    updated: "2026-05-28"
  },
  {
    id: "fither",
    name: "FitHer 珠江女子馆",
    district: "珠江新城",
    type: "女性训练空间",
    monthlyPrice: 499,
    trialPrice: 59,
    coordinates: [113.3228, 23.1173],
    hours: "07:00–22:30",
    crowd: { evening: "宽松", morning: "宽松", weekend: "一般", flexible: "宽松" },
    beginner: true,
    lowSales: false,
    equipment: 6,
    shower: true,
    open24: false,
    womenFriendly: true,
    image: "https://images.pexels.com/photos/30021732/pexels-photo-30021732.jpeg?auto=compress&cs=tinysrgb&w=1200",
    fit: "适合在意训练氛围、希望获得基础器械讲解的女性新手。",
    caution: "会推荐私教小课包，先确认自由训练会员是否包含入门指导。",
    evidence: ["门店报价截图", "周末下午试练", "更衣区现场记录"],
    updated: "2026-05-24"
  },
  {
    id: "startfit",
    name: "StartFit 天体旗舰",
    district: "天河体育中心",
    type: "商业健身房",
    monthlyPrice: 459,
    trialPrice: 49,
    coordinates: [113.3214, 23.1364],
    hours: "06:30–23:00",
    crowd: { evening: "拥挤", morning: "宽松", weekend: "一般", flexible: "一般" },
    beginner: true,
    lowSales: false,
    equipment: 9,
    shower: true,
    open24: false,
    womenFriendly: true,
    image: "https://images.pexels.com/photos/17227606/pexels-photo-17227606.jpeg?auto=compress&cs=tinysrgb&w=1200",
    fit: "适合重视器械种类、能避开工作日晚高峰的人。",
    caution: "体验课后会持续跟进私教，办卡前要确认退转卡条款。",
    evidence: ["门店合同样本", "工作日晚高峰试练", "器械数量记录"],
    updated: "2026-05-30"
  },
  {
    id: "lightgym",
    name: "Light Gym 天河",
    district: "天河体育中心",
    type: "社区健身房",
    monthlyPrice: 299,
    trialPrice: 29,
    coordinates: [113.3278, 23.1412],
    hours: "07:00–23:00",
    crowd: { evening: "一般", morning: "宽松", weekend: "宽松", flexible: "宽松" },
    beginner: true,
    lowSales: true,
    equipment: 7,
    shower: false,
    open24: false,
    womenFriendly: true,
    image: "https://images.pexels.com/photos/4959807/pexels-photo-4959807.jpeg?auto=compress&cs=tinysrgb&w=1200",
    fit: "适合预算有限、以基础力量和有氧训练为主的新手。",
    caution: "没有独立淋浴区，重训器械数量也不算多。",
    evidence: ["前台公开报价", "工作日早晨试练", "达人现场记录"],
    updated: "2026-05-20"
  },
  {
    id: "powerbox",
    name: "PowerBox 琶洲",
    district: "琶洲",
    type: "力量训练馆",
    monthlyPrice: 520,
    trialPrice: 68,
    coordinates: [113.3697, 23.0988],
    hours: "08:00–23:30",
    crowd: { evening: "一般", morning: "宽松", weekend: "拥挤", flexible: "一般" },
    beginner: false,
    lowSales: true,
    equipment: 10,
    shower: true,
    open24: false,
    womenFriendly: false,
    image: "https://images.pexels.com/photos/29639963/pexels-photo-29639963.jpeg?auto=compress&cs=tinysrgb&w=1200",
    fit: "适合已经掌握基础动作、重视自由重量设备的人。",
    caution: "训练氛围偏硬核，完全零基础建议有人陪同试练。",
    evidence: ["公开月卡价格", "周末试练", "自由重量区盘点"],
    updated: "2026-05-18"
  },
  {
    id: "airfit",
    name: "AirFit 北京路 24",
    district: "北京路",
    type: "24小时健身房",
    monthlyPrice: 329,
    trialPrice: 35,
    coordinates: [113.2708, 23.1251],
    hours: "24 小时",
    crowd: { evening: "拥挤", morning: "宽松", weekend: "一般", flexible: "一般" },
    beginner: false,
    lowSales: true,
    equipment: 7,
    shower: true,
    open24: true,
    womenFriendly: true,
    image: "https://images.pexels.com/photos/4959807/pexels-photo-4959807.jpeg?auto=compress&cs=tinysrgb&w=1200",
    fit: "适合有基本训练计划、需要深夜或清晨训练的人。",
    caution: "自助运营为主，新手器械指导有限，晚高峰跑步机较紧张。",
    evidence: ["线上价目表", "晚间实地观察", "门禁流程记录"],
    updated: "2026-05-26"
  }
];

const state = {
  recommendations: [],
  compareIds: new Set(),
  userCoordinates: null
};

const districtCenters = {
  "珠江新城": [113.3219, 23.1192],
  "天河体育中心": [113.3244, 23.1349],
  "琶洲": [113.3667, 23.0987],
  "北京路": [113.2703, 23.1255],
  "番禺万博": [113.3475, 23.0051]
};

const els = {
  form: document.querySelector("#preferenceForm"),
  locationInput: document.querySelector("#locationInput"),
  locateButton: document.querySelector("#locateButton"),
  locationStatus: document.querySelector("#locationStatus"),
  trainingTime: document.querySelector("#trainingTime"),
  recommendationPanel: document.querySelector("#recommendationPanel"),
  resultSummary: document.querySelector("#resultSummary"),
  venueList: document.querySelector("#venueList"),
  compareBar: document.querySelector("#compareBar"),
  compareCount: document.querySelector("#compareCount"),
  compareNames: document.querySelector("#compareNames"),
  openCompare: document.querySelector("#openCompare"),
  detailDialog: document.querySelector("#detailDialog"),
  detailContent: document.querySelector("#detailContent"),
  compareDialog: document.querySelector("#compareDialog"),
  compareContent: document.querySelector("#compareContent")
};

function getPreferences() {
  const formData = new FormData(els.form);
  const location = String(formData.get("location") || "").trim();
  const district = state.userCoordinates
    ? findNearestDistrict(state.userCoordinates)
    : inferDistrict(location);
  return {
    location: location || "当前位置",
    district,
    coordinates: state.userCoordinates || districtCenters[district],
    commute: Number(formData.get("commute")),
    budget: Number(formData.get("budget")),
    trainingTime: formData.get("trainingTime"),
    priorities: formData.getAll("priority")
  };
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

function scoreVenue(venue, preferences) {
  let score = 0;
  if (venue.district === preferences.district) score += 35;
  else if (venue.estimatedCommute <= preferences.commute) score += 18;
  if (venue.monthlyPrice <= preferences.budget) score += 24;
  else score -= Math.min(18, Math.ceil((venue.monthlyPrice - preferences.budget) / 30));
  if (venue.estimatedCommute <= preferences.commute) score += 14;
  if (venue.crowd[preferences.trainingTime] === "宽松") score += 10;
  if (venue.crowd[preferences.trainingTime] === "拥挤") score -= 6;
  if (preferences.priorities.includes("beginner") && venue.beginner) score += 12;
  if (preferences.priorities.includes("sales") && venue.lowSales) score += 12;
  if (preferences.priorities.includes("crowd") && venue.crowd[preferences.trainingTime] !== "拥挤") score += 10;
  if (preferences.priorities.includes("equipment")) score += venue.equipment;
  if (preferences.priorities.includes("shower") && venue.shower) score += 8;
  if (preferences.priorities.includes("open24") && venue.open24) score += 12;
  return score;
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

function generateRecommendations() {
  const preferences = getPreferences();
  state.recommendations = [...venues]
    .map((venue) => ({
      ...venue,
      estimatedCommute: estimateCommute(preferences.coordinates, venue.coordinates)
    }))
    .map((venue) => ({ ...venue, matchScore: scoreVenue(venue, preferences) }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);

  state.compareIds.clear();
  els.resultSummary.textContent = `从${preferences.location}出发 · ${preferences.commute}分钟内 · 每月¥${preferences.budget}内`;
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
    const article = document.createElement("article");
    article.className = "venue-card";
    article.innerHTML = `
      <div class="venue-image">
        <img src="${venue.image}" alt="${venue.type}训练空间场景图" loading="lazy" referrerpolicy="no-referrer" />
        <span class="rank-label">${index === 0 ? "首选" : `候选 ${index + 1}`}</span>
      </div>
      <div class="venue-card-body">
        <div class="venue-title-row">
          <div>
            <p class="match-reason">${getMatchReason(venue, preferences, index)}</p>
            <h3>${venue.name}</h3>
            <p class="venue-meta">${venue.district} · ${venue.type}</p>
          </div>
          <label class="compare-toggle">
            <input type="checkbox" data-compare="${venue.id}" />
            <span>加入对比</span>
          </label>
        </div>

        <div class="facts-row">
          <div><strong>¥${venue.monthlyPrice}</strong><span>参考月费</span></div>
          <div><strong>${venue.estimatedCommute} 分钟</strong><span>通勤估算</span></div>
          <div><strong class="${crowdClass(venue.crowd[preferences.trainingTime])}">${venue.crowd[preferences.trainingTime]}</strong><span>常练时段</span></div>
        </div>

        <p class="fit-line"><strong>适合你：</strong>${venue.fit}</p>
        <div class="caution-line"><span>办卡前留意</span><p>${venue.caution}</p></div>

        <div class="card-footer">
          <span>信息更新于 ${venue.updated}</span>
          <button class="text-button detail-button" data-detail="${venue.id}" type="button">查看详情</button>
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

function showDetail(id) {
  const venue = venues.find((item) => item.id === id);
  els.detailContent.innerHTML = `
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
          <div><span>参考月费</span><strong>¥${venue.monthlyPrice}</strong></div>
          <div><span>单次试练</span><strong>¥${venue.trialPrice}</strong></div>
          <div><span>营业时间</span><strong>${venue.hours}</strong></div>
          <div><span>力量器械</span><strong>${venue.equipment}/10</strong></div>
        </div>
      </section>
      <section class="warning-panel">
        <p class="eyebrow">办卡前留意</p>
        <strong>${venue.caution}</strong>
      </section>
      <section>
        <p class="eyebrow">信息依据</p>
        <div class="evidence-list">${venue.evidence.map((item) => `<span>${item}</span>`).join("")}</div>
        <p class="source-note">最近核验：${venue.updated}。当前为访谈演示数据，不构成真实消费建议。</p>
      </section>
    </div>
  `;
  els.detailContent.querySelector(".detail-close").addEventListener("click", () => els.detailDialog.close());
  els.detailDialog.showModal();
}

function renderComparison() {
  const selected = state.recommendations.filter((venue) => state.compareIds.has(venue.id));
  const preferences = getPreferences();
  const rows = [
    ["参考月费", ...selected.map((venue) => `¥${venue.monthlyPrice}`)],
    ["通勤估算", ...selected.map((venue) => `${venue.estimatedCommute} 分钟`)],
    ["常练时段", ...selected.map((venue) => venue.crowd[preferences.trainingTime])],
    ["营业时间", ...selected.map((venue) => venue.hours)],
    ["新手指导", ...selected.map((venue) => venue.beginner ? "有" : "较少")],
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
  `;
  els.compareDialog.showModal();
}

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

els.form.addEventListener("change", hideRecommendations);

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

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => document.querySelector(`#${button.dataset.close}`).close());
});

[els.detailDialog, els.compareDialog].forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});
