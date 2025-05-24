-- Create storage buckets for chat images and avatars

-- Create chat-images bucket (for chart screenshots and uploaded images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create avatars bucket (for user and assistant avatars)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for chat-images bucket (allow anonymous access)
CREATE POLICY "Public can view chat images" ON storage.objects
FOR SELECT USING (bucket_id = 'chat-images');

CREATE POLICY "Anyone can upload chat images" ON storage.objects
FOR INSERT 
WITH CHECK (bucket_id = 'chat-images');

CREATE POLICY "Anyone can update chat images" ON storage.objects
FOR UPDATE 
USING (bucket_id = 'chat-images');

CREATE POLICY "Anyone can delete chat images" ON storage.objects
FOR DELETE 
USING (bucket_id = 'chat-images');

-- Set up RLS policies for avatars bucket (allow anonymous access)
CREATE POLICY "Public can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload avatars" ON storage.objects
FOR INSERT 
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can update avatars" ON storage.objects
FOR UPDATE 
USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can delete avatars" ON storage.objects
FOR DELETE 
USING (bucket_id = 'avatars');
