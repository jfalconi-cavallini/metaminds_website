alter table homework
  add column if not exists attachment_url      text,
  add column if not exists attachment_filename text,
  add column if not exists kami_link           text;
