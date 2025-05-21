CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"auth0_sub" varchar(255) NOT NULL,
	"name" varchar(100),
	"nickname" varchar(100),
	"email" varchar(255),
	"email_verified" boolean DEFAULT false,
	"picture" varchar(1000),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "accounts_auth0_sub_unique" UNIQUE("auth0_sub")
);
--> statement-breakpoint
CREATE TABLE "device_accounts" (
	"account_id" integer NOT NULL,
	"device_id" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_login" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "device_accounts_account_id_device_id_pk" PRIMARY KEY("account_id","device_id")
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" serial PRIMARY KEY NOT NULL,
	"device_number" varchar(255) NOT NULL,
	"phone_model" varchar(100),
	"country_code" varchar(10),
	"version" varchar(20),
	"login_type" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "devices_device_number_unique" UNIQUE("device_number")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"password" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_accounts" ADD CONSTRAINT "device_accounts_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_accounts" ADD CONSTRAINT "device_accounts_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;