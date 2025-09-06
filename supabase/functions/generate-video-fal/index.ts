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

    const { imageBase64, prompt, aspectRatio = "16:9", duration = "8s" } = await req.json();

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

    // Convert base64 to data URI if not already
    const imageDataUri = imageBase64.startsWith('data:') 
      ? imageBase64 
      : `data:image/jpeg;base64,${imageBase64}`;

    const result = await fal.subscribe("fal-ai/veo3/fast", {
      input: {
        prompt: prompt,
        image_url: imageDataUri,
        aspect_ratio: aspectRatio,
        duration: duration,
        enhance_prompt: true,
        auto_fix: true,
        resolution: "720p",
        generate_audio: true
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