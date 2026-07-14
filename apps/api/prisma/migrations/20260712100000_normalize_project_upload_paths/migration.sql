-- Keep uploaded media portable between local, staging, and production hosts.
UPDATE "projects"
SET "cover_image_url" = regexp_replace(
  "cover_image_url",
  '^https?://[^/]+(/uploads/.*)$',
  '\1'
)
WHERE "cover_image_url" ~ '^https?://[^/]+/uploads/';
