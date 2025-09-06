import React, { useState } from 'react';
import { ProjectState } from '@/lib/schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, Users, Play, Image as ImageIcon, Film } from 'lucide-react';
import { useFalWorkflow } from '@/hooks/useFalWorkflow';
import { SceneConfig, VideoStyle, AspectRatio, Character } from '@/lib/schemas';

interface NanoBananaStudioProps {
  projectState: ProjectState;
  updateProject: (updates: Partial<ProjectState>) => void;
  onProgress: (progress: number) => void;
  onError: (error: string | null) => void;
}

export function NanoBananaStudio({ 
  projectState, 
  updateProject, 
  onProgress, 
  onError 
}: NanoBananaStudioProps) {
  const [sceneConfig, setSceneConfig] = useState<Partial<SceneConfig>>({
    aspectRatio: projectState.aspectRatio,
    cast: projectState.cast,
  });
  const [showSceneEditor, setShowSceneEditor] = useState(false);
  const [showCharacterDialog, setShowCharacterDialog] = useState(false);
  const [newCharacter, setNewCharacter] = useState({ name: '', description: '' });

  const { generateScene, isGenerating, progress, error, result, reset } = useFalWorkflow();

  // Update global progress/error when local state changes
  React.useEffect(() => {
    onProgress(progress);
  }, [progress, onProgress]);

  React.useEffect(() => {
    onError(error);
  }, [error, onError]);

  const handleStyleSelect = (style: VideoStyle) => {
    setSceneConfig(prev => ({ ...prev, videoStyle: style }));
  };

  const handleAddCharacter = () => {
    if (newCharacter.name && newCharacter.description) {
      const character: Character = {
        id: `char-${Date.now()}`,
        name: newCharacter.name,
        description: newCharacter.description,
      };
      
      const updatedCast = [...projectState.cast, character];
      updateProject({ cast: updatedCast });
      setSceneConfig(prev => ({ ...prev, cast: updatedCast }));
      setNewCharacter({ name: '', description: '' });
      setShowCharacterDialog(false);
    }
  };

  const handleGenerate = async () => {
    if (sceneConfig.sceneName && sceneConfig.location && sceneConfig.sceneDescription) {
      const fullConfig: SceneConfig = {
        sceneName: sceneConfig.sceneName!,
        location: sceneConfig.location!,
        lighting: sceneConfig.lighting || 'Natural',
        weather: sceneConfig.weather || 'Clear',
        sceneDescription: sceneConfig.sceneDescription!,
        voiceover: sceneConfig.voiceover,
        aspectRatio: sceneConfig.aspectRatio || '16:9',
        videoStyle: sceneConfig.videoStyle || 'None',
        styleReference: sceneConfig.styleReference,
        cinematicInspiration: sceneConfig.cinematicInspiration,
        cast: sceneConfig.cast || [],
        specialRequests: sceneConfig.specialRequests,
        format: sceneConfig.format || 'Custom',
        customFormat: sceneConfig.customFormat,
        genre: sceneConfig.genre,
        tone: sceneConfig.tone,
        addVoiceover: sceneConfig.addVoiceover || false,
      };

      await generateScene(fullConfig);
    }
  };

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
          </CardContent>
        </Card>
      </div>

      {/* Middle Panel - Scene Editor */}
      <div className="lg:col-span-6 space-y-6">
        <Card className="dark-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="h-5 w-5" />
              Scene Configuration
            </CardTitle>
            <CardDescription>
              Configure your scene details and generate video content
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
                placeholder="Describe what happens in this scene... (max 2000 characters)"
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
                disabled={isGenerating || !sceneConfig.sceneName || !sceneConfig.location || !sceneConfig.sceneDescription}
                className="flex-1"
              >
                <Play className="mr-2 h-4 w-4" />
                {isGenerating ? 'Generating...' : 'Generate Scene'}
              </Button>
              
              {result && (
                <Button variant="outline" onClick={reset}>
                  Reset
                </Button>
              )}
            </div>

            {result && (
              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="p-4">
                  <div className="text-sm font-medium text-green-400 mb-2">Generation Complete!</div>
                  <div className="text-xs text-muted-foreground">
                    Video generated successfully. Ready for review.
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
}