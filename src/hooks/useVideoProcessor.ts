import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VideoFrame {
  id: number;
  data: string; // base64 image data
  mimeType: string;
  timestamp: number;
}

export interface VideoProcessingResult {
  jobId: string;
  assetId: string;
  frames: VideoFrame[];
  videoUrl: string;
}

interface TrimOptions {
  startTime: number;
  endTime: number;
}

export const useVideoProcessor = () => {
  const [frames, setFrames] = useState<VideoFrame[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processVideo = useCallback(async (
    projectId: string,
    videoFile: File, 
    framesPerSecond: number = 1, 
    trimOptions?: TrimOptions
  ): Promise<VideoProcessingResult | null> => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setFrames([]);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix to get just base64
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(videoFile);
      });

      setProgress(10);

      // Call edge function to process video
      const { data, error: functionError } = await supabase.functions.invoke('process-video', {
        body: {
          projectId,
          videoFile: {
            name: videoFile.name,
            data: base64Data,
            type: videoFile.type,
            size: videoFile.size
          },
          framesPerSecond,
          trimOptions
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Video processing failed');
      }

      setProgress(50);

      // Process frames locally (extract actual frames from video)
      const extractedFrames = await extractFramesFromVideo(videoFile, framesPerSecond, trimOptions);
      setFrames(extractedFrames);
      
      setProgress(100);

      const result: VideoProcessingResult = {
        jobId: data.jobId,
        assetId: data.assetId,
        frames: extractedFrames,
        videoUrl: URL.createObjectURL(videoFile)
      };

      return result;

    } catch (err: any) {
      console.error('Video processing error:', err);
      setError(err.message || 'Failed to process video');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const extractFramesFromVideo = async (
    videoFile: File, 
    framesPerSecond: number, 
    trimOptions?: TrimOptions
  ): Promise<VideoFrame[]> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      video.src = URL.createObjectURL(videoFile);
      video.muted = true;

      video.onloadedmetadata = async () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const duration = video.duration;
        const extractedFrames: VideoFrame[] = [];
        const interval = 1 / framesPerSecond;

        const startTime = trimOptions?.startTime ?? 0;
        const endTime = trimOptions?.endTime ?? duration;

        let frameIndex = 0;
        for (let time = startTime; time < endTime && time < duration; time += interval) {
          video.currentTime = time;
          
          await new Promise(resolve => {
            const onSeeked = () => {
              video.removeEventListener('seeked', onSeeked);
              resolve(null);
            };
            video.addEventListener('seeked', onSeeked);
          });

          if (context) {
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const mimeType = 'image/jpeg';
            const dataUrl = canvas.toDataURL(mimeType, 0.8);
            
            extractedFrames.push({
              id: frameIndex,
              data: dataUrl,
              mimeType,
              timestamp: time
            });
            frameIndex++;
          }

          // Update progress
          const progressPercent = 50 + Math.floor(((time - startTime) / (endTime - startTime)) * 50);
          setProgress(progressPercent);
        }

        URL.revokeObjectURL(video.src);
        resolve(extractedFrames);
      };

      video.onerror = () => {
        console.error("Error loading video file for frame extraction");
        resolve([]);
      };
    });
  };

  const reset = useCallback(() => {
    setFrames([]);
    setIsProcessing(false);
    setProgress(0);
    setError(null);
  }, []);

  return {
    frames,
    isProcessing,
    progress,
    error,
    processVideo,
    reset
  };
};