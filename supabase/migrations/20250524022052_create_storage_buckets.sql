-- Create storage buckets for chat images and avatars

-- Create chat-images bucket (for chart screenshots and uploaded images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create avatars bucket (for user and assistant avatars)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for chat-images bucket
CREATE POLICY "Public can view chat images" ON storage.objects
FOR SELECT USING (bucket_id = 'chat-images');

CREATE POLICY "Authenticated users can upload chat images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-images');

CREATE POLICY "Users can update their chat images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'chat-images');

CREATE POLICY "Users can delete their chat images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'chat-images');

-- Set up RLS policies for avatars bucket
CREATE POLICY "Public can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can update their avatars" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete their avatars" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'avatars');
