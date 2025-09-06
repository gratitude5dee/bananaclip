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

    // Submit request to fal.ai
    const response = await fetch('https://queue.fal.run/fal-ai/veo3/fast', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        aspect_ratio: aspectRatio,
        duration: duration,
        enhance_prompt: true,
        auto_fix: true,
        resolution: "720p",
        generate_audio: true
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('FAL API error:', errorData);
      throw new Error(`FAL API error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    console.log('Video generation result:', result);

    return new Response(
      JSON.stringify(result),
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