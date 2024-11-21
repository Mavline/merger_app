import React from 'react';
import { FileUploaderProps } from '../types/types';
import { validateFile } from '../utils/fileHandlers';

export const FileUploader = ({ onFileUpload }: FileUploaderProps) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  return (
    <input
      type="file"
      onChange={handleFileChange}
      accept=".csv"
      className="file-input"
    />
  );
}; 