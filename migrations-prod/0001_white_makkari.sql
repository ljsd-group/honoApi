CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"app_name" varchar(100) NOT NULL,
	"domain" varchar(255) NOT NULL,
	"created_at" integer DEFAULT EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) NOT NULL,
	"updated_at" integer DEFAULT EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "app_id" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "app_id" integer;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_app_id_applications_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_app_id_applications_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;