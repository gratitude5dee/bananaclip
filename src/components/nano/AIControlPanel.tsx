import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Wand2 } from 'lucide-react';
import type { AISuggestion, Frame } from '@/types/video-editor';

interface AIControlPanelProps {
  onAnalyze: () => void;
  onEdit: (prompt: string) => void;
  suggestions: AISuggestion[];
  selectedFrame: Frame | null;
  hasFrames: boolean;
}

const EditSection: React.FC<{ 
  selectedFrame: Frame | null; 
  onEdit: (prompt: string) => void 
}> = ({ selectedFrame, onEdit }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(prompt.trim()) {
      onEdit(prompt);
      setPrompt('');
    }
  };
  
  return (
    <div className="space-y-4">
      <Separator />
      <div>
        <h3 className="text-lg font-display text-accent mb-3 flex items-center gap-2">
          <Wand2 className="h-4 w-4" />
          Edit Frame {selectedFrame ? `#${selectedFrame.id + 1}` : ''}
        </h3>
        {selectedFrame ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'Add sunglasses to the person' or 'make the sky purple'"
              className="min-h-[100px] resize-none"
            />
            <Button 
              type="submit"
              disabled={!prompt.trim()}
              className="w-full"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Edit
            </Button>
          </form>
        ) : (
          <p className="text-muted-foreground italic">Select a frame from the gallery to start editing.</p>
        )}
      </div>
    </div>
  );
};

export const AIControlPanel: React.FC<AIControlPanelProps> = ({ 
  onAnalyze, 
  onEdit, 
  suggestions, 
  selectedFrame, 
  hasFrames 
}) => {
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const handleAnalyzeClick = () => {
    onAnalyze();
    setHasAnalyzed(true);
  };

  return (
    <Card className="dark-surface h-full flex flex-col animate-fadeIn">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
        <Button
          onClick={handleAnalyzeClick}
          disabled={!hasFrames || hasAnalyzed}
          className="w-full"
          variant={hasAnalyzed ? "secondary" : "default"}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {hasAnalyzed ? 'Analysis Complete' : 'Analyze Video with Gemini'}
        </Button>
        
        <div className="flex-1 flex flex-col">
          <h3 className="text-lg font-display text-primary mb-2">Suggestions</h3>
          <ScrollArea className="flex-1 pr-4">
            {suggestions.length > 0 ? (
              <div className="space-y-3">
                {suggestions.map((s, i) => (
                  <Card key={i} className="p-3 bg-muted/50">
                    <div className="font-medium text-sm text-foreground">
                      Frame {s.frameIndex * 5 + 1}:
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{s.suggestion}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic text-sm">
                {hasAnalyzed ? 'No specific suggestions were generated.' : 'Click "Analyze Video" to get AI-powered editing ideas.'}
              </p>
            )}
          </ScrollArea>
        </div>

        <EditSection selectedFrame={selectedFrame} onEdit={onEdit} />
      </CardContent>
    </Card>
  );
};