import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Image as ImageIcon, Edit } from 'lucide-react';
import type { Frame } from '@/types/video-editor';

interface FrameGalleryProps {
  frames: Frame[];
  selectedFrameIndex: number | null;
  onFrameSelect: (index: number) => void;
  onEditFrame?: (index: number) => void;
  editedFrames?: Map<number, Frame>;
}

export const FrameGallery: React.FC<FrameGalleryProps> = ({
  frames,
  selectedFrameIndex,
  onFrameSelect,
  onEditFrame,
  editedFrames = new Map()
}) => {
  if (frames.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No frames extracted yet</p>
          <p className="text-sm text-muted-foreground">Upload and process a video to see frames</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Video Frames ({frames.length})
        </CardTitle>
        <CardDescription>
          Click on a frame to select it for editing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-96 overflow-y-auto">
          {frames.map((frame, index) => {
            const displayFrame = editedFrames.get(index) || frame;
            const isSelected = selectedFrameIndex === index;
            const isEdited = editedFrames.has(index);
            
            return (
              <div
                key={frame.id}
                className={`relative group cursor-pointer transition-all duration-200 rounded-lg overflow-hidden
                           ${isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:ring-2 hover:ring-primary/50'}`}
                onClick={() => onFrameSelect(index)}
              >
                <div className="aspect-video bg-muted">
                  <img 
                    src={displayFrame.data} 
                    alt={`Frame ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Frame number */}
                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                  {index + 1}
                </div>
                
                {/* Edited badge */}
                {isEdited && (
                  <Badge 
                    variant="secondary" 
                    className="absolute top-1 right-1 text-xs bg-accent/80 text-accent-foreground"
                  >
                    EDITED
                  </Badge>
                )}
                
                {/* Hover overlay with edit button */}
                {onEditFrame && (
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditFrame(index);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                )}
                
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute inset-0 bg-primary/10">
                    <div className="absolute top-2 left-2">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {selectedFrameIndex !== null && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Frame {selectedFrameIndex + 1} Selected</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Format: {frames[selectedFrameIndex].mimeType}</p>
              {editedFrames.has(selectedFrameIndex) && (
                <Badge variant="outline" className="text-accent">
                  This frame has been edited
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};