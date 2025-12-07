import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User profiles with job search preferences
 */
export const profiles = mysqlTable("profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  fullName: text("fullName"),
  city: text("city"),
  country: text("country"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  minSalary: int("minSalary"), // annual, base currency
  maxSalary: int("maxSalary"),
  currency: varchar("currency", { length: 10 }).default("USD"),
  experienceYears: int("experienceYears"),
  currentRoleTitle: text("currentRoleTitle"),
  desiredTitle: text("desiredTitle"),
  workModePreferences: json("workModePreferences").$type<string[]>(), // ['remote','hybrid','onsite']
  perksPreferences: json("perksPreferences").$type<Record<string, boolean>>(), // {companyCar: true, etc}
  skills: json("skills").$type<string[]>(), // plain list of skills
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

/**
 * Uploaded resumes/CVs
 */
export const resumes = mysqlTable("resumes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  fileUrl: text("fileUrl").notNull(), // S3 URL
  fileKey: text("fileKey").notNull(), // S3 key for reference
  originalFilename: text("originalFilename"),
  mimeType: varchar("mimeType", { length: 100 }),
  parsedText: text("parsedText"), // extracted plain text body
  parsedAt: timestamp("parsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Resume = typeof resumes.$inferSelect;
export type InsertResume = typeof resumes.$inferInsert;

/**
 * Job listings
 */
export const jobs = mysqlTable("jobs", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 255 }).unique(), // reference to source job board
  title: text("title").notNull(),
  companyName: text("companyName").notNull(),
  companyLogoUrl: text("companyLogoUrl"),
  city: text("city"),
  country: text("country"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  salaryMin: int("salaryMin"),
  salaryMax: int("salaryMax"),
  currency: varchar("currency", { length: 10 }).default("USD"),
  workMode: mysqlEnum("workMode", ["remote", "hybrid", "onsite"]),
  employmentType: varchar("employmentType", { length: 50 }).default("full-time"),
  summary: text("summary"), // short description
  description: text("description"), // full job description
  perks: json("perks").$type<Record<string, boolean>>(), // {salarySacrifice: true, wfh: true, etc}
  applyUrl: text("applyUrl"), // where we actually POST / redirect applications
  source: varchar("source", { length: 100 }), // e.g. "seek", "indeed", "internal"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

/**
 * User swipe decisions on jobs
 */
export const swipes = mysqlTable("swipes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobId: int("jobId").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  decision: mysqlEnum("decision", ["like", "dislike"]).notNull(),
  qualifiedFlag: boolean("qualifiedFlag"), // AI judgment at swipe time
  qualifiedReason: text("qualifiedReason"), // short explanation
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  undoneAt: timestamp("undoneAt"), // if user undoes swipe
});

export type Swipe = typeof swipes.$inferSelect;
export type InsertSwipe = typeof swipes.$inferInsert;

/**
 * Job applications (queued or submitted)
 */
export const applications = mysqlTable("applications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobId: int("jobId").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  swipeId: int("swipeId").references(() => swipes.id, { onDelete: "set null" }),
  status: mysqlEnum("status", ["queued", "submitted", "failed"]).default("queued").notNull(),
  submittedAt: timestamp("submittedAt"),
  failureReason: text("failureReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;
