const token = new URLSearchParams(location.search).get("token") || sessionStorage.getItem("gymAdminToken") || "";
if (token) sessionStorage.setItem("gymAdminToken", token);

const listElement = document.querySelector("#reportList");
const panel = document.querySelector("#reviewPanel");
const template = document.querySelector("#reviewTemplate");
const reportStats = document.querySelector("#reportStats");
const reportFilters = document.querySelector("#reportFilters");
const venueWorkspace = document.querySelector("#venueWorkspace");
const reviewWorkspace = document.querySelector("#reviewWorkspace");
const venueListElement = document.querySelector("#venueList");
const venuePanel = document.querySelector("#venuePanel");
const venueTemplate = document.querySelector("#venueTemplate");
let reports = [];
let activeReport = null;
let comparison = null;
let auditTrail = [];
let role = null;
let assignedVenueId = null;
let reviewerName = "";
let platformVenues = [];
let activeVenue = null;
let reportFilter = "action";

document.querySelector("#refreshButton").addEventListener("click", loadReports);
reportFilters.addEventListener("click", event => {
  const button = event.target.closest("[data-report-filter]");
  if (!button) return;
  reportFilter = button.dataset.reportFilter;
  reportFilters.querySelectorAll("button").forEach(item => item.classList.toggle("is-active", item === button));
  renderList();
});
document.querySelector("#reviewTab").addEventListener("click", () => switchWorkspace("review"));
document.querySelector("#venueTab").addEventListener("click", () => switchWorkspace("venues"));
initialize();

async function initialize() {
  if (!token) {
    listElement.innerHTML = '<p class="empty">链接缺少管理口令，请使用完整的审核员或平台管理员网址。</p>';
    document.querySelector("#roleBadge").textContent = "未登录";
    return;
  }
  try {
    const session = await api("/api/admin/session");
    role = session.role;
    assignedVenueId = session.venueId || null;
    reviewerName = session.reviewerName || "";
    applyRoleUi();
    await loadReports();
    if (role === "platform_admin") await switchWorkspace("venues");
  } catch (error) {
    listElement.innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`;
    document.querySelector("#roleBadge").textContent = "权限验证失败";
  }
}

function applyRoleUi() {
  const isPlatform = role === "platform_admin";
  document.body.classList.toggle("reviewer-mode", !isPlatform);
  document.title = isPlatform ? "练哪儿｜内容管理后台" : "练哪儿｜单馆审核工作台";
  document.querySelector("#roleBadge").textContent = isPlatform ? "平台管理员 · 全部权限" : `${reviewerName || "单馆审核员"} · 单馆权限`;
  document.querySelector("#permissionSummary").textContent = isPlatform
    ? "可审核报告、管理场馆资料、重新调用 AI、删除和下架内容。"
    : `当前只处理平台分配给你的这一家场馆${reviewerName ? `；审核身份：${reviewerName}` : ""}。其他场馆、平台配置和管理操作均不可见。`;
  document.querySelector("#workspaceEyebrow").textContent = isPlatform ? "练哪儿管理后台" : "练哪儿 · 单馆任务";
  document.querySelector("#workspaceTitle").textContent = isPlatform ? "内容运营台" : "单馆审核工作台";
  document.querySelector("#publicSiteLink").hidden = !isPlatform;
  document.querySelector("#reportAsideEyebrow").textContent = isPlatform ? "REPORTS" : "MY ASSIGNMENT";
  document.querySelector("#reportAsideTitle").textContent = isPlatform ? "待处理报告" : "本馆报告";
  document.querySelector("#venueAsideEyebrow").textContent = isPlatform ? "VENUES" : "ASSIGNED VENUE";
  document.querySelector("#venueAsideTitle").textContent = isPlatform ? "场馆资料库" : "我的场馆";
  document.querySelector("#venuePermissionSummary").textContent = isPlatform
    ? "体验官上传报告后会自动建档。打开标记为“待分配审核员”的档案，生成专属链接并发给审核员。"
    : "这里只显示你被分配的场馆。你可以补齐资料和图片，但不能上线、下架或访问其他场馆。";
  document.querySelector("#reviewTab").innerHTML = isPlatform
    ? "<strong>② 报告处理记录</strong><span>查看分析情况与处理结果</span>"
    : "<strong>① 核对体验报告</strong><span>检查证据、评分与风险</span>";
  document.querySelector("#venueTab").innerHTML = isPlatform
    ? "<strong>① 自动建档与分配审核员</strong><span>打开新档案并生成专属链接</span>"
    : "<strong>② 完善场馆资料</strong><span>补齐用户端展示信息</span>";
  document.querySelector("#reviewTab").style.order = isPlatform ? "2" : "1";
  document.querySelector("#venueTab").style.order = isPlatform ? "1" : "2";
  reportStats.hidden = !isPlatform;
  reportFilters.hidden = !isPlatform;
  document.querySelector("#workspaceTabs").hidden = false;
}

async function api(path, options = {}) {
  const headers = { "x-admin-token": token, ...(options.headers || {}) };
  if (typeof options.body === "string" && !headers["content-type"]) headers["content-type"] = "application/json";
  const response = await fetch(path, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || "请求失败");
    error.details = body.missing || body.comparison?.issues;
    error.status = response.status;
    throw error;
  }
  return body;
}

function switchWorkspace(target) {
  const venues = target === "venues";
  reviewWorkspace.hidden = venues;
  venueWorkspace.hidden = !venues;
  document.querySelector("#reviewTab").classList.toggle("is-active", !venues);
  document.querySelector("#venueTab").classList.toggle("is-active", venues);
  if (venues) return loadPlatformVenues();
}

async function loadReports() {
  try {
    const body = await api("/api/admin/reports");
    reports = body.reports;
    role = body.role || role;
    assignedVenueId = body.venueId || assignedVenueId;
    reviewerName = body.reviewerName || reviewerName;
    renderList();
    if (activeReport) {
      await openReport(activeReport.id);
    } else if (role === "reviewer" && reports.length) {
      const nextReport = reports.find(report => report.status === "needs_review")
        || reports.find(report => report.status !== "published")
        || reports[0];
      await openReport(nextReport.id);
    } else if (role === "reviewer") {
      renderReviewerEmptyState();
    }
  } catch (error) {
    listElement.innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`;
  }
}

function renderReviewerEmptyState() {
  panel.innerHTML = '<div class="empty-state reviewer-empty"><strong>当前没有需要核对的报告</strong><p>你仍然可以完善这家场馆的地址、营业时间和图片。</p><button id="goVenueButton" type="button">前往完善场馆资料</button></div>';
  panel.querySelector("#goVenueButton").addEventListener("click", () => switchWorkspace("venues"));
}

function renderList() {
  const actionCount = reports.filter(report => report.status !== "published").length;
  const failedCount = reports.filter(report => report.status === "analysis_failed").length;
  reportStats.innerHTML = `<article><strong>${actionCount}</strong><span>待处理</span></article><article><strong>${failedCount}</strong><span>需先修复</span></article>`;
  if (!reports.length) {
    listElement.innerHTML = '<p class="empty">还没有体验官上传报告。</p>';
    return;
  }
  const visibleReports = role === "reviewer" ? reports : reports.filter(report => {
    if (reportFilter === "all") return true;
    if (reportFilter === "action") return report.status !== "published";
    return report.status === reportFilter;
  });
  if (!visibleReports.length) {
    listElement.innerHTML = '<p class="empty">这个筛选条件下没有报告。</p>';
    return;
  }
  listElement.innerHTML = visibleReports.map(report => `<button class="report-item ${activeReport?.id === report.id ? "is-active" : ""}" data-id="${escapeAttribute(report.id)}"><span class="report-item-top"><strong>${escapeHtml(report.venueName || report.analysis?.venueName || "待命名场馆")}</strong><i class="status-dot status-${escapeAttribute(report.status)}"></i></span><span>${statusText(report.status)} · ${escapeHtml(report.evaluatorName || "未填写体验官")}</span><small>${new Date(report.createdAt).toLocaleString("zh-CN")}</small></button>`).join("");
  listElement.querySelectorAll("[data-id]").forEach(button => button.addEventListener("click", () => openReport(button.dataset.id)));
}

async function openReport(id) {
  try {
    const body = await api(`/api/admin/reports/${encodeURIComponent(id)}`);
    activeReport = body.report;
    comparison = body.comparison;
    auditTrail = body.auditTrail || [];
    renderList();
    renderReview();
  } catch (error) {
    showPanelError(error.message);
  }
}

function renderReview() {
  panel.innerHTML = "";
  panel.append(template.content.cloneNode(true));
  const report = activeReport;
  const draft = report.venueDraft || {};
  panel.querySelectorAll(".platform-only").forEach(element => { element.hidden = role !== "platform_admin"; });
  panel.querySelector("#statusBadge").textContent = statusText(report.status);
  panel.querySelector("#reportTitle").textContent = draft.name || report.venueName || "待命名场馆";
  panel.querySelector("#reportMeta").textContent = `${report.evaluatorName || "未填写体验官"} · ${report.originalName} · ${(report.fileSize / 1024 / 1024).toFixed(2)} MB`;
  panel.querySelector("#auditCount").textContent = auditTrail.length;
  const notice = panel.querySelector("#systemNotice");
  if (report.analysisMode === "openai") {
    notice.classList.add("is-openai");
    notice.textContent = `OpenAI 已完成结构化总结（${report.analysisModel}）。请核对事实、图片和同馆差异后再发布。`;
  } else if (report.analysisMode === "test-fixture") {
    notice.classList.add("is-test");
    notice.textContent = "测试审核草稿：未调用 OpenAI，所有评分与场馆信息均为虚构。完成发布后只会保存在隔离测试记录中，不会显示给用户。";
  } else if (report.status === "analysis_failed") notice.textContent = `自动分析失败：${report.analysisError || "未知原因"}。平台管理员可以检查配置后重新分析。`;
  else notice.textContent = "报告已提取；请人工核对营业时间、地址和图片等基础资料。";

  renderComparison(panel.querySelector("#comparisonDetails"), comparison);
  renderAuditTrail(panel.querySelector("#auditTrail"), auditTrail);
  const form = panel.querySelector("#venueForm");
  const hasDraft = hasReviewDraft(draft);
  panel.querySelector("#reviewContent").hidden = !hasDraft;
  fillForm(form, { ...draft, reviewNotes: report.reviewNotes || "" });
  renderGalleryEditor(panel.querySelector("#galleryEditor"), draft.gallery || [], form);
  panel.querySelector("#venueImageInput").addEventListener("change", event => uploadReviewImages(event.target.files));

  const details = report.analysis || {};
  renderScoreCard(panel.querySelector("#scoreCard"), draft);
  panel.querySelector("#analysisDetails").innerHTML = `<strong>AI文字提取把握：${details.confidence ?? "—"}%（不参与场馆评分）</strong><p>缺失：${escapeHtml((details.missingItems || []).join("；") || "无")}</p><p>风险：${escapeHtml((details.riskTags || []).join("；") || "未识别到独立风险")}</p><p>${escapeHtml(details.summary || "暂无 AI 总结")}</p>`;
  panel.querySelector("#sourceText").textContent = report.extractedText || "";
  panel.querySelector("#saveButton").addEventListener("click", saveDraft);
  panel.querySelector("#downloadReportButton").addEventListener("click", downloadOriginalReport);
  panel.querySelector("#reanalyzeButton").addEventListener("click", reanalyze);
  panel.querySelector("#testAnalyzeButton").addEventListener("click", createTestDraft);
  panel.querySelector("#deleteReportButton").addEventListener("click", deleteReport);
  panel.querySelector("#rejectButton").addEventListener("click", rejectReport);
  panel.querySelector("#publishButton").addEventListener("click", publish);
  if (role === "reviewer") {
    panel.querySelector("#saveButton").textContent = "保存本次核对";
    panel.querySelector("#rejectButton").textContent = "退回补充材料";
    panel.querySelector("#publishButton").textContent = "完成审核并发布";
  }
  form.addEventListener("input", updateReviewProgress);
  updateReviewProgress();
}

function hasReviewDraft(draft) {
  return Boolean(draft && (Array.isArray(draft.scoreModules) || draft.name || draft.experienceScore !== undefined));
}

function getPublishChecks(draft) {
  const gates = draft.publicationGates || {};
  const useful = value => Boolean(String(value ?? "").trim()) && !/待补充|待核实/.test(String(value));
  return [
    { label: "场馆名称已确认", passed: useful(draft.name), selector: '[name="name"]' },
    { label: "所在区域已确认", passed: useful(draft.district), selector: '[name="district"]' },
    { label: "营业时间已补齐", passed: useful(draft.hours), selector: '[name="hours"]' },
    { label: "详细地址已补齐", passed: useful(draft.contact?.address), selector: '[name="contact.address"]' },
    { label: "场馆主图已提供", passed: useful(draft.image), selector: "#venueImageInput" },
    { label: "适合人群已核对", passed: useful(draft.fit), selector: '[name="fit"]' },
    { label: "注意事项已核对", passed: useful(draft.caution), selector: '[name="caution"]' },
    { label: "体验总分已自动生成", passed: Number.isFinite(Number(draft.experienceScore)) && Number(draft.experienceScore) >= 0 && Number(draft.experienceScore) <= 100, selector: "#scoreCard" },
    { label: "4次训练要求通过", passed: Boolean(gates.trainingComplete), selector: "#scoreCard" },
    { label: "六模块必填项通过", passed: Boolean(gates.requiredComplete), selector: "#scoreCard" },
    { label: "证据可信度达到B级", passed: Boolean(gates.confidencePassed), selector: "#scoreCard" },
    { label: "严重风险已二次核验", passed: !gates.riskReviewRequired || Boolean(draft.riskReviewed), selector: '[name="riskReviewed"]' }
  ];
}

function updateReviewProgress() {
  if (!activeReport) return;
  const form = panel.querySelector("#venueForm");
  const storedDraft = activeReport.venueDraft || {};
  const hasDraft = hasReviewDraft(storedDraft);
  const draft = hasDraft && form ? readForm(form, storedDraft) : storedDraft;
  const checks = hasDraft ? getPublishChecks(draft) : [];
  const completed = checks.filter(check => check.passed).length;
  const ready = hasDraft && checks.length > 0 && completed === checks.length;
  const published = activeReport.status === "published";
  const steps = [
    { label: "报告已上传", done: true },
    { label: "生成审核草稿", done: hasDraft },
    { label: "核对必填项", done: ready },
    { label: "完成发布", done: published }
  ];
  const currentIndex = published ? 3 : ready ? 3 : hasDraft ? 2 : 1;
  panel.querySelector("#workflowGuide").innerHTML = steps.map((step, index) => `<div class="${step.done ? "is-done" : ""} ${index === currentIndex ? "is-current" : ""}"><span>${step.done ? "✓" : index + 1}</span><strong>${step.label}</strong></div>`).join("");

  const checklist = panel.querySelector("#publishChecklist");
  if (hasDraft) {
    checklist.innerHTML = `<div><small>发布检查</small><h3>${ready ? "发布条件已满足" : `还差 ${checks.length - completed} 项`}</h3><p>系统会随着你填写内容自动更新。</p></div><div class="checklist-items">${checks.map(check => `<span class="${check.passed ? "is-pass" : "is-missing"}">${check.passed ? "✓" : "○"} ${escapeHtml(check.label)}</span>`).join("")}</div>`;
  }

  const nextAction = panel.querySelector("#nextActionCard");
  if (published) {
    nextAction.innerHTML = '<div><small>当前状态</small><h3>这份报告已经处理完成</h3><p>需要检查修改记录或原始材料时，再展开下方的次要信息。</p></div><span class="done-mark">✓</span>';
  } else if (!hasDraft) {
    nextAction.innerHTML = role === "platform_admin"
      ? '<div><small>现在只做这一步</small><h3>先生成一份可审核的草稿</h3><p>可以用免费虚构数据跑通流程；配额恢复后再调用 AI 重新分析。</p></div><div class="next-action-buttons"><button data-workflow-action="test" type="button">生成免费测试草稿</button><button class="secondary" data-workflow-action="ai" type="button">调用 AI 重新分析</button></div>'
      : '<div><small>需要平台管理员处理</small><h3>这份报告还没有审核草稿</h3><p>请联系平台管理员重新分析，完成后你再继续核对。</p></div>';
  } else if (!ready) {
    const firstMissing = checks.find(check => !check.passed);
    nextAction.innerHTML = `<div><small>现在只做这一步</small><h3>补齐发布前检查</h3><p>已完成 ${completed}/${checks.length} 项，先处理“${escapeHtml(firstMissing.label)}”。</p></div><button data-workflow-action="missing" data-selector="${escapeAttribute(firstMissing.selector)}" type="button">去处理这一项</button>`;
  } else {
    nextAction.innerHTML = `<div><small>下一步</small><h3>${activeReport.venueDraft?.testMode ? "完成隔离测试发布" : "填写审核备注后发布"}</h3><p>${activeReport.venueDraft?.testMode ? "测试记录不会展示给真实用户。" : "发布前最后检查一次修改依据和风险核验。"}</p></div><button data-workflow-action="decision" type="button">前往审核结论</button>`;
  }
  nextAction.querySelector('[data-workflow-action="test"]')?.addEventListener("click", createTestDraft);
  nextAction.querySelector('[data-workflow-action="ai"]')?.addEventListener("click", reanalyze);
  nextAction.querySelector('[data-workflow-action="decision"]')?.addEventListener("click", () => scrollToReviewTarget("#decisionSection"));
  nextAction.querySelector('[data-workflow-action="missing"]')?.addEventListener("click", event => scrollToReviewTarget(event.currentTarget.dataset.selector));
}

function scrollToReviewTarget(selector) {
  const target = panel.querySelector(selector);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  if (typeof target.focus === "function") setTimeout(() => target.focus({ preventScroll: true }), 350);
}

async function downloadOriginalReport() {
  try {
    const response = await fetch(`/api/admin/reports/${encodeURIComponent(activeReport.id)}/file`, { headers: { "x-admin-token": token } });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || "原始报告下载失败");
    }
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = activeReport.originalName || "体验官报告.docx";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  } catch (error) { toast(error.message, true); }
}

function renderScoreCard(target, draft) {
  const modules = Array.isArray(draft.scoreModules) ? draft.scoreModules : [];
  const gates = draft.publicationGates || {};
  const gateRows = [
    ["4次训练且含工作日晚高峰", gates.trainingComplete],
    ["六模块必填项完整", gates.requiredComplete],
    ["证据可信度至少B级", gates.confidencePassed],
    ["严重风险已处理", !gates.riskReviewRequired || draft.riskReviewed]
  ];
  target.innerHTML = `<header><div><small>评分机制 V1.2</small><h3>系统固定计算结果</h3></div><div class="score-total"><strong>${draft.experienceScore ?? "—"}</strong><span>/ 100</span></div><div class="confidence-total"><strong>${draft.evidenceConfidence ?? "—"}%</strong><span>${escapeHtml(draft.confidenceGrade || "—")}级可信度</span></div></header>
    <div class="module-grid">${modules.map(module => `<article><div><strong>${escapeHtml(module.label)}</strong><span>${module.points === null ? "暂不出分" : `${module.points}/${module.max}`}</span></div><p>${escapeHtml(module.note || "")}</p></article>`).join("") || "<p>请由平台管理员重新分析这份旧报告，以生成V1.2固定评分。</p>"}</div>
    <div class="gate-grid">${gateRows.map(([label, passed]) => `<span class="${passed ? "is-pass" : "is-blocked"}">${passed ? "✓" : "×"} ${escapeHtml(label)}</span>`).join("")}</div>
    ${(gates.blockers || []).length ? `<p class="score-blockers">当前阻断：${escapeHtml(gates.blockers.join("；"))}</p>` : ""}`;
}

function renderComparison(target, result) {
  if (!result?.hasComparison) {
    target.innerHTML = '<span class="comparison-neutral">暂时没有同一场馆的第二份报告，请审核员重点人工核对。</span>';
    return;
  }
  if (result.severeConflict) {
    target.innerHTML = `<strong class="comparison-risk">发现明显差异，审核员不能直接发布</strong><ul>${result.issues.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
    return;
  }
  target.innerHTML = `<strong class="comparison-ok">已对比 ${result.comparedReports.length} 份同馆报告，未发现阻断发布的明显差异。</strong>`;
}

function renderAuditTrail(target, entries) {
  if (!entries?.length) {
    target.innerHTML = '<span class="comparison-neutral">尚无人工修改记录。首条记录会在保存审核草稿后出现。</span>';
    return;
  }
  target.innerHTML = `<ol class="audit-list">${entries.map(entry => {
    const fields = (entry.changes || []).map(change => change.field).slice(0, 5);
    const more = (entry.changes || []).length > fields.length ? ` 等 ${entry.changes.length} 项` : "";
    const detail = fields.length ? `修改：${fields.join("、")}${more}` : "未改变展示字段";
    return `<li><strong>${escapeHtml(entry.action)}</strong><span>${escapeHtml(entry.actorName || "审核员")} · ${new Date(entry.createdAt).toLocaleString("zh-CN")}</span><p>${escapeHtml(detail)}${entry.note ? `；依据：${escapeHtml(entry.note)}` : ""}</p></li>`;
  }).join("")}</ol>`;
}

function fillForm(form, draft) {
  const flat = {
    ...draft,
    "crowd.evening": draft.crowd?.evening,
    "crowd.morning": draft.crowd?.morning,
    "crowd.weekend": draft.crowd?.weekend,
    "crowd.flexible": draft.crowd?.flexible,
    "contact.phone": draft.contact?.phone,
    "contact.address": draft.contact?.address,
    "contact.nearestStation": draft.contact?.nearestStation,
    "contact.booking": draft.contact?.booking,
    longitude: draft.coordinates?.[0],
    latitude: draft.coordinates?.[1],
    highlights: (draft.highlights || []).join("\n"),
    evidence: (draft.evidence || []).join("\n"),
    additionalFees: (draft.additionalFees || []).join("\n")
  };
  for (const element of form.elements) {
    if (!element.name) continue;
    if (element.type === "checkbox") element.checked = Boolean(flat[element.name]);
    else element.value = flat[element.name] ?? "";
  }
}

function readForm(form, current = {}) {
  const value = name => form.elements.namedItem(name)?.value.trim() || "";
  const optionalValue = name => {
    const element = form.elements.namedItem(name);
    return element ? element.value.trim() : undefined;
  };
  const checked = name => form.elements.namedItem(name)?.checked || false;
  const gallery = Array.isArray(current.gallery) ? current.gallery : [];
  return {
    ...current,
    name: value("name"), district: value("district"), type: value("type"), category: value("category"),
    monthlyPrice: value("monthlyPrice"), trialPrice: value("trialPrice"),
    weeklyPrice: optionalValue("weeklyPrice") ?? current.weeklyPrice ?? 0,
    annualPrice: optionalValue("annualPrice") ?? current.annualPrice ?? 0,
    hours: value("hours"), testedAt: optionalValue("testedAt") || current.testedAt || new Date().toISOString().slice(0, 10),
    rating: optionalValue("rating") ?? current.rating ?? 0, equipment: optionalValue("equipment") ?? current.equipment ?? 0, image: value("image"), gallery,
    crowd: {
      ...(current.crowd || {}),
      morning: optionalValue("crowd.morning") || current.crowd?.morning || "一般",
      evening: optionalValue("crowd.evening") || current.crowd?.evening || "一般",
      weekend: optionalValue("crowd.weekend") || current.crowd?.weekend || "一般",
      flexible: optionalValue("crowd.flexible") || current.crowd?.flexible || "一般"
    },
    highlights: value("highlights").split(/\n+/).map(item => item.trim()).filter(Boolean).slice(0, 5),
    fit: value("fit") || current.fit || "", caution: value("caution") || current.caution || "",
    evidence: value("evidence").split(/\n+/).map(item => item.trim()).filter(Boolean),
    additionalFees: (optionalValue("additionalFees") ?? (current.additionalFees || []).join("\n")).split(/\n+/).map(item => item.trim()).filter(Boolean).slice(0, 12),
    beginner: checked("beginner"), lowSales: checked("lowSales"), shower: checked("shower"), cleanEnvironment: checked("cleanEnvironment"), open24: checked("open24"), womenFriendly: checked("womenFriendly"), nightSafety: checked("nightSafety"), riskReviewed: checked("riskReviewed"),
    coordinates: value("longitude") && value("latitude")
      ? [Number(value("longitude")), Number(value("latitude"))]
      : (Array.isArray(current.coordinates) ? current.coordinates : []),
    contact: {
      ...(current.contact || {}),
      phone: value("contact.phone"), address: value("contact.address"), nearestStation: value("contact.nearestStation"), booking: value("contact.booking") || current.contact?.booking || "到店前请联系场馆确认开放和试练安排。"
    }
  };
}

function renderGalleryEditor(container, gallery, form) {
  const items = Array.isArray(gallery) ? gallery : [];
  if (!items.length) {
    container.innerHTML = '<p class="empty gallery-empty">还没有上传场馆图片。</p>';
    return;
  }
  container.innerHTML = items.map((item, index) => `<article class="gallery-item"><img src="${escapeAttribute(item.src)}" alt="场馆图片 ${index + 1}" /><div><input data-caption="${index}" value="${escapeAttribute(item.caption || "场馆实拍")}" aria-label="图片说明" /><button class="mini secondary" data-main-photo="${index}" type="button">设为主图</button><button class="mini danger" data-remove-photo="${index}" type="button">删除</button></div></article>`).join("");
  container.querySelectorAll("[data-caption]").forEach(input => input.addEventListener("change", () => { items[Number(input.dataset.caption)].caption = input.value.trim() || "场馆实拍"; }));
  container.querySelectorAll("[data-main-photo]").forEach(button => button.addEventListener("click", () => {
    form.elements.namedItem("image").value = items[Number(button.dataset.mainPhoto)].src;
    if (form.id === "platformVenueForm") { renderPlatformCardPreview(); platformToast("已设为主图"); }
    else toast("已设为主图");
  }));
  container.querySelectorAll("[data-remove-photo]").forEach(button => button.addEventListener("click", () => {
    const index = Number(button.dataset.removePhoto);
    const removed = items.splice(index, 1)[0];
    if (form.elements.namedItem("image").value === removed?.src) form.elements.namedItem("image").value = items[0]?.src || "";
    renderGalleryEditor(container, items, form);
    if (form.id === "platformVenueForm") renderPlatformCardPreview();
  }));
}

async function uploadFiles(files, scope) {
  const uploaded = [];
  for (const file of Array.from(files || [])) {
    const response = await fetch(`/api/admin/media?name=${encodeURIComponent(file.name)}&scope=${encodeURIComponent(scope)}`, {
      method: "POST",
      headers: { "x-admin-token": token, "content-type": file.type || "application/octet-stream" },
      body: file
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `图片 ${file.name} 上传失败`);
    uploaded.push(body.image);
  }
  return uploaded;
}

async function uploadReviewImages(files) {
  if (!files?.length) return;
  setButtons(true);
  try {
    const uploaded = await uploadFiles(files, activeReport.id);
    activeReport.venueDraft = activeReport.venueDraft || {};
    activeReport.venueDraft.gallery = [...(activeReport.venueDraft.gallery || []), ...uploaded].slice(0, 12);
    if (!activeReport.venueDraft.image) activeReport.venueDraft.image = uploaded[0]?.src || "";
    fillForm(panel.querySelector("#venueForm"), { ...activeReport.venueDraft, reviewNotes: activeReport.reviewNotes || "" });
    renderGalleryEditor(panel.querySelector("#galleryEditor"), activeReport.venueDraft.gallery, panel.querySelector("#venueForm"));
    toast(`已上传 ${uploaded.length} 张图片，请保存审核草稿`);
  } catch (error) { toast(error.message, true); }
  finally { setButtons(false); }
}

async function saveDraft({ quiet = false } = {}) {
  setButtons(true);
  try {
    const form = panel.querySelector("#venueForm");
    const venueDraft = readForm(form, activeReport.venueDraft || {});
    const reviewNotes = form.elements.namedItem("reviewNotes")?.value.trim() || "";
    const response = await api(`/api/admin/reports/${encodeURIComponent(activeReport.id)}`, { method: "PATCH", body: JSON.stringify({ venueDraft, reviewNotes }) });
    activeReport = response.report;
    auditTrail = response.auditTrail || auditTrail;
    renderAuditTrail(panel.querySelector("#auditTrail"), auditTrail);
    panel.querySelector("#auditCount").textContent = auditTrail.length;
    updateReviewProgress();
    if (!quiet) toast("审核草稿已保存");
    return true;
  } catch (error) { toast(error.message, true); return false; }
  finally { setButtons(false); }
}

async function reanalyze() {
  if (!confirm("重新分析会覆盖当前 AI 草稿，确定继续吗？")) return;
  setButtons(true);
  try {
    activeReport = (await api(`/api/admin/reports/${encodeURIComponent(activeReport.id)}/reanalyze`, { method: "POST" })).report;
    await openReport(activeReport.id);
    toast("重新分析完成");
  } catch (error) { toast(error.message, true); }
  finally { setButtons(false); }
}

async function createTestDraft() {
  if (!confirm("这会用一套明确标注为虚构的测试数据覆盖当前分析草稿；不会调用 OpenAI，也不会显示给用户。确定继续吗？")) return;
  setButtons(true);
  try {
    activeReport = (await api(`/api/admin/reports/${encodeURIComponent(activeReport.id)}/test-analyze`, { method: "POST" })).report;
    await openReport(activeReport.id);
    toast("测试审核草稿已生成，可继续验证审核与发布流程");
  } catch (error) { toast(error.message, true); }
  finally { setButtons(false); }
}

async function deleteReport() {
  if (!confirm("确定永久删除这份未发布报告及其原文件吗？")) return;
  try {
    await api(`/api/admin/reports/${encodeURIComponent(activeReport.id)}`, { method: "DELETE" });
    activeReport = null;
    panel.innerHTML = '<div class="empty-state"><strong>报告已删除</strong><p>请选择其他报告。</p></div>';
    await loadReports();
  } catch (error) { toast(error.message, true); }
}

async function rejectReport() {
  const notes = panel.querySelector("#venueForm").elements.namedItem("reviewNotes")?.value.trim() || "";
  if (!notes) { toast("请先填写退回原因", true); return; }
  if (!confirm("确认退回这份报告并要求补充吗？")) return;
  try {
    activeReport = (await api(`/api/admin/reports/${encodeURIComponent(activeReport.id)}/reject`, { method: "POST", body: JSON.stringify({ notes }) })).report;
    await loadReports();
    toast("已退回补充");
  } catch (error) { toast(error.message, true); }
}

async function publish() {
  const testMode = Boolean(activeReport?.venueDraft?.testMode);
  if (!confirm(testMode ? "确认完成测试发布吗？该记录会被隔离，不会显示给用户。" : "确认审核通过，并将当前内容发布到用户前端吗？")) return;
  if (!await saveDraft({ quiet: true })) return;
  setButtons(true);
  try {
    const response = await api(`/api/admin/reports/${encodeURIComponent(activeReport.id)}/publish`, { method: "POST", body: JSON.stringify({ overrideConflict: false }) });
    toast(response.testPublication ? "测试发布完成：记录已隔离，不会显示给用户" : "发布成功，用户前端刷新后即可读取新内容");
    await loadReports();
  } catch (error) {
    if (error.status === 409 && role === "platform_admin" && confirm(`${error.message}\n${(error.details || []).join("\n")}\n\n是否以平台管理员身份强制发布？`)) {
      try {
        await api(`/api/admin/reports/${encodeURIComponent(activeReport.id)}/publish`, { method: "POST", body: JSON.stringify({ overrideConflict: true }) });
        toast("平台管理员已确认差异并发布");
        await loadReports();
        return;
      } catch (overrideError) { toast(overrideError.message, true); return; }
    }
    toast(`${error.message}${error.details?.length ? `：${error.details.join("、")}` : ""}`, true);
  } finally { setButtons(false); }
}

async function loadPlatformVenues() {
  try {
    const body = await api("/api/platform/venues");
    platformVenues = body.venues;
    assignedVenueId = body.venueId || assignedVenueId;
    renderVenueList();
    if (activeVenue?.id) {
      const refreshed = platformVenues.find(item => item.id === activeVenue.id);
      if (refreshed) openPlatformVenue(refreshed);
    } else if (role === "reviewer" && platformVenues[0]) {
      openPlatformVenue(platformVenues[0]);
    } else if (role === "platform_admin") {
      const nextArchive = platformVenues.find(item => !item.visible && !item.reviewer && item.source === "evaluator_upload");
      if (nextArchive) openPlatformVenue(nextArchive);
    }
  } catch (error) { venueListElement.innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`; }
}

function renderVenueList() {
  if (!platformVenues.length) { venueListElement.innerHTML = `<p class="empty">${role === "platform_admin" ? "还没有档案。体验官上传第一份报告后会自动出现在这里。" : "当前没有可访问的场馆，请联系平台管理员。"}</p>`; return; }
  venueListElement.innerHTML = platformVenues.map(venue => {
    const workflowStatus = venue.visible
      ? "已上线"
      : venue.reviewer
        ? `已分配 · ${venue.reviewer.name}`
        : venue.source === "evaluator_upload"
          ? "新档案 · 待分配审核员"
          : "草稿 · 未分配审核员";
    const isNewArchive = !venue.visible && !venue.reviewer && venue.source === "evaluator_upload";
    return `<button class="report-item ${activeVenue?.id === venue.id ? "is-active" : ""} ${isNewArchive ? "is-new-archive" : ""}" data-venue-id="${escapeAttribute(venue.id)}"><strong>${escapeHtml(venue.name || "待命名场馆")}</strong><span>${escapeHtml(workflowStatus)} · ${escapeHtml(venue.district || "未填写区域")}</span><small>${escapeHtml(venue.hours || "未填写营业时间")}</small></button>`;
  }).join("");
  venueListElement.querySelectorAll("[data-venue-id]").forEach(button => button.addEventListener("click", () => openPlatformVenue(platformVenues.find(item => item.id === button.dataset.venueId))));
}

function openPlatformVenue(venue) {
  if (!venue) return;
  activeVenue = JSON.parse(JSON.stringify(venue));
  renderVenueList();
  venuePanel.innerHTML = "";
  venuePanel.append(venueTemplate.content.cloneNode(true));
  venuePanel.querySelectorAll(".platform-only").forEach(element => { element.hidden = role !== "platform_admin"; });
  venuePanel.querySelector("#venueTitle").textContent = activeVenue.name || "待命名场馆档案";
  venuePanel.querySelector("#venueVisibility").textContent = activeVenue.id
    ? (activeVenue.visible ? "已上线" : activeVenue.reviewer ? "已分配审核员" : activeVenue.source === "evaluator_upload" ? "新档案 · 待分配" : "草稿 · 未分配")
    : "草稿";
  if (role === "reviewer") {
    venuePanel.querySelector("#venueIntro").textContent = "这里只显示你负责的场馆。请补齐用户真正会看到的基础资料，保存后再返回报告审核。";
  } else if (activeVenue.source === "evaluator_upload") {
    venuePanel.querySelector("#venueIntro").textContent = activeVenue.reviewer
      ? "这份档案由体验官报告自动建立，审核员已分配。你可以重新生成链接或查看处理状态。"
      : "这份档案由体验官报告自动建立。下一步只需生成审核员链接；场馆资料由审核员核对并发布。";
  }
  const form = venuePanel.querySelector("#platformVenueForm");
  fillForm(form, activeVenue);
  renderPlatformGallery();
  renderPlatformCardPreview();
  form.addEventListener("input", renderPlatformCardPreview);
  venuePanel.querySelector("#platformImageInput").addEventListener("change", event => uploadPlatformImages(event.target.files));
  venuePanel.querySelector("#venueSaveButton").addEventListener("click", () => savePlatformVenue(false));
  venuePanel.querySelector("#venueSaveButton").textContent = role === "platform_admin" ? "保存草稿" : "保存这家场馆的修改";
  venuePanel.querySelector("#venuePublishButton").hidden = role !== "platform_admin";
  if (role === "platform_admin") venuePanel.querySelector("#venuePublishButton").addEventListener("click", () => savePlatformVenue(true));
  venuePanel.querySelector("#venueUnpublishButton").hidden = role !== "platform_admin" || !activeVenue.id || !activeVenue.visible;
  venuePanel.querySelector("#venueUnpublishButton").addEventListener("click", unpublishPlatformVenue);
  venuePanel.querySelector("#venueDeleteButton").hidden = role !== "platform_admin" || !activeVenue.id;
  venuePanel.querySelector("#venueDeleteButton").addEventListener("click", deletePlatformVenue);
  if (role === "platform_admin") setupReviewerAssignment();
}

function setupReviewerAssignment() {
  const nameInput = venuePanel.querySelector("#reviewerNameInput");
  const linkOutput = venuePanel.querySelector("#reviewerLinkOutput");
  const copyButton = venuePanel.querySelector("#copyReviewerLinkButton");
  const status = venuePanel.querySelector("#reviewerAssignmentStatus");
  const generateButton = venuePanel.querySelector("#generateReviewerLinkButton");
  const revokeButton = venuePanel.querySelector("#revokeReviewerButton");
  const assignment = activeVenue.reviewer;
  nameInput.value = assignment?.name || "";
  status.textContent = assignment ? `已分配给：${assignment.name}。出于安全原因，旧链接不会再次显示；需要时可重新生成。` : "下一步：填写审核员姓名或编号，生成专属链接并发送给对方。";
  revokeButton.hidden = !assignment;
  generateButton.disabled = !activeVenue.id;
  generateButton.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    if (!activeVenue.id) return platformToast("请先保存这家健身房，再分配审核员", true);
    if (!name) return platformToast("请填写审核员姓名或编号", true);
    try {
      const body = await api(`/api/platform/venues/${encodeURIComponent(activeVenue.id)}/reviewer`, { method: "POST", body: JSON.stringify({ reviewerName: name }) });
      linkOutput.value = body.reviewerUrl;
      copyButton.hidden = false;
      status.textContent = `已分配给：${body.assignment.name}。链接已生成，发送给审核员即可；本页刷新前会一直保留。`;
      revokeButton.hidden = false;
      activeVenue.reviewer = body.assignment;
      const savedVenue = platformVenues.find(item => item.id === activeVenue.id);
      if (savedVenue) savedVenue.reviewer = body.assignment;
      renderVenueList();
      platformToast("审核员专属链接已生成，请点击“复制链接”");
    } catch (error) { platformToast(error.message, true); }
  });
  copyButton.addEventListener("click", async () => {
    if (!linkOutput.value) return platformToast("请先生成审核员链接", true);
    try {
      await navigator.clipboard.writeText(linkOutput.value);
      platformToast("审核员链接已复制");
    } catch {
      linkOutput.focus();
      linkOutput.select();
      platformToast("链接已选中，请按 Command + C 复制");
    }
  });
  revokeButton.addEventListener("click", async () => {
    if (!confirm("确认撤销这位审核员对该场馆的访问权限吗？")) return;
    try {
      await api(`/api/platform/venues/${encodeURIComponent(activeVenue.id)}/reviewer`, { method: "DELETE" });
      linkOutput.value = "";
      copyButton.hidden = true;
      status.textContent = "下一步：填写审核员姓名或编号，生成专属链接并发送给对方。";
      revokeButton.hidden = true;
      activeVenue.reviewer = null;
      const savedVenue = platformVenues.find(item => item.id === activeVenue.id);
      if (savedVenue) savedVenue.reviewer = null;
      renderVenueList();
      platformToast("审核员权限已撤销");
    } catch (error) { platformToast(error.message, true); }
  });
}

function renderPlatformGallery() {
  renderGalleryEditor(venuePanel.querySelector("#platformGalleryEditor"), activeVenue.gallery || [], venuePanel.querySelector("#platformVenueForm"));
}

function renderPlatformCardPreview() {
  const target = venuePanel.querySelector("#platformCardPreview");
  const form = venuePanel.querySelector("#platformVenueForm");
  if (!target || !form) return;
  const venue = readForm(form, activeVenue || {});
  const highlights = venue.highlights.length ? venue.highlights : ["亮点将在这里显示"];
  target.innerHTML = `<div class="preview-copy"><small>前端卡片预览</small><h3>${escapeHtml(venue.name || "健身房名称")}</h3><p>${escapeHtml(venue.district || "所在区域")} · ${escapeHtml(venue.type || "场馆类型")}</p><div>${highlights.slice(0, 3).map(item => `<span>${escapeHtml(item)}</span>`).join("")}</div><footer><strong>${Number(venue.monthlyPrice) > 0 ? `¥${Number(venue.monthlyPrice)}/月` : "月卡价格待填写"}</strong><em>基础资料 · 待体验官实测</em></footer></div>${venue.image ? `<img src="${escapeAttribute(venue.image)}" alt="场馆主图预览" />` : '<div class="preview-image-empty">上传主图后在这里预览</div>'}`;
}

async function uploadPlatformImages(files) {
  if (!files?.length) return;
  setVenueButtons(true);
  try {
    const uploaded = await uploadFiles(files, activeVenue.id || "new-venue");
    activeVenue.gallery = [...(activeVenue.gallery || []), ...uploaded].slice(0, 12);
    if (!activeVenue.image) activeVenue.image = uploaded[0]?.src || "";
    fillForm(venuePanel.querySelector("#platformVenueForm"), activeVenue);
    renderPlatformGallery();
    renderPlatformCardPreview();
    platformToast(`已上传 ${uploaded.length} 张图片`);
  } catch (error) { platformToast(error.message, true); }
  finally { setVenueButtons(false); }
}

async function savePlatformVenue(publishAfter) {
  setVenueButtons(true);
  try {
    const form = venuePanel.querySelector("#platformVenueForm");
    if (publishAfter && !form.reportValidity()) { platformToast("请先补齐所有必填信息", true); return; }
    const venue = readForm(form, activeVenue);
    activeVenue = (await api(`/api/platform/venues/${encodeURIComponent(activeVenue.id)}`, { method: "PATCH", body: JSON.stringify({ venue }) })).venue;
    if (publishAfter) await api(`/api/platform/venues/${encodeURIComponent(activeVenue.id)}/publish`, { method: "POST" });
    platformToast(publishAfter ? "基础资料已保存并上线" : (role === "platform_admin" ? "基础资料草稿已保存" : "这家场馆的修改已保存"));
    await loadPlatformVenues();
  } catch (error) { platformToast(`${error.message}${error.details?.length ? `：${error.details.join("、")}` : ""}`, true); }
  finally { setVenueButtons(false); }
}

async function unpublishPlatformVenue() {
  if (!confirm("确认将这个场馆从用户前端下架吗？资料会保留。")) return;
  try { await api(`/api/platform/venues/${encodeURIComponent(activeVenue.id)}/unpublish`, { method: "POST" }); await loadPlatformVenues(); platformToast("已下架，资料仍保留"); }
  catch (error) { platformToast(error.message, true); }
}

async function deletePlatformVenue() {
  if (!confirm("确认永久删除这个场馆记录吗？此操作不可撤销。")) return;
  try {
    await api(`/api/platform/venues/${encodeURIComponent(activeVenue.id)}`, { method: "DELETE" });
    activeVenue = null;
    venuePanel.innerHTML = '<div class="empty-state"><strong>场馆记录已删除</strong><p>请选择其他场馆或新建资料。</p></div>';
    await loadPlatformVenues();
  } catch (error) { platformToast(error.message, true); }
}

function setButtons(disabled) { panel.querySelectorAll("button").forEach(button => { button.disabled = disabled; }); }
function setVenueButtons(disabled) { venuePanel.querySelectorAll("button").forEach(button => { button.disabled = disabled; }); }
function toast(message, isError = false) { const element = panel.querySelector("#toast"); if (!element) return; showToast(element, message, isError); }
function platformToast(message, isError = false) { const element = venuePanel.querySelector("#platformToast"); if (!element) return; showToast(element, message, isError); }
function showToast(element, message, isError) { element.hidden = false; element.classList.toggle("is-error", isError); element.textContent = message; clearTimeout(element._timer); element._timer = setTimeout(() => { element.hidden = true; }, 5000); }
function statusText(status) { return ({ analyzing: "分析中", needs_review: "待审核", analysis_failed: "分析失败", rejected: "已退回", published: "已发布" })[status] || status; }
function showPanelError(message) { panel.innerHTML = `<div class="empty-state"><strong>读取失败</strong><p>${escapeHtml(message)}</p></div>`; }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[char]); }
function escapeAttribute(value) { return escapeHtml(value).replace(/`/g, "&#96;"); }
