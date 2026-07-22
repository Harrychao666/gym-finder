const token = new URLSearchParams(location.search).get("token") || sessionStorage.getItem("gymAdminToken") || "";
if (token) sessionStorage.setItem("gymAdminToken", token);
const listElement = document.querySelector("#reportList");
const panel = document.querySelector("#reviewPanel");
const template = document.querySelector("#reviewTemplate");
let reports = [];
let activeReport = null;

document.querySelector("#refreshButton").addEventListener("click", loadReports);
loadReports();

async function api(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { "x-admin-token": token, ...(options.body ? { "content-type": "application/json" } : {}), ...(options.headers || {}) } });
  const body = await response.json();
  if (!response.ok) { const error = new Error(body.error || "请求失败"); error.details = body.missing; throw error; }
  return body;
}

async function loadReports() {
  if (!token) { listElement.innerHTML = '<p class="empty">链接缺少管理员口令，请从服务器启动信息中打开完整后台地址。</p>'; return; }
  try {
    reports = (await api("/api/admin/reports")).reports;
    renderList();
    if (activeReport) await openReport(activeReport.id);
  } catch (error) { listElement.innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`; }
}

function renderList() {
  if (!reports.length) { listElement.innerHTML = '<p class="empty">还没有体验官上传报告。</p>'; return; }
  listElement.innerHTML = reports.map(report => `<button class="report-item ${activeReport?.id === report.id ? "is-active" : ""}" data-id="${report.id}"><strong>${escapeHtml(report.venueName || report.analysis?.venueName || "待命名场馆")}</strong><span>${statusText(report.status)} · ${escapeHtml(report.evaluatorName || "未填写体验官")}</span><small>${new Date(report.createdAt).toLocaleString("zh-CN")}</small></button>`).join("");
  listElement.querySelectorAll("[data-id]").forEach(button => button.addEventListener("click", () => openReport(button.dataset.id)));
}

async function openReport(id) {
  try {
    activeReport = (await api(`/api/admin/reports/${id}`)).report;
    renderList(); renderReview();
  } catch (error) { showPanelError(error.message); }
}

function renderReview() {
  panel.innerHTML = "";
  panel.append(template.content.cloneNode(true));
  const report = activeReport;
  const draft = report.venueDraft || {};
  panel.querySelector("#statusBadge").textContent = statusText(report.status);
  panel.querySelector("#reportTitle").textContent = draft.name || report.venueName || "待命名场馆";
  panel.querySelector("#reportMeta").textContent = `${report.evaluatorName || "未填写体验官"} · ${report.originalName} · ${(report.fileSize / 1024 / 1024).toFixed(2)} MB`;
  const notice = panel.querySelector("#systemNotice");
  if (report.analysisMode === "openai") { notice.classList.add("is-openai"); notice.textContent = `OpenAI 已完成结构化总结（${report.analysisModel}）。请核对事实和评分后再发布。`; }
  else if (report.status === "analysis_failed") notice.textContent = `自动分析失败：${report.analysisError || "未知原因"}。可检查 API 配置后重新分析。`;
  else notice.textContent = "当前是本地预览分析：报告已提取，但尚未配置 OPENAI_API_KEY。可以人工编辑，也可以配置后点击重新分析。";
  fillForm(panel.querySelector("#venueForm"), draft);
  const details = report.analysis || {};
  panel.querySelector("#analysisDetails").innerHTML = `<strong>提取可信度：${details.confidence ?? "—"}%</strong><p>缺失：${escapeHtml((details.missingItems || []).join("；") || "无")}</p><p>风险：${escapeHtml((details.riskTags || []).join("；") || "未识别到独立风险")}</p><p>${escapeHtml(details.summary || "暂无AI总结")}</p>`;
  panel.querySelector("#sourceText").textContent = report.extractedText || "";
  panel.querySelector("#saveButton").addEventListener("click", saveDraft);
  panel.querySelector("#reanalyzeButton").addEventListener("click", reanalyze);
  panel.querySelector("#publishButton").addEventListener("click", publish);
}

function fillForm(form, draft) {
  const flat = { ...draft, "crowd.evening": draft.crowd?.evening, "contact.phone": draft.contact?.phone, "contact.address": draft.contact?.address, "contact.nearestStation": draft.contact?.nearestStation, "contact.booking": draft.contact?.booking, longitude: draft.coordinates?.[0], latitude: draft.coordinates?.[1], highlights: (draft.highlights || []).join("\n"), evidence: (draft.evidence || []).join("\n") };
  for (const element of form.elements) {
    if (!element.name) continue;
    if (element.type === "checkbox") element.checked = Boolean(flat[element.name]);
    else element.value = flat[element.name] ?? "";
  }
}

function readForm() {
  const form = panel.querySelector("#venueForm");
  const value = name => form.elements.namedItem(name)?.value.trim() || "";
  const checked = name => form.elements.namedItem(name)?.checked || false;
  return {
    name: value("name"), district: value("district"), type: value("type"), category: value("category"), monthlyPrice: value("monthlyPrice"), trialPrice: value("trialPrice"), hours: value("hours"), rating: value("rating"), equipment: value("equipment"), image: value("image"),
    crowd: { ...(activeReport.venueDraft?.crowd || {}), evening: value("crowd.evening") },
    highlights: value("highlights").split(/\n+/).map(item => item.trim()).filter(Boolean).slice(0, 5), fit: value("fit"), caution: value("caution"), evidence: value("evidence").split(/\n+/).map(item => item.trim()).filter(Boolean),
    beginner: checked("beginner"), lowSales: checked("lowSales"), shower: checked("shower"), cleanEnvironment: checked("cleanEnvironment"), open24: checked("open24"), womenFriendly: checked("womenFriendly"), nightSafety: checked("nightSafety"),
    coordinates: [Number(value("longitude")) || 113.2644, Number(value("latitude")) || 23.1291],
    contact: { phone: value("contact.phone"), address: value("contact.address"), nearestStation: value("contact.nearestStation"), booking: value("contact.booking") }
  };
}

async function saveDraft({ quiet = false } = {}) {
  setButtons(true);
  try {
    activeReport = (await api(`/api/admin/reports/${activeReport.id}`, { method: "PATCH", body: JSON.stringify({ venueDraft: readForm() }) })).report;
    if (!quiet) toast("草稿已保存");
    return true;
  } catch (error) { toast(error.message, true); return false; }
  finally { setButtons(false); }
}

async function reanalyze() {
  if (!confirm("重新分析会覆盖当前AI草稿，确定继续吗？")) return;
  setButtons(true);
  try { activeReport = (await api(`/api/admin/reports/${activeReport.id}/reanalyze`, { method: "POST" })).report; renderReview(); toast("重新分析完成"); }
  catch (error) { toast(error.message, true); }
  finally { setButtons(false); }
}

async function publish() {
  if (!confirm("确认将当前内容发布到用户前端吗？")) return;
  if (!await saveDraft({ quiet: true })) return;
  setButtons(true);
  try { await api(`/api/admin/reports/${activeReport.id}/publish`, { method: "POST" }); toast("发布成功，用户前端刷新后即可读取新内容"); await loadReports(); }
  catch (error) { toast(`${error.message}${error.details?.length ? `：${error.details.join("、")}` : ""}`, true); }
  finally { setButtons(false); }
}

function setButtons(disabled) { panel.querySelectorAll("button").forEach(button => { button.disabled = disabled; }); }
function toast(message, isError = false) { const element = panel.querySelector("#toast"); if (!element) return; element.hidden = false; element.classList.toggle("is-error", isError); element.textContent = message; clearTimeout(toast.timer); toast.timer = setTimeout(() => { element.hidden = true; }, 5000); }
function statusText(status) { return ({ analyzing: "分析中", needs_review: "待审核", analysis_failed: "分析失败", published: "已发布" })[status] || status; }
function showPanelError(message) { panel.innerHTML = `<div class="empty-state"><strong>读取失败</strong><p>${escapeHtml(message)}</p></div>`; }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[char]); }
