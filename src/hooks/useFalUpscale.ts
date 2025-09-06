import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UpscaleResult {
  image: {
    url: string;
    content_type?: string;
    file_name?: string;
  };
  request_id?: string;
}

export const useFalUpscale = () => {
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UpscaleResult | null>(null);
  const { toast } = useToast();

  const upscaleImage = async (imageBase64: string, scale: number = 2) => {
    setIsUpscaling(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      toast({
        title: "Upscaling Image",
        description: "Enhancing image quality with AI...",
      });

      const { data, error: functionError } = await supabase.functions.invoke('upscale-image-fal', {
        body: {
          imageBase64,
          scale
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      // Handle queue response - check if we got a request_id for polling
      if (data.request_id) {
        // Poll for completion
        await pollForCompletion(data.request_id);
      } else if (data.image) {
        // Direct response
        setResult(data);
        setProgress(100);
        toast({
          title: "Image Upscaled",
          description: "Your image has been successfully enhanced!",
        });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Upscaling Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUpscaling(false);
    }
  };

  const pollForCompletion = async (requestId: string) => {
    const maxAttempts = 30; // 2.5 minutes with 5-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`https://queue.fal.run/fal-ai/clarity-upscaler/requests/${requestId}`, {
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
            title: "Image Upscaled",
            description: "Your image has been successfully enhanced!",
          });
          return;
        }

        if (status.status === 'FAILED') {
          throw new Error(status.error || 'Image upscaling failed');
        }

        // Update progress
        const progressPercent = Math.min((attempts / maxAttempts) * 90, 90);
        setProgress(progressPercent);

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000); // Poll every 5 seconds
        } else {
          throw new Error('Image upscaling timed out');
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Polling error';
        setError(errorMessage);
        toast({
          title: "Upscaling Failed",
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
    setIsUpscaling(false);
    setProgress(0);
    setError(null);
    setResult(null);
  };

  return {
    upscaleImage,
    isUpscaling,
    progress,
    error,
    result,
    reset
  };
};