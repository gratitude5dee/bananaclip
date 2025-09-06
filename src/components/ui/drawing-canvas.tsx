import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Palette, RotateCcw } from 'lucide-react';

interface DrawingCanvasProps {
  onChange?: (canvasData: string) => void;
  className?: string;
}

export function DrawingCanvas({ onChange, className = '' }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#667eea');

  const colors = [
    { name: 'Purple', value: '#667eea' },
    { name: 'Pink', value: '#764ba2' },
    { name: 'Teal', value: '#4ecdc4' },
    { name: 'Red', value: '#ff6b6b' },
    { name: 'White', value: '#ffffff' },
  ];

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (onChange && canvasRef.current) {
      onChange(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (onChange) {
        onChange('');
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute top-3 left-3 z-10 flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={clearCanvas}
          className="bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background/90"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Clear
        </Button>
        
        <div className="flex gap-1">
          {colors.map((color) => (
            <Button
              key={color.value}
              size="sm"
              variant={currentColor === color.value ? "default" : "secondary"}
              onClick={() => setCurrentColor(color.value)}
              className="w-8 h-8 p-0 bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background/90"
              style={{
                backgroundColor: currentColor === color.value ? color.value : undefined,
              }}
            >
              <div 
                className="w-4 h-4 rounded-full border border-border/50"
                style={{ backgroundColor: color.value }}
              />
            </Button>
          ))}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair rounded-lg"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
}