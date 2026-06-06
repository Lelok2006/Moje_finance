-- ── Document duplicate guard ─────────────────────────────────
-- A content hash lets the app detect the same uploaded file regardless of name.

alter table documents
  add column if not exists file_hash text,
  add column if not exists file_size bigint,
  add column if not exists mime_type text;

create unique index if not exists documents_household_file_hash_unique
  on documents (household_id, file_hash)
  where file_hash is not null;

create unique index if not exists transactions_document_id_unique
  on transactions (document_id)
  where document_id is not null;
