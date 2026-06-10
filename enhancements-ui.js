if (typeof showGallery !== "function" && window.gymEnhancements) {
  const enhancement = window.gymEnhancements;
  const photoUrl = (id, width = 700) =>
    `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;

  Object.entries(enhancement.venues).forEach(([id, [rating, gallery]]) => {
    const venue = venues.find((item) => item.id === id);
    venue.rating = rating;
    venue.gallery = gallery.map(([photoId, caption]) => ({ src: photoUrl(photoId, 1600), caption }));
  });

  Object.assign(state, { galleryIndex: 0, galleryVenue: null });
  Object.assign(els, {
    galleryDialog: document.querySelector("#galleryDialog"),
    galleryTitle: document.querySelector("#galleryTitle"),
    galleryCounter: document.querySelector("#galleryCounter"),
    galleryTrack: document.querySelector("#galleryTrack"),
    galleryPrevious: document.querySelector("#galleryPrevious"),
    galleryNext: document.querySelector("#galleryNext")
  });

  renderRecommendations = function (preferences) {
    els.venueList.innerHTML = "";
    state.recommendations.forEach((venue, index) => {
      const article = document.createElement("article");
      article.className = "venue-card";
      article.innerHTML = `
        <button class="venue-image" data-gallery="${venue.id}" type="button" aria-label="查看 ${venue.name} 的场馆照片">
          <img src="${venue.image}" alt="${venue.type}训练空间场景图" loading="lazy" referrerpolicy="no-referrer" />
          <span class="rank-label">${index === 0 ? "首选" : `候选 ${index + 1}`}</span>
          <span class="photo-count"><span aria-hidden="true">▣</span> ${venue.gallery.length} 张</span>
        </button>
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
            <div><strong class="rating-value">${venue.rating}</strong><span>体验官评分</span></div>
          </div>
          <div class="caution-line"><span>办卡前留意</span><p>${venue.caution}</p></div>
          <div class="card-footer">
            <span>信息更新于 ${venue.updated}</span>
            <button class="text-button detail-button" data-detail="${venue.id}" type="button">查看详情</button>
          </div>
        </div>`;
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
  };

  showDetail = function (id) {
    const venue = venues.find((item) => item.id === id);
    const inventory = enhancement.inventory[venue.id];
    const equipmentGroups = enhancement.sections.map(([key, title, description]) => `
      <section class="equipment-group">
        <header><div><h4>${title}</h4><p>${description}</p></div><span>${inventory[key].length} 类</span></header>
        <div class="equipment-list">
          ${inventory[key].map(([equipmentId, quantity]) => {
            const [name, itemDescription, photoId] = enhancement.catalog[equipmentId];
            return `<article class="equipment-item">
              <img src="${photoUrl(photoId)}" alt="${name}" loading="lazy" referrerpolicy="no-referrer" />
              <div><div class="equipment-name"><strong>${name}</strong><span>${quantity}</span></div><p>${itemDescription}</p></div>
            </article>`;
          }).join("")}
        </div>
      </section>`).join("");

    els.detailContent.innerHTML = `
      <div class="detail-hero" style="background-image: linear-gradient(rgba(16, 25, 29, 0.1), rgba(16, 25, 29, 0.78)), url('${venue.image}')">
        <button class="icon-button detail-close" type="button" aria-label="关闭">×</button>
        <div><p>${venue.district} · ${venue.type}</p><h2>${venue.name}</h2></div>
      </div>
      <div class="detail-body">
        <section>
          <p class="eyebrow">快速判断</p><h3>${venue.fit}</h3>
          <div class="detail-facts">
            <div><span>参考月费</span><strong>¥${venue.monthlyPrice}</strong></div>
            <div><span>单次试练</span><strong>¥${venue.trialPrice}</strong></div>
            <div><span>营业时间</span><strong>${venue.hours}</strong></div>
            <div><span>体验官评分</span><strong>${venue.rating} / 10</strong></div>
          </div>
        </section>
        <section class="equipment-section">
          <div class="equipment-heading"><div><p class="eyebrow">器材清单</p><h3>这里有什么器械？</h3></div><span>按训练部位查看</span></div>
          <div class="equipment-groups">${equipmentGroups}</div>
          <p class="source-note">器材数量为访谈原型演示，正式数据需经门店或实地核验。</p>
        </section>
        <section class="warning-panel"><p class="eyebrow">办卡前留意</p><strong>${venue.caution}</strong></section>
        <section>
          <p class="eyebrow">信息依据</p>
          <div class="evidence-list">${venue.evidence.map((item) => `<span>${item}</span>`).join("")}</div>
          <p class="source-note">最近核验：${venue.updated}。当前为访谈演示数据，不构成真实消费建议。</p>
        </section>
      </div>`;
    els.detailContent.querySelector(".detail-close").addEventListener("click", () => els.detailDialog.close());
    els.detailDialog.showModal();
  };

  updateGalleryPosition = function (index, smooth = true) {
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
  };

  showGallery = function (id) {
    const venue = venues.find((item) => item.id === id);
    state.galleryVenue = venue;
    state.galleryIndex = 0;
    els.galleryTitle.textContent = venue.name;
    els.galleryTrack.innerHTML = venue.gallery.map((photo, index) => `
      <figure class="gallery-slide">
        <img src="${photo.src}" alt="${venue.name}：${photo.caption}" ${index === 0 ? "" : 'loading="lazy"'} referrerpolicy="no-referrer" />
        <figcaption>${photo.caption}</figcaption>
      </figure>`).join("");
    els.galleryDialog.showModal();
    requestAnimationFrame(() => updateGalleryPosition(0, false));
  };

  els.galleryPrevious.addEventListener("click", () => updateGalleryPosition(state.galleryIndex - 1));
  els.galleryNext.addEventListener("click", () => updateGalleryPosition(state.galleryIndex + 1));

  let galleryTimer;
  els.galleryTrack.addEventListener("scroll", () => {
    window.clearTimeout(galleryTimer);
    galleryTimer = window.setTimeout(() => {
      if (!els.galleryTrack.clientWidth || !state.galleryVenue) return;
      const index = Math.round(els.galleryTrack.scrollLeft / els.galleryTrack.clientWidth);
      if (index !== state.galleryIndex) updateGalleryPosition(index, false);
    }, 80);
  });

  els.galleryDialog.addEventListener("click", (event) => {
    if (event.target === els.galleryDialog) els.galleryDialog.close();
  });
}

(() => {
  const ratingDetails = {
    luma: [["价格透明", 9.0, 20, "月卡和短周期价格较清楚"], ["器械配置", 8.8, 25, "基础力量与有氧器械较完整"], ["拥挤体验", 8.2, 20, "晚八点力量区偶尔需要等位"], ["新手友好", 9.2, 20, "门禁和器械容易上手，推销较少"], ["卫生环境", 8.8, 15, "训练区和淋浴维护稳定"]],
    fither: [["价格透明", 8.5, 20, "自由训练与小课包需分别确认"], ["器械配置", 8.4, 25, "器械够用，自由重量相对有限"], ["拥挤体验", 9.2, 20, "晚高峰训练空间仍较宽松"], ["新手友好", 9.6, 20, "女性氛围友好并提供基础讲解"], ["卫生环境", 9.6, 15, "更衣区和公共区域反馈较好"]],
    startfit: [["价格透明", 8.2, 20, "退转卡和私教条款需要细看"], ["器械配置", 9.5, 25, "器械种类多，力量区配置完整"], ["拥挤体验", 7.4, 20, "工作日晚高峰热门器械需排队"], ["新手友好", 8.8, 20, "有基础指导，但销售跟进较积极"], ["卫生环境", 9.0, 15, "淋浴与更衣空间整体够用"]],
    lightgym: [["价格透明", 9.2, 20, "短周期价格清楚，月费压力较低"], ["器械配置", 7.4, 25, "基础训练够用，重训器械较少"], ["拥挤体验", 8.5, 20, "早晨宽松，晚间偶尔需要等位"], ["新手友好", 8.4, 20, "工作人员较少推销，指导有限"], ["卫生环境", 8.2, 15, "训练区整洁，但没有独立淋浴"]],
    powerbox: [["价格透明", 8.0, 20, "月卡信息明确，试练规则需确认"], ["器械配置", 9.8, 25, "自由重量和重训器械非常完整"], ["拥挤体验", 8.0, 20, "周末深蹲架等热门器械较紧张"], ["新手友好", 8.2, 20, "氛围直接，完全新手建议有人陪同"], ["卫生环境", 9.4, 15, "训练区域维护和清洁反馈较好"]],
    airfit: [["价格透明", 8.8, 20, "月卡规则简单，线上价格较清楚"], ["器械配置", 8.0, 25, "基础器械完整，热门有氧数量一般"], ["拥挤体验", 8.0, 20, "晚高峰跑步机偶尔需要等待"], ["新手友好", 8.0, 20, "自助流程清楚，但现场指导较少"], ["卫生环境", 8.3, 15, "整体整洁，深夜维护频率较低"]]
  };

  const venueIdByName = Object.fromEntries(venues.map((venue) => [venue.name, venue.id]));

  function dumbbells(score) {
    const active = Math.round(score / 2);
    return Array.from({ length: 5 }, (_, index) =>
      `<span class="dumbbell ${index < active ? "is-active" : ""}" aria-hidden="true"><i></i><b></b><i></i></span>`
    ).join("");
  }

  function ensureRatingDialog() {
    if (document.querySelector("#ratingDialog")) return;
    document.body.insertAdjacentHTML("beforeend", `
      <dialog id="ratingDialog" class="app-dialog rating-dialog" aria-labelledby="ratingTitle">
        <article>
          <header class="dialog-header">
            <div><p class="eyebrow">平台实测评分</p><h2 id="ratingTitle"></h2></div>
            <button class="icon-button" type="button" aria-label="关闭评分详情">×</button>
          </header>
          <div id="ratingContent" class="rating-dialog-content"></div>
        </article>
      </dialog>
    `);
    const dialog = document.querySelector("#ratingDialog");
    dialog.querySelector(".icon-button").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  function ensureCommuteDialog() {
    if (document.querySelector("#commuteDialog")) return;
    document.body.insertAdjacentHTML("beforeend", `
      <dialog id="commuteDialog" class="app-dialog commute-dialog" aria-labelledby="commuteTitle">
        <article>
          <header class="dialog-header">
            <div><p class="eyebrow">单程通勤估算</p><h2 id="commuteTitle"></h2></div>
            <button class="icon-button" type="button" aria-label="关闭通勤详情">×</button>
          </header>
          <div id="commuteContent" class="commute-dialog-content"></div>
        </article>
      </dialog>
    `);
    const dialog = document.querySelector("#commuteDialog");
    dialog.querySelector(".icon-button").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  function showEnhancedRating(id) {
    ensureRatingDialog();
    const venue = venues.find((item) => item.id === id);
    const dimensions = ratingDetails[id];
    const total = dimensions.reduce((sum, [, score, weight]) => sum + score * weight / 100, 0);
    const reviews = typeof venueReviews !== "undefined" ? venueReviews[id] : [];
    const consumerTotal = reviews.length
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : total;
    document.querySelector("#ratingTitle").textContent = venue.name;
    document.querySelector("#ratingContent").innerHTML = `
      <section class="rating-origin-note">
        <span>我们的核心评分</span>
        <strong>体验官费用由平台承担，并按统一标准到店实测。</strong>
        <p>消费者评价用于补充不同时间段和使用场景，不计入体验官主评分。</p>
      </section>
      <section class="rating-sources" aria-label="两类评分来源">
        <article class="rating-source rating-source-primary">
          <span class="rating-source-tag">核心依据</span>
          <h3>体验官评分</h3>
          <div class="rating-source-score"><strong>${(total / 2).toFixed(1)}</strong><small>/ 5</small></div>
          <div class="dumbbell-row" aria-label="体验官评分 ${(total / 2).toFixed(1)} 分，满分 5 分">${dumbbells(total)}</div>
          <p>统一查看价格、器械、拥挤、新手体验和卫生环境。</p>
        </article>
        <article class="rating-source">
          <span class="rating-source-tag">补充参考</span>
          <h3>消费者评分</h3>
          <div class="rating-source-score"><strong>${(consumerTotal / 2).toFixed(1)}</strong><small>/ 5</small></div>
          <p>来自 ${reviews.length || "演示"} 条体验样本，仅作为真实使用感受的补充，不参与主评分核算。</p>
        </article>
      </section>
      <section class="rating-dimensions" aria-label="体验官评分维度">
        <header class="rating-section-heading">
          <div><span>体验官测评</span><h3>主评分怎么得出？</h3></div>
          <small>满分 10 分</small>
        </header>
        ${dimensions.map(([label, score, weight, note]) => `
          <article class="rating-dimension">
            <div class="rating-dimension-heading">
              <div><strong>${label}</strong><span>权重 ${weight}%</span></div>
              <b>${score.toFixed(1)}</b>
            </div>
            <div class="rating-bar" aria-label="${label} ${score.toFixed(1)} 分"><span style="width:${score * 10}%"></span></div>
            <p>${note}</p>
          </article>
        `).join("")}
      </section>
      <section class="rating-method">
        <strong>怎么核算？</strong>
        <p>只使用体验官的五项实测得分，按对应权重相加，再除以 2 转换为 5 分制。消费者评分不会混入这个结果。</p>
        <code>${dimensions.map(([, score, weight]) => `${score.toFixed(1)}×${weight}%`).join(" + ")} = ${total.toFixed(1)}</code>
      </section>
      <p class="source-note">当前为访谈原型演示数据。正式上线后应展示体验官编号、到店日期、测评时段、消费凭证和最近核验日期。</p>
    `;
    document.querySelector("#ratingDialog").showModal();
  }

  function enhanceRatingCards() {
    document.querySelectorAll(".venue-card").forEach((card) => {
      if (card.querySelector("[data-rating], [data-enhanced-rating]")) return;
      const name = card.querySelector("h3")?.textContent.trim();
      const id = venueIdByName[name];
      const ratingValue = card.querySelector(".rating-value");
      const oldFact = ratingValue?.parentElement;
      if (!id || !oldFact) return;
      const score = Number(ratingValue.textContent);
      const button = document.createElement("button");
      button.className = "rating-fact enhanced-rating-fact";
      button.type = "button";
      button.dataset.enhancedRating = id;
      button.setAttribute("aria-label", `查看 ${name} 的评分构成`);
      button.innerHTML = `
        <span class="rating-score-line">
          <strong class="rating-value">${(score / 2).toFixed(1)}</strong>
          <small>/ 5</small>
        </span>
        <span class="rating-label">体验官实测</span>
      `;
      oldFact.replaceWith(button);
    });
  }

  function showEnhancedCommute(id) {
    ensureCommuteDialog();
    const venue = state.recommendations.find((item) => item.id === id);
    const preferences = getPreferences();
    const distance = distanceInKm(preferences.coordinates, venue.coordinates);
    document.querySelector("#commuteTitle").textContent = venue.name;
    document.querySelector("#commuteContent").innerHTML = `
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
    document.querySelector("#commuteDialog").showModal();
  }

  function enhanceCommuteCards() {
    document.querySelectorAll(".venue-card").forEach((card) => {
      if (card.querySelector("[data-commute], [data-enhanced-commute]")) return;
      const name = card.querySelector("h3")?.textContent.trim();
      const id = venueIdByName[name];
      const facts = card.querySelector(".facts-row");
      const oldFact = facts?.children[1];
      if (!id || !oldFact) return;
      const button = document.createElement("button");
      button.className = "commute-fact enhanced-commute-fact";
      button.type = "button";
      button.dataset.enhancedCommute = id;
      button.setAttribute("aria-label", `查看到 ${name} 的通勤时间`);
      button.innerHTML = oldFact.innerHTML;
      oldFact.replaceWith(button);
    });
  }

  function addReviewPhotoSlots() {
    document.querySelectorAll(".review-item").forEach((review) => {
      if (review.querySelector(".review-photos")) return;
      const date = review.querySelector("small");
      if (!date) return;
      date.insertAdjacentHTML("beforebegin", `
        <div class="review-photos" aria-label="体验照片演示位">
          ${[1, 2].map((index) => `
            <div class="review-photo-placeholder" role="img" aria-label="体验照片 ${index} 占位">
              <span aria-hidden="true">▧</span>
              <strong>体验照片 ${index}</strong>
              <small>正式版展示用户实拍</small>
            </div>
          `).join("")}
        </div>
      `);
    });
  }

  ensureRatingDialog();
  ensureCommuteDialog();
  enhanceRatingCards();
  enhanceCommuteCards();
  addReviewPhotoSlots();

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-enhanced-rating]");
    if (button) showEnhancedRating(button.dataset.enhancedRating);
    const commuteButton = event.target.closest("[data-enhanced-commute]");
    if (commuteButton) showEnhancedCommute(commuteButton.dataset.enhancedCommute);
  });

  const enhancementObserver = new MutationObserver(() => {
    enhanceRatingCards();
    enhanceCommuteCards();
    addReviewPhotoSlots();
  });
  enhancementObserver.observe(document.body, { childList: true, subtree: true });
})();
