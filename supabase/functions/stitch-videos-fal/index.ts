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
    const FAL_KEY = Deno.env.get('FAL_KEY');
    if (!FAL_KEY) {
      throw new Error('FAL_KEY is not configured');
    }

    const { videoUrls, projectName = 'stitched-video' } = await req.json();

    if (!videoUrls || !Array.isArray(videoUrls) || videoUrls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'videoUrls array is required and must not be empty' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Stitching ${videoUrls.length} videos for project: ${projectName}`);
    console.log('Video URLs:', videoUrls);

    // Import and configure fal client
    const { fal } = await import('npm:@fal-ai/client@1.6.2');
    fal.config({
      credentials: FAL_KEY
    });

    console.log('Video URLs to stitch:', videoUrls);

    const result = await fal.subscribe("fal-ai/ffmpeg-api/merge-videos", {
      input: {
        video_urls: videoUrls,
        resolution: "landscape_16_9"
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log('Queue update:', update);
      }
    });

    console.log('FFmpeg stitching result:', result);

    if (result.data && result.data.video) {
      return new Response(
        JSON.stringify({ 
          video: result.data.video,
          duration: result.data.duration || null,
          metadata: {
            inputCount: videoUrls.length,
            projectName,
            stitchedAt: new Date().toISOString()
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      throw new Error('No video data received from FFmpeg API');
    }

  } catch (error) {
    console.error('Error in stitch-videos-fal function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : 'No details available'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});