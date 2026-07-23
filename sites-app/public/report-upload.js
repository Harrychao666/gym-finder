const token = new URLSearchParams(location.search).get("token") || "";
const form = document.querySelector("#reportForm");
const fileInput = document.querySelector("#reportFile");
const fileHint = document.querySelector("#fileHint");
const button = document.querySelector("#submitButton");
const result = document.querySelector("#result");

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  fileHint.textContent = file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB` : "选择填写完成的 V1.1 报告";
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
  show("系统正在保存报告并建立场馆草稿档案，请不要关闭页面。", false);
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
    const message = body.report.status === "analysis_failed"
      ? `提交成功，场馆草稿档案已经建立。自动分析暂时失败，平台管理员可在后台重新分析。编号：${body.report.id}`
      : `提交成功。场馆草稿档案和待审核报告已经建立，平台管理员会分配审核员。编号：${body.report.id}`;
    show(message, false);
    form.reset();
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
  result.textContent = message;
}
