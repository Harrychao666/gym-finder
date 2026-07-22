import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { createEmptyAnswers, FORM_VERSION, SCORING_VERSION } from "./form-schema.mjs";

export class PilotStore {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.file = path.join(dataDir, "store.json");
    this.uploadDir = path.join(dataDir, "uploads");
    this.writeQueue = Promise.resolve();
  }

  async init() {
    await mkdir(this.uploadDir, { recursive: true });
    try {
      await readFile(this.file, "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      const now = new Date().toISOString();
      const initial = {
        createdAt: now,
        adminToken: process.env.ADMIN_TOKEN || randomBytes(18).toString("hex"),
        uploadToken: process.env.UPLOAD_TOKEN || randomBytes(18).toString("hex"),
        reports: {},
        publishedVenues: {},
        tasks: {
          "pilot-001": {
            id: "pilot-001",
            accessToken: randomBytes(18).toString("hex"),
            title: "首轮同学试跑",
            venueLabel: "待确定场馆",
            formVersion: FORM_VERSION,
            scoringVersion: SCORING_VERSION,
            status: "draft",
            answers: createEmptyAnswers(),
            evidence: [],
            createdAt: now,
            updatedAt: now,
            submittedAt: null
          }
        }
      };
      await this.atomicWrite(initial);
    }
  }

  async read() {
    const data = JSON.parse(await readFile(this.file, "utf8"));
    let changed = false;
    if (!data.adminToken) { data.adminToken = process.env.ADMIN_TOKEN || randomBytes(18).toString("hex"); changed = true; }
    if (!data.uploadToken) { data.uploadToken = process.env.UPLOAD_TOKEN || randomBytes(18).toString("hex"); changed = true; }
    if (!data.reports) { data.reports = {}; changed = true; }
    if (!data.publishedVenues) { data.publishedVenues = {}; changed = true; }
    if (changed) await this.atomicWrite(data);
    return data;
  }

  async atomicWrite(data) {
    const temp = `${this.file}.${process.pid}.tmp`;
    await writeFile(temp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    await rename(temp, this.file);
  }

  async update(mutator) {
    this.writeQueue = this.writeQueue.then(async () => {
      const data = await this.read();
      const result = await mutator(data);
      await this.atomicWrite(data);
      return result;
    });
    return this.writeQueue;
  }

  async getTask(id) {
    const data = await this.read();
    return data.tasks[id] || null;
  }

  async updateTask(id, mutator) {
    return this.update(data => {
      const task = data.tasks[id];
      if (!task) return null;
      const result = mutator(task);
      task.updatedAt = new Date().toISOString();
      return result ?? task;
    });
  }

  async getSecrets() {
    const data = await this.read();
    return { adminToken: data.adminToken, uploadToken: data.uploadToken };
  }

  async listReports() {
    const data = await this.read();
    return Object.values(data.reports).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getReport(id) {
    const data = await this.read();
    return data.reports[id] || null;
  }

  async createReport(report) {
    return this.update(data => { data.reports[report.id] = report; return report; });
  }

  async updateReport(id, mutator) {
    return this.update(data => {
      const report = data.reports[id];
      if (!report) return null;
      const result = mutator(report, data);
      report.updatedAt = new Date().toISOString();
      return result ?? report;
    });
  }

  async listPublishedVenues() {
    const data = await this.read();
    return Object.values(data.publishedVenues).filter(item => item.visible !== false).map(item => item.venue);
  }
}
