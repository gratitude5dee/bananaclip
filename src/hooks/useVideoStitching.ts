import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { uploadGeneratedVideo } from '@/lib/storage';

interface StitchedVideo {
  id: string;
  url: string;
  storageUrl?: string;
  storagePath?: string;
}

interface StitchingProgress {
  status: 'idle' | 'processing' | 'complete' | 'error';
  message?: string;
}

export const useVideoStitching = () => {
  const [isStitching, setIsStitching] = useState(false);
  const [progress, setProgress] = useState<StitchingProgress>({ status: 'idle' });
  const [stitchedVideo, setStitchedVideo] = useState<StitchedVideo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const stitchVideos = async (videoUrls: string[], projectName: string = 'stitched-video') => {
    if (!videoUrls || videoUrls.length === 0) {
      toast({
        title: "No Videos to Stitch",
        description: "Please generate some videos first.",
        variant: "destructive"
      });
      return;
    }

    setIsStitching(true);
    setProgress({ status: 'processing', message: 'Preparing videos for stitching...' });
    setError(null);
    setStitchedVideo(null);

    toast({
      title: "Stitching Videos",
      description: `Combining ${videoUrls.length} videos into one...`,
    });

    try {
      console.log('Starting video stitching with URLs:', videoUrls);

      setProgress({ status: 'processing', message: 'Sending videos to FFmpeg API...' });

      const { data, error: functionError } = await supabase.functions.invoke('stitch-videos-fal', {
        body: {
          videoUrls,
          projectName
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data && data.video) {
        setProgress({ status: 'processing', message: 'Uploading stitched video to storage...' });

        const stitchedVideoResult: StitchedVideo = {
          id: `stitched-${Date.now()}`,
          url: data.video.url
        };

        // Try to upload to storage
        try {
          const storageRecord = await uploadGeneratedVideo(
            data.video.url,
            `${projectName}_stitched.mp4`,
            `Stitched video from ${videoUrls.length} individual videos`
          );
          stitchedVideoResult.storageUrl = storageRecord.storage_url;
          stitchedVideoResult.storagePath = storageRecord.storage_path;
        } catch (storageError) {
          console.warn('Failed to upload stitched video to storage:', storageError);
          // Continue without storage - video still has external URL
        }

        setStitchedVideo(stitchedVideoResult);
        setProgress({ status: 'complete', message: 'Video stitching completed successfully!' });

        toast({
          title: "Videos Stitched Successfully!",
          description: "Your combined video is ready for download.",
        });

        return stitchedVideoResult;
      } else {
        throw new Error('No stitched video data received');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during video stitching';
      
      setError(errorMessage);
      setProgress({ status: 'error', message: errorMessage });

      toast({
        title: "Video Stitching Failed",
        description: errorMessage,
        variant: "destructive"
      });

      console.error('Video stitching error:', error);
    } finally {
      setIsStitching(false);
    }
  };

  const reset = () => {
    setIsStitching(false);
    setProgress({ status: 'idle' });
    setStitchedVideo(null);
    setError(null);
  };

  return {
    stitchVideos,
    isStitching,
    progress,
    stitchedVideo,
    error,
    reset
  };
};