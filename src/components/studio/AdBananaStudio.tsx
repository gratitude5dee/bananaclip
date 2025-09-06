import React, { useState } from 'react';
import { ProjectState, AdBrief, Platform, Objective, PLATFORM_CONSTRAINTS } from '@/lib/schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Sparkles, Download, Copy, Zap, Camera, Info, Cloud } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Target, Hash, Clock, Palette } from 'lucide-react';
import { useAdBanana } from '@/hooks/useAdBanana';
import { useFalUpscale } from '@/hooks/useFalUpscale';
import { useBatchVideoGeneration } from '@/hooks/useBatchVideoGeneration';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DrawingCanvas } from '@/components/ui/drawing-canvas';
import { ImageUploadGrid } from '@/components/ui/image-upload-grid';
import { VideoGenerationModal } from './VideoGenerationModal';
import { generateImagesFromCanvas, generateActualImagesFromCanvas } from '@/services/geminiService';

interface AdBananaStudioProps {
  projectState: ProjectState;
  onProgress: (progress: number) => void;
  onError: (error: string | null) => void;
}

export function AdBananaStudio({ projectState, onProgress, onError }: AdBananaStudioProps) {
  // Scene description form state
  const [sceneDescription, setSceneDescription] = useState({
    setting: '',
    subjects: '',
    composition: '',
    environment: '',
    lighting: '',
    focalPoints: '',
    mood: '',
  });
  
  // Visual assets state
  const [canvasData, setCanvasData] = useState<string>('');
  const [referenceImages, setReferenceImages] = useState<(File | null)[]>([]);
  const [generatedImages, setGeneratedImages] = useState<{ id: string; base64_data: string; filename: string }[]>([]);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [lastGenerationTime, setLastGenerationTime] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // Generation settings
  const [adBrief, setAdBrief] = useState({
    brand: '',
    product: '',
    valueProp: '',
    audience: '',
    objective: 'awareness' as const,
    platform: 'tiktok' as const,
    durationSec: 30,
    sensitiveClaims: false
  });
  const [variantCount, setVariantCount] = useState(3);
  
  // Modal states
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedImageForVideo, setSelectedImageForVideo] = useState<{base64: string; name: string} | null>(null);
  const [activeResultTab, setActiveResultTab] = useState('images');
  const [hoveredImageIndex, setHoveredImageIndex] = useState<number | null>(null);

  // Hooks
  const { generateAdPackage, exportToJSON, exportToSRT, isGenerating, progress, error, result, reset } = useAdBanana();
  const { upscaleImage, isUpscaling, progress: upscaleProgress, error: upscaleError, result: upscaleResult } = useFalUpscale();
  const { generateAllVideos, isGenerating: isBatchGenerating, progress: batchProgress, generatedVideos: batchGeneratedVideos, errors: batchErrors, reset: resetBatch } = useBatchVideoGeneration();

  // Effects for updating global progress and error
  React.useEffect(() => {
    onProgress(isGenerating ? progress : (isGeneratingImages ? 50 : 0));
  }, [isGenerating, progress, isGeneratingImages, onProgress]);

  React.useEffect(() => {
    onError(error || generationError || upscaleError);
  }, [error, generationError, upscaleError, onError]);

  // Handlers
  const handleGenerate = async () => {
    // Rate limiting check (3 seconds)
    const now = Date.now();
    if (now - lastGenerationTime < 3000) {
      setGenerationError('Please wait before generating again');
      return;
    }
    setLastGenerationTime(now);

    setGenerationError(null);
    setIsGeneratingImages(true);

    try {
      console.log('Starting image generation with scene description:', sceneDescription);
      const images = await generateActualImagesFromCanvas(canvasData, referenceImages, sceneDescription);
      console.log('Generated images:', images);
      setGeneratedImages(images);
      setIsGeneratingImages(false);

      // Then generate ad package
      if (!adBrief.audience || !adBrief.valueProp) {
        throw new Error('Please fill in audience and value proposition');
      }

      await generateAdPackage({ brief: adBrief, variantCount });
    } catch (error) {
      setIsGeneratingImages(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate images';
      setGenerationError(errorMessage);
      console.error('Error generating:', error);
    }
  };

  const handleGenerateAllVideos = () => {
    if (generatedImages.length === 0) return;
    
    const sceneDescText = `${sceneDescription.setting} ${sceneDescription.subjects} ${sceneDescription.environment}`.trim();
    generateAllVideos(generatedImages, sceneDescText || 'Dynamic video scene');
  };

  const handleExportJSON = () => {
    if (result) {
      exportToJSON(result);
    }
  };

  const handleExportSRT = () => {
    if (result) {
      exportToSRT(result.baseScript);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Visual Concept Input */}
      <Card className="bg-card/50 backdrop-blur-lg border border-border/50 rounded-2xl mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
            <Palette className="h-5 w-5 text-primary" />
            Visual Concept Input
          </CardTitle>
          <CardDescription>
            Sketch your ideas or upload reference images to guide the AI generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Drawing Canvas */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-muted-foreground">Creative Sketch</Label>
              <DrawingCanvas onDataChange={setCanvasData} />
            </div>

            {/* Reference Images */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-muted-foreground">Reference Images (Optional)</Label>
              <ImageUploadGrid 
                onChange={setReferenceImages}
                maxImages={4}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scene Description */}
      <Card className="bg-card/50 backdrop-blur-lg border border-border/50 rounded-2xl mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
            <Camera className="h-5 w-5 text-primary" />
            Scene Description
          </CardTitle>
          <CardDescription>
            Describe the visual elements you want in your creative concept
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="setting" className="text-sm font-medium text-muted-foreground">Setting *</Label>
              <Textarea
                id="setting"
                placeholder="e.g., Modern coffee shop, outdoor park, minimalist studio"
                value={sceneDescription.setting}
                onChange={(e) => setSceneDescription(prev => ({ ...prev, setting: e.target.value }))}
                className="bg-background/50 border-border/50 focus:border-primary/50 min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subjects" className="text-sm font-medium text-muted-foreground">Main Subjects *</Label>
              <Textarea
                id="subjects"
                placeholder="e.g., Young professional using smartphone, happy family"
                value={sceneDescription.subjects}
                onChange={(e) => setSceneDescription(prev => ({ ...prev, subjects: e.target.value }))}
                className="bg-background/50 border-border/50 focus:border-primary/50 min-h-[80px]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mood" className="text-sm font-medium text-muted-foreground">Mood & Atmosphere</Label>
            <Input
              id="mood"
              placeholder="e.g., Energetic and vibrant, calm and peaceful, bold and dynamic"
              value={sceneDescription.mood}
              onChange={(e) => setSceneDescription(prev => ({ ...prev, mood: e.target.value }))}
              className="bg-background/50 border-border/50 focus:border-primary/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lighting" className="text-sm font-medium text-muted-foreground">Lighting & Style</Label>
            <Input
              id="lighting"
              placeholder="e.g., Natural sunlight, studio lighting, golden hour, neon lights"
              value={sceneDescription.lighting}
              onChange={(e) => setSceneDescription(prev => ({ ...prev, lighting: e.target.value }))}
              className="bg-background/50 border-border/50 focus:border-primary/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="focalPoints" className="text-sm font-medium text-muted-foreground">Key Visual Elements</Label>
            <Input
              id="focalPoints"
              placeholder="e.g., Product packaging, brand colors, specific gestures"
              value={sceneDescription.focalPoints}
              onChange={(e) => setSceneDescription(prev => ({ ...prev, focalPoints: e.target.value }))}
              className="bg-background/50 border-border/50 focus:border-primary/50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="composition" className="text-sm font-medium text-muted-foreground">Composition</Label>
              <Textarea
                id="composition"
                placeholder="Describe the arrangement and positioning of elements"
                value={sceneDescription.composition}
                onChange={(e) => setSceneDescription(prev => ({ ...prev, composition: e.target.value }))}
                className="bg-background/50 border-border/50 focus:border-primary/50 min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="environment" className="text-sm font-medium text-muted-foreground">Environment</Label>
              <Textarea
                id="environment"
                placeholder="Describe the surroundings and atmosphere"
                value={sceneDescription.environment}
                onChange={(e) => setSceneDescription(prev => ({ ...prev, environment: e.target.value }))}
                className="bg-background/50 border-border/50 focus:border-primary/50 min-h-[80px]"
              />
            </div>
          </div>


          <div className="flex justify-center gap-4 pt-4">
            <Button 
              variant="outline"
              onClick={() => {
                console.log('Preview Data:', {
                  sceneDescription,
                  canvasData: canvasData ? 'Canvas data available' : 'No sketch',
                  referenceImages: referenceImages.filter(img => img).length + ' images',
                });
              }}
              className="border-primary/50 text-primary hover:bg-primary/10"
            >
              Preview Brief
            </Button>
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || isGeneratingImages || !sceneDescription.setting || !sceneDescription.subjects}
              className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/25 transition-all duration-300"
              size="lg"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isGeneratingImages 
                ? 'Generating AI Images...' 
                : isGenerating 
                  ? 'Creating Ad Package...' 
                  : 'Generate Creative with Gemini NanoBanana'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Images Section */}
      {generatedImages.length > 0 && (
        <Card className="bg-card/50 backdrop-blur-lg border border-border/50 rounded-2xl mx-4 mb-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
                <Camera className="h-5 w-5 text-primary" />
                Generated Images ({generatedImages.length})
              </span>
              <div className="flex gap-2">
                <Button 
                  onClick={handleGenerateAllVideos}
                  disabled={generatedImages.length === 0 || isBatchGenerating}
                  variant="default"
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isBatchGenerating ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                      Generating ({batchProgress.completed}/{batchProgress.total})
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Generate All Videos
                    </>
                  )}
                </Button>
                {batchGeneratedVideos.length > 0 && (
                  <span className="text-sm text-muted-foreground self-center">
                    {batchGeneratedVideos.length} videos generated
                  </span>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedImages.map((imageData, index) => (
                <Card key={index} className="bg-card/30 border-border/30 overflow-hidden">
                  <div className="relative aspect-square">
                    <img 
                      src={`data:image/png;base64,${imageData.base64_data}`} 
                      alt={`AI Generated Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{imageData.filename}</span>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-background/90 hover:bg-background text-foreground border border-border/50"
                            onClick={() => upscaleImage(imageData.base64_data)}
                            disabled={isUpscaling}
                          >
                            <Zap className="h-4 w-4 mr-2" />
                            {isUpscaling ? 'Upscaling...' : 'Upscale'}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-background/90 hover:bg-background text-foreground border border-border/50"
                            onClick={() => {
                              setSelectedImageForVideo({
                                base64: imageData.base64_data,
                                name: imageData.filename
                              });
                              setVideoModalOpen(true);
                            }}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Video
                          </Button>
                        </div>
                      </div>
                       <div className="flex gap-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => {
                             // Download image
                             const link = document.createElement('a');
                             link.href = `data:image/png;base64,${imageData.base64_data}`;
                             link.download = imageData.filename;
                             link.click();
                           }}
                           className="flex-1 border-border/50 hover:bg-background/80"
                         >
                           <Download className="h-4 w-4 mr-2" />
                           Download
                         </Button>
                         <Tooltip>
                           <TooltipTrigger asChild>
                             <Button
                               variant="outline"
                               size="sm"
                               className="border-border/50 hover:bg-background/80"
                             >
                               <Info className="h-4 w-4" />
                             </Button>
                           </TooltipTrigger>
                           <TooltipContent>
                             <p className="text-xs">AI-generated image from Gemini 2.5 Flash</p>
                           </TooltipContent>
                         </Tooltip>
                       </div>
                    </div>
                   </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Videos Section */}
      {batchGeneratedVideos.length > 0 && (
        <Card className="bg-card/50 backdrop-blur-lg border border-border/50 rounded-2xl mx-4 mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full"></div>
              <Play className="h-5 w-5 text-purple-500" />
              Generated Videos ({batchGeneratedVideos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {batchGeneratedVideos.map((video, index) => (
                <Card key={video.id} className="bg-card/30 border-border/30 overflow-hidden">
                  <div className="relative aspect-video">
                    <video 
                      src={video.storageUrl || video.url} 
                      controls
                      className="w-full h-full object-cover"
                      poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23666' d='M8 5v14l11-7z'/%3E%3C/svg%3E"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <div className="text-xs text-muted-foreground truncate">
                      {video.prompt}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = video.storageUrl || video.url;
                          link.download = `video_${index + 1}.mp4`;
                          link.click();
                        }}
                        className="flex-1 border-border/50 hover:bg-background/80"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      {video.storageUrl && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-border/50 hover:bg-background/80"
                            >
                              <Cloud className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Stored in Supabase Storage</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card className="bg-card/50 backdrop-blur-lg border border-border/50 rounded-2xl mx-4 mb-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
                <Sparkles className="h-5 w-5 text-primary" />
                Generated Ad Package
              </span>
              <div className="flex gap-2">
                <Button onClick={handleExportJSON} variant="outline" size="sm" className="border-border/50 hover:bg-background/80">
                  <Download className="mr-2 h-4 w-4" />
                  Export JSON
                </Button>
                <Button onClick={handleExportSRT} variant="outline" size="sm" className="border-border/50 hover:bg-background/80">
                  <Download className="mr-2 h-4 w-4" />
                  Export SRT
                </Button>
                <Button onClick={reset} variant="outline" size="sm" className="border-border/50 hover:bg-background/80">
                  Reset
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeResultTab} onValueChange={setActiveResultTab}>
              <TabsList className="grid w-full grid-cols-6 bg-background/50">
                <TabsTrigger value="images">AI Images ({generatedImages.length})</TabsTrigger>
                <TabsTrigger value="videos">Videos ({batchGeneratedVideos.length})</TabsTrigger>
                <TabsTrigger value="script">Base Script</TabsTrigger>
                <TabsTrigger value="variants">Variants ({result.variants.length})</TabsTrigger>
                <TabsTrigger value="captions">Captions</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
              </TabsList>

              <TabsContent value="images" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {generatedImages.length > 0 ? (
                    generatedImages.map((imageData, index) => (
                      <Card key={imageData.id} className="bg-card/50 backdrop-blur-sm border border-border/50">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-sm">
                                {index + 1}
                              </div>
                              Creative Image {index + 1}
                            </CardTitle>
                            <Badge variant="secondary" className="text-xs">
                              Gemini 2.5 Flash
                            </Badge>
                          </div>
                        </CardHeader>
                         <CardContent className="space-y-4">
                           <div 
                             className="relative bg-gradient-to-br from-muted/30 to-muted/10 border border-border/30 rounded-xl overflow-hidden group"
                             onMouseEnter={() => setHoveredImageIndex(index)}
                             onMouseLeave={() => setHoveredImageIndex(null)}
                           >
                             <div className="aspect-square">
                               <img 
                                 src={`data:image/png;base64,${imageData.base64_data}`} 
                                 alt={`AI Generated Image ${index + 1}`}
                                 className="w-full h-full object-cover transition-transform group-hover:scale-105"
                               />
                               <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 flex items-center justify-center gap-3 ${
                                 hoveredImageIndex === index ? 'opacity-100' : 'opacity-0'
                               }`}>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="bg-background/90 hover:bg-background text-foreground border border-border/50"
                                  onClick={() => upscaleImage(imageData.base64_data)}
                                  disabled={isUpscaling}
                                >
                                  <Zap className="h-4 w-4 mr-2" />
                                  {isUpscaling ? 'Upscaling...' : 'Upscale'}
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="bg-background/90 hover:bg-background text-foreground border border-border/50"
                                  onClick={() => {
                                    setSelectedImageForVideo({
                                      base64: imageData.base64_data,
                                      name: imageData.filename
                                    });
                                    setVideoModalOpen(true);
                                  }}
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  Video
                                </Button>
                               </div>
                             </div>
                           </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Download image
                                  const link = document.createElement('a');
                                  link.href = `data:image/png;base64,${imageData.base64_data}`;
                                  link.download = imageData.filename;
                                  link.click();
                                }}
                                className="flex-1 border-border/50 hover:bg-background/80"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download Image
                              </Button>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-border/50 hover:bg-background/80"
                                  >
                                    <Info className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">AI-generated image from Gemini 2.5 Flash Image Preview</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                         </CardContent>
                       </Card>
                     ))
                   ) : (
                     <div className="col-span-full">
                       <Card className="bg-card/30 border-dashed border-border/50">
                         <CardContent className="flex flex-col items-center justify-center py-12">
                           <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mb-4">
                             <Camera className="h-8 w-8 text-primary/60" />
                           </div>
                           <h3 className="font-medium text-foreground mb-2">No AI Images Generated Yet</h3>
                           <p className="text-sm text-muted-foreground text-center max-w-md">
                             Fill out the scene description and click "Generate Creative" to create AI-powered image concepts with Gemini NanoBanana.
                           </p>
                         </CardContent>
                       </Card>
                     </div>
                   )}
                 </div>
               </TabsContent>

              <TabsContent value="videos" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {batchGeneratedVideos.map((video, index) => (
                    <Card key={video.id} className="bg-card/30 border-border/30 overflow-hidden">
                      <div className="relative aspect-video">
                        <video 
                          src={video.storageUrl || video.url} 
                          controls
                          className="w-full h-full object-cover"
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                      <CardContent className="p-4 space-y-2">
                        <div className="text-xs text-muted-foreground truncate">
                          {video.prompt}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = video.storageUrl || video.url;
                              link.download = `video_${index + 1}.mp4`;
                              link.click();
                            }}
                            className="flex-1 border-border/50 hover:bg-background/80"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Video
                          </Button>
                          {video.storageUrl && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-border/50 hover:bg-background/80"
                                >
                                  <Cloud className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Stored in Supabase Storage</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="script" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Hook</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <p className="text-sm">{result.baseScript.hook}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(result.baseScript.hook)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Content Beats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.baseScript.beats.map((beat, index) => (
                      <div key={index} className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <Badge variant="outline" className="mb-2">Beat {index + 1}</Badge>
                          <p className="text-sm">{beat.content}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(beat.content)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Call to Action
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium">{result.baseScript.callToAction}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(result.baseScript.callToAction)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="variants" className="space-y-4">
                <div className="grid gap-4">
                  {result.variants.map((variant, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>Variant {index + 1}</span>
                          <Badge variant="secondary">{variant.platform}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Hook</h4>
                          <div className="flex items-start justify-between">
                            <p className="text-sm">{variant.hook}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(variant.hook)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Call to Action</h4>
                          <div className="flex items-start justify-between">
                            <p className="text-sm">{variant.callToAction}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(variant.callToAction)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Key Messages</h4>
                          <div className="space-y-2">
                            {variant.keyMessages.map((message, msgIndex) => (
                              <div key={msgIndex} className="flex items-start justify-between p-2 bg-muted/30 rounded">
                                <p className="text-sm">{message}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(message)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="captions" className="space-y-4">
                <div className="space-y-4">
                  {result.baseScript.captions.map((caption, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Badge variant="outline" className="mb-2">
                              {caption.startTime}s - {caption.endTime}s
                            </Badge>
                            <p className="text-sm">{caption.text}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(caption.text)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="compliance" className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Review these compliance notes before publishing your ad content.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  {result.complianceNotes.map((note, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Badge variant={note.severity === 'high' ? 'destructive' : note.severity === 'medium' ? 'default' : 'secondary'} className="mb-2">
                              {note.severity.toUpperCase()} - {note.category}
                            </Badge>
                            <p className="text-sm">{note.issue}</p>
                            <p className="text-xs text-muted-foreground mt-1">{note.recommendation}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(`${note.issue}\n\nRecommendation: ${note.recommendation}`)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
      
      {/* Video Generation Modal */}
      {selectedImageForVideo && (
        <VideoGenerationModal
          isOpen={videoModalOpen}
          onClose={() => {
            setVideoModalOpen(false);
            setSelectedImageForVideo(null);
          }}
          imageBase64={selectedImageForVideo.base64}
          imageName={selectedImageForVideo.name}
        />
      )}
    </div>
  );
}