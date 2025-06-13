import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';

interface FileViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | string | null;
  type: 'pdf' | 'image';
  title?: string;
}

const getFileUrl = (file: File | string | null): string | null => {
  if (!file) return null;
  if (typeof file === 'string') return file;
  return URL.createObjectURL(file);
};

const FileViewerDialog: React.FC<FileViewerDialogProps> = ({ open, onOpenChange, file, type, title }) => {
  const fileUrl = getFileUrl(file);

  if (!fileUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg font-semibold">{title || 'File Preview'}</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 flex flex-col gap-4">
          <div className="flex gap-2 mb-2">
            <Button asChild variant="outline" size="sm">
              <a href={fileUrl} download target="_blank" rel="noopener noreferrer">Download</a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">Open in New Tab</a>
            </Button>
          </div>
          <div className="w-full min-h-[400px] flex items-center justify-center bg-gray-50 rounded-lg border">
            {type === 'image' ? (
              <img src={fileUrl} alt="Preview" className="max-h-[500px] max-w-full object-contain rounded" />
            ) : (
              <iframe
                src={fileUrl}
                title="PDF Preview"
                className="w-full h-[500px] rounded"
                frameBorder={0}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileViewerDialog; 