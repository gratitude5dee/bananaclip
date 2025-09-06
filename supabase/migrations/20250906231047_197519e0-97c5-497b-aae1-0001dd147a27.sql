-- Create storage bucket for generated images
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-images', 'generated-images', false);

-- Create storage policies for generated images
CREATE POLICY "Users can upload their own generated images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own generated images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own generated images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for generated videos bucket (assuming it exists)
CREATE POLICY "Users can upload their own generated videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'generated-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own generated videos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'generated-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own generated videos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'generated-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create table for storing generated media metadata
CREATE TABLE public.generated_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  storage_path TEXT NOT NULL,
  storage_url TEXT,
  original_prompt TEXT,
  generation_params JSONB,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on generated_media
ALTER TABLE public.generated_media ENABLE ROW LEVEL SECURITY;

-- Create policies for generated_media
CREATE POLICY "Users can create their own generated media records" 
ON public.generated_media 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own generated media records" 
ON public.generated_media 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own generated media records" 
ON public.generated_media 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generated media records" 
ON public.generated_media 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_generated_media_updated_at
BEFORE UPDATE ON public.generated_media
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();