-- Create public receipts bucket
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- Receipts Storage Policies
create policy "Receipts are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'receipts' );

create policy "Anyone can upload receipts."
  on storage.objects for insert
  with check ( bucket_id = 'receipts' );

create policy "Users can update their own uploaded receipts."
  on storage.objects for update
  using ( bucket_id = 'receipts' );

create policy "Users can delete their own uploaded receipts."
  on storage.objects for delete
  using ( bucket_id = 'receipts' );
