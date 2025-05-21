CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"app_name" varchar(100) NOT NULL,
	"domain" varchar(255) NOT NULL,
	"code" varchar(50) DEFAULT uuid_generate_v4()::text NOT NULL,
	"created_at" integer DEFAULT EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) NOT NULL,
	"updated_at" integer DEFAULT EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) NOT NULL,
	CONSTRAINT "applications_code_unique" UNIQUE("code")
);
