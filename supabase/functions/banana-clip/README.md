# Banana Clipper – Supabase Edge Function

Ports the FastAPI backend to a Supabase Edge Function (Deno + TS) with Gemini 2.0 Flash image generation.

## Setup

1. Install Supabase CLI:
   https://supabase.com/docs/guides/cli

2. Start local stack:
   ```bash
   supabase start
   ```

3. Serve the function locally:
   ```bash
   cd supabase/functions/banana-clip
   supabase functions serve --env-file .env.example
   ```

   Local URL:
   ```
   http://localhost:54321/functions/v1/banana-clip
   ```

4. Set secrets in your project (for deploy):
   ```bash
   supabase secrets set GEMINI_API_KEY=YOUR_KEY
   ```

5. Deploy:
   ```bash
   supabase functions deploy banana-clip --no-verify-jwt
   ```

   (Add JWT verification if you want auth on this function.)

## Endpoints

- `GET /functions/v1/banana-clip/` – Welcome
- `GET /functions/v1/banana-clip/health` – Health check  
- `GET /functions/v1/banana-clip/check-config` – Gemini key check
- `POST /functions/v1/banana-clip/generate-images` – Main endpoint

## Request (multipart/form-data)

**Files:**
- `doodle_image` (PNG/JPG)
- `location_image_1..location_image_5` (PNG/JPG)

**Field:**
- `description` – JSON string with keys:
  `setting, subjects, composition, environment, lighting, focal_points, mood`

## Response

```json
{
  "success": true,
  "message": "Successfully generated 5 images",
  "generated_images": [
    { 
      "id": "nanobanan_gen_1_1699999999", 
      "base64_data": "...", 
      "filename": "nano_banana_image_1.png" 
    }
  ],
  "processing_time": 12.34
}
```

**Note:** Uses Gemini 2.0 Flash for actual image generation instead of text descriptions.

## Example fetch (Frontend)

```javascript
const formData = new FormData();
formData.append("doodle_image", doodleFile);
formData.append("location_image_1", loc1);
formData.append("location_image_2", loc2);
formData.append("location_image_3", loc3);
formData.append("location_image_4", loc4);
formData.append("location_image_5", loc5);
formData.append("description", JSON.stringify(descriptionObject));

const res = await fetch(
  `${supabaseUrl}/functions/v1/banana-clip/generate-images`,
  { 
    method: "POST", 
    body: formData,
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  }
);
const json = await res.json();
if (json.success) {
  json.generated_images.forEach((img) => {
    const el = new Image();
    el.src = `data:image/png;base64,${img.base64_data}`;
    document.body.appendChild(el);
  });
}
```

## What changed from FastAPI version

- **Runtime:** FastAPI → **Supabase Edge (Deno/TypeScript)**
- **Routes:** kept logically the same (now under `/functions/v1/banana-clip/*`).
- **Uploads:** still `multipart/form-data`, parsed via `await req.formData()`.
- **Gemini:** via `@google/generative-ai` with Gemini 2.0 Flash for image generation.
- **Images:** generates **actual images** using Gemini 2.0 Flash instead of placeholder PNGs.
- **Config:** use `supabase secrets set GEMINI_API_KEY=...`.