import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const { images, sceneDescription, count = 4 } = await req.json();
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error('At least one image is required');
    }

    console.log(`Generating ${count} images using ${images.length} input images`);

    // Create prompt based on scene description
    const prompt = `Generate ${count} creative advertising images based on this scene description:
    Setting: ${sceneDescription.setting || 'Modern creative space'}
    Subjects: ${sceneDescription.subjects || 'Product or brand elements'}
    Composition: ${sceneDescription.composition || 'Balanced and engaging layout'}
    Environment: ${sceneDescription.environment || 'Professional advertising environment'}
    Lighting: ${sceneDescription.lighting || 'Studio lighting'}
    Focal Points: ${sceneDescription.focalPoints || 'Main product or message'}
    Mood: ${sceneDescription.mood || 'Professional and engaging'}

    Create variations that maintain the core concept while offering different creative interpretations. Each image should be suitable for advertising use with high visual impact.`;

    // Prepare image parts for Gemini
    const imageParts = images.map((imageData: string, index: number) => {
      // Remove data URL prefix if present
      const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
      
      return {
        inline_data: {
          mime_type: imageData.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png',
          data: base64Data
        }
      };
    });

    const generatedImages: string[] = [];

    // Generate images one by one (Gemini doesn't support batch generation)
    for (let i = 0; i < count; i++) {
      console.log(`Generating image ${i + 1}/${count}`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${prompt} Generate variation ${i + 1}: Focus on a unique creative angle while maintaining the core concept.`
                  },
                  ...imageParts
                ]
              }
            ],
            generationConfig: {
              temperature: 0.8 + (i * 0.1), // Vary temperature for different results
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 4096,
            }
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error for image ${i + 1}:`, errorText);
        throw new Error(`Gemini API request failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('Invalid Gemini response structure:', data);
        throw new Error('Invalid response from Gemini API');
      }

      const generatedContent = data.candidates[0].content.parts[0].text;
      
      // For now, we'll return text descriptions as Gemini doesn't directly generate images
      // In a real implementation, you'd use an image generation service here
      generatedImages.push(generatedContent);
    }

    return new Response(
      JSON.stringify({
        success: true,
        generatedImages,
        inputImageCount: images.length,
        sceneDescription
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-images-gemini function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate images'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});