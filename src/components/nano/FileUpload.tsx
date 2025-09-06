import React, { useCallback, useState, useEffect } from 'react';
import { useGoogleDrivePicker } from '@/hooks/useGoogleDrivePicker';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, HardDrive } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  setErrorMessage: (message: string | null) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, setErrorMessage }) => {
  const [isDragging, setIsDragging] = useState(false);
  const { openPicker, error: pickerError, isReady, isConfigured } = useGoogleDrivePicker({ onVideoSelect: onFileSelect });

  useEffect(() => {
    if (pickerError) {
      setErrorMessage(`Google Drive Error: ${pickerError}`);
    }
  }, [pickerError, setErrorMessage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  return (
    <div className="w-full max-w-4xl text-center animate-fadeIn">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Option 1: Upload from Device */}
        <label
          htmlFor="video-upload"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={`flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 group
                      ${isDragging ? 'border-accent bg-card/50' : 'border-border bg-card/30 hover:bg-card/50 hover:border-primary'}`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-12 h-12 mb-4 text-primary" />
            <p className="mb-2 text-lg text-foreground"><span className="font-semibold text-accent">Upload from Device</span></p>
            <p className="text-sm text-muted-foreground">Drag & drop or click to browse</p>
            <p className="text-xs text-muted-foreground mt-2">MP4, MOV, WEBM, etc.</p>
          </div>
          <input id="video-upload" type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
        </label>
        
        {/* Option 2: Select from Google Drive */}
        <Card
          className={`cursor-pointer transition-all duration-300 group border-dashed hover:bg-card/50 hover:border-accent ${!isReady ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={isReady ? openPicker : undefined}
        >
          <CardContent className="flex flex-col items-center justify-center h-80 pt-5 pb-6">
            <HardDrive className="w-12 h-12 mb-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <p className="mb-2 text-lg text-foreground"><span className="font-semibold text-accent">Select from Google Drive</span></p>
            <p className="text-sm text-muted-foreground">Import a video from your Drive</p>
            {!isConfigured ? (
              <p className="text-xs text-yellow-500 mt-2">Feature not configured.</p>
            ) : !isReady ? (
              <p className="text-xs text-yellow-400 mt-2 animate-pulse">Initializing...</p>
            ) : pickerError ? (
              <p className="text-xs text-red-400 mt-2">Could not connect to Drive.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};