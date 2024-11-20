export interface DataPreviewProps {
  data: any[];
  headers: string[];
}

export interface FileUploaderProps {
  onFileUpload: (file: File) => void;
} 