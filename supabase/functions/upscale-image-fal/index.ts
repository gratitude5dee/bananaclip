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

    const { imageBase64, scale = 2 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'imageBase64 is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting image upscaling with scale:', scale);

    // Convert base64 to data URI
    const imageDataUri = `data:image/png;base64,${imageBase64}`;

    // Submit request to fal.ai upscaler
    const response = await fetch('https://queue.fal.run/fal-ai/clarity-upscaler', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageDataUri,
        scale: scale,
        dynamic: 6,
        creativity: 0.35,
        resemblance: 0.6,
        fractality: 0.8
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('FAL API error:', errorData);
      throw new Error(`FAL API error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    console.log('Image upscaling result:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in upscale-image-fal function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});