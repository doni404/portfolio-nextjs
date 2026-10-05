ALTER TABLE "editorial_settings"
  ADD COLUMN "run_at" VARCHAR(5) NOT NULL DEFAULT '09:00',
  ADD COLUMN "worker_last_seen_at" TIMESTAMPTZ;
ALTER TABLE "editorial_settings" ADD CONSTRAINT "editorial_run_at_valid"
  CHECK ("run_at" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
