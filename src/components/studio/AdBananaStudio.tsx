import React, { useState } from 'react';
import { ProjectState, AdBrief, Platform, Objective, PLATFORM_CONSTRAINTS } from '@/lib/schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Target, Sparkles, Download, Copy, Info, Hash, Clock, Palette, Camera, Zap, Play } from 'lucide-react';
import { useAdBanana } from '@/hooks/useAdBanana';
import { useFalUpscale } from '@/hooks/useFalUpscale';
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
  const [brief, setBrief] = useState<Partial<AdBrief>>({
    platform: 'tiktok',
    objective: 'awareness',
    durationSec: 15,
    sensitiveClaims: false,
  });
  const [variantCount, setVariantCount] = useState(3);
  const [activeResultTab, setActiveResultTab] = useState('images');
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedImageForVideo, setSelectedImageForVideo] = useState<{ base64: string; name: string } | null>(null);
  const [hoveredImageIndex, setHoveredImageIndex] = useState<number | null>(null);

  const { generateAdPackage, isGenerating, progress, error, result, exportToJSON, exportToSRT, reset } = useAdBanana();
  const { upscaleImage, isUpscaling, progress: upscaleProgress, result: upscaleResult } = useFalUpscale();

  // Update global progress/error when local state changes
  React.useEffect(() => {
    onProgress(progress);
  }, [progress, onProgress]);

  React.useEffect(() => {
    onError(error);
  }, [error, onError]);

  const handlePlatformChange = (platform: Platform) => {
    setBrief(prev => ({
      ...prev,
      platform,
      durationSec: PLATFORM_CONSTRAINTS[platform].recommendedDurations[0],
    }));
  };

  const handleGenerate = async () => {
    // Rate limiting: prevent rapid API calls  
    const now = Date.now();
    const timeSinceLastCall = now - lastGenerationTime;
    const minInterval = 10000; // 10 seconds between calls
    
    if (timeSinceLastCall < minInterval) {
      const waitTime = Math.ceil((minInterval - timeSinceLastCall) / 1000);
      onError?.(`Please wait ${waitTime} seconds before generating again.`);
      return;
    }
    
    try {
      setGenerationError(null);
      setLastGenerationTime(now);
      
      // First generate actual images using Gemini 2.5 Flash Image Preview via Banana Clip API
      setIsGeneratingImages(true);
      console.log('Generating images with Gemini 2.5 Flash Image Preview...');
      
      const images = await generateActualImagesFromCanvas(
        canvasData, 
        referenceImages, 
        sceneDescription
      );
      
      setGeneratedImages(images);
      console.log('Generated actual images:', images.length);
      
      setIsGeneratingImages(false);
      
      // Then generate the ad package as before
      const contextDescription = `
Scene Setting: ${sceneDescription.setting}
Subjects: ${sceneDescription.subjects}
Composition: ${sceneDescription.composition}
Environment: ${sceneDescription.environment}
Lighting: ${sceneDescription.lighting}
Focal Points: ${sceneDescription.focalPoints}
Mood: ${sceneDescription.mood}

Visual Assets:
- Hand-drawn concept sketch: ${canvasData ? 'Included' : 'None'}
- Reference images: ${referenceImages.filter(img => img).length} uploaded
- Generated AI images: ${images.length} created with Gemini NanoBanana
      `.trim();

      // Use scene description as the brief context with minimal required fields
      const fullBrief: AdBrief = {
        brand: sceneDescription.setting || 'Creative Brief',
        product: sceneDescription.subjects || 'Visual Concept',
        valueProp: sceneDescription.mood || 'Engaging Creative',
        audience: 'Target Audience',
        objective: brief.objective || 'awareness',
        platform: brief.platform || 'tiktok',
        durationSec: brief.durationSec || 15,
        briefContext: contextDescription,
        sensitiveClaims: brief.sensitiveClaims || false,
      };

      await generateAdPackage({ brief: fullBrief, variantCount });
    } catch (error) {
      console.error('Error during generation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate content';
      setGenerationError(errorMessage);
      setIsGeneratingImages(false);
      onError(errorMessage);
    }
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

  const currentPlatform = brief.platform || 'tiktok';
  const platformConstraints = PLATFORM_CONSTRAINTS[currentPlatform];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background/80 space-y-8">
      {/* Header */}
      <div className="bg-card/50 backdrop-blur-lg border border-border/50 rounded-2xl p-6 mx-4 mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-2xl">
              🍌
            </div>
            <div>
              <h1 className="text-2xl font-display text-foreground">AdBanana</h1>
              <p className="text-sm text-muted-foreground">Creative Brief Studio • Gemini NanoBanana</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">
        {/* Visual Concept Sketch */}
        <Card className="bg-card/50 backdrop-blur-lg border border-border/50 rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
              <Palette className="h-5 w-5 text-primary" />
              Visual Concept Sketch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 bg-muted/20 border-2 border-dashed border-primary/30 rounded-xl overflow-hidden">
              <DrawingCanvas 
                onChange={setCanvasData}
                className="w-full h-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Reference Images */}
        <Card className="bg-card/50 backdrop-blur-lg border border-border/50 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
              <Camera className="h-5 w-5 text-primary" />
              Reference Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploadGrid 
              maxImages={5}
              onChange={setReferenceImages}
            />
          </CardContent>
        </Card>
      </div>

      {/* Scene Description Form */}
      <Card className="bg-card/50 backdrop-blur-lg border border-border/50 rounded-2xl mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full"></div>
            <Target className="h-5 w-5 text-primary" />
            Scene Description
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="setting" className="text-sm font-medium text-muted-foreground">Setting</Label>
              <Input
                id="setting"
                placeholder="e.g., Grand study of an opulent mansion"
                value={sceneDescription.setting}
                onChange={(e) => setSceneDescription(prev => ({ ...prev, setting: e.target.value }))}
                className="bg-background/50 border-border/50 focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subjects" className="text-sm font-medium text-muted-foreground">Subjects</Label>
              <Input
                id="subjects"
                placeholder="e.g., Three men with center figure prominently featured"
                value={sceneDescription.subjects}
                onChange={(e) => setSceneDescription(prev => ({ ...prev, subjects: e.target.value }))}
                className="bg-background/50 border-border/50 focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lighting" className="text-sm font-medium text-muted-foreground">Lighting</Label>
              <Input
                id="lighting"
                placeholder="e.g., Dramatic afternoon light streaming through tall windows"
                value={sceneDescription.lighting}
                onChange={(e) => setSceneDescription(prev => ({ ...prev, lighting: e.target.value }))}
                className="bg-background/50 border-border/50 focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="focalPoints" className="text-sm font-medium text-muted-foreground">Focal Points</Label>
              <Input
                id="focalPoints"
                placeholder="Key elements that draw attention"
                value={sceneDescription.focalPoints}
                onChange={(e) => setSceneDescription(prev => ({ ...prev, focalPoints: e.target.value }))}
                className="bg-background/50 border-border/50 focus:border-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mood" className="text-sm font-medium text-muted-foreground">Mood</Label>
              <Input
                id="mood"
                placeholder="e.g., Bold confidence and dynamic energy"
                value={sceneDescription.mood}
                onChange={(e) => setSceneDescription(prev => ({ ...prev, mood: e.target.value }))}
                className="bg-background/50 border-border/50 focus:border-primary/50"
              />
            </div>
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
              <TabsList className="grid w-full grid-cols-5 bg-background/50">
                <TabsTrigger value="images">AI Images ({generatedImages.length})</TabsTrigger>
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
                             <img 
                               src={`data:image/png;base64,${imageData.base64_data}`}
                               alt={`Generated creative concept ${index + 1}`}
                               className="w-full h-auto rounded-xl"
                             />
                             
                             {/* Hover Buttons */}
                             <div className={`absolute inset-0 bg-black/50 flex items-center justify-center gap-3 transition-opacity duration-200 ${
                               hoveredImageIndex === index ? 'opacity-100' : 'opacity-0 pointer-events-none'
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
                    <CardTitle className="text-lg">Scene Beats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {result.baseScript.beats.map((beat, index) => (
                          <div key={index} className="border dark-border rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="h-4 w-4" />
                              <Badge variant="outline">{beat.tStart}s - {beat.tEnd}s</Badge>
                            </div>
                            {beat.onScreenText && (
                              <div className="mb-2">
                                <strong className="text-xs">On-Screen:</strong>
                                <p className="text-sm mt-1">{beat.onScreenText}</p>
                              </div>
                            )}
                            {beat.voiceover && (
                              <div className="mb-2">
                                <strong className="text-xs">Voiceover:</strong>
                                <p className="text-sm mt-1">{beat.voiceover}</p>
                              </div>
                            )}
                            {beat.shotNotes && (
                              <div className="mb-2">
                                <strong className="text-xs">Shot Notes:</strong>
                                <p className="text-sm mt-1 text-muted-foreground">{beat.shotNotes}</p>
                              </div>
                            )}
                            {beat.overlay.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {beat.overlay.map((item, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Call to Action</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <p className="text-sm">{result.baseScript.cta}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(result.baseScript.cta)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="variants" className="space-y-4">
                <ScrollArea className="h-96">
                  <div className="grid gap-4">
                    {result.variants.map((variant, index) => (
                      <Card key={variant.id}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>Variant {index + 1}</span>
                            {variant.tone && (
                              <Badge variant="secondary">{variant.tone}</Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {variant.hookRewrite && (
                            <div>
                              <strong className="text-xs">Hook:</strong>
                              <p className="text-sm mt-1">{variant.hookRewrite}</p>
                            </div>
                          )}
                          {variant.ctaRewrite && (
                            <div>
                              <strong className="text-xs">CTA:</strong>
                              <p className="text-sm mt-1">{variant.ctaRewrite}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="captions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Full Caption</span>
                      <Badge variant="outline">
                        {result.baseScript.captions.length}/{platformConstraints.maxCaptionLength} chars
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <p className="text-sm">{result.baseScript.captions}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(result.baseScript.captions)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Hashtags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {result.baseScript.hashtags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="cursor-pointer"
                               onClick={() => copyToClipboard(tag)}>
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="compliance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Compliance Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {result.baseScript.complianceNotes.length > 0 ? (
                      <ul className="space-y-2">
                        {result.baseScript.complianceNotes.map((note, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                            {note}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No compliance issues detected.</p>
                    )}
                  </CardContent>
                </Card>
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