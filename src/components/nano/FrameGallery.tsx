import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Film } from 'lucide-react';
import type { Frame } from '@/types/video-editor';

interface FrameGalleryProps {
  frames: Frame[];
  editedFrames: Map<number, Frame>;
  selectedFrameIndex: number | null;
  onFrameSelect: (index: number) => void;
}

export const FrameGallery: React.FC<FrameGalleryProps> = ({ 
  frames, 
  editedFrames, 
  selectedFrameIndex, 
  onFrameSelect 
}) => {
  if (frames.length === 0) {
    return null;
  }

  return (
    <Card className="dark-surface animate-fadeIn">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Film className="h-5 w-5" />
          Extracted Frames ({frames.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex overflow-x-auto space-x-3 pb-4">
          {frames.map((frame, index) => {
            const displayFrame = editedFrames.get(index) || frame;
            const isSelected = selectedFrameIndex === index;
            const isEdited = editedFrames.has(index);
            
            return (
              <div
                key={frame.id}
                onClick={() => onFrameSelect(index)}
                className={`relative flex-shrink-0 w-32 h-20 rounded-md cursor-pointer transition-all duration-200 group overflow-hidden
                           ${isSelected ? 'ring-4 ring-accent' : 'ring-2 ring-transparent hover:ring-primary'}`}
              >
                <img 
                  src={displayFrame.data} 
                  alt={`Frame ${index + 1}`} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-10 transition-opacity"></div>
                <span className="absolute bottom-1 right-1 text-xs bg-black bg-opacity-60 text-white px-1.5 py-0.5 rounded">
                  {index + 1}
                </span>
                {isEdited && (
                  <span className="absolute top-1 left-1 text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded font-bold">
                    EDITED
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};