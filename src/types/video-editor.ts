export interface Frame {
  id: number;
  data: string; // base64 encoded image data
  mimeType: string;
}

export interface AISuggestion {
  frameIndex: number;
  suggestion: string;
}

export interface TrimOptions {
  startTime: number;
  endTime: number;
}

export interface GoogleDrivePickerOptions {
  onVideoSelect: (file: File) => void;
}