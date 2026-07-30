const token = new URLSearchParams(location.search).get("token") || "";
const form = document.querySelector("#reportForm");
const fileInput = document.querySelector("#reportFile");
const fileHint = document.querySelector("#fileHint");
const button = document.querySelector("#submitButton");
const result = document.querySelector("#result");

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  fileHint.textContent = file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB` : "选择填写完成的最新版报告";
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  const file = fileInput.files[0];
  if (!token) return show("上传链接缺少访问口令，请联系管理员重新获取。", true);
  if (!file) return show("请选择报告文件。", true);
  const venueName = document.querySelector("#venueName").value.trim();
  const venueDistrict = document.querySelector("#venueDistrict").value.trim();
  if (!venueName) return show("请填写体验场馆的完整名称。", true);
  button.disabled = true;
  button.textContent = "正在上传、建档并分析…";
  showProgress();
  const query = new URLSearchParams({
    name: file.name,
    evaluator: document.querySelector("#evaluatorName").value.trim(),
    venue: venueName,
    district: venueDistrict
  });
  try {
    const response = await fetch(`/api/reports?${query}`, { method: "POST", headers: { "x-upload-token": token, "content-type": file.type || "application/octet-stream" }, body: file });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "上传失败");
    showSuccess(body.report || {});
    form.reset();
    fileHint.textContent = "选择填写完成的最新版报告";
  } catch (error) {
    show(error.message, true);
  } finally {
    button.disabled = false;
    button.textContent = "上传并自动建档";
  }
});

function show(message, isError) {
  result.hidden = false;
  result.classList.toggle("is-error", isError);
  result.classList.remove("is-progress", "is-success");
  result.textContent = message;
}

function showProgress() {
  result.hidden = false;
  result.className = "result is-progress";
  result.innerHTML = '<strong>正在上传并建立场馆档案</strong><p>系统会继续提取价格、5 次客流观察、03A–03I 器械与完整报告，请不要关闭页面。</p><div class="progress-bar" aria-hidden="true"><i></i></div>';
}

function showSuccess(report) {
  const failed = report.status === "analysis_failed";
  const draft = report.venueDraft || report.draft || {};
  const pricing = draft.pricing || {};
  const planCount = Array.isArray(pricing.plans) ? pricing.plans.filter(plan => hasValue(plan?.amount)).length : countLegacyPlans(draft);
  const crowdCount = Array.isArray(draft.crowdObservations) ? draft.crowdObservations.length : 0;
  const equipmentCount = Array.isArray(draft.equipmentInventory) ? draft.equipmentInventory.length : 0;
  const modules = Array.isArray(draft.scoreModules) ? draft.scoreModules.length : 0;
  const structureAvailable = planCount || crowdCount || equipmentCount || modules;
  result.hidden = false;
  result.className = `result ${failed ? "is-error" : "is-success"}`;
  result.innerHTML = failed
    ? `<strong>报告已保存，自动分析暂未完成</strong><p>场馆草稿档案已经建立，平台管理员可在审核后台重新分析；原始报告不会丢失。</p><small>报告编号：${escapeHtml(report.id || "待生成")}</small>`
    : `<strong>提交成功，已进入待审核流程</strong>
      <p>审核员会核对结构化数据和现场证据，发布后用户看到的就是新版场馆卡片。</p>
      ${structureAvailable ? `<div class="result-grid">
        <span><b>${planCount}</b>种价格已识别</span>
        <span><b>${crowdCount}</b>次客流观察</span>
        <span><b>${equipmentCount}</b>类器械</span>
        <span><b>${modules}</b>个评分模块</span>
      </div>` : '<p class="pending-analysis">文件已入库；结构化分析会在后台继续完成。</p>'}
      <small>报告编号：${escapeHtml(report.id || "待生成")} · 状态：${escapeHtml(statusText(report.status))}</small>`;
}

function countLegacyPlans(draft) {
  return ["trialPrice", "weeklyPrice", "monthlyPrice", "quarterlyPrice", "annualPrice"].filter(key => hasValue(draft[key])).length;
}

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function statusText(status) {
  return ({ analyzing: "分析中", needs_review: "待审核", published: "已发布", rejected: "待补充" })[status] || "待审核";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[char]);
}
