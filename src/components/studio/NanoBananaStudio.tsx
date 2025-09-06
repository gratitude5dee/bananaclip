import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Plus, Users, Settings, Sparkles, Play, RotateCcw, Upload, Film } from 'lucide-react';
import { VideoUpload } from '@/components/video/VideoUpload';
import { VideoTrimmer } from '@/components/video/VideoTrimmer';
import { useVideoProcessor } from '@/hooks/useVideoProcessor';
import { supabase } from '@/integrations/supabase/client';
import type { ProjectState, SceneConfig, Character, AspectRatio, VideoStyle } from '@/lib/schemas';

interface NanoBananaStudioProps {
  projectState: ProjectState;
  updateProject: (updates: Partial<ProjectState>) => void;
  onProgress: (progress: number) => void;
  onError: (error: string | null) => void;
}

export const NanoBananaStudio: React.FC<NanoBananaStudioProps> = ({
  projectState,
  updateProject,
  onProgress,
  onError
}) => {
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [sceneConfig, setSceneConfig] = useState<SceneConfig>({
    sceneName: 'Scene 1',
    location: '',
    lighting: 'Natural',
    weather: 'Clear',
    sceneDescription: '',
    voiceover: '',
    aspectRatio: projectState.aspectRatio,
    videoStyle: 'Cinematic',
    cast: projectState.cast,
    styleReference: '',
    cinematicInspiration: '',
    specialRequests: '',
    format: 'Custom',
    customFormat: '',
    genre: 'Drama',
    tone: 'Serious',
    addVoiceover: false
  });
  
  const [showCharacterDialog, setShowCharacterDialog] = useState(false);
  const [newCharacter, setNewCharacter] = useState<Omit<Character, 'id'>>({
    name: '',
    description: ''
  });

  const { frames, isProcessing, progress: videoProgress, error: videoError, processVideo, reset: resetVideo } = useVideoProcessor();
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);

  // Initialize or get current project
  useEffect(() => {
    initializeProject();
  }, []);

  // Propagate progress and error to parent
  useEffect(() => {
    const totalProgress = Math.max(videoProgress, sceneProgress);
    onProgress(totalProgress);
  }, [videoProgress, sceneProgress, onProgress]);

  useEffect(() => {
    onError(videoError);
  }, [videoError, onError]);

  const initializeProject = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create or get existing project
      const { data: projects, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('name', projectState.projectName)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (!projects) {
        // Create new project
        const { data: newProject, error: createError } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            name: projectState.projectName,
            aspect_ratio: projectState.aspectRatio,
            video_style: 'Cinematic'
          })
          .select()
          .single();

        if (createError) throw createError;
        setCurrentProject(newProject);
      } else {
        setCurrentProject(projects);
      }
    } catch (err: any) {
      console.error('Error initializing project:', err);
      onError(err.message);
    }
  };

  const handleVideoSelect = (file: File) => {
    setSelectedVideo(file);
    setShowTrimmer(true);
  };

  const handleTrimConfirm = async (file: File, startTime: number, endTime: number) => {
    if (!currentProject) return;
    
    setShowTrimmer(false);
    
    try {
      const result = await processVideo(
        currentProject.id,
        file,
        1, // frames per second
        { startTime, endTime }
      );
      
      if (result) {
        console.log('Video processed successfully:', result);
      }
    } catch (err: any) {
      console.error('Error processing video:', err);
      onError(err.message);
    }
  };

  const handleTrimCancel = () => {
    setShowTrimmer(false);
    setSelectedVideo(null);
  };

  const handleStyleSelect = (style: VideoStyle) => {
    setSceneConfig(prev => ({ ...prev, videoStyle: style }));
  };

  const handleAddCharacter = async () => {
    if (newCharacter.name && newCharacter.description && currentProject) {
      try {
        const { data: character, error } = await supabase
          .from('characters')
          .insert({
            project_id: currentProject.id,
            name: newCharacter.name,
            description: newCharacter.description
          })
          .select()
          .single();

        if (error) throw error;

        const updatedCharacter: Character = {
          id: character.id,
          name: character.name,
          description: character.description
        };
        
        const updatedCast = [...projectState.cast, updatedCharacter];
        updateProject({ cast: updatedCast });
        setSceneConfig(prev => ({ ...prev, cast: updatedCast }));
        setNewCharacter({ name: '', description: '' });
        setShowCharacterDialog(false);
      } catch (err: any) {
        console.error('Error adding character:', err);
        onError(err.message);
      }
    }
  };

  const handleGenerate = async () => {
    if (!currentProject || !sceneConfig.sceneName || !sceneConfig.location || !sceneConfig.sceneDescription) {
      return;
    }

    setIsGeneratingScene(true);
    setSceneProgress(0);

    try {
      const { data, error } = await supabase.functions.invoke('generate-scene', {
        body: {
          projectId: currentProject.id,
          sceneConfig
        }
      });

      if (error) throw error;

      if (data.success) {
        setGeneratedVideo(data.videoUrl);
        setSceneProgress(100);
      } else {
        throw new Error(data.error || 'Scene generation failed');
      }
    } catch (err: any) {
      console.error('Error generating scene:', err);
      onError(err.message);
    } finally {
      setIsGeneratingScene(false);
    }
  };

  const reset = () => {
    setGeneratedVideo(null);
    setSceneProgress(0);
    resetVideo();
  };

  // Show video upload if no frames and no trimmer
  if (!frames.length && !showTrimmer && !isProcessing) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <VideoUpload 
          onVideoSelect={handleVideoSelect}
          isProcessing={isProcessing}
          progress={videoProgress}
          error={videoError}
        />
      </div>
    );
  }

  // Show video trimmer
  if (showTrimmer && selectedVideo) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <VideoTrimmer
          file={selectedVideo}
          onConfirm={handleTrimConfirm}
          onCancel={handleTrimCancel}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* Left Panel - Project Settings */}
      <div className="lg:col-span-3 space-y-6">
        <Card className="dark-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Project Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={projectState.projectName}
                onChange={(e) => updateProject({ projectName: e.target.value })}
                placeholder="Untitled Project"
              />
            </div>
            
            <div>
              <Label>Aspect Ratio</Label>
              <Select
                value={projectState.aspectRatio}
                onValueChange={(value: AspectRatio) => {
                  updateProject({ aspectRatio: value });
                  setSceneConfig(prev => ({ ...prev, aspectRatio: value }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                  <SelectItem value="1:1">1:1 (Square)</SelectItem>
                  <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Video Style</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {(['None', 'Cinematic', 'Scribble', 'Film-noir'] as VideoStyle[]).map((style) => (
                  <Card
                    key={style}
                    className={`cursor-pointer transition-colors ${
                      sceneConfig.videoStyle === style ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleStyleSelect(style)}
                  >
                    <CardContent className="p-3 text-center">
                      <div className="text-sm font-medium">{style}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="inspiration">Cinematic Inspiration</Label>
              <Textarea
                id="inspiration"
                placeholder="Describe your visual inspiration..."
                value={sceneConfig.cinematicInspiration || ''}
                onChange={(e) => setSceneConfig(prev => ({ ...prev, cinematicInspiration: e.target.value }))}
                rows={3}
              />
            </div>

            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedVideo(null);
                setShowTrimmer(false);
                resetVideo();
              }}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload New Video
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Middle Panel - Scene Editor & Video Preview */}
      <div className="lg:col-span-6 space-y-6">
        {/* Video Preview */}
        {frames.length > 0 && (
          <Card className="dark-surface">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Film className="h-5 w-5" />
                Video Frames ({frames.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {frames.slice(0, 12).map((frame, index) => (
                  <div key={frame.id} className="relative">
                    <img 
                      src={frame.data} 
                      alt={`Frame ${index + 1}`} 
                      className="w-full h-16 object-cover rounded border"
                    />
                    <div className="absolute bottom-0 right-0 bg-black/70 text-white text-xs px-1 rounded-tl">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="dark-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Scene Configuration
            </CardTitle>
            <CardDescription>
              Configure your scene details and generate enhanced video content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scene-name">Scene Name</Label>
                <Input
                  id="scene-name"
                  placeholder="Opening Scene"
                  value={sceneConfig.sceneName || ''}
                  onChange={(e) => setSceneConfig(prev => ({ ...prev, sceneName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Coffee shop interior"
                  value={sceneConfig.location || ''}
                  onChange={(e) => setSceneConfig(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lighting">Lighting</Label>
                <Input
                  id="lighting"
                  placeholder="Warm, natural"
                  value={sceneConfig.lighting || ''}
                  onChange={(e) => setSceneConfig(prev => ({ ...prev, lighting: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="weather">Weather</Label>
                <Input
                  id="weather"
                  placeholder="Sunny"
                  value={sceneConfig.weather || ''}
                  onChange={(e) => setSceneConfig(prev => ({ ...prev, weather: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Scene Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what happens in this scene..."
                value={sceneConfig.sceneDescription || ''}
                onChange={(e) => setSceneConfig(prev => ({ ...prev, sceneDescription: e.target.value }))}
                rows={4}
                maxLength={2000}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {(sceneConfig.sceneDescription || '').length}/2000 characters
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="voiceover"
                checked={sceneConfig.addVoiceover || false}
                onCheckedChange={(checked) => setSceneConfig(prev => ({ ...prev, addVoiceover: checked }))}
              />
              <Label htmlFor="voiceover">Add Voiceover</Label>
            </div>

            {sceneConfig.addVoiceover && (
              <div>
                <Label htmlFor="voiceover-text">Voiceover Text</Label>
                <Textarea
                  id="voiceover-text"
                  placeholder="Enter voiceover script..."
                  value={sceneConfig.voiceover || ''}
                  onChange={(e) => setSceneConfig(prev => ({ ...prev, voiceover: e.target.value }))}
                  rows={3}
                />
              </div>
            )}

            <Separator />

            <div className="flex gap-4">
              <Button 
                onClick={handleGenerate}
                disabled={isGeneratingScene || !sceneConfig.sceneName || !sceneConfig.location || !sceneConfig.sceneDescription}
                className="flex-1"
              >
                <Play className="mr-2 h-4 w-4" />
                {isGeneratingScene ? 'Generating...' : 'Generate Enhanced Scene'}
              </Button>
              
              {generatedVideo && (
                <Button variant="outline" onClick={reset}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              )}
            </div>

            {generatedVideo && (
              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-green-400 mb-2">Enhanced Scene Generated!</div>
                  <div className="text-xs text-muted-foreground">
                    Your BananaClip scene has been generated and is ready for review.
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Cast */}
      <div className="lg:col-span-3 space-y-6">
        <Card className="dark-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Cast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {projectState.cast.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No characters added yet</p>
                    <p className="text-xs">Add characters to populate your scenes</p>
                  </div>
                ) : (
                  projectState.cast.map((character) => (
                    <Card key={character.id} className="p-3">
                      <div className="font-medium text-sm">{character.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {character.description}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
            
            <Dialog open={showCharacterDialog} onOpenChange={setShowCharacterDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Character
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Character</DialogTitle>
                  <DialogDescription>
                    Create a new character for your project
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="char-name">Character Name</Label>
                    <Input
                      id="char-name"
                      value={newCharacter.name}
                      onChange={(e) => setNewCharacter(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Sarah"
                    />
                  </div>
                  <div>
                    <Label htmlFor="char-description">Description</Label>
                    <Textarea
                      id="char-description"
                      value={newCharacter.description}
                      onChange={(e) => setNewCharacter(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="e.g., Young entrepreneur, confident, wearing business casual"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddCharacter} className="flex-1">
                      Add Character
                    </Button>
                    <Button variant="outline" onClick={() => setShowCharacterDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};