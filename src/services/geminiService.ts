import { supabase } from '@/integrations/supabase/client';
import type { AISuggestion } from '@/types/video-editor';

export const analyzeVideoFrames = async (frames: string[]): Promise<AISuggestion[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-frames', {
      body: { frames }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.suggestions || [];
  } catch (error) {
    console.error('Error analyzing video frames:', error);
    throw new Error('Failed to analyze video with Gemini AI');
  }
};

export const editFrame = async (
  base64ImageData: string, 
  mimeType: string, 
  prompt: string
): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('edit-frame', {
      body: {
        imageData: base64ImageData,
        mimeType,
        prompt
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.editedImageData) {
      throw new Error('No edited image data returned');
    }

    return data.editedImageData;
  } catch (error) {
    console.error('Error editing frame:', error);
    throw new Error('Failed to edit frame with Gemini AI');
  }
};

export const generateImagesFromCanvas = async (
  canvasData: string,
  uploadedImages: (File | null)[],
  sceneDescription: any,
  count: number = 4
): Promise<string[]> => {
  try {
    // Prepare all images (canvas + uploaded)
    const images: string[] = [];
    
    // Add canvas data if available
    if (canvasData) {
      images.push(canvasData);
    }
    
    // Convert uploaded files to base64
    for (const file of uploadedImages) {
      if (file) {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        images.push(base64);
      }
    }

    const { data, error } = await supabase.functions.invoke('generate-images-gemini', {
      body: {
        images,
        sceneDescription,
        count
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.generatedImages || [];
  } catch (error) {
    console.error('Error generating images:', error);
    throw new Error('Failed to generate images with Gemini NanoBanana');
  }
};