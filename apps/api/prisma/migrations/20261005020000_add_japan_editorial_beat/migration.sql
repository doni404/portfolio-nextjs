-- Extend the untouched default topic mix, not an editor's custom selection.
UPDATE "editorial_settings"
SET "topics" = array_append("topics", 'Japan life & practical hacks'),
    "updated_at" = CURRENT_TIMESTAMP
WHERE "topics" = ARRAY[
  'AI industry & leadership', 'AI policy & safety', 'Work, society & education',
  'Consumer AI & products', 'Science & AI research',
  'Cloud, security & developer tools', 'AI model releases'
]::TEXT[];
