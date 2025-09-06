import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileVideo, FileImage, File, CheckCircle, XCircle, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGoogleDrivePicker } from '@/hooks/useGoogleDrivePicker';

interface UploadZoneProps {
  onFileSelect?: (file: File) => void;
  onUploadComplete?: (file: File) => void;
  className?: string;
}

export function UploadZone({ onFileSelect, onUploadComplete, className }: UploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const { openPicker: openGoogleDrive, isReady: driveReady, error: driveError } = useGoogleDrivePicker({
    onVideoSelect: (file) => {
      onFileSelect?.(file);
      handleFileProcessing(file);
    }
  });

  const handleFileProcessing = useCallback(async (file: File) => {
    setError(null);
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const next = prev + Math.random() * 15;
          return next >= 95 ? 95 : next;
        });
      }, 200);

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setUploadedFile(file);
      onUploadComplete?.(file);
      
      // Reset after success
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
      setUploadProgress(0);
    }
  }, [onUploadComplete]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      onFileSelect?.(file);
      handleFileProcessing(file);
    }
  }, [onFileSelect, handleFileProcessing]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
      'audio/*': ['.mp3', '.wav', '.aac'],
    }
  });

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('video/')) return <FileVideo className="h-6 w-6" />;
    if (file.type.startsWith('image/')) return <FileImage className="h-6 w-6" />;
    return <File className="h-6 w-6" />;
  };

  if (uploading) {
    return (
      <Card className={cn("bg-card/50 border-border/50", className)}>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mb-6">
            <Upload className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Processing your file...</h3>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            Our AI is analyzing your content and preparing it for editing.
          </p>
          <div className="w-full max-w-md">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Upload Progress</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (uploadedFile) {
    return (
      <Card className={cn("bg-card/50 border-border/50", className)}>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center mb-6">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Upload Complete!</h3>
          <p className="text-muted-foreground mb-4 text-center max-w-md">
            <span className="font-medium">{uploadedFile.name}</span> is ready for editing.
          </p>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
            {getFileIcon(uploadedFile)}
            <span>{(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB</span>
          </div>
          <Button 
            onClick={() => {
              setUploadedFile(null);
              setError(null);
            }}
            variant="outline"
          >
            Upload Another File
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Primary Upload Area */}
      <Card 
        {...getRootProps()} 
        className={cn(
          "bg-card/50 border-2 border-dashed transition-all duration-300 cursor-pointer hover:bg-card/70",
          isDragActive ? "border-primary bg-primary/5" : "border-border/50"
        )}
      >
        <input {...getInputProps()} />
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className={cn(
            "w-20 h-20 rounded-3xl flex items-center justify-center mb-6 transition-colors",
            isDragActive 
              ? "bg-gradient-to-br from-primary to-accent" 
              : "bg-gradient-to-br from-primary/20 to-accent/20"
          )}>
            <Upload className={cn(
              "h-10 w-10 transition-colors",
              isDragActive ? "text-white" : "text-primary"
            )} />
          </div>
          
          <h3 className="text-2xl font-semibold mb-3">
            {isDragActive ? "Drop your file here" : "Upload your content"}
          </h3>
          
          <p className="text-muted-foreground text-center mb-8 max-w-md leading-relaxed">
            Drag and drop your video, image, or audio file here, or click to browse your files. 
            Supported formats: MP4, MOV, AVI, JPG, PNG, MP3, WAV
          </p>
          
          <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:shadow-lg">
            <Upload className="mr-2 h-5 w-5" />
            Choose File
          </Button>
        </CardContent>
      </Card>

      {/* Secondary Options */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-4">Or import from</p>
        <div className="flex gap-4 justify-center">
          <Button 
            variant="outline" 
            onClick={openGoogleDrive}
            disabled={!driveReady}
            className="border-border/50 hover:bg-card/80"
          >
            <Cloud className="mr-2 h-4 w-4" />
            {!driveReady ? 'Setting up...' : 'Google Drive'}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}