CREATE TABLE `shopping_items` (
	`id` text PRIMARY KEY NOT NULL,
	`list_id` text NOT NULL,
	`name` text NOT NULL,
	`quantity_milli` integer DEFAULT 1000 NOT NULL,
	`price_minor` integer,
	`price_currency` text DEFAULT 'USD' NOT NULL,
	`category_id` text,
	`checked` integer DEFAULT false NOT NULL,
	`purchased_at` integer,
	`priority` text,
	`note` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`list_id`) REFERENCES `shopping_lists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "shopping_items_qty_positive" CHECK("shopping_items"."quantity_milli" > 0),
	CONSTRAINT "shopping_items_price_nonneg" CHECK("shopping_items"."price_minor" IS NULL OR "shopping_items"."price_minor" >= 0)
);
--> statement-breakpoint
CREATE INDEX `shopping_items_list_idx` ON `shopping_items` (`list_id`);--> statement-breakpoint
CREATE TABLE `shopping_lists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`category_id` text,
	`limit_minor` integer,
	`rate_mode` text DEFAULT 'bcv' NOT NULL,
	`manual_rate_scaled` integer,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "shopping_lists_limit_positive" CHECK("shopping_lists"."limit_minor" IS NULL OR "shopping_lists"."limit_minor" > 0),
	CONSTRAINT "shopping_lists_manual_rate" CHECK(("shopping_lists"."rate_mode" = 'manual') = ("shopping_lists"."manual_rate_scaled" IS NOT NULL)),
	CONSTRAINT "shopping_lists_manual_positive" CHECK("shopping_lists"."manual_rate_scaled" IS NULL OR "shopping_lists"."manual_rate_scaled" > 0)
);
--> statement-breakpoint
CREATE INDEX `shopping_lists_category_idx` ON `shopping_lists` (`category_id`);