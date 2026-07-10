import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "/Users/ushi/Documents/健身房/outputs/user_research";
await fs.mkdir(outputDir, { recursive: true });

const workbook = Workbook.create();
const sheet = workbook.worksheets.add("访谈记录");
sheet.showGridLines = false;

sheet.getRange("A1:D1").merge();
sheet.getRange("A1").values = [["健身房选馆产品｜用户访谈记录"]];
sheet.getRange("A2:D2").merge();
sheet.getRange("A2").values = [["先了解真实经历，再让用户独立操作产品。尽量追问具体发生过的事，不提示正确答案。"]];

sheet.getRange("A4:D6").values = [
  ["受访者编号", "", "访谈日期", ""],
  ["用户状态", "", "访谈方式", "线上"],
  ["所在区域", "", "访谈时长", "约 30 分钟"],
];

sheet.getRange("A8:D8").merge();
sheet.getRange("A8").values = [["第一部分｜用户痛点"]];
sheet.getRange("A9:D9").values = [["编号", "需要问的问题", "用户回复", "关键信号 / 我的结论"]];

const painQuestions = [
  ["P1", "请讲讲你最近一次找健身房的完整过程，最后办卡了吗？", "", ""],
  ["P2", "整个过程中最麻烦或最犹豫的一件事是什么？当时怎么解决？", "", ""],
  ["P3", "哪些重要信息最难找到，或者找到后你不敢相信？为什么？", "", ""],
  ["P4", "有什么事情如果办卡前就知道，会改变你最后的选择？", "", ""],
];
sheet.getRange("A10:D13").values = painQuestions;

sheet.getRange("A15:D15").merge();
sheet.getRange("A15").values = [["第二部分｜产品本身"]];
sheet.getRange("A16:D16").values = [["编号", "需要问的问题", "用户回复", "关键信号 / 我的结论"]];

const productQuestions = [
  ["T1", "先不听介绍，你觉得这个网站主要是帮你解决什么问题？", "", ""],
  ["T2", "这些筛选条件里，哪个最重要？有没有缺少或不需要的条件？", "", ""],
  ["T3", "看到三家推荐后，你第一眼会看什么？你会先选哪一家？为什么？", "", ""],
  ["T4", "页面里哪些信息让你不理解或不信任？需要什么证据才会相信？", "", ""],
  ["T5", "使用完以后，你下一步会去试练、继续搜索，还是暂时不行动？为什么？", "", ""],
];
sheet.getRange("A17:D21").values = productQuestions;

sheet.getRange("A23:D23").merge();
sheet.getRange("A23").values = [["访谈结束后只提炼：最大痛点、最缺信息、是否信任、是否愿意去试练。"]];

sheet.getRange("A1:D1").format = {
  fill: "#111111",
  font: { bold: true, color: "#FFFFFF", size: 18 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
sheet.getRange("A2:D2").format = {
  fill: "#111111",
  font: { color: "#B8B8B8", size: 10 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  wrapText: true,
};

sheet.getRange("A4:D6").format = {
  fill: "#F4F4F4",
  font: { color: "#222222", size: 10 },
  borders: { preset: "all", style: "thin", color: "#D8D8D8" },
  verticalAlignment: "center",
};
sheet.getRange("A4:A6").format.font = { bold: true, color: "#222222", size: 10 };
sheet.getRange("C4:C6").format.font = { bold: true, color: "#222222", size: 10 };
sheet.getRange("B4:B6").format.fill = "#FFF7E8";
sheet.getRange("D4:D6").format.fill = "#FFF7E8";

for (const sectionRange of ["A8:D8", "A15:D15"]) {
  sheet.getRange(sectionRange).format = {
    fill: "#242424",
    font: { bold: true, color: "#FFFFFF", size: 13 },
    verticalAlignment: "center",
  };
}

for (const headerRange of ["A9:D9", "A16:D16"]) {
  sheet.getRange(headerRange).format = {
    fill: "#E7E7E7",
    font: { bold: true, color: "#222222", size: 10 },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    borders: { preset: "all", style: "thin", color: "#C9C9C9" },
  };
}

for (const bodyRange of ["A10:D13", "A17:D21"]) {
  sheet.getRange(bodyRange).format = {
    font: { color: "#222222", size: 10 },
    verticalAlignment: "top",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: "#D8D8D8" },
  };
}

sheet.getRange("A10:A13").format = {
  fill: "#F2F2F2",
  font: { bold: true, color: "#555555", size: 10 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  borders: { preset: "all", style: "thin", color: "#D8D8D8" },
};
sheet.getRange("A17:A21").format = {
  fill: "#F2F2F2",
  font: { bold: true, color: "#555555", size: 10 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  borders: { preset: "all", style: "thin", color: "#D8D8D8" },
};
sheet.getRange("C10:D13").format.fill = "#FFF8EC";
sheet.getRange("C17:D21").format.fill = "#FFF8EC";

sheet.getRange("A23:D23").format = {
  fill: "#FFF0D8",
  font: { bold: true, color: "#8A4B00", size: 10 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  wrapText: true,
  borders: { preset: "outside", style: "thin", color: "#E9B96E" },
};

sheet.getRange("B5").dataValidation = {
  rule: {
    type: "list",
    values: ["正在选馆", "刚办卡", "办卡后后悔", "准备换馆"],
  },
};

sheet.getRange("A1:D23").format.font.name = "Arial";
sheet.getRange("A1:D23").format.columnWidth = 12;
sheet.getRange("A1:A23").format.columnWidth = 10;
sheet.getRange("B1:B23").format.columnWidth = 38;
sheet.getRange("C1:C23").format.columnWidth = 48;
sheet.getRange("D1:D23").format.columnWidth = 34;

sheet.getRange("A1:D1").format.rowHeight = 34;
sheet.getRange("A2:D2").format.rowHeight = 28;
sheet.getRange("A4:D6").format.rowHeight = 24;
sheet.getRange("A8:D9").format.rowHeight = 25;
sheet.getRange("A15:D16").format.rowHeight = 25;
sheet.getRange("A10:D13").format.rowHeight = 62;
sheet.getRange("A17:D21").format.rowHeight = 62;
sheet.getRange("A23:D23").format.rowHeight = 30;

sheet.freezePanes.freezeRows(9);

const preview = await workbook.render({
  sheetName: "访谈记录",
  range: "A1:D23",
  scale: 1.4,
  format: "png",
});
await fs.writeFile(`${outputDir}/用户访谈记录表预览.png`, new Uint8Array(await preview.arrayBuffer()));

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(`${outputDir}/健身房用户访谈记录表.xlsx`);

const inspection = await workbook.inspect({
  kind: "table",
  range: "访谈记录!A1:D23",
  include: "values,formulas",
  tableMaxRows: 25,
  tableMaxCols: 5,
});
console.log(inspection.ndjson);
