DELETE FROM "project_tags"
WHERE "project_id" IN (
  SELECT "id" FROM "projects" WHERE "slug" <> 'i-nose-c19-ml-model'
);

DELETE FROM "projects"
WHERE "slug" <> 'i-nose-c19-ml-model';

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
  'AI Chatbot for Drone Flight Route Reservations',
  'ai-chatbot-drone-flight-route-reservations',
  'Conversational AI platform that helps operators query drone flight areas, routes, and reservation schedules through Rocket.Chat, Amazon Lex V2, and Go-based backend services.',
  'Users needed a reliable conversational way to retrieve drone flight route and reservation information across multiple systems. The solution also had to handle Japanese NLU constraints, authentication, time ranges, and service-to-service communication.',
  'Built a Rocket.Chat-integrated chatbot server using Go and Gin with Amazon Lex V2 for intent and slot extraction. Connected it to a Go and Gin reservation resource server over gRPC and PostgreSQL/RDS, with MongoDB for chat data and Amazon S3 for attachments. Refined slot design with FreeFormInput, TimeEnd, session timeout, and error handling.',
  'Cloud Architect & Senior Backend Engineer - designed service boundaries and integration flows, implemented chatbot and reservation services, integrated Amazon Lex and Rocket.Chat webhooks, refined Japanese conversation flows, supported authentication and deployment, and led end-to-end testing.',
  'Delivered ChatBot Server v0.4.2 with all eight functional test cases passing in the final report. Resolved route-list presentation, time-range queries, Japanese slot handling, admin-user filtering, and session-timeout issues.',
  ARRAY['Go', 'Gin', 'Amazon Lex V2', 'Rocket.Chat', 'gRPC', 'PostgreSQL', 'Amazon RDS', 'MongoDB', 'Amazon S3', 'Docker', 'AWS EC2', 'AWS ALB', 'Route 53', 'CloudWatch']::text[],
  "id",
  true,
  1,
  2026,
  'published'::"ContentStatus",
  NULL,
  '[]'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "categories"
WHERE "slug" = 'ai-llm'
  AND NOT EXISTS (
    SELECT 1 FROM "projects" WHERE "slug" = 'ai-chatbot-drone-flight-route-reservations'
  );

UPDATE "projects"
SET "sort_order" = 2
WHERE "slug" = 'i-nose-c19-ml-model';
