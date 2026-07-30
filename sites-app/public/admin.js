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
const PRICING_PLAN_DEFS = [
  ["single", "单次 / 体验卡"],
  ["weekly", "周卡"],
  ["monthly", "月卡"],
  ["quarterly", "季卡"],
  ["annual", "年卡"]
];
const EQUIPMENT_CATEGORY_DEFS = [
  ["03A", "有氧器械"],
  ["03B", "背部训练"],
  ["03C", "胸部训练"],
  ["03D", "腿部训练"],
  ["03E", "哑铃区"],
  ["03F", "手臂训练"],
  ["03G", "肩部训练"],
  ["03H", "核心训练"],
  ["03I", "拉伸与放松"]
];

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
  document.title = isPlatform ? "有间好馆｜内容管理后台" : "有间好馆｜单馆审核工作台";
  document.querySelector("#roleBadge").textContent = isPlatform ? "平台管理员 · 全部权限" : `${reviewerName || "单馆审核员"} · 单馆权限`;
  document.querySelector("#permissionSummary").textContent = isPlatform
    ? "可审核报告、管理场馆资料、重新调用 AI、删除和下架内容。"
    : `当前只处理平台分配给你的这一家场馆${reviewerName ? `；审核身份：${reviewerName}` : ""}。其他场馆、平台配置和管理操作均不可见。`;
  document.querySelector("#workspaceEyebrow").textContent = isPlatform ? "有间好馆管理后台" : "有间好馆 · 单馆任务";
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
  setupStructuredEditors(form, draft, { scope: report.id, notify: toast });
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
  const pricing = normalizePricing(draft);
  const observations = normalizeCrowdObservations(draft);
  const inventory = normalizeEquipmentInventory(draft);
  const summary = normalizeFullReport(draft);
  const plansReviewed = pricing.plans.length >= 5 && pricing.plans.every(plan => plan.evidenceStatus && plan.evidenceStatus !== "unknown");
  const observationsComplete = observations.length >= 5 && observations.slice(0, 5).every(observation => {
    const hasWait = Number.isFinite(Number(observation.cardioWaitMinutes)) || Number.isFinite(Number(observation.cableWaitMinutes));
    return useful(observation.observedAt) && useful(observation.start) && useful(observation.end)
      && Number.isFinite(Number(observation.approxPeople)) && hasWait && useful(observation.description);
  });
  const equipmentComplete = EQUIPMENT_CATEGORY_DEFS.every(([id]) => {
    const category = inventory.find(item => item.id === id);
    if (!category || !Number.isFinite(Number(category.total)) || !Number.isFinite(Number(category.available))) return false;
    return Number(category.total) === 0 || (Array.isArray(category.items) && category.items.length > 0);
  });
  return [
    { label: "场馆名称已确认", passed: useful(draft.name), selector: '[name="name"]' },
    { label: "所在区域已确认", passed: useful(draft.district), selector: '[name="district"]' },
    { label: "营业时间已补齐", passed: useful(draft.hours), selector: '[name="hours"]' },
    { label: "详细地址已补齐", passed: useful(draft.contact?.address), selector: '[name="contact.address"]' },
    { label: "场馆主图已提供", passed: useful(draft.image), selector: "#venueImageInput" },
    { label: "五种卡型已逐项核对", passed: plansReviewed && Boolean(pricing.feesReviewed), selector: "#pricingSection" },
    { label: "5次客流观察可展示", passed: observationsComplete, selector: "#crowdObservationSection" },
    { label: "03A–03I器械已核对", passed: equipmentComplete, selector: "#equipmentInventorySection" },
    { label: "完整报告六项已核对", passed: useful(summary.conclusion) && summary.recommendations.length > 0 && summary.cautions.length > 0 && useful(summary.fit) && useful(summary.unfit) && useful(summary.sessionSummary), selector: "#contentSection" },
    { label: "适合人群已核对", passed: useful(draft.fit), selector: '[name="fit"]' },
    { label: "注意事项已核对", passed: useful(draft.caution), selector: '[name="caution"]' },
    { label: "体验总分已自动生成", passed: Number.isFinite(Number(draft.experienceScore)) && Number(draft.experienceScore) >= 0 && Number(draft.experienceScore) <= 100, selector: "#scoreCard" },
    { label: "有效训练与晚高峰覆盖通过", passed: Boolean(gates.trainingComplete), selector: "#scoreCard" },
    { label: "六模块评分可解释", passed: Array.isArray(draft.scoreModules) && draft.scoreModules.length >= 6, selector: "#scoreCard" },
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
    ["有效训练且覆盖工作日晚高峰", gates.trainingComplete],
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

function setupStructuredEditors(form, draft, options) {
  form._structuredOptions = options;
  const pricingTarget = form.querySelector("[data-pricing-editor]");
  if (pricingTarget) {
    form._pricingState = normalizePricing(draft);
    renderPricingEditor(form, pricingTarget);
  }
  const crowdTarget = form.querySelector("[data-crowd-editor]");
  if (crowdTarget) {
    form._crowdState = normalizeCrowdObservations(draft);
    while (form._crowdState.length < 5) form._crowdState.push(blankCrowdObservation(form._crowdState.length));
    renderCrowdEditor(form, crowdTarget);
  }
  const equipmentTarget = form.querySelector("[data-equipment-editor]");
  if (equipmentTarget) {
    form._equipmentState = normalizeEquipmentInventory(draft);
    renderEquipmentEditor(form, equipmentTarget);
  }
}

function normalizePricing(draft = {}) {
  const pricing = draft.pricing || {};
  const sourcePlans = Array.isArray(pricing.plans) ? pricing.plans : [];
  const plans = PRICING_PLAN_DEFS.map(([id, label]) => {
    const source = sourcePlans.find(plan => [plan?.id, plan?.key, plan?.type].includes(id) || pricingPlanNameMatches(plan?.name || plan?.label, id, label))
      || (pricing[id] && typeof pricing[id] === "object" ? pricing[id] : {});
    const legacyKey = ({ single: "trialPrice", weekly: "weeklyPrice", monthly: "monthlyPrice", quarterly: "quarterlyPrice", annual: "annualPrice" })[id];
    const amount = firstDefined(source.amount, source.price, pricing[id]?.amount, draft[legacyKey]);
    return {
      ...source,
      id,
      key: id,
      name: source.name || source.label || label,
      label: source.label || label,
      amount: optionalNumber(amount),
      validity: source.validity || source.period || "",
      source: source.source || "",
      evidenceStatus: source.evidenceStatus || source.status || (hasValue(amount) ? "reported" : "unknown"),
      provided: source.provided === false ? false : hasValue(amount)
    };
  });
  const rawFees = Array.isArray(pricing.fees)
    ? pricing.fees
    : Array.isArray(pricing.additionalFees)
      ? pricing.additionalFees
      : Array.isArray(draft.additionalFees)
        ? draft.additionalFees
        : [];
  const fees = rawFees.map((fee, index) => typeof fee === "string"
    ? { id: `fee-${index + 1}`, key: `fee-${index + 1}`, label: fee, amount: null, rule: "", proactivelyDisclosed: null, source: "", evidenceStatus: "reported" }
    : {
        ...fee,
        id: fee.id || fee.key || `fee-${index + 1}`,
        key: fee.key || fee.id || `fee-${index + 1}`,
        name: fee.name || fee.label || "",
        label: fee.label || fee.name || "",
        amount: optionalNumber(fee.amount),
        rule: fee.rule || fee.description || "",
        proactivelyDisclosed: typeof fee.proactivelyDisclosed === "boolean" ? fee.proactivelyDisclosed : null,
        source: fee.source || "",
        evidenceStatus: fee.evidenceStatus || fee.status || "reported"
      });
  return {
    ...pricing,
    plans,
    fees,
    feesReviewed: Boolean(pricing.feesReviewed || pricing.additionalFeesReviewed)
  };
}

function renderPricingEditor(form, target) {
  const state = form._pricingState;
  target.innerHTML = `<div class="structured-heading"><div><strong>五种卡型</strong><span>金额未知可留空，但必须标记“未提供”或“待核对”</span></div></div>
    <div class="pricing-plan-grid">${state.plans.map((plan, index) => `<article class="pricing-plan-card">
      <header><span>${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(plan.label)}</strong></header>
      <div class="mini-field-grid">
        <label>金额（元）<input type="number" min="0" step="0.01" data-plan-index="${index}" data-plan-field="amount" value="${inputValue(plan.amount)}" /></label>
        <label>有效期 / 规则<input data-plan-index="${index}" data-plan-field="validity" value="${escapeAttribute(plan.validity || "")}" placeholder="例如 30 天" /></label>
        <label>价格来源<input data-plan-index="${index}" data-plan-field="source" value="${escapeAttribute(plan.source || "")}" placeholder="例如 门店价目表" /></label>
        <label>核对状态<select data-plan-index="${index}" data-plan-field="evidenceStatus">${pricingStatusOptions(plan.evidenceStatus)}</select></label>
      </div>
    </article>`).join("")}</div>
    <div class="structured-subheading"><div><strong>额外收费</strong><span>押金、转卡、储物柜、淋浴、门禁卡、自动续费等</span></div><button class="mini secondary" data-add-fee type="button">＋ 添加费用</button></div>
    <div class="fee-editor">${state.fees.map((fee, index) => `<article class="fee-row">
      <label>费用名称<input data-fee-index="${index}" data-fee-field="label" value="${escapeAttribute(fee.label || "")}" placeholder="例如 门禁卡押金" /></label>
      <label>金额（元）<input type="number" min="0" step="0.01" data-fee-index="${index}" data-fee-field="amount" value="${inputValue(fee.amount)}" /></label>
      <label>收取规则<input data-fee-index="${index}" data-fee-field="rule" value="${escapeAttribute(fee.rule || "")}" placeholder="例如 退卡时返还" /></label>
      <label>门店是否主动告知<select data-fee-index="${index}" data-fee-field="proactivelyDisclosed"><option value="" ${fee.proactivelyDisclosed === null ? "selected" : ""}>待核对</option><option value="true" ${fee.proactivelyDisclosed === true ? "selected" : ""}>是</option><option value="false" ${fee.proactivelyDisclosed === false ? "selected" : ""}>否</option></select></label>
      <label>证据来源<input data-fee-index="${index}" data-fee-field="source" value="${escapeAttribute(fee.source || "")}" /></label>
      <button class="mini danger fee-remove" data-remove-fee="${index}" type="button">删除</button>
    </article>`).join("") || '<p class="empty structured-empty">报告没有识别到额外收费；确认无额外收费后勾选下方。</p>'}</div>
    <label class="structured-confirm"><input type="checkbox" data-fees-reviewed ${state.feesReviewed ? "checked" : ""} /> 我已逐项核对额外收费；如无收费，也已确认门店未收取或报告未发现</label>`;
  target.querySelectorAll("[data-plan-field]").forEach(element => element.addEventListener("input", () => {
    const plan = state.plans[Number(element.dataset.planIndex)];
    plan[element.dataset.planField] = element.dataset.planField === "amount" ? optionalNumber(element.value) : element.value.trim();
    plan.provided = hasValue(plan.amount);
    notifyStructuredInput(form);
  }));
  target.querySelectorAll("[data-fee-field]").forEach(element => element.addEventListener("input", () => {
    const fee = state.fees[Number(element.dataset.feeIndex)];
    if (element.dataset.feeField === "amount") fee.amount = optionalNumber(element.value);
    else if (element.dataset.feeField === "proactivelyDisclosed") fee.proactivelyDisclosed = element.value === "" ? null : element.value === "true";
    else fee[element.dataset.feeField] = element.value.trim();
    notifyStructuredInput(form);
  }));
  target.querySelector("[data-fees-reviewed]").addEventListener("change", event => {
    state.feesReviewed = event.target.checked;
    notifyStructuredInput(form);
  });
  target.querySelector("[data-add-fee]").addEventListener("click", () => {
    const id = makeRowId("fee");
    state.fees.push({ id, key: id, label: "", amount: null, rule: "", proactivelyDisclosed: null, source: "", evidenceStatus: "reported" });
    renderPricingEditor(form, target);
  });
  target.querySelectorAll("[data-remove-fee]").forEach(button => button.addEventListener("click", () => {
    state.fees.splice(Number(button.dataset.removeFee), 1);
    renderPricingEditor(form, target);
    notifyStructuredInput(form);
  }));
}

function pricingStatusOptions(selected) {
  return [
    ["unknown", "待核对"],
    ["reported", "报告已提取"],
    ["verified", "审核员已核实"],
    ["not_offered", "门店未提供"]
  ].map(([value, label]) => `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`).join("");
}

function readPricingEditor(form, current) {
  const state = form._pricingState || normalizePricing(current);
  const plans = state.plans.map(plan => ({
    ...plan,
    id: plan.id || plan.key,
    key: plan.key || plan.id,
    name: plan.name || plan.label,
    amount: optionalNumber(plan.amount),
    provided: hasValue(plan.amount) && plan.evidenceStatus !== "not_offered"
  }));
  const fees = state.fees.filter(fee => hasValue(fee.label) || hasValue(fee.amount) || hasValue(fee.rule)).map(fee => ({
    ...fee,
    id: fee.id || fee.key || makeRowId("fee"),
    key: fee.key || fee.id || makeRowId("fee"),
    name: fee.name || fee.label,
    amount: optionalNumber(fee.amount)
  }));
  const pricing = { ...state, plans, fees, feesReviewed: Boolean(state.feesReviewed) };
  for (const plan of plans) pricing[plan.id] = { ...plan };
  return pricing;
}

function normalizeCrowdObservations(draft = {}) {
  const observations = Array.isArray(draft.crowdObservations)
    ? draft.crowdObservations
    : Array.isArray(draft.crowd?.observations)
      ? draft.crowd.observations
      : [];
  return observations.map((observation, index) => {
    const [rangeStart, rangeEnd] = String(observation.timeRange || "").split(/\s*[-–—至]\s*/);
    return {
      ...observation,
      id: observation.id || `observation-${index + 1}`,
      observedAt: observation.observedAt || observation.date || "",
      start: observation.start || observation.startTime || rangeStart || "",
      end: observation.end || observation.endTime || rangeEnd || "",
      dayType: observation.dayType || "",
      state: observation.state || observation.judgment || "",
      cardioVacancies: optionalNumber(observation.cardioVacancies),
      cardioWaitMinutes: optionalNumber(observation.cardioWaitMinutes),
      cableVacancies: optionalNumber(observation.cableVacancies),
      cableWaitMinutes: optionalNumber(firstDefined(observation.cableWaitMinutes, observation.rackWaitMinutes)),
      queuePeople: optionalNumber(observation.queuePeople),
      approxPeople: optionalNumber(observation.approxPeople),
      description: observation.description || "",
      evidence: normalizeStringList(observation.evidence)
    };
  });
}

function blankCrowdObservation(index) {
  return {
    id: `observation-${index + 1}`,
    observedAt: "",
    start: "",
    end: "",
    dayType: "",
    state: "",
    cardioVacancies: null,
    cardioWaitMinutes: null,
    cableVacancies: null,
    cableWaitMinutes: null,
    queuePeople: null,
    approxPeople: null,
    description: "",
    evidence: []
  };
}

function renderCrowdEditor(form, target) {
  const state = form._crowdState;
  target.innerHTML = `<div class="structured-heading"><div><strong>客流观察记录</strong><span>至少 5 次，且覆盖报告规定的晚高峰时段</span></div><button class="mini secondary" data-add-observation type="button">＋ 添加观察</button></div>
    <div class="observation-editor">${state.map((observation, index) => `<details class="observation-card" ${index === 0 ? "open" : ""}>
      <summary><span>第 ${index + 1} 次</span><strong>${escapeHtml(observation.observedAt || "日期待填写")} ${escapeHtml([observation.start, observation.end].filter(Boolean).join("–"))}</strong><em>${escapeHtml(observation.state || "拥挤程度待判断")}</em></summary>
      <div class="observation-fields">
        <label>观察日期<input type="date" data-observation-index="${index}" data-observation-field="observedAt" value="${escapeAttribute(observation.observedAt || "")}" /></label>
        <label>日期类型<select data-observation-index="${index}" data-observation-field="dayType">${simpleOptions(observation.dayType, [["", "待核对"],["weekday", "工作日"],["weekend", "周末"]])}</select></label>
        <label>开始时间<input type="time" data-observation-index="${index}" data-observation-field="start" value="${escapeAttribute(observation.start || "")}" /></label>
        <label>结束时间<input type="time" data-observation-index="${index}" data-observation-field="end" value="${escapeAttribute(observation.end || "")}" /></label>
        <label>有氧空位（台）<input type="number" min="0" data-observation-index="${index}" data-observation-field="cardioVacancies" value="${inputValue(observation.cardioVacancies)}" /></label>
        <label>有氧等待（分钟）<input type="number" min="0" data-observation-index="${index}" data-observation-field="cardioWaitMinutes" value="${inputValue(observation.cardioWaitMinutes)}" /></label>
        <label>龙门架 / 绳索区空位<input type="number" min="0" data-observation-index="${index}" data-observation-field="cableVacancies" value="${inputValue(observation.cableVacancies)}" /></label>
        <label>龙门架最长等待（分钟）<input type="number" min="0" data-observation-index="${index}" data-observation-field="cableWaitMinutes" value="${inputValue(observation.cableWaitMinutes)}" /></label>
        <label>排队人数<input type="number" min="0" data-observation-index="${index}" data-observation-field="queuePeople" value="${inputValue(observation.queuePeople)}" /></label>
        <label>现场约有多少人<input type="number" min="0" data-observation-index="${index}" data-observation-field="approxPeople" value="${inputValue(observation.approxPeople)}" /></label>
        <label>拥挤判断<select data-observation-index="${index}" data-observation-field="state">${simpleOptions(observation.state, [["", "待核对"],["宽松", "宽松"],["一般", "一般"],["拥挤", "拥挤"]])}</select></label>
        <label class="wide">现场具体描述<textarea rows="3" data-observation-index="${index}" data-observation-field="description">${escapeHtml(observation.description || "")}</textarea></label>
        <label class="wide">证据说明（每行一项）<textarea rows="2" data-observation-index="${index}" data-observation-field="evidence">${escapeHtml((observation.evidence || []).join("\n"))}</textarea></label>
        <button class="mini danger observation-remove" data-remove-observation="${index}" type="button">删除这次观察</button>
      </div>
    </details>`).join("")}</div>`;
  target.querySelectorAll("[data-observation-field]").forEach(element => element.addEventListener("input", () => {
    const observation = state[Number(element.dataset.observationIndex)];
    const field = element.dataset.observationField;
    if (["cardioVacancies", "cardioWaitMinutes", "cableVacancies", "cableWaitMinutes", "queuePeople", "approxPeople"].includes(field)) observation[field] = optionalNumber(element.value);
    else if (field === "evidence") observation.evidence = normalizeStringList(element.value);
    else observation[field] = element.value.trim();
    notifyStructuredInput(form);
  }));
  target.querySelector("[data-add-observation]").addEventListener("click", () => {
    state.push(blankCrowdObservation(state.length));
    renderCrowdEditor(form, target);
  });
  target.querySelectorAll("[data-remove-observation]").forEach(button => button.addEventListener("click", () => {
    state.splice(Number(button.dataset.removeObservation), 1);
    renderCrowdEditor(form, target);
    notifyStructuredInput(form);
  }));
}

function readCrowdEditor(form, current) {
  const state = form._crowdState || normalizeCrowdObservations(current);
  return state.filter(crowdObservationHasContent).map((observation, index) => ({
    ...observation,
    id: observation.id || `observation-${index + 1}`,
    observedAt: observation.observedAt || "",
    start: observation.start || "",
    end: observation.end || "",
    state: observation.state || "",
    date: observation.observedAt || "",
    startTime: observation.start || "",
    endTime: observation.end || "",
    timeRange: observation.start || observation.end ? `${observation.start || ""}–${observation.end || ""}` : "",
    judgment: observation.state || "",
    rackWaitMinutes: optionalNumber(observation.cableWaitMinutes)
  }));
}

function crowdObservationHasContent(observation) {
  return ["observedAt", "start", "end", "description", "state"].some(field => hasValue(observation[field]))
    || ["cardioVacancies", "cardioWaitMinutes", "cableVacancies", "cableWaitMinutes", "queuePeople", "approxPeople"].some(field => hasValue(observation[field]));
}

function normalizeEquipmentInventory(draft = {}) {
  const sourceInventory = Array.isArray(draft.equipmentInventory) ? draft.equipmentInventory : [];
  const normalized = EQUIPMENT_CATEGORY_DEFS.map(([id, label]) => {
    const category = sourceInventory.find(item => [item?.id, item?.code].includes(id)) || {};
    const items = Array.isArray(category.items) ? category.items : [];
    return {
      ...category,
      id,
      code: id,
      label: category.label || label,
      total: optionalNumber(firstDefined(category.total, category.totalCount)),
      available: optionalNumber(firstDefined(category.available, category.availableCount)),
      items: items.map((item, index) => ({
        ...item,
        id: item.id || item.code || `${id}-${index + 1}`,
        code: item.code || item.id || `${id}-${index + 1}`,
        name: item.name || "",
        total: optionalNumber(item.total),
        available: optionalNumber(item.available),
        maxWaitMinutes: optionalNumber(item.maxWaitMinutes),
        status: item.status || (item.issueSummary ? "issue" : "unknown"),
        issueSummary: item.issueSummary || "",
        issuePhotos: Array.isArray(item.issuePhotos) ? item.issuePhotos : []
      }))
    };
  });
  for (const category of sourceInventory) {
    const id = category?.id || category?.code;
    if (id && !normalized.some(item => item.id === id)) normalized.push(category);
  }
  return normalized;
}

function renderEquipmentEditor(form, target) {
  const state = form._equipmentState;
  target.innerHTML = `<div class="structured-heading"><div><strong>九类器械清单</strong><span>点击分类展开；问题照片会跟随具体器械发布</span></div></div>
    <div class="equipment-editor">${state.map((category, categoryIndex) => `<details class="equipment-category" ${categoryIndex === 0 ? "open" : ""}>
      <summary><span>${escapeHtml(category.id)}</span><strong>${escapeHtml(category.label)}</strong><em>总数 ${displayNumber(category.total)} · 可用 ${displayNumber(category.available)} · ${category.items.length} 个项目</em></summary>
      <div class="equipment-category-body">
        <div class="category-counts">
          <label>分类总数<input type="number" min="0" data-category-index="${categoryIndex}" data-category-field="total" value="${inputValue(category.total)}" /></label>
          <label>当前可用数<input type="number" min="0" data-category-index="${categoryIndex}" data-category-field="available" value="${inputValue(category.available)}" /></label>
          <button class="mini secondary" data-add-equipment="${categoryIndex}" type="button">＋ 添加器械项目</button>
        </div>
        <div class="equipment-items">${category.items.map((item, itemIndex) => `<article class="equipment-item">
          <header><div>${item.referenceImage ? `<img src="${escapeAttribute(item.referenceImage)}" alt="" />` : `<span>${escapeHtml(item.code || category.id)}</span>`}<strong>${escapeHtml(item.name || "器械名称待填写")}</strong></div><button class="mini danger" data-remove-equipment="${categoryIndex}:${itemIndex}" type="button">删除</button></header>
          <div class="equipment-item-fields">
            <label>器械编号<input data-equipment-index="${categoryIndex}:${itemIndex}" data-equipment-field="code" value="${escapeAttribute(item.code || "")}" /></label>
            <label>器械名称<input data-equipment-index="${categoryIndex}:${itemIndex}" data-equipment-field="name" value="${escapeAttribute(item.name || "")}" /></label>
            <label>总数<input type="number" min="0" data-equipment-index="${categoryIndex}:${itemIndex}" data-equipment-field="total" value="${inputValue(item.total)}" /></label>
            <label>可用数<input type="number" min="0" data-equipment-index="${categoryIndex}:${itemIndex}" data-equipment-field="available" value="${inputValue(item.available)}" /></label>
            <label>最长等待（分钟）<input type="number" min="0" data-equipment-index="${categoryIndex}:${itemIndex}" data-equipment-field="maxWaitMinutes" value="${inputValue(item.maxWaitMinutes)}" /></label>
            <label>状态<select data-equipment-index="${categoryIndex}:${itemIndex}" data-equipment-field="status">${simpleOptions(item.status, [["unknown", "待核对"],["ok", "正常"],["issue", "有问题"]])}</select></label>
            <label class="wide">问题或现场反馈<textarea rows="2" data-equipment-index="${categoryIndex}:${itemIndex}" data-equipment-field="issueSummary" placeholder="无问题可留空；有问题请写明损坏、缺件或安全隐患">${escapeHtml(item.issueSummary || "")}</textarea></label>
            <label class="wide upload-box equipment-upload">上传该器械的问题照片<input type="file" accept="image/jpeg,image/png,image/webp" multiple data-equipment-photo="${categoryIndex}:${itemIndex}" /><span>照片只挂到这一项器械；上传后仍需点击“保存草稿”。</span></label>
            <div class="wide issue-photo-list">${renderIssuePhotos(item.issuePhotos, categoryIndex, itemIndex)}</div>
          </div>
        </article>`).join("") || '<p class="empty structured-empty">该分类还没有器械项目；如果分类总数为 0 可不添加，否则请逐项添加。</p>'}</div>
      </div>
    </details>`).join("")}</div>`;
  target.querySelectorAll("[data-category-field]").forEach(element => element.addEventListener("input", () => {
    state[Number(element.dataset.categoryIndex)][element.dataset.categoryField] = optionalNumber(element.value);
    notifyStructuredInput(form);
  }));
  target.querySelectorAll("[data-equipment-field]").forEach(element => element.addEventListener("input", () => {
    const [categoryIndex, itemIndex] = element.dataset.equipmentIndex.split(":").map(Number);
    const item = state[categoryIndex].items[itemIndex];
    const field = element.dataset.equipmentField;
    item[field] = ["total", "available", "maxWaitMinutes"].includes(field) ? optionalNumber(element.value) : element.value.trim();
    notifyStructuredInput(form);
  }));
  target.querySelectorAll("[data-add-equipment]").forEach(button => button.addEventListener("click", () => {
    const categoryIndex = Number(button.dataset.addEquipment);
    const category = state[categoryIndex];
    const id = `${category.id}-${String(category.items.length + 1).padStart(2, "0")}`;
    category.items.push({ id, code: id, name: "", total: null, available: null, maxWaitMinutes: null, status: "unknown", issueSummary: "", issuePhotos: [] });
    renderEquipmentEditor(form, target);
  }));
  target.querySelectorAll("[data-remove-equipment]").forEach(button => button.addEventListener("click", () => {
    const [categoryIndex, itemIndex] = button.dataset.removeEquipment.split(":").map(Number);
    state[categoryIndex].items.splice(itemIndex, 1);
    renderEquipmentEditor(form, target);
    notifyStructuredInput(form);
  }));
  target.querySelectorAll("[data-remove-issue-photo]").forEach(button => button.addEventListener("click", () => {
    const [categoryIndex, itemIndex, photoIndex] = button.dataset.removeIssuePhoto.split(":").map(Number);
    state[categoryIndex].items[itemIndex].issuePhotos.splice(photoIndex, 1);
    renderEquipmentEditor(form, target);
    notifyStructuredInput(form);
  }));
  target.querySelectorAll("[data-equipment-photo]").forEach(input => input.addEventListener("change", () => uploadEquipmentIssuePhotos(form, target, input)));
}

function renderIssuePhotos(photos, categoryIndex, itemIndex) {
  if (!photos?.length) return '<p class="empty issue-photo-empty">还没有问题照片。</p>';
  return photos.map((photo, photoIndex) => `<figure><img src="${escapeAttribute(photo.src || photo.url || "")}" alt="器械问题现场照片" /><figcaption>${escapeHtml(photo.caption || "器械问题现场照片")}</figcaption><button class="mini danger" data-remove-issue-photo="${categoryIndex}:${itemIndex}:${photoIndex}" type="button">移除</button></figure>`).join("");
}

async function uploadEquipmentIssuePhotos(form, target, input) {
  if (!input.files?.length) return;
  const [categoryIndex, itemIndex] = input.dataset.equipmentPhoto.split(":").map(Number);
  const item = form._equipmentState[categoryIndex].items[itemIndex];
  input.disabled = true;
  try {
    const scope = form._structuredOptions.scope;
    const uploaded = await uploadFiles(input.files, scope);
    item.issuePhotos = [...(item.issuePhotos || []), ...uploaded.map(image => ({ ...image, caption: image.caption || "器械问题现场照片" }))].slice(0, 8);
    if (item.issuePhotos.length) item.status = "issue";
    renderEquipmentEditor(form, target);
    notifyStructuredInput(form);
    form._structuredOptions.notify(`已给“${item.name || item.code}”上传 ${uploaded.length} 张问题照片，请保存草稿`);
  } catch (error) {
    input.disabled = false;
    form._structuredOptions.notify(error.message, true);
  }
}

function readEquipmentEditor(form, current) {
  const state = form._equipmentState || normalizeEquipmentInventory(current);
  return state.map(category => ({
    ...category,
    id: category.id || category.code,
    code: category.code || category.id,
    total: optionalNumber(category.total),
    available: optionalNumber(category.available),
    totalCount: optionalNumber(category.total),
    availableCount: optionalNumber(category.available),
    items: (category.items || []).filter(equipmentItemHasContent).map(item => ({
      ...item,
      id: item.id || item.code || makeRowId("equipment"),
      code: item.code || item.id || "",
      total: optionalNumber(item.total),
      available: optionalNumber(item.available),
      maxWaitMinutes: optionalNumber(item.maxWaitMinutes),
      issuePhotos: Array.isArray(item.issuePhotos) ? item.issuePhotos : []
    }))
  }));
}

function equipmentItemHasContent(item) {
  return ["name", "code", "issueSummary"].some(field => hasValue(item[field]))
    || ["total", "available", "maxWaitMinutes"].some(field => hasValue(item[field]))
    || (item.issuePhotos || []).length > 0;
}

function normalizeFullReport(draft = {}) {
  const summary = draft.fullReport || draft.reportSummary || {};
  return {
    ...summary,
    conclusion: summary.conclusion || draft.conclusion || "",
    recommendations: normalizeStringList(firstDefined(summary.recommendations, draft.recommendations)),
    cautions: normalizeStringList(firstDefined(summary.cautions, summary.mustKnow, draft.mustKnow)),
    fit: summary.fit || draft.fit || "",
    unfit: summary.unfit || draft.unfit || "",
    sessionSummary: summary.sessionSummary || draft.sessionSummary || ""
  };
}

function pricingPlanNameMatches(value, id, label) {
  const text = String(value || "").trim();
  if (!text) return false;
  if (text === label) return true;
  const aliases = {
    single: ["单次", "单次卡", "体验卡", "次卡", "单次 / 体验卡"],
    weekly: ["周卡", "星期卡"],
    monthly: ["月卡"],
    quarterly: ["季卡", "季度卡"],
    annual: ["年卡", "年度卡"]
  };
  return (aliases[id] || []).includes(text);
}

function notifyStructuredInput(form) {
  form.dispatchEvent(new Event("input", { bubbles: true }));
}

function simpleOptions(selected, options) {
  return options.map(([value, label]) => `<option value="${escapeAttribute(value)}" ${selected === value ? "selected" : ""}>${escapeHtml(label)}</option>`).join("");
}

function normalizeStringList(value) {
  if (Array.isArray(value)) return value.map(item => typeof item === "string" ? item.trim() : String(item?.text || item?.label || "").trim()).filter(Boolean);
  return String(value || "").split(/\n+/).map(item => item.trim()).filter(Boolean);
}

function firstDefined(...values) {
  return values.find(value => value !== undefined && value !== null && value !== "");
}

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function optionalNumber(value) {
  if (!hasValue(value)) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function inputValue(value) {
  return hasValue(value) ? escapeAttribute(value) : "";
}

function displayNumber(value) {
  return hasValue(value) ? escapeHtml(value) : "—";
}

function makeRowId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function fillForm(form, draft) {
  const fullReport = normalizeFullReport(draft);
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
    additionalFees: (draft.additionalFees || []).join("\n"),
    "fullReport.conclusion": fullReport.conclusion,
    "fullReport.recommendations": fullReport.recommendations.join("\n"),
    "fullReport.cautions": fullReport.cautions.join("\n"),
    "fullReport.unfit": fullReport.unfit,
    "fullReport.sessionSummary": fullReport.sessionSummary
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
  const pricing = readPricingEditor(form, current);
  const planAmount = id => pricing.plans.find(plan => plan.id === id)?.amount ?? 0;
  const crowdObservations = readCrowdEditor(form, current);
  const equipmentInventory = readEquipmentEditor(form, current);
  const currentSummary = normalizeFullReport(current);
  const fullReport = {
    ...currentSummary,
    conclusion: optionalValue("fullReport.conclusion") ?? currentSummary.conclusion,
    recommendations: normalizeStringList(optionalValue("fullReport.recommendations") ?? currentSummary.recommendations),
    cautions: normalizeStringList(optionalValue("fullReport.cautions") ?? currentSummary.cautions),
    fit: value("fit") || currentSummary.fit,
    unfit: optionalValue("fullReport.unfit") ?? currentSummary.unfit,
    sessionSummary: optionalValue("fullReport.sessionSummary") ?? currentSummary.sessionSummary
  };
  const additionalFees = pricing.fees.map(fee => [
    fee.label,
    hasValue(fee.amount) ? `¥${fee.amount}` : "",
    fee.rule
  ].filter(Boolean).join(" · ")).filter(Boolean);
  return {
    ...current,
    name: value("name"), district: value("district"), type: value("type"), category: value("category"),
    pricing,
    monthlyPrice: planAmount("monthly"), trialPrice: planAmount("single"),
    weeklyPrice: planAmount("weekly"), quarterlyPrice: planAmount("quarterly"), annualPrice: planAmount("annual"),
    hours: value("hours"), testedAt: optionalValue("testedAt") || current.testedAt || new Date().toISOString().slice(0, 10),
    rating: optionalValue("rating") ?? current.rating ?? 0, equipment: optionalValue("equipment") ?? current.equipment ?? 0, image: value("image"), gallery,
    crowdObservations,
    equipmentInventory,
    fullReport,
    reportSummary: { ...fullReport },
    crowd: {
      ...(current.crowd || {}),
      morning: optionalValue("crowd.morning") || current.crowd?.morning || "一般",
      evening: optionalValue("crowd.evening") || current.crowd?.evening || "一般",
      weekend: optionalValue("crowd.weekend") || current.crowd?.weekend || "一般",
      flexible: optionalValue("crowd.flexible") || current.crowd?.flexible || "一般",
      observations: crowdObservations
    },
    highlights: value("highlights").split(/\n+/).map(item => item.trim()).filter(Boolean).slice(0, 5),
    fit: value("fit") || current.fit || "", caution: value("caution") || current.caution || "",
    evidence: value("evidence").split(/\n+/).map(item => item.trim()).filter(Boolean),
    additionalFees,
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
  setupStructuredEditors(form, activeVenue, { scope: activeVenue.id || "new-venue", notify: platformToast });
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
