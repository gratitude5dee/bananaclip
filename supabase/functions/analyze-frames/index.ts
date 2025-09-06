import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { frames } = await req.json();
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const prompt = "You are a creative video editor's assistant. Analyze these video frames and provide suggestions for edits that would make a short video clip more engaging for marketing. Identify key moments or objects. Provide a list of suggestions in JSON format with frameIndex and suggestion fields.";
    
    const imageParts = frames.map((frame: string, index: number) => {
      const base64Data = frame.split(',')[1];
      return {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data,
        }
      };
    });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            ...imageParts
          ]
        }],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API call failed');
    }

    let suggestions = [];
    try {
      const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      suggestions = JSON.parse(jsonText);
    } catch (parseError) {
      console.log('Failed to parse JSON response, providing fallback suggestions');
      suggestions = frames.map((_: any, index: number) => ({
        frameIndex: index,
        suggestion: `Consider enhancing frame ${index + 1} with creative effects or text overlays`
      }));
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-frames function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});