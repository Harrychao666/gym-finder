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
            <div><strong class="rating-value">${venue.rating}</strong><span>综合评分</span></div>
          </div>
          <p class="fit-line"><strong>适合你：</strong>${venue.fit}</p>
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
            <div><span>综合评分</span><strong>${venue.rating} / 10</strong></div>
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
