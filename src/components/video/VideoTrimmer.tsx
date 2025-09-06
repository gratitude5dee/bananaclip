import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

// Helper to format seconds to MM:SS
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
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
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
      setCurrentTime(0);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      
      // Auto-pause at end time
      if (videoRef.current.currentTime >= endTime) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        // Start from start time if at end
        if (currentTime >= endTime) {
          videoRef.current.currentTime = startTime;
        }
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleStartTimeChange = (value: number[]) => {
    const newStart = value[0];
    if (newStart < endTime) {
      setStartTime(newStart);
      handleSeek(newStart);
    }
  };

  const handleEndTimeChange = (value: number[]) => {
    const newEnd = value[0];
    if (newEnd > startTime) {
      setEndTime(newEnd);
    }
  };

  const trimDuration = endTime - startTime;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Trim Your Video</CardTitle>
          <CardDescription>
            Select the portion of your video you'd like to use for your BananaClip
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Video Player */}
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {videoUrl && (
              <video
                ref={videoRef}
                src={videoUrl}
                onLoadedMetadata={handleMetadataLoaded}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full h-full"
              />
            )}
          </div>

          {/* Video Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSeek(startTime)}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlayPause}
              disabled={duration === 0}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSeek(endTime)}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Current: {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            
            {/* Progress indicator */}
            <div className="relative h-2 bg-muted rounded-full">
              <div
                className="absolute h-full bg-primary/30 rounded-full"
                style={{
                  left: `${(startTime / duration) * 100}%`,
                  width: `${((endTime - startTime) / duration) * 100}%`
                }}
              />
              <div
                className="absolute h-full w-1 bg-primary rounded-full"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />
            </div>

            {/* Start Time Slider */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Time: {formatTime(startTime)}</label>
              <Slider
                value={[startTime]}
                onValueChange={handleStartTimeChange}
                max={duration}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* End Time Slider */}
            <div className="space-y-2">
              <label className="text-sm font-medium">End Time: {formatTime(endTime)}</label>
              <Slider
                value={[endTime]}
                onValueChange={handleEndTimeChange}
                max={duration}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Selected duration: {formatTime(trimDuration)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => onConfirm(file, 0, duration)}
              >
                Use Full Video ({formatTime(duration)})
              </Button>
              
              <Button
                onClick={() => onConfirm(file, startTime, endTime)}
                disabled={trimDuration <= 0}
              >
                Use Selected Clip ({formatTime(trimDuration)})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};