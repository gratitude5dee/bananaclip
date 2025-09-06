import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VideoProcessRequest {
  projectId: string
  videoFile: {
    name: string
    data: string // base64 encoded
    type: string
    size: number
  }
  framesPerSecond?: number
  trimOptions?: {
    startTime: number
    endTime: number
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

    const { projectId, videoFile, framesPerSecond = 1, trimOptions }: VideoProcessRequest = await req.json()

    console.log(`Processing video for project ${projectId}`)

    // Create processing job
    const { data: job, error: jobError } = await supabaseClient
      .from('processing_jobs')
      .insert({
        user_id: user.id,
        project_id: projectId,
        job_type: 'frame_extraction',
        status: 'processing',
        progress: 0,
        input_data: {
          fileName: videoFile.name,
          framesPerSecond,
          trimOptions
        }
      })
      .select()
      .single()

    if (jobError) {
      throw new Error(`Failed to create processing job: ${jobError.message}`)
    }

    // Decode base64 video data
    const videoData = Uint8Array.from(atob(videoFile.data), c => c.charCodeAt(0))
    
    // Upload video to storage
    const videoPath = `${user.id}/${projectId}/${videoFile.name}`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('video-uploads')
      .upload(videoPath, videoData, {
        contentType: videoFile.type,
        upsert: true
      })

    if (uploadError) {
      await supabaseClient
        .from('processing_jobs')
        .update({ 
          status: 'failed', 
          error_message: `Upload failed: ${uploadError.message}` 
        })
        .eq('id', job.id)
      
      throw new Error(`Failed to upload video: ${uploadError.message}`)
    }

    // Create video asset record
    const { data: asset, error: assetError } = await supabaseClient
      .from('video_assets')
      .insert({
        project_id: projectId,
        file_name: videoFile.name,
        file_url: uploadData.path,
        file_size: videoFile.size,
        mime_type: videoFile.type,
        asset_type: 'upload',
        metadata: {
          framesPerSecond,
          trimOptions
        }
      })
      .select()
      .single()

    if (assetError) {
      throw new Error(`Failed to create asset record: ${assetError.message}`)
    }

    // Update job progress
    await supabaseClient
      .from('processing_jobs')
      .update({ 
        progress: 50,
        output_data: {
          assetId: asset.id,
          videoPath: uploadData.path
        }
      })
      .eq('id', job.id)

    // Simulate frame extraction process
    // In a real implementation, this would process the actual video file
    const frames: any[] = []
    const totalFrames = Math.floor((trimOptions?.endTime ?? 10) - (trimOptions?.startTime ?? 0)) * framesPerSecond
    
    for (let i = 0; i < Math.min(totalFrames, 20); i++) {
      // Simulate frame extraction
      frames.push({
        id: i,
        timestamp: (trimOptions?.startTime ?? 0) + (i / framesPerSecond),
        frameIndex: i
      })

      // Update progress
      const progress = 50 + Math.floor((i / totalFrames) * 50)
      await supabaseClient
        .from('processing_jobs')
        .update({ progress })
        .eq('id', job.id)
    }

    // Complete the job
    await supabaseClient
      .from('processing_jobs')
      .update({ 
        status: 'completed',
        progress: 100,
        output_data: {
          assetId: asset.id,
          videoPath: uploadData.path,
          frames,
          totalFrames: frames.length
        }
      })
      .eq('id', job.id)

    console.log(`Video processing completed for project ${projectId}`)

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        assetId: asset.id,
        frames,
        message: 'Video processed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing video:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})