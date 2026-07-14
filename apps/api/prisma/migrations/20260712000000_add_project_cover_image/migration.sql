ALTER TABLE "projects"
ADD COLUMN "cover_image_url" TEXT;

UPDATE "projects"
SET
  "cover_image_url" = NULL,
  "links" = '[
    {"label":"University news","url":"https://www.its.ac.id/news/en/its-develops-i-nose-c-19-covid-19-detector-through-underarm-sweat-odor/"},
    {"label":"Research paper","url":"https://www.sciencedirect.com/science/article/pii/S2214180422000216"}
  ]'::jsonb
WHERE "slug" = 'i-nose-c19-ml-model';
