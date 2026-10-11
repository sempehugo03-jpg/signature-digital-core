ALTER TABLE `fp_seo_changes` ADD `source_data_json` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE `fp_seo_changes` ADD `expected_effect` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `fp_seo_changes` ADD `published_at` text;
--> statement-breakpoint
CREATE TRIGGER fp_first_touch_immutable BEFORE UPDATE ON fp_first_touch BEGIN SELECT RAISE(ABORT, 'first-touch immutable'); END;
--> statement-breakpoint
CREATE TRIGGER fp_user_touch_immutable BEFORE UPDATE ON fp_user_first_touch BEGIN SELECT RAISE(ABORT, 'first-touch immutable'); END;
--> statement-breakpoint
CREATE TRIGGER fp_project_touch_immutable BEFORE UPDATE ON fp_project_first_touch BEGIN SELECT RAISE(ABORT, 'first-touch immutable'); END;
