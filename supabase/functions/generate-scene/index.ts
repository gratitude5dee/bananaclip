import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SceneGenerationRequest {
  projectId: string
  sceneId?: string
  sceneConfig: {
    sceneName: string
    location: string
    lighting: string
    weather: string
    sceneDescription: string
    voiceover?: string
    aspectRatio: string
    videoStyle: string
    cast: any[]
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const { projectId, sceneId, sceneConfig }: SceneGenerationRequest = await req.json()

    console.log(`Generating scene for project ${projectId}`)

    // Create or update scene record
    let scene
    if (sceneId) {
      const { data, error } = await supabaseClient
        .from('scenes')
        .update({
          name: sceneConfig.sceneName,
          location: sceneConfig.location,
          lighting: sceneConfig.lighting,
          weather: sceneConfig.weather,
          description: sceneConfig.sceneDescription,
          voiceover: sceneConfig.voiceover,
          scene_config: sceneConfig,
          status: 'generating'
        })
        .eq('id', sceneId)
        .select()
        .single()
      
      if (error) throw new Error(`Failed to update scene: ${error.message}`)
      scene = data
    } else {
      const { data, error } = await supabaseClient
        .from('scenes')
        .insert({
          project_id: projectId,
          name: sceneConfig.sceneName,
          location: sceneConfig.location,
          lighting: sceneConfig.lighting,
          weather: sceneConfig.weather,
          description: sceneConfig.sceneDescription,
          voiceover: sceneConfig.voiceover,
          scene_config: sceneConfig,
          status: 'generating'
        })
        .select()
        .single()
      
      if (error) throw new Error(`Failed to create scene: ${error.message}`)
      scene = data
    }

    // Create processing job
    const { data: job, error: jobError } = await supabaseClient
      .from('processing_jobs')
      .insert({
        user_id: user.id,
        project_id: projectId,
        scene_id: scene.id,
        job_type: 'scene_generation',
        status: 'processing',
        progress: 0,
        input_data: sceneConfig
      })
      .select()
      .single()

    if (jobError) {
      throw new Error(`Failed to create processing job: ${jobError.message}`)
    }

    // Simulate scene generation process
    const generationSteps = [
      { step: 'Analyzing scene configuration', progress: 20 },
      { step: 'Generating visual elements', progress: 40 },
      { step: 'Processing characters and cast', progress: 60 },
      { step: 'Applying lighting and weather effects', progress: 80 },
      { step: 'Finalizing video generation', progress: 95 }
    ]

    for (const { step, progress } of generationSteps) {
      await supabaseClient
        .from('processing_jobs')
        .update({ 
          progress,
          output_data: { currentStep: step }
        })
        .eq('id', job.id)

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // Generate mock video URL (in real implementation, this would be actual video generation)
    const mockVideoUrl = `generated-videos/${user.id}/${projectId}/${scene.id}/generated_scene.mp4`

    // Update scene with generated video
    await supabaseClient
      .from('scenes')
      .update({
        generated_video_url: mockVideoUrl,
        status: 'completed'
      })
      .eq('id', scene.id)

    // Create video asset for generated scene
    await supabaseClient
      .from('video_assets')
      .insert({
        project_id: projectId,
        scene_id: scene.id,
        file_name: `${sceneConfig.sceneName}_generated.mp4`,
        file_url: mockVideoUrl,
        mime_type: 'video/mp4',
        asset_type: 'generated',
        metadata: {
          sceneConfig,
          generatedAt: new Date().toISOString()
        }
      })

    // Complete the job
    await supabaseClient
      .from('processing_jobs')
      .update({ 
        status: 'completed',
        progress: 100,
        output_data: {
          sceneId: scene.id,
          videoUrl: mockVideoUrl,
          generatedAt: new Date().toISOString()
        }
      })
      .eq('id', job.id)

    console.log(`Scene generation completed for project ${projectId}, scene ${scene.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        sceneId: scene.id,
        videoUrl: mockVideoUrl,
        message: 'Scene generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating scene:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})