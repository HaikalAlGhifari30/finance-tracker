import { pgTable, text, timestamp, boolean, decimal } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("emailVerified").notNull(),
	image: text("image"),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull(),
	role: text("role").default("USER"),
	npwp: text("npwp"),
	phoneNumber: text("phoneNumber")
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expiresAt").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull(),
	ipAddress: text("ipAddress"),
	userAgent: text("userAgent"),
	userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" })
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("accountId").notNull(),
	providerId: text("providerId").notNull(),
	userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("accessToken"),
	refreshToken: text("refreshToken"),
	idToken: text("idToken"),
	accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
	refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("createdAt").notNull(),
	updatedAt: timestamp("updatedAt").notNull()
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expiresAt").notNull(),
	createdAt: timestamp("createdAt"),
	updatedAt: timestamp("updatedAt")
});

export const categories = pgTable("categories", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
	type: text("type").notNull().default("EXPENSE")
});

export const goals = pgTable("goals", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	targetAmount: decimal("targetAmount", { precision: 15, scale: 2 }).notNull(),
	userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
	createdAt: timestamp("createdAt").notNull(),
	isMain: boolean("isMain").default(false).notNull()
});

export const expenses = pgTable("expenses", {
	id: text("id").primaryKey(),
	amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
	description: text("description"),
	categoryId: text("categoryId").notNull().references(() => categories.id, { onDelete: "cascade" }),
	userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
	date: timestamp("date").notNull(),
	source: text("source").notNull().default("MAIN"), // MAIN or SAVINGS
	goalId: text("goalId").references(() => goals.id, { onDelete: "set null" })
});

export const income = pgTable("income", {
	id: text("id").primaryKey(),
	amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
	description: text("description"),
	categoryId: text("categoryId").references(() => categories.id, { onDelete: "set null" }),
	userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
	date: timestamp("date").notNull(),
	source: text("source").notNull().default("MAIN") // MAIN or SAVINGS
});

export const settings = pgTable("settings", {
	key: text("key").primaryKey(),
	value: text("value").notNull()
});

export const accounts = pgTable("accounts", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	type: text("type").notNull(), // BANK / EWALLET / CASH
	accountNumber: text("accountNumber"),
	userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
	createdAt: timestamp("createdAt").notNull(),
});

export const transactions = pgTable("transactions", {
	id: text("id").primaryKey(),
	amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
	description: text("description"),
	date: timestamp("date").notNull(),
	userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
	type: text("type").notNull(), // INCOME / EXPENSE / TRANSFER
	categoryId: text("categoryId").references(() => categories.id, { onDelete: "set null" }),
	accountId: text("accountId").references(() => accounts.id, { onDelete: "set null" }),
	destinationAccountId: text("destinationAccountId").references(() => accounts.id, { onDelete: "set null" }), // for transfers
	goalId: text("goalId").references(() => goals.id, { onDelete: "set null" }),
	destinationGoalId: text("destinationGoalId").references(() => goals.id, { onDelete: "set null" }),
	createdAt: timestamp("createdAt").notNull(),
});

export const budgetPeriods = pgTable("budget_periods", {
	id: text("id").primaryKey(),
	userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
	month: text("month").notNull(), // "1" to "12"
	year: text("year").notNull(), // e.g., "2026"
	createdAt: timestamp("createdAt").notNull(),
});

export const budgetItems = pgTable("budget_items", {
	id: text("id").primaryKey(),
	periodId: text("periodId").notNull().references(() => budgetPeriods.id, { onDelete: "cascade" }),
	categoryId: text("categoryId").notNull().references(() => categories.id, { onDelete: "cascade" }),
	amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
});
