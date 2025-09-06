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
  count: number = 2
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
      console.error('Supabase function error:', error);
      throw new Error(error.message || 'Failed to call image generation service');
    }

    if (!data.success) {
      console.error('Image generation failed:', data.error);
      
      // Handle specific error types
      const errorMessage = data.error || 'Unknown error occurred';
      if (errorMessage.includes('quota') || errorMessage.includes('429')) {
        throw new Error('Gemini API quota exceeded. Please wait a few minutes and try again, or upgrade your API plan.');
      }
      if (errorMessage.includes('GEMINI_API_KEY')) {
        throw new Error('Gemini API key not configured. Please contact support.');
      }
      
      throw new Error(`Image generation failed: ${errorMessage}`);
    }

    return data.generatedImages || [];
  } catch (error) {
    console.error('Error generating images:', error);
    
    // Re-throw with preserved message if it's already a helpful error
    if (error instanceof Error && (
      error.message.includes('quota') || 
      error.message.includes('API key') ||
      error.message.includes('wait a few minutes')
    )) {
      throw error;
    }
    
    throw new Error('Failed to generate images with Gemini NanoBanana. Please try again later.');
  }
};

export const generateActualImagesFromCanvas = async (
  canvasData: string,
  uploadedImages: (File | null)[],
  sceneDescription: any
): Promise<{ id: string; base64_data: string; filename: string }[]> => {
  try {
    // Create form data
    const formData = new FormData();
    
    // Add doodle image (canvas sketch)
    if (canvasData) {
      // Convert base64 to blob
      const response = await fetch(canvasData);
      const blob = await response.blob();
      const canvasBlob = new File([blob], 'doodle_sketch.png', { type: 'image/png' });
      formData.append('doodle_image', canvasBlob);
    } else {
      // Create empty 1x1 transparent PNG as placeholder
      const emptyBlob = await new Promise<Blob>((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        ctx!.clearRect(0, 0, 1, 1);
        
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png');
      });
      
      const emptyFile = new File([emptyBlob], 'empty.png', { type: 'image/png' });
      formData.append('doodle_image', emptyFile);
    }
    
    // Add location images (fill missing with placeholder)
    const maxImages = 5;
    let imageCount = 0;
    
    for (const file of uploadedImages) {
      if (file && imageCount < maxImages) {
        formData.append(`location_image_${imageCount + 1}`, file);
        imageCount++;
      }
    }
    
    // Fill remaining slots with placeholder images synchronously
    const createPlaceholderBlob = (colorIndex: number): Promise<Blob> => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx!.fillStyle = `hsl(${colorIndex * 60}, 50%, 90%)`;
        ctx!.fillRect(0, 0, 100, 100);
        
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png');
      });
    };
    
    // Create placeholder blobs for missing images
    for (let i = imageCount; i < maxImages; i++) {
      const blob = await createPlaceholderBlob(i);
      const placeholderFile = new File([blob], `placeholder_${i + 1}.png`, { type: 'image/png' });
      formData.append(`location_image_${i + 1}`, placeholderFile);
    }

    // Add description with mapped field names for FastAPI compatibility  
    const description = {
      setting: sceneDescription.setting || 'Modern creative space',
      subjects: sceneDescription.subjects || 'Creative subjects',
      composition: sceneDescription.composition || 'Balanced composition',
      environment: sceneDescription.environment || 'Professional environment',
      lighting: sceneDescription.lighting || 'Studio lighting',
      focal_points: sceneDescription.focalPoints || 'Main focal elements',
      mood: sceneDescription.mood || 'Professional and engaging'
    };
    
    formData.append('description', JSON.stringify(description));

    // Use fetch directly to call the banana-clip function
    const supabaseUrl = "https://glawvradrxlzcxwpkwxj.supabase.co";
    const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsYXd2cmFkcnhsemN4d3Brd3hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxODQwMjksImV4cCI6MjA3Mjc2MDAyOX0.FJGzFxRkqHMx3kke5xF7sueoZl_ktVX-UnNMKyBJSlo";
    
    const response = await fetch(`${supabaseUrl}/functions/v1/banana-clip/generate-images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Banana Clip API error:', errorText);
      throw new Error(`API request failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to generate images');
    }

    return data.generated_images || [];
    
  } catch (error) {
    console.error('Error generating actual images:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate images with Gemini 2.5 Flash Image Preview');
  }
};