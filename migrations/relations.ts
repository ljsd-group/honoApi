import { relations } from "drizzle-orm/relations";
import { users, accounts, responses, answers, deviceAccounts, devices, deviceAppNames, appNames } from "./schema";

export const accountsRelations = relations(accounts, ({one, many}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
	deviceAccounts: many(deviceAccounts),
}));

export const usersRelations = relations(users, ({many}) => ({
	accounts: many(accounts),
}));

export const answersRelations = relations(answers, ({one}) => ({
	response: one(responses, {
		fields: [answers.responseId],
		references: [responses.id]
	}),
}));

export const responsesRelations = relations(responses, ({many}) => ({
	answers: many(answers),
}));

export const deviceAccountsRelations = relations(deviceAccounts, ({one}) => ({
	account: one(accounts, {
		fields: [deviceAccounts.accountId],
		references: [accounts.id]
	}),
	device: one(devices, {
		fields: [deviceAccounts.deviceId],
		references: [devices.id]
	}),
}));

export const devicesRelations = relations(devices, ({many}) => ({
	deviceAccounts: many(deviceAccounts),
	deviceAppNames: many(deviceAppNames),
}));

export const deviceAppNamesRelations = relations(deviceAppNames, ({one}) => ({
	device: one(devices, {
		fields: [deviceAppNames.deviceId],
		references: [devices.id]
	}),
	appName: one(appNames, {
		fields: [deviceAppNames.appNameId],
		references: [appNames.id]
	}),
}));

export const appNamesRelations = relations(appNames, ({many}) => ({
	deviceAppNames: many(deviceAppNames),
}));