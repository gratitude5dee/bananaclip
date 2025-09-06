import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Download, Play, X } from 'lucide-react';
import { useFalVideo } from '@/hooks/useFalVideo';

interface VideoGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageBase64: string;
  imageName: string;
}

export const VideoGenerationModal: React.FC<VideoGenerationModalProps> = ({
  isOpen,
  onClose,
  imageBase64,
  imageName
}) => {
  const [prompt, setPrompt] = useState('');
  const { generateVideo, isGenerating, progress, error, result, reset } = useFalVideo();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    await generateVideo(imageBase64, prompt);
  };

  const handleClose = () => {
    reset();
    setPrompt('');
    onClose();
  };

  const downloadVideo = () => {
    if (result?.video?.url) {
      const link = document.createElement('a');
      link.href = result.video.url;
      link.download = `video_${imageName}_${Date.now()}.mp4`;
      link.click();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Generate Video from Image
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Image preview */}
          <div className="bg-muted/30 rounded-lg p-3">
            <img
              src={`data:image/png;base64,${imageBase64}`}
              alt={imageName}
              className="w-full h-32 object-cover rounded-md"
            />
          </div>

          {!result && (
            <>
              {/* Prompt input */}
              <div className="space-y-2">
                <Label htmlFor="video-prompt">Video Description</Label>
                <Textarea
                  id="video-prompt"
                  placeholder="Describe the video you want to generate based on this image..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Progress */}
              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Generating video...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? 'Generating...' : 'Generate Video'}
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-3">
                <video
                  src={result.video.url}
                  controls
                  className="w-full rounded-md"
                  poster={`data:image/png;base64,${imageBase64}`}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={downloadVideo} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download Video
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};