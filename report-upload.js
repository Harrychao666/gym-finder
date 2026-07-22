const token = new URLSearchParams(location.search).get("token") || "";
const form = document.querySelector("#reportForm");
const fileInput = document.querySelector("#reportFile");
const fileHint = document.querySelector("#fileHint");
const button = document.querySelector("#submitButton");
const result = document.querySelector("#result");

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  fileHint.textContent = file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB` : "选择已经填写完成的报告";
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  const file = fileInput.files[0];
  if (!token) return show("上传链接缺少访问口令，请联系管理员重新获取。", true);
  if (!file) return show("请选择报告文件。", true);
  button.disabled = true;
  button.textContent = "正在上传并分析…";
  show("报告正在处理，请不要关闭页面。AI分析通常需要几十秒。", false);
  const query = new URLSearchParams({ name: file.name, evaluator: document.querySelector("#evaluatorName").value.trim(), venue: document.querySelector("#venueName").value.trim() });
  try {
    const response = await fetch(`/api/reports?${query}`, { method: "POST", headers: { "x-upload-token": token, "content-type": file.type || "application/octet-stream" }, body: file });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "上传失败");
    const message = body.report.status === "analysis_failed"
      ? `报告已保存，但自动分析暂时失败。管理员仍可在后台查看并重新分析。编号：${body.report.id}`
      : `提交成功。系统已经生成待审核草稿，管理员确认前不会公开发布。编号：${body.report.id}`;
    show(message, body.report.status === "analysis_failed");
    if (body.report.status !== "analysis_failed") form.reset();
  } catch (error) {
    show(error.message, true);
  } finally {
    button.disabled = false;
    button.textContent = "上传并开始分析";
  }
});

function show(message, isError) {
  result.hidden = false;
  result.classList.toggle("is-error", isError);
  result.textContent = message;
}
