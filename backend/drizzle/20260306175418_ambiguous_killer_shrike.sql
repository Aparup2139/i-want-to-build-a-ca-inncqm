ALTER TABLE "food_entries" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "food_entries" ADD COLUMN "recognized_by_ai" boolean DEFAULT false NOT NULL;