CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"accountNumber" text,
	"userId" text NOT NULL,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"targetAmount" numeric(15, 2) NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"isMain" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"description" text,
	"date" timestamp NOT NULL,
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"categoryId" text,
	"accountId" text,
	"destinationAccountId" text,
	"goalId" text,
	"destinationGoalId" text,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "type" text DEFAULT 'EXPENSE' NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "source" text DEFAULT 'MAIN' NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "goalId" text;--> statement-breakpoint
ALTER TABLE "income" ADD COLUMN "source" text DEFAULT 'MAIN' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_categoryId_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_accountId_accounts_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_destinationAccountId_accounts_id_fk" FOREIGN KEY ("destinationAccountId") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_goalId_goals_id_fk" FOREIGN KEY ("goalId") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_destinationGoalId_goals_id_fk" FOREIGN KEY ("destinationGoalId") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_goalId_goals_id_fk" FOREIGN KEY ("goalId") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;