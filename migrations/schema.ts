import { pgTable, serial, varchar, text, timestamp, unique, index, foreignKey, integer, boolean, jsonb, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const tasks = pgTable("tasks", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	status: varchar({ length: 50 }).default('pending'),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: varchar({ length: 50 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("users_username_key").on(table.username),
	unique("users_email_key").on(table.email),
]);

export const accounts = pgTable("accounts", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	auth0Sub: varchar("auth0_sub", { length: 255 }).notNull(),
	name: varchar({ length: 100 }),
	nickname: varchar({ length: 100 }),
	email: varchar({ length: 255 }),
	emailVerified: boolean("email_verified").default(false),
	picture: varchar({ length: 1000 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_accounts_auth0_sub").using("btree", table.auth0Sub.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "accounts_user_id_fkey"
		}),
	unique("accounts_auth0_sub_key").on(table.auth0Sub),
]);

export const devices = pgTable("devices", {
	id: serial().primaryKey().notNull(),
	deviceNumber: varchar("device_number", { length: 255 }).notNull(),
	phoneModel: varchar("phone_model", { length: 100 }),
	countryCode: varchar("country_code", { length: 10 }),
	version: varchar({ length: 20 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	loginType: integer("login_type").default(1),
}, (table) => [
	index("idx_devices_device_number").using("btree", table.deviceNumber.asc().nullsLast().op("text_ops")),
	unique("devices_device_number_key").on(table.deviceNumber),
]);

export const appNames = pgTable("app_names", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: varchar({ length: 255 }),
	bundleId: varchar("bundle_id", { length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_app_names_name").using("btree", table.name.asc().nullsLast().op("text_ops")),
	unique("app_names_name_key").on(table.name),
]);

export const responses = pgTable("responses", {
	id: serial().primaryKey().notNull(),
	deviceId: varchar("device_id", { length: 100 }).notNull(),
	language: varchar({ length: 10 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
});

export const answers = pgTable("answers", {
	id: serial().primaryKey().notNull(),
	responseId: integer("response_id"),
	questionKey: varchar("question_key", { length: 50 }).notNull(),
	answerContent: jsonb("answer_content").notNull(),
	answeredTime: timestamp("answered_time", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	questionTitle: varchar("question_title", { length: 255 }).default(').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.responseId],
			foreignColumns: [responses.id],
			name: "answers_response_id_responses_id_fk"
		}),
]);

export const deviceAccounts = pgTable("device_accounts", {
	accountId: integer("account_id").notNull(),
	deviceId: integer("device_id").notNull(),
	isActive: boolean("is_active").default(true),
	lastLogin: timestamp("last_login", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_device_accounts_account_id").using("btree", table.accountId.asc().nullsLast().op("int4_ops")),
	index("idx_device_accounts_device_id").using("btree", table.deviceId.asc().nullsLast().op("int4_ops")),
	index("idx_device_accounts_is_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [accounts.id],
			name: "device_accounts_account_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.deviceId],
			foreignColumns: [devices.id],
			name: "device_accounts_device_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.accountId, table.deviceId], name: "device_accounts_pkey"}),
]);

export const deviceAppNames = pgTable("device_app_names", {
	deviceId: integer("device_id").notNull(),
	appNameId: integer("app_name_id").notNull(),
	isActive: boolean("is_active").default(true),
	lastAccess: timestamp("last_access", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_device_app_names_app_name_id").using("btree", table.appNameId.asc().nullsLast().op("int4_ops")),
	index("idx_device_app_names_device_id").using("btree", table.deviceId.asc().nullsLast().op("int4_ops")),
	index("idx_device_app_names_is_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.deviceId],
			foreignColumns: [devices.id],
			name: "device_app_names_device_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.appNameId],
			foreignColumns: [appNames.id],
			name: "device_app_names_app_name_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.deviceId, table.appNameId], name: "device_app_names_pkey"}),
]);
