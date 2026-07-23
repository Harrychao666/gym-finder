const params = new URLSearchParams(location.search);
const taskId = params.get("task") || "";
const token = params.get("token") || "";
const form = document.querySelector("#pilotForm");
const saveState = document.querySelector("#saveState");
const connectionError = document.querySelector("#connectionError");
const submitPanel = document.querySelector("#submitPanel");
const validationPanel = document.querySelector("#validationPanel");

let task;
let schema;
let answers;
let saveTimer;
let saving = false;
let saveAgain = false;

const sections = [
  ["profile", "基础信息"], ["sessions", "四次训练"], ["prices", "价格费用"], ["equipment", "器械盘点"],
  ["crowd", "拥挤情况"], ["hygiene", "环境卫生"], ["sales", "销售办卡"], ["beginner", "新手友好"],
  ["evidence", "证据上传"], ["final", "统一复核"]
];

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}

function binding(path) {
  return escapeHtml(JSON.stringify(path));
}

function getValue(path) {
  return path.reduce((current, key) => current?.[key], answers);
}

function setValue(path, value) {
  let current = answers;
  path.slice(0, -1).forEach(key => { current = current[key]; });
  current[path.at(-1)] = value;
}

function input(path, type = "text", options = {}) {
  const value = getValue(path) ?? "";
  const attrs = [`type="${type}"`, `data-bind="${binding(path)}"`];
  if (options.placeholder) attrs.push(`placeholder="${escapeHtml(options.placeholder)}"`);
  if (options.min !== undefined) attrs.push(`min="${options.min}"`);
  if (options.max !== undefined) attrs.push(`max="${options.max}"`);
  if (type === "checkbox") attrs.push(value ? "checked" : "");
  else attrs.push(`value="${escapeHtml(value)}"`);
  return `<input ${attrs.join(" ")} />`;
}

function textarea(path, placeholder = "") {
  return `<textarea data-bind="${binding(path)}" placeholder="${escapeHtml(placeholder)}">${escapeHtml(getValue(path) || "")}</textarea>`;
}

function select(path, options, placeholder = "请选择") {
  const value = getValue(path) || "";
  return `<select data-bind="${binding(path)}"><option value="">${placeholder}</option>${options.map(option => `<option value="${escapeHtml(option)}" ${value === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select>`;
}

function section(id, index, title, help, content) {
  return `<section class="form-section" id="${id}"><div class="section-head"><div><span class="section-index">${String(index).padStart(2, "0")}</span><h2>${title}</h2><p>${help}</p></div></div>${content}</section>`;
}

function renderProfile() {
  return section("profile", 1, "基础信息", "这份记录会固定保存所使用的表格版本和评分版本。", `<div class="field-grid">
    <label class="field"><span>场馆名称（必填）</span>${input(["profile", "venueName"], "text", { placeholder: "填写实际测评场馆" })}</label>
    <label class="field"><span>体验官姓名/编号（必填）</span>${input(["profile", "evaluatorName"])}</label>
    <label class="field"><span>体验开始日期（必填）</span>${input(["profile", "periodStart"], "date")}</label>
    <label class="field"><span>体验结束日期（必填）</span>${input(["profile", "periodEnd"], "date")}</label>
    <label class="field wide"><span>联系方式（选填，仅项目内部使用）</span>${input(["profile", "contact"])}</label>
  </div>`);
}

function renderSessions() {
  const cards = answers.sessions.map((record, index) => `<article class="record-card"><h3>第${index + 1}次真实训练</h3><div class="field-grid three">
    <label class="field"><span>日期</span>${input(["sessions", index, "date"], "date")}</label>
    <label class="field"><span>入场时间</span>${input(["sessions", index, "start"], "time")}</label>
    <label class="field"><span>离场时间</span>${input(["sessions", index, "end"], "time")}</label>
    <label class="field"><span>训练时长</span>${input(["sessions", index, "duration"], "text", { placeholder: "例如90分钟" })}</label>
    <label class="check-field">${input(["sessions", index, "isPeak"], "checkbox")}<span>属于工作日18:00–21:00晚高峰</span></label>
    <label class="field wide"><span>本次训练内容</span>${textarea(["sessions", index, "content"], "记录实际完成的训练内容")}</label>
  </div></article>`).join("");
  return section("sessions", 2, "四次真实训练", "7天内完成4次训练，其中至少一次覆盖工作日晚高峰。", cards);
}

function renderPrices() {
  const cardRows = schema.cardTypes.map(name => `<tr><td>${name}</td><td>${input(["prices", name, "provided"], "checkbox")}</td><td>${input(["prices", name, "amount"])}</td><td>${input(["prices", name, "validity"])}</td><td>${select(["prices", name, "source"], ["前台", "价目表", "合同", "其他"])}</td><td>${input(["prices", name, "note"])}</td></tr>`).join("");
  const feeRows = schema.extraFeeTypes.map(name => `<tr><td>${name}</td><td>${input(["extraFees", name, "rule"])}</td><td>${select(["extraFees", name, "disclosed"], ["是", "否", "不适用"])}</td><td>${input(["extraFees", name, "note"])}</td></tr>`).join("");
  return section("prices", 3, "价格与额外费用", "至少完整核验一种实际提供的卡项；不存在的费用明确填写“无”。", `
    <h3>卡项价格</h3><div class="table-wrap"><table class="data-table"><thead><tr><th>卡项</th><th>提供</th><th>金额</th><th>有效期/次数</th><th>来源</th><th>证据/备注</th></tr></thead><tbody>${cardRows}</tbody></table></div>
    <h3>可能的额外费用</h3><div class="table-wrap"><table class="data-table"><thead><tr><th>项目</th><th>收费/规则</th><th>是否主动告知</th><th>证据/说明</th></tr></thead><tbody>${feeRows}</tbody></table></div>`);
}

function renderEquipment() {
  const groups = schema.equipmentCategories.map((category, categoryIndex) => {
    const rows = category.items.map(name => `<tr><td>${escapeHtml(name)}</td><td>${input(["equipment", category.id, name, "total"], "number", { min: 0 })}</td><td>${input(["equipment", category.id, name, "available"], "number", { min: 0 })}</td><td>${input(["equipment", category.id, name, "wait"])}</td><td>${input(["equipment", category.id, name, "note"], "text", { placeholder: "数量不一致时必填" })}</td></tr>`).join("");
    return `<details class="equipment-group" ${categoryIndex === 0 ? "open" : ""}><summary>${category.label} · ${category.items.length}项</summary><div class="table-wrap"><table class="data-table"><thead><tr><th>器械/项目</th><th>总数</th><th>可用数</th><th>最长等待</th><th>证据/备注</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
  }).join("");
  return section("equipment", 4, "器械盘点", "没有的器械总数和可用数都填0；两者不一致时必须说明原因。", groups);
}

function renderCrowd() {
  const rows = answers.crowd.map((_, index) => `<tr><td>第${index + 1}次</td><td>${input(["crowd", index, "observedAt"], "datetime-local")}</td><td>${input(["crowd", index, "cardioVacancies"], "number", { min: 0 })}</td><td>${input(["crowd", index, "cableVacancies"], "number", { min: 0 })}</td><td>${input(["crowd", index, "maxWait"], "number", { min: 0 })}</td><td>${select(["crowd", index, "state"], ["宽松", "一般", "高峰"])}</td></tr>`).join("");
  return section("crowd", 5, "拥挤情况", "每次选择固定10分钟观察窗口；晚高峰那次必须填写。", `<div class="table-wrap"><table class="data-table"><thead><tr><th>记录</th><th>观察时间</th><th>有氧空位</th><th>龙门架空位</th><th>最长等待/分钟</th><th>现场判断</th></tr></thead><tbody>${rows}</tbody></table></div>`);
}

function renderHygiene() {
  const rows = schema.hygieneAreas.map(name => `<tr><td>${name}</td><td>${select(["hygiene", name, "status"], ["好", "一般", "差", "无"])}</td><td>${input(["hygiene", name, "note"])}</td></tr>`).join("");
  return section("hygiene", 6, "环境与卫生", "只记录实际使用或亲眼观察到的区域；没有的设施选择“无”。", `<div class="table-wrap"><table class="data-table"><thead><tr><th>区域</th><th>状态</th><th>观察事实/备注</th></tr></thead><tbody>${rows}</tbody></table></div>`);
}

function renderSales() {
  const rows = schema.salesQuestions.map(question => `<tr><td>${question.label}</td><td>${select(["sales", question.id, "result"], question.options)}</td><td>${input(["sales", question.id, "note"])}</td></tr>`).join("");
  return section("sales", 7, "销售与办卡体验", "至少完成一次完整咨询，不要求实际购买长期卡。", `<div class="table-wrap"><table class="data-table"><thead><tr><th>观察项</th><th>结果</th><th>证据/备注</th></tr></thead><tbody>${rows}</tbody></table></div>`);
}

function renderBeginner() {
  const rows = schema.beginnerQuestions.map(question => `<tr><td>${question.label}</td><td>${select(["beginner", question.id, "result"], question.options)}</td><td>${input(["beginner", question.id, "fact"], "text", { placeholder: "记录具体事实或原话" })}</td></tr>`).join("");
  return section("beginner", 8, "新手友好", "记录亲自尝试、询问或观察到的事实，不凭印象推测。", `<div class="table-wrap"><table class="data-table"><thead><tr><th>环节</th><th>观察结果</th><th>具体事实/原话</th></tr></thead><tbody>${rows}</tbody></table></div>`);
}

function renderEvidence() {
  const list = (task.evidence || []).map(item => `<div class="evidence-item"><span><strong>${escapeHtml(item.originalName)}</strong> · ${escapeHtml(item.module)}</span><small>${Math.ceil(item.size / 1024)} KB</small></div>`).join("") || "<p>还没有上传证据。</p>";
  return section("evidence", 9, "证据上传", "支持JPG、PNG、WebP和PDF，单个文件不超过12MB。", `<div class="evidence-zone">
    <label class="field"><span>证据所属模块</span><select id="evidenceModule"><option>价格费用</option><option>器械情况</option><option>拥挤情况</option><option>环境卫生</option><option>销售办卡</option><option>新手友好</option><option>其他</option></select></label>
    <input id="evidenceFiles" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple />
    <button id="uploadEvidence" type="button">上传所选文件</button>
    <div class="evidence-list" id="evidenceList">${list}</div>
  </div>`);
}

function renderFinal() {
  return section("final", 10, "第7天统一复核", "体验官只提交事实、证据和结论，不自行填写平台总分。", `<div class="field-grid">
    <label class="field wide"><span>体验官综合结论（80–150字）</span>${textarea(["final", "conclusion"], "概括实际体验，不写宣传式口号")}</label>
    <label class="field wide"><span>最推荐的三点</span>${textarea(["final", "recommendations"], "请分三点填写")}</label>
    <label class="field wide"><span>办卡前必须知道的三点</span>${textarea(["final", "cautions"], "请分三点填写")}</label>
    <label class="field"><span>适合人群（选填）</span>${textarea(["final", "fit"])}</label>
    <label class="field"><span>不适合人群（选填）</span>${textarea(["final", "unfit"])}</label>
  </div>`);
}

function render() {
  form.innerHTML = [renderProfile(), renderSessions(), renderPrices(), renderEquipment(), renderCrowd(), renderHygiene(), renderSales(), renderBeginner(), renderEvidence(), renderFinal()].join("");
  document.querySelector("#sectionNav").innerHTML = sections.map(([id, label]) => `<a href="#${id}">${label}</a>`).join("");
  document.querySelector("#taskTitle").textContent = task.title;
  document.querySelector("#taskMeta").textContent = `${task.formVersion} · ${task.scoringVersion} · ${task.venueLabel}`;
  submitPanel.hidden = task.status === "submitted";
  if (task.status === "submitted") form.insertAdjacentHTML("afterbegin", `<div class="submitted-banner">本次测评已于${new Date(task.submittedAt).toLocaleString("zh-CN")}提交，页面已锁定。</div>`);
  form.querySelectorAll("input, select, textarea, button").forEach(element => { if (task.status === "submitted") element.disabled = true; });
  document.querySelector("#uploadEvidence")?.addEventListener("click", uploadEvidence);
  updateProgress();
}

function updateProgress() {
  const controls = [...form.querySelectorAll("[data-bind]")].filter(control => control.type !== "checkbox");
  const completed = controls.filter(control => String(control.value).trim() !== "").length;
  const value = controls.length ? Math.round(completed / controls.length * 100) : 0;
  document.querySelector("#progressValue").textContent = value;
  document.querySelector("#progressBar").style.width = `${value}%`;
}

function scheduleSave() {
  saveState.textContent = "有更改，等待保存…";
  saveState.dataset.state = "pending";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDraft, 900);
}

async function saveDraft() {
  if (saving) { saveAgain = true; return; }
  saving = true;
  saveState.textContent = "正在保存…";
  try {
    const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}/draft`, {
      method: "PUT",
      headers: { "content-type": "application/json", "x-task-token": token },
      body: JSON.stringify({ formVersion: task.formVersion, answers })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "保存失败");
    saveState.textContent = `已自动保存 ${new Date(payload.savedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
    saveState.dataset.state = "saved";
  } catch (error) {
    saveState.textContent = error.message;
    saveState.dataset.state = "error";
  } finally {
    saving = false;
    if (saveAgain) { saveAgain = false; saveDraft(); }
  }
}

async function uploadEvidence() {
  const files = [...document.querySelector("#evidenceFiles").files];
  const module = document.querySelector("#evidenceModule").value;
  if (!files.length) return alert("请先选择文件");
  const button = document.querySelector("#uploadEvidence");
  button.disabled = true;
  try {
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      button.textContent = `正在上传 ${index + 1}/${files.length}`;
      const query = new URLSearchParams({ name: file.name, module });
      const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}/evidence?${query}`, { method: "POST", headers: { "content-type": file.type, "x-task-token": token }, body: file });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "上传失败");
      task.evidence.push(payload.evidence);
    }
    const refreshed = await loadTask();
    task = refreshed;
    render();
  } catch (error) {
    alert(error.message);
  } finally {
    button.disabled = false;
    button.textContent = "上传所选文件";
  }
}

async function submitTask() {
  await saveDraft();
  const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}/submit`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-task-token": token },
    body: JSON.stringify({ answers })
  });
  const payload = await response.json();
  if (response.status === 422) {
    validationPanel.hidden = false;
    validationPanel.innerHTML = `<h3>还有${payload.missing.length}项需要完成</h3><ul>${payload.missing.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
    validationPanel.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  if (!response.ok) return alert(payload.error || "提交失败");
  task = await loadTask();
  render();
  validationPanel.hidden = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadTask() {
  const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`, { headers: { "x-task-token": token } });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "无法读取任务");
  return payload;
}

async function init() {
  if (!taskId || !token) throw new Error("体验官链接不完整，请向项目负责人索取完整链接");
  task = await loadTask();
  const schemaResponse = await fetch(`/api/form-versions/${encodeURIComponent(task.formVersion)}`);
  schema = await schemaResponse.json();
  if (!schemaResponse.ok) throw new Error(schema.error || "无法读取表格版本");
  answers = task.answers || schema.emptyAnswers;
  render();
  saveState.textContent = task.status === "submitted" ? "已提交" : "已连接，支持自动保存";
  saveState.dataset.state = "saved";
  form.addEventListener("input", event => {
    const control = event.target.closest("[data-bind]");
    if (!control) return;
    const path = JSON.parse(control.dataset.bind);
    setValue(path, control.type === "checkbox" ? control.checked : control.value);
    updateProgress();
    scheduleSave();
  });
  document.querySelector("#submitTask").addEventListener("click", submitTask);
}

init().catch(error => {
  connectionError.hidden = false;
  connectionError.textContent = error.message;
  saveState.textContent = "连接失败";
  saveState.dataset.state = "error";
});
