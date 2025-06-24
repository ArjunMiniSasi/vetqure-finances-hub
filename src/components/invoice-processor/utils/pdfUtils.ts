// PDF Utility Functions

import { UploadedFile } from '../types/extractionTypes';
import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker source for browser environment
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

// PDF file validation
export const validatePDFFile = (file: File): { isValid: boolean; error?: string } => {
    // Check file type
    if (file.type !== 'application/pdf') {
        return { isValid: false, error: 'File must be a PDF' };
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        return { isValid: false, error: 'File size must be less than 10MB' };
    }

    // Check if file is empty
    if (file.size === 0) {
        return { isValid: false, error: 'File cannot be empty' };
    }

    return { isValid: true };
};

// Generate unique file ID
export const generateFileId = (): string => {
    return `invoice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Create UploadedFile object
export const createUploadedFile = (file: File): UploadedFile => {
    return {
        file,
        id: generateFileId(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadProgress: 0,
        uploadStatus: 'pending'
    };
};

// Extract text from PDF using PDF.js
export const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';

        // Extract text from all pages
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            fullText += pageText + '\n';
        }

        return fullText.trim();
    } catch (error) {
        throw new Error(`Failed to extract text from PDF: ${error}`);
    }
};

// Clean and normalize extracted text
export const cleanExtractedText = (text: string): string => {
    return text
        // Remove excessive whitespace
        .replace(/\s+/g, ' ')
        // Remove special characters that might interfere with parsing
        .replace(/[^\w\s\-.,$₹€£@#%&*()\[\]{}:;]/g, '')
        // Normalize line breaks
        .replace(/\n+/g, '\n')
        // Trim whitespace
        .trim();
};

// Extract basic metadata from PDF
export const extractPDFMetadata = async (file: File): Promise<{
    pageCount: number;
    fileSize: number;
    creationDate?: Date;
    modificationDate?: Date;
}> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        return {
            pageCount: pdf.numPages,
            fileSize: file.size,
            // Note: PDF metadata extraction requires additional processing
            // For now, we'll return basic info
        };
    } catch (error) {
        console.warn('Failed to extract PDF metadata:', error);
        return {
            pageCount: 0,
            fileSize: file.size
        };
    }
};

// Check if PDF contains text (vs scanned image)
export const isPDFTextBased = async (file: File): Promise<boolean> => {
    try {
        const text = await extractTextFromPDF(file);
        const cleanText = cleanExtractedText(text);

        // If we have substantial text content, consider it text-based
        return cleanText.length > 100;
    } catch (error) {
        console.warn('Failed to determine PDF type:', error);
        return false;
    }
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get file extension
export const getFileExtension = (filename: string): string => {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

// Validate multiple files
export const validateMultiplePDFFiles = (files: File[]): {
    validFiles: File[];
    invalidFiles: Array<{ file: File; error: string }>;
} => {
    const validFiles: File[] = [];
    const invalidFiles: Array<{ file: File; error: string }> = [];

    files.forEach(file => {
        const validation = validatePDFFile(file);
        if (validation.isValid) {
            validFiles.push(file);
        } else {
            invalidFiles.push({ file, error: validation.error! });
        }
    });

    return { validFiles, invalidFiles };
};

// Create a preview URL for PDF
export const createPDFPreviewUrl = (file: File): string => {
    return URL.createObjectURL(file);
};

// Clean up preview URL
export const cleanupPreviewUrl = (url: string): void => {
    URL.revokeObjectURL(url);
}; 