ALTER TABLE "applications" DROP CONSTRAINT "applications_code_unique";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "app_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_app_id_applications_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "code";