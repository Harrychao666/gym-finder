import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  venueId: text("venue_id"),
  venueName: text("venue_name").notNull().default(""),
  evaluatorName: text("evaluator_name").notNull().default(""),
  status: text("status").notNull(),
  originalName: text("original_name").notNull(),
  r2Key: text("r2_key").notNull(),
  fileSize: integer("file_size").notNull(),
  extractedText: text("extracted_text").notNull(),
  analysisJson: text("analysis_json"),
  analysisMode: text("analysis_mode"),
  analysisModel: text("analysis_model"),
  analysisError: text("analysis_error"),
  openaiResponseId: text("openai_response_id"),
  venueDraftJson: text("venue_draft_json"),
  reviewNotes: text("review_notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  publishedAt: text("published_at")
});

export const venueReviewers = sqliteTable("venue_reviewers", {
  venueId: text("venue_id").primaryKey(),
  reviewerName: text("reviewer_name").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const publishedVenues = sqliteTable("published_venues", {
  id: text("id").primaryKey(),
  venueJson: text("venue_json").notNull(),
  visible: integer("visible").notNull().default(1),
  version: integer("version").notNull().default(1),
  reportId: text("report_id").notNull(),
  publishedAt: text("published_at").notNull(),
  hiddenAt: text("hidden_at")
});

export const venueChangeLog = sqliteTable("venue_change_log", {
  id: text("id").primaryKey(),
  venueId: text("venue_id").notNull(),
  reportId: text("report_id"),
  actorRole: text("actor_role").notNull(),
  actorName: text("actor_name").notNull(),
  action: text("action").notNull(),
  changesJson: text("changes_json").notNull(),
  note: text("note"),
  createdAt: text("created_at").notNull()
});
