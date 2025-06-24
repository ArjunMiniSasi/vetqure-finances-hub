// Fallback Invoice Service - Basic text extraction when AI is unavailable

import { ExtractedInvoiceData } from '../types/extractionTypes';

export class FallbackInvoiceService {

    /**
     * Extract basic invoice data using regex patterns
     * This is a fallback when AI service is unavailable
     */
    async extractInvoiceData(text: string): Promise<ExtractedInvoiceData> {
        const cleanedText = text.toLowerCase();

        // Extract invoice number
        const invoiceNumber = this.extractInvoiceNumber(cleanedText);

        // Extract amounts
        const amounts = this.extractAmounts(cleanedText);

        // Extract dates
        const dates = this.extractDates(cleanedText);

        // Extract vendor name (basic approach)
        const vendorName = this.extractVendorName(text);

        return {
            invoiceNumber: invoiceNumber || 'Unknown',
            vendorName: vendorName || 'Unknown Vendor',
            invoiceDate: dates.invoiceDate || new Date(),
            dueDate: dates.dueDate || null,
            serviceEndDate: dates.serviceEndDate || null,
            subtotal: amounts.subtotal || 0,
            taxAmount: amounts.tax || 0,
            totalAmount: amounts.total || amounts.subtotal || 0,
            currency: amounts.currency || 'USD',
            notes: this.extractNotes(text),
            confidence: 0.3, // Low confidence for regex-based extraction
            extractionMethod: 'regex_fallback'
        };
    }

    /**
     * Extract invoice number using various patterns
     */
    private extractInvoiceNumber(text: string): string | null {
        const patterns = [
            /invoice\s*#?\s*:?\s*([a-z0-9\-_]+)/i,
            /invoice\s*number\s*:?\s*([a-z0-9\-_]+)/i,
            /inv\s*#?\s*:?\s*([a-z0-9\-_]+)/i,
            /bill\s*#?\s*:?\s*([a-z0-9\-_]+)/i,
            /statement\s*#?\s*:?\s*([a-z0-9\-_]+)/i
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }

        return null;
    }

    /**
     * Extract monetary amounts
     */
    private extractAmounts(text: string): {
        subtotal: number | null;
        tax: number | null;
        total: number | null;
        currency: string;
    } {
        const currencyPattern = /(\$|usd|cad|eur|gbp)/i;
        const currency = text.match(currencyPattern)?.[1]?.toUpperCase() || 'USD';

        // Remove currency symbols for amount extraction
        const cleanText = text.replace(/[\$,]/g, '');

        const amountPatterns = [
            /total\s*:?\s*\$?\s*([0-9]+\.?[0-9]*)/i,
            /amount\s*due\s*:?\s*\$?\s*([0-9]+\.?[0-9]*)/i,
            /balance\s*due\s*:?\s*\$?\s*([0-9]+\.?[0-9]*)/i,
            /grand\s*total\s*:?\s*\$?\s*([0-9]+\.?[0-9]*)/i
        ];

        let total: number | null = null;
        for (const pattern of amountPatterns) {
            const match = cleanText.match(pattern);
            if (match && match[1]) {
                total = parseFloat(match[1]);
                break;
            }
        }

        // Extract subtotal
        const subtotalPatterns = [
            /subtotal\s*:?\s*\$?\s*([0-9]+\.?[0-9]*)/i,
            /sub\s*total\s*:?\s*\$?\s*([0-9]+\.?[0-9]*)/i
        ];

        let subtotal: number | null = null;
        for (const pattern of subtotalPatterns) {
            const match = cleanText.match(pattern);
            if (match && match[1]) {
                subtotal = parseFloat(match[1]);
                break;
            }
        }

        // Extract tax
        const taxPatterns = [
            /tax\s*:?\s*\$?\s*([0-9]+\.?[0-9]*)/i,
            /sales\s*tax\s*:?\s*\$?\s*([0-9]+\.?[0-9]*)/i,
            /gst\s*:?\s*\$?\s*([0-9]+\.?[0-9]*)/i,
            /hst\s*:?\s*\$?\s*([0-9]+\.?[0-9]*)/i
        ];

        let tax: number | null = null;
        for (const pattern of taxPatterns) {
            const match = cleanText.match(pattern);
            if (match && match[1]) {
                tax = parseFloat(match[1]);
                break;
            }
        }

        return { subtotal, tax, total, currency };
    }

    /**
     * Extract dates from text
     */
    private extractDates(text: string): {
        invoiceDate: Date | null;
        dueDate: Date | null;
        serviceEndDate: Date | null;
    } {
        const datePatterns = [
            /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g,
            /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/g,
            /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}/gi
        ];

        const dates: Date[] = [];

        for (const pattern of datePatterns) {
            const matches = text.match(pattern);
            if (matches) {
                for (const match of matches) {
                    try {
                        const date = new Date(match);
                        if (!isNaN(date.getTime())) {
                            dates.push(date);
                        }
                    } catch (e) {
                        // Ignore invalid dates
                    }
                }
            }
        }

        // Sort dates chronologically
        dates.sort((a, b) => a.getTime() - b.getTime());

        // Look for specific date types
        const dueDatePatterns = [
            /due\s*date\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
            /payment\s*due\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
        ];

        let dueDate: Date | null = null;
        for (const pattern of dueDatePatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                try {
                    dueDate = new Date(match[1]);
                    if (isNaN(dueDate.getTime())) dueDate = null;
                } catch (e) {
                    dueDate = null;
                }
                break;
            }
        }

        return {
            invoiceDate: dates[0] || new Date(),
            dueDate: dueDate,
            serviceEndDate: dates.length > 1 ? dates[1] : null
        };
    }

    /**
     * Extract vendor name (basic approach)
     */
    private extractVendorName(text: string): string | null {
        // Look for common vendor name patterns
        const lines = text.split('\n');

        // Look for company names in the first few lines
        for (let i = 0; i < Math.min(10, lines.length); i++) {
            const line = lines[i].trim();

            // Skip empty lines and common headers
            if (!line ||
                line.toLowerCase().includes('invoice') ||
                line.toLowerCase().includes('bill') ||
                line.toLowerCase().includes('statement') ||
                line.toLowerCase().includes('date') ||
                line.toLowerCase().includes('amount')) {
                continue;
            }

            // If line looks like a company name (has some structure, not just numbers)
            if (line.length > 3 && line.length < 100 && /[a-zA-Z]/.test(line)) {
                return line;
            }
        }

        return null;
    }

    /**
     * Extract notes or description
     */
    private extractNotes(text: string): string | null {
        const notePatterns = [
            /description\s*:?\s*(.+?)(?=\n|$)/i,
            /notes\s*:?\s*(.+?)(?=\n|$)/i,
            /memo\s*:?\s*(.+?)(?=\n|$)/i
        ];

        for (const pattern of notePatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }

        return null;
    }

    /**
     * Validate extracted data
     */
    async validateExtractedData(data: ExtractedInvoiceData): Promise<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
    }> {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check required fields
        if (!data.invoiceNumber || data.invoiceNumber === 'Unknown') {
            warnings.push('Invoice number could not be extracted');
        }

        if (!data.vendorName || data.vendorName === 'Unknown Vendor') {
            warnings.push('Vendor name could not be extracted');
        }

        if (!data.totalAmount || data.totalAmount <= 0) {
            errors.push('Total amount is required and must be greater than 0');
        }

        if (!data.invoiceDate) {
            errors.push('Invoice date is required');
        }

        // Check for reasonable values
        if (data.totalAmount && data.totalAmount > 1000000) {
            warnings.push('Total amount seems unusually high');
        }

        if (data.invoiceDate && data.invoiceDate > new Date()) {
            warnings.push('Invoice date is in the future');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
}

export const fallbackInvoiceService = new FallbackInvoiceService(); 