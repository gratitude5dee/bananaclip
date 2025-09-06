import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const formatTime = (time: number) => {
  if (isNaN(time)) return '00:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

interface VideoTrimmerProps {
  file: File;
  onConfirm: (file: File, startTime: number, endTime: number) => void;
  onCancel: () => void;
}

export const VideoTrimmer: React.FC<VideoTrimmerProps> = ({ file, onConfirm, onCancel }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleMetadataLoaded = () => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration;
      setDuration(videoDuration);
      setEndTime(videoDuration);
    }
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = parseFloat(e.target.value);
    if (newStart < endTime) {
      setStartTime(newStart);
      if (videoRef.current) videoRef.current.currentTime = newStart;
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = parseFloat(e.target.value);
    if (newEnd > startTime) {
      setEndTime(newEnd);
      if (videoRef.current) videoRef.current.currentTime = newEnd;
    }
  };
  
  const progressPercent = (duration > 0) ? (endTime - startTime) / duration * 100 : 0;
  const startPercent = (duration > 0) ? (startTime / duration) * 100 : 0;

  return (
    <Card className="w-full max-w-4xl dark-surface animate-fadeIn">
      <CardHeader>
        <CardTitle className="text-2xl font-display text-primary text-center">Trim Your Video</CardTitle>
        <p className="text-muted-foreground text-center">Select a clip or use the full video to continue.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="w-full aspect-video bg-black rounded-md overflow-hidden">
          {videoUrl && (
            <video
              ref={videoRef}
              src={videoUrl}
              onLoadedMetadata={handleMetadataLoaded}
              controls
              className="w-full h-full"
            />
          )}
        </div>

        <div className="w-full px-2">
          <div className="relative h-12 flex items-center">
            <div className="absolute w-full h-2 bg-muted rounded-full"></div>
            <div 
              className="absolute h-2 bg-accent rounded-full"
              style={{
                left: `${startPercent}%`,
                width: `${progressPercent}%`,
              }}
            ></div>
            <input
              type="range"
              min={0}
              max={duration}
              step={0.1}
              value={startTime}
              onChange={handleStartTimeChange}
              className="absolute w-full h-2 appearance-none bg-transparent pointer-events-auto range-thumb"
              aria-label="Start Time"
            />
            <input
              type="range"
              min={0}
              max={duration}
              step={0.1}
              value={endTime}
              onChange={handleEndTimeChange}
              className="absolute w-full h-2 appearance-none bg-transparent pointer-events-auto range-thumb"
              aria-label="End Time"
            />
          </div>

          <div className="flex justify-between text-sm font-mono mt-2 text-muted-foreground">
            <span>Start: <span className="text-primary">{formatTime(startTime)}</span></span>
            <span>End: <span className="text-primary">{formatTime(endTime)}</span></span>
          </div>
        </div>
          
        <style>{`
          .range-thumb::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 24px;
            height: 24px;
            background-color: hsl(var(--accent));
            border: 2px solid hsl(var(--background));
            border-radius: 50%;
            cursor: pointer;
            margin-top: -10px;
            pointer-events: all;
            position: relative;
            z-index: 10;
          }
          .range-thumb::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background-color: hsl(var(--accent));
            border: 2px solid hsl(var(--background));
            border-radius: 50%;
            cursor: pointer;
            pointer-events: all;
            position: relative;
            z-index: 10;
          }
        `}</style>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button variant="outline" onClick={onCancel} className="flex-1 sm:flex-none">
            Cancel
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => onConfirm(file, 0, duration)}
            className="flex-1 sm:flex-none"
          >
            Use Full Video
          </Button>
          <Button
            onClick={() => onConfirm(file, startTime, endTime)}
            disabled={endTime - startTime <= 0}
            className="flex-1 sm:flex-none"
          >
            Use Clip ({formatTime(endTime - startTime)})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};