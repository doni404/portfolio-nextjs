ALTER TABLE "blog_posts" ADD COLUMN "story_date" DATE;
ALTER TABLE "blog_posts" ADD COLUMN "editorial_meta" JSONB NOT NULL DEFAULT '{}';
CREATE TABLE "blog_likes" (
  "blog_post_id" UUID NOT NULL REFERENCES "blog_posts"("id") ON DELETE CASCADE,
  "visitor_hash" VARCHAR(64) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("blog_post_id", "visitor_hash")
);
CREATE TABLE "editorial_settings" (
  "id" VARCHAR(40) PRIMARY KEY DEFAULT 'default',
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "daily_limit" INTEGER NOT NULL DEFAULT 2 CHECK (daily_limit BETWEEN 1 AND 5),
  "monthly_budget_usd" DECIMAL(10,6) NOT NULL DEFAULT 5 CHECK (monthly_budget_usd >= 0),
  "topics" TEXT[] NOT NULL DEFAULT ARRAY['AI products', 'AI research', 'Cloud and developer tools'],
  "recipient_email" VARCHAR(255),
  "generate_images" BOOLEAN NOT NULL DEFAULT true,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "editorial_jobs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "day" VARCHAR(10) NOT NULL,
  "slot" INTEGER NOT NULL, "status" VARCHAR(30) NOT NULL DEFAULT 'running',
  "lease_token" VARCHAR(64) NOT NULL, "lease_until" TIMESTAMPTZ NOT NULL,
  "title" VARCHAR(220), "topic_key" VARCHAR(300) UNIQUE, "blog_post_id" UUID UNIQUE REFERENCES "blog_posts"("id"),
  "error_code" VARCHAR(80), "email_status" VARCHAR(30) NOT NULL DEFAULT 'not_sent',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "finished_at" TIMESTAMPTZ,
  UNIQUE ("day", "slot")
);
CREATE TABLE "ai_usage_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "job_id" UUID NOT NULL REFERENCES "editorial_jobs"("id"),
  "stage" VARCHAR(30) NOT NULL, "model" VARCHAR(80) NOT NULL, "status" VARCHAR(30) NOT NULL DEFAULT 'reserved',
  "reserved_usd" DECIMAL(10,6) NOT NULL, "estimated_usd" DECIMAL(10,6),
  "input_tokens" INTEGER NOT NULL DEFAULT 0, "cached_tokens" INTEGER NOT NULL DEFAULT 0,
  "output_tokens" INTEGER NOT NULL DEFAULT 0, "search_calls" INTEGER NOT NULL DEFAULT 0,
  "request_id" VARCHAR(160), "duration_ms" INTEGER, "pricing" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "completed_at" TIMESTAMPTZ,
  UNIQUE ("job_id", "stage")
);
CREATE INDEX "ai_usage_logs_created_at_idx" ON "ai_usage_logs"("created_at");
