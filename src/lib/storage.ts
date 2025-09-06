import { supabase } from '@/integrations/supabase/client';

export interface StorageUploadResult {
  storageUrl: string;
  storagePath: string;
}

export interface GeneratedMediaRecord {
  id: string;
  user_id: string;
  project_id?: string;
  media_type: 'image' | 'video';
  storage_path: string;
  storage_url: string;
  original_prompt?: string;
  generation_params?: any;
  file_size?: number;
  mime_type?: string;
}

// Upload image to storage and save metadata
export const uploadGeneratedImage = async (
  base64Data: string,
  filename: string,
  prompt?: string,
  projectId?: string
): Promise<GeneratedMediaRecord> => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('User not authenticated');

    // Convert base64 to blob
    const response = await fetch(`data:image/png;base64,${base64Data}`);
    const blob = await response.blob();

    // Create storage path with user folder structure
    const storagePath = `${user.id}/${Date.now()}_${filename}`;

    // Upload to generated-images bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('generated-images')
      .upload(storagePath, blob, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('generated-images')
      .getPublicUrl(storagePath);

    // Save metadata to database
    const mediaRecord = {
      user_id: user.id,
      project_id: projectId,
      media_type: 'image' as const,
      storage_path: storagePath,
      storage_url: urlData.publicUrl,
      original_prompt: prompt,
      file_size: blob.size,
      mime_type: 'image/png'
    };

    const { data: dbData, error: dbError } = await supabase
      .from('generated_media')
      .insert(mediaRecord)
      .select()
      .single();

    if (dbError) throw dbError;

    return dbData as GeneratedMediaRecord;
  } catch (error) {
    console.error('Error uploading generated image:', error);
    throw error;
  }
};

// Upload video from URL to storage and save metadata
export const uploadGeneratedVideo = async (
  videoUrl: string,
  filename: string,
  prompt?: string,
  projectId?: string
): Promise<GeneratedMediaRecord> => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('User not authenticated');

    // Download video from external URL
    const response = await fetch(videoUrl);
    if (!response.ok) throw new Error('Failed to download video');
    
    const blob = await response.blob();

    // Create storage path with user folder structure
    const storagePath = `${user.id}/${Date.now()}_${filename}`;

    // Upload to generated-videos bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('generated-videos')
      .upload(storagePath, blob, {
        contentType: 'video/mp4',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('generated-videos')
      .getPublicUrl(storagePath);

    // Save metadata to database
    const mediaRecord = {
      user_id: user.id,
      project_id: projectId,
      media_type: 'video' as const,
      storage_path: storagePath,
      storage_url: urlData.publicUrl,
      original_prompt: prompt,
      file_size: blob.size,
      mime_type: 'video/mp4'
    };

    const { data: dbData, error: dbError } = await supabase
      .from('generated_media')
      .insert(mediaRecord)
      .select()
      .single();

    if (dbError) throw dbError;

    return dbData as GeneratedMediaRecord;
  } catch (error) {
    console.error('Error uploading generated video:', error);
    throw error;
  }
};

// Get user's generated media
export const getUserGeneratedMedia = async (
  mediaType?: 'image' | 'video',
  projectId?: string
): Promise<GeneratedMediaRecord[]> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('User not authenticated');

    let query = supabase
      .from('generated_media')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (mediaType) {
      query = query.eq('media_type', mediaType);
    }

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []) as GeneratedMediaRecord[];
  } catch (error) {
    console.error('Error fetching generated media:', error);
    throw error;
  }
};

// Delete generated media
export const deleteGeneratedMedia = async (mediaId: string): Promise<void> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('User not authenticated');

    // First get the media record to get storage path
    const { data: mediaRecord, error: fetchError } = await supabase
      .from('generated_media')
      .select('storage_path, storage_url, media_type')
      .eq('id', mediaId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !mediaRecord) throw new Error('Media record not found');

    // Delete from storage
    const bucketName = mediaRecord.media_type === 'image' ? 'generated-images' : 'generated-videos';
    const { error: storageError } = await supabase.storage
      .from(bucketName)
      .remove([mediaRecord.storage_path]);

    if (storageError) {
      console.warn('Error deleting from storage:', storageError);
      // Continue with database deletion even if storage fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('generated_media')
      .delete()
      .eq('id', mediaId)
      .eq('user_id', user.id);

    if (dbError) throw dbError;
  } catch (error) {
    console.error('Error deleting generated media:', error);
    throw error;
  }
};