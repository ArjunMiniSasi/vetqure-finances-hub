import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker source for browser environment
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export interface ExtractedTextResult {
    text: string;
    pages: number;
}

/**
 * Extract text content from a PDF file
 */
export const extractTextFromPDF = async (file: File): Promise<ExtractedTextResult> => {
    try {
        // Convert file to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';
        const numPages = pdf.numPages;

        // Extract text from each page
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            // Combine text items into a single string
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');

            fullText += pageText + '\n';
        }

        return {
            text: fullText.trim(),
            pages: numPages
        };
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error(`Failed to extract text from PDF: ${error}`);
    }
};

/**
 * Validate if a file is a PDF
 */
export const isPDFFile = (file: File): boolean => {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
};

/**
 * Get file size in a human-readable format
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate PDF file size (max 10MB)
 */
export const validatePDFFile = (file: File): { isValid: boolean; error?: string } => {
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!isPDFFile(file)) {
        return { isValid: false, error: 'File must be a PDF' };
    }

    if (file.size > maxSize) {
        return { isValid: false, error: 'File size must be less than 10MB' };
    }

    return { isValid: true };
}; 