-- Fix RLS policies to allow anonymous users to upload images

-- Drop existing restrictive policies for chat-images
DROP POLICY IF EXISTS "Authenticated users can upload chat images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their chat images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their chat images" ON storage.objects;

-- Drop existing restrictive policies for avatars
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their avatars" ON storage.objects;

-- Create permissive policies for chat-images bucket (allow anonymous uploads)
CREATE POLICY "Anyone can upload chat images" ON storage.objects
FOR INSERT 
WITH CHECK (bucket_id = 'chat-images');

CREATE POLICY "Anyone can update chat images" ON storage.objects
FOR UPDATE 
USING (bucket_id = 'chat-images');

CREATE POLICY "Anyone can delete chat images" ON storage.objects
FOR DELETE 
USING (bucket_id = 'chat-images');

-- Create permissive policies for avatars bucket (allow anonymous uploads)
CREATE POLICY "Anyone can upload avatars" ON storage.objects
FOR INSERT 
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can update avatars" ON storage.objects
FOR UPDATE 
USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can delete avatars" ON storage.objects
FOR DELETE 
USING (bucket_id = 'avatars');
