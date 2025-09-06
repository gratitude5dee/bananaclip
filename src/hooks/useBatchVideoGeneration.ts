import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  imageId: string;
}

interface BatchVideoProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
}

export const useBatchVideoGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<BatchVideoProgress>({ total: 0, completed: 0, failed: 0, inProgress: 0 });
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const generateAllVideos = async (images: { id: string; base64_data: string }[], sceneDescription: string) => {
    setIsGenerating(true);
    setProgress({ total: images.length, completed: 0, failed: 0, inProgress: images.length });
    setGeneratedVideos([]);
    setErrors([]);

    toast({
      title: "Generating Videos",
      description: `Starting batch generation of ${images.length} videos...`,
    });

    // Generate videos in parallel
    const videoPromises = images.map(async (image, index) => {
      try {
        const prompt = `${sceneDescription} - Dynamic video scene ${index + 1}`;
        
        const { data, error: functionError } = await supabase.functions.invoke('generate-video-fal', {
          body: {
            imageBase64: image.base64_data,
            prompt,
            aspectRatio: "16:9",
            duration: "8s"
          }
        });

        if (functionError) {
          throw new Error(functionError.message);
        }

        if (data && data.video) {
          const generatedVideo: GeneratedVideo = {
            id: `video-${image.id}`,
            url: data.video.url,
            prompt,
            imageId: image.id
          };

          // Update progress and add to results
          setProgress(prev => ({
            ...prev,
            completed: prev.completed + 1,
            inProgress: prev.inProgress - 1
          }));

          setGeneratedVideos(prev => [...prev, generatedVideo]);
          
          return generatedVideo;
        } else {
          throw new Error('No video data received');
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        setProgress(prev => ({
          ...prev,
          failed: prev.failed + 1,
          inProgress: prev.inProgress - 1
        }));

        setErrors(prev => [...prev, `Image ${index + 1}: ${errorMessage}`]);
        return null;
      }
    });

    // Wait for all videos to complete
    await Promise.allSettled(videoPromises);

    setIsGenerating(false);

    // Show completion toast
    const finalProgress = progress;
    toast({
      title: "Batch Generation Complete",
      description: `Generated ${finalProgress.completed} videos successfully${finalProgress.failed > 0 ? `, ${finalProgress.failed} failed` : ''}`,
      variant: finalProgress.failed > 0 ? "destructive" : "default"
    });
  };

  const reset = () => {
    setIsGenerating(false);
    setProgress({ total: 0, completed: 0, failed: 0, inProgress: 0 });
    setGeneratedVideos([]);
    setErrors([]);
  };

  return {
    generateAllVideos,
    isGenerating,
    progress,
    generatedVideos,
    errors,
    reset
  };
};