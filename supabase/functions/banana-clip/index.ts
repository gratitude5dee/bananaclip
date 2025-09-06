// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function: banana-clip
// Endpoints:
//   GET    /               -> welcome
//   GET    /health         -> health check
//   GET    /check-config   -> check Gemini key present
//   POST   /generate-images -> main endpoint (multipart/form-data)

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.21.0";

// ---- Config / CORS ----------------------------------------------------------

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "GET,POST,OPTIONS",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";

// ---- Helpers ----------------------------------------------------------------

function jsonResponse(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

function errorResponse(error: string, details?: string, status = 400) {
  return jsonResponse({ success: false, error, details }, status);
}

async function fileToBase64(file: File): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  // Chunked base64 to avoid call stack overflow on big files
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) {
    binary += String.fromCharCode(...buf.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function createGenerationPrompt(d: {
  setting: string;
  subjects: string;
  composition: string;
  environment: string;
  lighting: string;
  focal_points: string;
  mood: string;
}) {
  return `
Create a photorealistic image with the following specifications:

Setting: ${d.setting}
Subjects: ${d.subjects}
Composition: ${d.composition}
Environment: ${d.environment}
Lighting: ${d.lighting}
Focal Points: ${d.focal_points}
Mood: ${d.mood}

Please generate a high-quality, detailed image that captures all these elements harmoniously.
`.trim();
}

function routePath(url: string) {
  // Strip "/functions/v1/banana-clip" prefix so we can match clean subpaths
  const u = new URL(url);
  const parts = u.pathname.split("/").filter(Boolean);
  // [..., 'functions', 'v1', 'banana-clip', ...rest]
  const idx = parts.findIndex((p) => p === "banana-clip");
  const rest = idx >= 0 ? parts.slice(idx + 1) : [];
  return `/${rest.join("/")}`;
}

const VARIATION_FOCUS = [
  "Focus on the main subject with dramatic lighting and close-up details.",
  "Emphasize the environment and atmosphere with wide composition.",
  "Highlight the composition and spatial relationships between elements.",
  "Focus on color harmony and mood with artistic lighting effects.",
  "Emphasize texture and material details with sharp focus.",
];

// ---- Handler ----------------------------------------------------------------

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const path = routePath(req.url);

  try {
    if (req.method === "GET" && (path === "/" || path === "")) {
      return jsonResponse({
        message: "Welcome to Banana Clipper (Supabase Edge) with Nano Banana (Gemini) integration",
        version: "1.0.0",
      });
    }

    if (req.method === "GET" && path === "/health") {
      return jsonResponse({ status: "ok", timestamp: new Date().toISOString() });
    }

    if (req.method === "GET" && path === "/check-config") {
      return jsonResponse({
        gemini_api_configured: Boolean(GEMINI_API_KEY),
        timestamp: new Date().toISOString(),
      });
    }

    if (req.method === "POST" && path === "/generate-images") {
      if (!GEMINI_API_KEY) {
        return errorResponse(
          "API configuration error",
          "Gemini API key not configured. Please set GEMINI_API_KEY as a Supabase secret.",
          500,
        );
      }

      const start = Date.now();
      const form = await req.formData();

      // Required files (same names as FastAPI backend)
      const doodle = form.get("doodle_image");
      const loc1 = form.get("location_image_1");
      const loc2 = form.get("location_image_2");
      const loc3 = form.get("location_image_3");
      const loc4 = form.get("location_image_4");
      const loc5 = form.get("location_image_5");
      const descriptionStr = form.get("description");

      const files = [doodle, loc1, loc2, loc3, loc4, loc5];

      if (!files.every((f) => f instanceof File)) {
        return errorResponse(
          "Invalid form-data",
          "One or more required files are missing or invalid. Expecting 6 files: doodle_image + location_image_1..5.",
          400,
        );
      }
      if (typeof descriptionStr !== "string") {
        return errorResponse(
          "Invalid description format",
          "`description` must be a JSON string.",
          400,
        );
      }

      // Parse and validate description JSON
      let description: any;
      try {
        description = JSON.parse(descriptionStr);
      } catch (e) {
        return errorResponse(
          "Invalid description format",
          `Description must be valid JSON: ${(e as Error).message}`,
          400,
        );
      }

      const requiredFields = [
        "setting",
        "subjects",
        "composition",
        "environment",
        "lighting",
        "focal_points",
        "mood",
      ];
      const missing = requiredFields.filter((k) => !description?.[k]);
      if (missing.length) {
        return errorResponse(
          "Description validation error",
          `Missing required fields: ${missing.join(", ")}`,
          400,
        );
      }

      // Convert all images to base64 for Gemini inlineData
      const imageBase64 = await Promise.all(
        (files as File[]).map((f) => fileToBase64(f)),
      );

      // Build prompt
      const generationPrompt = createGenerationPrompt(description);

      // Gemini client (use 2.5 Flash Image Preview for image generation)
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });

      // Prepare inline image parts
      const imageParts = (files as File[]).map((f, i) => ({
        inlineData: {
          data: imageBase64[i],
          mimeType: f.type || "image/png",
        },
      }));

      // Generate 5 actual images using Gemini 2.5 Flash Image Preview
      const generated: Array<{ id: string; base64_data: string; filename: string }> = [];

      for (let i = 0; i < 5; i++) {
        const variationPrompt =
          `You are Nano Banana, an advanced AI image generator. Based on the provided ` +
          `doodle sketch and reference image, generate a photorealistic image that matches ` +
          `the detailed brief below.\n\n` +
          `${generationPrompt}\n\n` +
          `Reference Images Context:\n` +
          `- Image 1 (Doodle): User's concept sketch showing layout/composition\n` +
          `- Image 2 (Reference): Location/product reference for style and atmosphere\n\n` +
          `Instructions:\n` +
          `1) Use the doodle as the composition guide.\n` +
          `2) Incorporate color, lighting, and stylistic cues from the reference image.\n` +
          `3) Generate a high-quality photorealistic image for VARIATION ${i + 1}.\n` +
          `4) ${VARIATION_FOCUS[i]}\n` +
          `5) Return the image in high resolution.\n\n` +
          `Generate the image now.`;

        try {
          // Use Gemini 2.5 Flash Image Preview with sketch + one specific reference image
          const sketchPart = imageParts[0]; // Always use the doodle/sketch
          const referencePart = imageParts[i + 1]; // Use specific reference for this variation (i+1 because imageParts[0] is sketch)
          const parts: any[] = [{ text: variationPrompt }, sketchPart, referencePart];
          
          const result = await model.generateContent({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 4096,
            },
          });

          // Check if image was generated in response
          const response = result.response;
          const candidates = response.candidates;
          
          if (candidates && candidates.length > 0) {
            const candidate = candidates[0];
            const content = candidate.content;
            
            // Look for inline data in the response parts
            if (content && content.parts) {
              for (const part of content.parts) {
                if (part.inlineData) {
                  const imageData = part.inlineData.data;
                  generated.push({
                    id: `nanobanan_gen_${i + 1}_${Math.floor(Date.now() / 1000)}`,
                    base64_data: imageData,
                    filename: `nano_banana_image_${i + 1}.png`,
                  });
                  break;
                }
              }
            }
          }

          // If no image in response, this might be text-only model response
          // For now, we'll skip this variation
          console.log(`Variation ${i + 1}: ${candidates ? 'processed' : 'no candidates'}`);
          
        } catch (err) {
          console.error(`Gemini error on variation ${i + 1}:`, err);
          // Continue to next variation
        }
      }

      // If no images generated, return error
      if (generated.length === 0) {
        return errorResponse(
          "Image generation failed",
          "Gemini 2.0 Flash did not generate any images. This may be due to content policy restrictions or model limitations. Please try adjusting your prompt or images.",
          500,
        );
      }

      const processing_time = (Date.now() - start) / 1000;
      console.log(`Successfully generated ${generated.length} images in ${processing_time}s`);
      
      return jsonResponse({
        success: true,
        message: `Successfully generated ${generated.length} images`,
        generated_images: generated,
        processing_time,
      });
    }

    // No route matched
    return jsonResponse(
      { success: false, error: "Not Found", details: `No route for ${req.method} ${path}` },
      404,
    );
  } catch (e) {
    console.error("Unhandled error:", e);
    return errorResponse("Internal server error", (e as Error).message, 500);
  }
});