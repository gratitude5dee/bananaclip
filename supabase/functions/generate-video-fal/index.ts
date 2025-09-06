import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FAL_KEY = Deno.env.get('FAL_KEY');
    if (!FAL_KEY) {
      throw new Error('FAL_KEY is not set');
    }

    const { imageBase64, prompt, duration = "8s" } = await req.json();

    if (!imageBase64 || !prompt) {
      return new Response(
        JSON.stringify({ error: 'imageBase64 and prompt are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting video generation with prompt:', prompt);

    // Use fal-ai client properly
    const { fal } = await import("npm:@fal-ai/client@1.6.2");
    
    fal.config({
      credentials: FAL_KEY
    });

    // Convert base64 to data URI with proper MIME type detection
    let imageDataUri: string;
    if (imageBase64.startsWith('data:')) {
      imageDataUri = imageBase64;
    } else {
      // Detect image format from base64 data (Gemini generates PNG images)
      // PNG images start with 'iVBOR' in base64, JPEG images start with '/9j/'
      const isPng = imageBase64.startsWith('iVBOR');
      const isJpeg = imageBase64.startsWith('/9j/') || imageBase64.startsWith('iVBOR') === false;
      
      if (isPng) {
        imageDataUri = `data:image/png;base64,${imageBase64}`;
        console.log('Detected PNG image format for Veo3');
      } else {
        imageDataUri = `data:image/jpeg;base64,${imageBase64}`;
        console.log('Detected JPEG image format for Veo3');
      }
    }
    
    console.log('Image data URI length:', imageDataUri.length, 'Format detected from base64 prefix:', imageBase64.substring(0, 10));

    const result = await fal.subscribe("fal-ai/veo3/fast/image-to-video", {
      input: {
        prompt: prompt,
        image_url: imageDataUri,
        duration: duration,
        resolution: "720p",
        generate_audio: false
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log('Generation progress:', update.status);
        }
      },
    });

    console.log('Video generation completed:', result.data);

    return new Response(
      JSON.stringify(result.data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in generate-video-fal function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});