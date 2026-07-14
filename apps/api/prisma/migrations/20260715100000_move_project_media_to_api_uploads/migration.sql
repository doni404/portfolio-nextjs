-- Repository media is no longer the production source of truth. Uploaded
-- project covers are served from the API's persistent storage instead.
UPDATE "projects"
SET "cover_image_url" = NULL
WHERE "cover_image_url" LIKE '/projects/%';
