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
import { Target, Sparkles, Download, Copy, Info, Hash, Clock } from 'lucide-react';
import { useAdBanana } from '@/hooks/useAdBanana';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AdBananaStudioProps {
  projectState: ProjectState;
  onProgress: (progress: number) => void;
  onError: (error: string | null) => void;
}

export function AdBananaStudio({ projectState, onProgress, onError }: AdBananaStudioProps) {
  const [brief, setBrief] = useState<Partial<AdBrief>>({
    platform: 'tiktok',
    objective: 'awareness',
    durationSec: 15,
    sensitiveClaims: false,
  });
  const [variantCount, setVariantCount] = useState(3);
  const [activeResultTab, setActiveResultTab] = useState('script');

  const { generateAdPackage, isGenerating, progress, error, result, exportToJSON, exportToSRT, reset } = useAdBanana();

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
    if (brief.brand && brief.product && brief.valueProp && brief.audience) {
      const fullBrief: AdBrief = {
        brand: brief.brand!,
        product: brief.product!,
        valueProp: brief.valueProp!,
        audience: brief.audience!,
        objective: brief.objective || 'awareness',
        platform: brief.platform || 'tiktok',
        durationSec: brief.durationSec || 15,
        briefContext: brief.briefContext,
        sensitiveClaims: brief.sensitiveClaims || false,
      };

      await generateAdPackage({ brief: fullBrief, variantCount });
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
    <div className="space-y-6">
      {/* Brief Configuration */}
      <Card className="dark-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 brand-pink" />
            Brand & Brief
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-sm">
                  AdBanana uses the global Banana Studio prompt context to generate 
                  platform-optimized ad creatives with proper vocabulary and constraints.
                </p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <CardDescription>
            Configure your brand details and campaign objectives
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">Brand Name</Label>
              <Input
                id="brand"
                placeholder="Acme"
                value={brief.brand || ''}
                onChange={(e) => setBrief(prev => ({ ...prev, brand: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="product">Product Name</Label>
              <Input
                id="product"
                placeholder="NanoCam"
                value={brief.product || ''}
                onChange={(e) => setBrief(prev => ({ ...prev, product: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="value-prop">Value Proposition</Label>
            <Input
              id="value-prop"
              placeholder="4K pocket camera for creators"
              value={brief.valueProp || ''}
              onChange={(e) => setBrief(prev => ({ ...prev, valueProp: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="audience">Target Audience</Label>
            <Input
              id="audience"
              placeholder="Content creators, photographers, filmmakers"
              value={brief.audience || ''}
              onChange={(e) => setBrief(prev => ({ ...prev, audience: e.target.value }))}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Objective</Label>
              <Select
                value={brief.objective}
                onValueChange={(value: Objective) => setBrief(prev => ({ ...prev, objective: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="awareness">Awareness</SelectItem>
                  <SelectItem value="traffic">Traffic</SelectItem>
                  <SelectItem value="conversion">Conversion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Platform</Label>
              <Select
                value={brief.platform}
                onValueChange={handlePlatformChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="instagram_reels">Instagram Reels</SelectItem>
                  <SelectItem value="youtube_shorts">YouTube Shorts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Duration</Label>
              <Select
                value={brief.durationSec?.toString()}
                onValueChange={(value) => setBrief(prev => ({ ...prev, durationSec: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platformConstraints.recommendedDurations.map(duration => (
                    <SelectItem key={duration} value={duration.toString()}>
                      {duration}s
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="sensitive-claims"
              checked={brief.sensitiveClaims || false}
              onCheckedChange={(checked) => setBrief(prev => ({ ...prev, sensitiveClaims: checked }))}
            />
            <Label htmlFor="sensitive-claims">Sensitive Claims (requires compliance review)</Label>
          </div>

          <div>
            <Label htmlFor="brief-context">Brief Context</Label>
            <Textarea
              id="brief-context"
              placeholder="Add any additional brand brief, campaign details, or specific requirements..."
              value={brief.briefContext || ''}
              onChange={(e) => setBrief(prev => ({ ...prev, briefContext: e.target.value }))}
              rows={4}
            />
            <div className="text-xs text-muted-foreground mt-1">
              This context will be appended to the global Banana Studio prompt specification
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Platform Optimization:</strong> {currentPlatform.charAt(0).toUpperCase() + currentPlatform.slice(1)} 
              • Max caption: {platformConstraints.maxCaptionLength} chars 
              • Safe area: {Math.round(platformConstraints.safeAreaPercent * 100)}%
            </AlertDescription>
          </Alert>

          <Separator />

          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Label>Variants to Generate</Label>
              <Select
                value={variantCount.toString()}
                onValueChange={(value) => setVariantCount(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map(count => (
                    <SelectItem key={count} value={count.toString()}>
                      {count} variant{count > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || !brief.brand || !brief.product || !brief.valueProp || !brief.audience}
              className="bg-brand-pink hover:bg-brand-pink/90"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isGenerating ? 'Generating...' : `Generate ${variantCount} Variant${variantCount > 1 ? 's' : ''}`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card className="dark-surface">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 brand-purple" />
                Generated Ad Package
              </span>
              <div className="flex gap-2">
                <Button onClick={handleExportJSON} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export JSON
                </Button>
                <Button onClick={handleExportSRT} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export SRT
                </Button>
                <Button onClick={reset} variant="outline" size="sm">
                  Reset
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeResultTab} onValueChange={setActiveResultTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="script">Base Script</TabsTrigger>
                <TabsTrigger value="variants">Variants ({result.variants.length})</TabsTrigger>
                <TabsTrigger value="captions">Captions</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
              </TabsList>

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
    </div>
  );
}