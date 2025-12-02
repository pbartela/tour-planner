-- migration: 20251116000001_create_avatars_storage_bucket.sql
-- description: Create Supabase Storage bucket for user avatars with RLS policies

begin;

-- Create the avatars bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- Policy: Users can upload their own avatar (INSERT)
create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own avatar (UPDATE)
create policy "Users can update their own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own avatar (DELETE)
create policy "Users can delete their own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Anyone can view avatars (SELECT) since bucket is public
create policy "Anyone can view avatars"
on storage.objects for select
to public
using (bucket_id = 'avatars');

commit;
