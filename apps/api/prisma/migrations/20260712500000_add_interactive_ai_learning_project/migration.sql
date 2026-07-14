INSERT INTO "projects" (
  "id",
  "title",
  "slug",
  "summary",
  "problem",
  "solution",
  "role",
  "outcome",
  "stack",
  "category_id",
  "featured",
  "sort_order",
  "year",
  "status",
  "cover_image_url",
  "links",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  'Interactive AI Learning Platform PoC',
  'interactive-ai-learning-platform-poc',
  'AI-powered interactive lecture platform designed to help students ask questions in real time, receive instant explanations, and complete adaptive knowledge checks.',
  'Traditional video-based learning can leave students waiting for clarification and makes it difficult to identify knowledge gaps. The PoC needed to combine real-time Q&A, progress visibility, and personalized follow-up within one learning experience.',
  'Defined a phased PoC architecture combining lecture content processing, AI question answering, automatically generated or instructor-authored checkpoints, instant explanation generation, learning history, and an AI tutor avatar. The plan included model and API comparison, structured content ingestion, backend services, a responsive student UI, admin history management, and AWS deployment.',
  'Cloud Architect & Senior Backend Engineer - contributed to the cloud and backend architecture, AI integration boundaries, data flows, API and error-handling approach, and operational plan for a secure, extensible education platform.',
  'Defined a 10-month, four-phase PoC plan covering AI model research, real-time Q&A, checkpoint generation, student UI, history and admin workflows, pilot evaluation, and tuning. Success criteria targeted at least 80% question-answering accuracy, responses within 10 seconds, and a smooth interactive learning experience, with production-scale delivery treated as a follow-on phase.',
  ARRAY['AWS', 'OpenAI API', 'Google Cloud AI', 'LLM Evaluation', 'Backend APIs', 'PostgreSQL', 'Responsive Web UI', 'AI Tutor Avatar']::text[],
  "id",
  FALSE,
  2,
  2025,
  'published'::"ContentStatus",
  NULL,
  '[]'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "categories"
WHERE "slug" = 'ai-llm'
  AND NOT EXISTS (
    SELECT 1 FROM "projects" WHERE "slug" = 'interactive-ai-learning-platform-poc'
  );

UPDATE "projects"
SET "sort_order" = 3
WHERE "slug" = 'i-nose-c19-ml-model';
