CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`currency` text NOT NULL,
	`icon` text NOT NULL,
	`color` text,
	`opening_minor` integer DEFAULT 0 NOT NULL,
	`archived_at` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_name_uq` ON `accounts` (`name`);--> statement-breakpoint
CREATE TABLE `budget_items` (
	`id` text PRIMARY KEY NOT NULL,
	`budget_id` text NOT NULL,
	`category_id` text NOT NULL,
	`kind` text NOT NULL,
	`planned_minor` integer NOT NULL,
	`is_fixed` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "budget_items_positive" CHECK("budget_items"."planned_minor" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `budget_items_uq` ON `budget_items` (`budget_id`,`category_id`);--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`month` text NOT NULL,
	`base_currency` text DEFAULT 'USD' NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "budgets_usd_only" CHECK("budgets"."base_currency" = 'USD')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `budgets_month_uq` ON `budgets` (`month`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`icon` text NOT NULL,
	`color` text,
	`kind` text NOT NULL,
	`parent_id` text,
	`exclude_from_reports` integer DEFAULT false NOT NULL,
	`archived_at` integer,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `categories_parent_idx` ON `categories` (`parent_id`);--> statement-breakpoint
CREATE TABLE `exchange_rates` (
	`id` text PRIMARY KEY NOT NULL,
	`base` text DEFAULT 'USD' NOT NULL,
	`quote` text DEFAULT 'VES' NOT NULL,
	`source` text NOT NULL,
	`rate_scaled` integer NOT NULL,
	`valid_from` text NOT NULL,
	`fetched_at` integer NOT NULL,
	CONSTRAINT "exchange_rates_positive" CHECK("exchange_rates"."rate_scaled" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exchange_rates_uq` ON `exchange_rates` (`base`,`quote`,`source`,`valid_from`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_uq` ON `tags` (`name`);--> statement-breakpoint
CREATE TABLE `transaction_tags` (
	`transaction_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`transaction_id`, `tag_id`),
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tx_tags_tag_idx` ON `transaction_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`account_currency` text NOT NULL,
	`kind` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`occurred_at` text NOT NULL,
	`category_id` text,
	`concept` text DEFAULT '' NOT NULL,
	`note` text,
	`rate_scaled` integer,
	`rate_source` text,
	`listed_amount_minor` integer,
	`listed_currency` text,
	`transfer_id` text,
	`deleted_at` integer,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "tx_amount_nonzero" CHECK("transactions"."amount_minor" <> 0),
	CONSTRAINT "tx_sign_matches_kind" CHECK(("transactions"."kind" = 'expense' AND "transactions"."amount_minor" < 0) OR ("transactions"."kind" = 'income' AND "transactions"."amount_minor" > 0) OR "transactions"."kind" = 'transfer'),
	CONSTRAINT "tx_transfer_link" CHECK(("transactions"."kind" = 'transfer') = ("transactions"."transfer_id" IS NOT NULL)),
	CONSTRAINT "tx_category_required" CHECK("transactions"."kind" = 'transfer' OR "transactions"."category_id" IS NOT NULL),
	CONSTRAINT "tx_listed_pair" CHECK(("transactions"."listed_amount_minor" IS NULL) = ("transactions"."listed_currency" IS NULL)),
	CONSTRAINT "tx_rate_pair" CHECK(("transactions"."rate_scaled" IS NULL) = ("transactions"."rate_source" IS NULL)),
	CONSTRAINT "tx_rate_rule" CHECK("transactions"."kind" = 'transfer' OR (
        ("transactions"."account_currency" = 'VES' OR ("transactions"."listed_currency" IS NOT NULL AND "transactions"."listed_currency" <> "transactions"."account_currency"))
        = ("transactions"."rate_scaled" IS NOT NULL)
      ))
);
--> statement-breakpoint
CREATE INDEX `tx_account_date_idx` ON `transactions` (`account_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `tx_date_idx` ON `transactions` (`occurred_at`);--> statement-breakpoint
CREATE INDEX `tx_category_idx` ON `transactions` (`category_id`);--> statement-breakpoint
CREATE INDEX `tx_transfer_idx` ON `transactions` (`transfer_id`);