-- Create tables for BananaClip video processing integration

-- Projects table for storing video project metadata
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Project',
  description TEXT,
  aspect_ratio TEXT DEFAULT '16:9',
  video_style TEXT DEFAULT 'Cinematic',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Scenes table for individual scene configurations and results
CREATE TABLE public.scenes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Scene 1',
  location TEXT,
  lighting TEXT,
  weather TEXT,
  description TEXT,
  voiceover TEXT,
  scene_config JSONB,
  generated_video_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Video assets table for uploaded videos and generated content
CREATE TABLE public.video_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES public.scenes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  duration FLOAT,
  asset_type TEXT DEFAULT 'upload' CHECK (asset_type IN ('upload', 'generated', 'frame', 'edited_frame')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Processing jobs table for tracking AI processing status
CREATE TABLE public.processing_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES public.scenes(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('video_analysis', 'frame_extraction', 'scene_generation', 'frame_editing')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Characters/Cast table for project cast management
CREATE TABLE public.characters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects table
CREATE POLICY "Users can view their own projects" 
ON public.projects 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
ON public.projects 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
ON public.projects 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for scenes table
CREATE POLICY "Users can view scenes from their projects" 
ON public.scenes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = scenes.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create scenes in their projects" 
ON public.scenes 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = scenes.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update scenes in their projects" 
ON public.scenes 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = scenes.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete scenes from their projects" 
ON public.scenes 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = scenes.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- RLS Policies for video_assets table
CREATE POLICY "Users can view assets from their projects" 
ON public.video_assets 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = video_assets.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create assets in their projects" 
ON public.video_assets 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = video_assets.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update assets in their projects" 
ON public.video_assets 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = video_assets.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete assets from their projects" 
ON public.video_assets 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = video_assets.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- RLS Policies for processing_jobs table
CREATE POLICY "Users can view their own processing jobs" 
ON public.processing_jobs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own processing jobs" 
ON public.processing_jobs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own processing jobs" 
ON public.processing_jobs 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for characters table
CREATE POLICY "Users can view characters from their projects" 
ON public.characters 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = characters.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create characters in their projects" 
ON public.characters 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = characters.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update characters in their projects" 
ON public.characters 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = characters.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete characters from their projects" 
ON public.characters 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = characters.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scenes_updated_at
BEFORE UPDATE ON public.scenes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_processing_jobs_updated_at
BEFORE UPDATE ON public.processing_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets for video assets
INSERT INTO storage.buckets (id, name, public) VALUES ('video-uploads', 'video-uploads', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-videos', 'generated-videos', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('video-frames', 'video-frames', false);

-- Storage policies for video-uploads bucket
CREATE POLICY "Users can upload their own videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'video-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own uploaded videos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'video-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own uploaded videos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'video-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own uploaded videos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'video-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for generated-videos bucket
CREATE POLICY "Users can view their own generated videos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'generated-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can create generated videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'generated-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for video-frames bucket
CREATE POLICY "Users can view their own video frames" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'video-frames' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can create video frames" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'video-frames' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own video frames" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'video-frames' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own video frames" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'video-frames' AND auth.uid()::text = (storage.foldername(name))[1]);