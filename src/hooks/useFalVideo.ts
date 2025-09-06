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

      // Handle queue response - check if we got a request_id for polling
      if (data.request_id) {
        // Poll for completion
        await pollForCompletion(data.request_id);
      } else if (data.video) {
        // Direct response
        setResult(data);
        setProgress(100);
        toast({
          title: "Video Generated",
          description: "Your video has been successfully created!",
        });
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

  const pollForCompletion = async (requestId: string) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`https://queue.fal.run/fal-ai/veo3/fast/requests/${requestId}`, {
          headers: {
            'Authorization': `Key ${await getFalKey()}`,
          }
        });

        if (!response.ok) {
          throw new Error(`Polling failed: ${response.status}`);
        }

        const status = await response.json();
        
        if (status.status === 'COMPLETED') {
          setResult(status);
          setProgress(100);
          toast({
            title: "Video Generated",
            description: "Your video has been successfully created!",
          });
          return;
        }

        if (status.status === 'FAILED') {
          throw new Error(status.error || 'Video generation failed');
        }

        // Update progress
        const progressPercent = Math.min((attempts / maxAttempts) * 90, 90);
        setProgress(progressPercent);

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          throw new Error('Video generation timed out');
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Polling error';
        setError(errorMessage);
        toast({
          title: "Video Generation Failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    };

    poll();
  };

  const getFalKey = async () => {
    // This is a simplified approach - in a real app, you'd get this from the edge function
    return 'fal_key_placeholder';
  };

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