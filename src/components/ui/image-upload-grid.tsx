import React, { useState } from 'react';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploadGridProps {
  maxImages?: number;
  onChange?: (images: (File | null)[]) => void;
  className?: string;
}

export function ImageUploadGrid({ maxImages = 5, onChange, className = '' }: ImageUploadGridProps) {
  const [uploadedImages, setUploadedImages] = useState<(File | null)[]>(
    new Array(maxImages).fill(null)
  );
  const [previews, setPreviews] = useState<(string | null)[]>(
    new Array(maxImages).fill(null)
  );

  const handleImageUpload = (file: File, index: number) => {
    const newImages = [...uploadedImages];
    const newPreviews = [...previews];
    
    newImages[index] = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      newPreviews[index] = e.target?.result as string;
      setPreviews(newPreviews);
    };
    reader.readAsDataURL(file);
    
    setUploadedImages(newImages);
    onChange?.(newImages);
  };

  const removeImage = (index: number) => {
    const newImages = [...uploadedImages];
    const newPreviews = [...previews];
    
    newImages[index] = null;
    newPreviews[index] = null;
    
    setUploadedImages(newImages);
    setPreviews(newPreviews);
    onChange?.(newImages);
  };

  return (
    <div className={`grid grid-cols-3 md:grid-cols-5 gap-4 ${className}`}>
      {Array.from({ length: maxImages }, (_, index) => (
        <div key={index} className="relative">
          {previews[index] ? (
            <div className="relative group aspect-square">
              <img
                src={previews[index]!}
                alt={`Reference ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border-2 border-border/50"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleImageUpload(file, index);
                    };
                    input.click();
                  }}
                >
                  Replace
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="aspect-square border-2 border-dashed border-border/50 rounded-lg bg-muted/20 hover:bg-muted/30 hover:border-primary/50 transition-all cursor-pointer flex flex-col items-center justify-center group hover:scale-105"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleImageUpload(file, index);
                };
                input.click();
              }}
            >
              <Camera className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors text-center">
                Upload Image {index + 1}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}