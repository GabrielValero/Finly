CREATE TABLE `debt_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`debt_id` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`paid_on` text NOT NULL,
	`note` text,
	`transaction_id` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`debt_id`) REFERENCES `debts`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "debt_payments_positive" CHECK("debt_payments"."amount_minor" > 0)
);
--> statement-breakpoint
CREATE INDEX `debt_payments_debt_idx` ON `debt_payments` (`debt_id`);--> statement-breakpoint
CREATE TABLE `debts` (
	`id` text PRIMARY KEY NOT NULL,
	`direction` text NOT NULL,
	`person` text NOT NULL,
	`currency` text NOT NULL,
	`principal_minor` integer NOT NULL,
	`note` text,
	`opened_on` text NOT NULL,
	`due_on` text,
	`open_rate_scaled` integer,
	`transaction_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "debts_principal_positive" CHECK("debts"."principal_minor" > 0),
	CONSTRAINT "debts_open_rate_positive" CHECK("debts"."open_rate_scaled" IS NULL OR "debts"."open_rate_scaled" > 0)
);
--> statement-breakpoint
CREATE INDEX `debts_direction_idx` ON `debts` (`direction`);