import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VideoGenerationResult {
  video: {
    url: string;
    content_type?: string;
    file_name?: string;
  };
  request_id?: string;
}

export const useFalVideo = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoGenerationResult | null>(null);
  const { toast } = useToast();

  const generateVideo = async (imageBase64: string, prompt: string) => {
    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      toast({
        title: "Generating Video",
        description: "Starting video generation with Veo3 Fast...",
      });

      const { data, error: functionError } = await supabase.functions.invoke('generate-video-fal', {
        body: {
          imageBase64,
          prompt,
          aspectRatio: "16:9",
          duration: "8s"
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      // Direct response from fal.subscribe
      if (data && data.video) {
        setResult(data);
        setProgress(100);
        toast({
          title: "Video Generated",
          description: "Your video has been successfully created!",
        });
      } else {
        throw new Error('No video data received');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Video Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Removed polling functions as fal.subscribe handles this automatically

  const reset = () => {
    setIsGenerating(false);
    setProgress(0);
    setError(null);
    setResult(null);
  };

  return {
    generateVideo,
    isGenerating,
    progress,
    error,
    result,
    reset
  };
};