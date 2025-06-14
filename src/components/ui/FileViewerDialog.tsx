import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
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

  console.log('FileViewerDialog fileUrl:', fileUrl);

  if (!fileUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[60vw] max-w-[90vw] p-0 overflow-hidden" style={{ maxHeight: '80vh' }}>
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg font-semibold">{title || 'File Preview'}</DialogTitle>
          <DialogDescription className="sr-only">
            {title ? `Preview of ${title}` : 'Preview of file'}
          </DialogDescription>
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
          <div className="w-full flex items-center justify-center bg-gray-50 rounded-lg border overflow-auto" style={{ maxHeight: '75vh' }}>
            {type === 'image' ? (
              <img src={fileUrl} alt="Preview" className="max-h-[70vh] max-w-full object-contain rounded" />
            ) : (
              <iframe
                src={fileUrl}
                title="PDF Preview"
                className="w-full"
                style={{ height: '70vh', maxWidth: '100%', maxHeight: '100%' }}
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