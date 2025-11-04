// Gemini AI Service for Invoice Data Extraction

import { geminiService } from '@/services/geminiService';
import {
    ExtractedInvoiceData,
    GeminiExtractionResponse,
    VendorMatchResult
} from '../types/extractionTypes';
import { Vendor, VendorType } from '@/types/vendor';
import {
    INVOICE_EXTRACTION_PROMPT,
    VENDOR_MATCHING_PROMPT,
    INVOICE_VALIDATION_PROMPT
} from '../constants/geminiPrompts';

export class GeminiInvoiceService {

    /**
     * Extract invoice data from PDF text using Gemini AI
     */
    async extractInvoiceData(pdfText: string): Promise<ExtractedInvoiceData> {
        try {
            const prompt = INVOICE_EXTRACTION_PROMPT + pdfText;

            const response = await geminiService.generateContent(prompt, {
                temperature: 0.1, // Low temperature for consistent extraction
                maxTokens: 2000
            });

            // Parse the JSON response
            const extractedData = this.parseGeminiResponse(response);

            // Convert string dates to Date objects
            const processedData = this.processExtractedData(extractedData);

            return processedData;
        } catch (error) {
            console.error('Error extracting invoice data:', error);
            throw new Error(`Failed to extract invoice data: ${error}`);
        }
    }

    /**
     * Match vendor from extracted data with existing vendors
     */
    async matchVendor(
        vendorName: string,
        existingVendors: Vendor[]
    ): Promise<VendorMatchResult> {
        try {
            // Format vendor list for AI
            const vendorList = existingVendors.map(vendor =>
                `ID: ${vendor.id}, Name: ${vendor.name}, Email: ${vendor.email || 'N/A'}, Phone: ${vendor.phone || 'N/A'}`
            ).join('\n');

            const prompt = VENDOR_MATCHING_PROMPT
                .replace('{vendorList}', vendorList)
                .replace('{invoiceVendorName}', vendorName);

            const response = await geminiService.generateContent(prompt, {
                temperature: 0.2,
                maxTokens: 1000
            });

            return this.parseVendorMatchResponse(response, existingVendors);
        } catch (error) {
            console.error('Error matching vendor:', error);
            return {
                type: 'no_match',
                confidence: 0,
                suggestedVendor: {
                    name: vendorName,
                    type: 'Services' as VendorType
                }
            };
        }
    }

    /**
     * Validate extracted invoice data
     */
    async validateExtractedData(data: ExtractedInvoiceData): Promise<{
        isValid: boolean;
        errors: Array<{ field: string; message: string; severity: 'error' | 'warning' | 'info' }>;
        warnings: Array<{ field: string; message: string }>;
        suggestions: Array<{ field: string; message: string }>;
        overallConfidence: number;
    }> {
        try {
            const prompt = INVOICE_VALIDATION_PROMPT.replace(
                '{extractedData}',
                JSON.stringify(data, null, 2)
            );

            const response = await geminiService.generateContent(prompt, {
                temperature: 0.1,
                maxTokens: 1000
            });

            return this.parseValidationResponse(response);
        } catch (error) {
            console.error('Error validating extracted data:', error);
            return {
                isValid: false,
                errors: [{ field: 'general', message: 'Validation failed', severity: 'error' }],
                warnings: [],
                suggestions: [],
                overallConfidence: 0
            };
        }
    }

    /**
     * Parse Gemini response to extract JSON data
     */
    private parseGeminiResponse(response: string): GeminiExtractionResponse {
        try {
            console.log('Raw AI response:', response);

            // Try to extract JSON from the response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const jsonString = jsonMatch[0];
            console.log('Extracted JSON string:', jsonString);

            const parsed = JSON.parse(jsonString);
            console.log('Parsed JSON:', parsed);

            // Create a default response structure
            const defaultResponse: GeminiExtractionResponse = {
                vendorName: 'Unknown Vendor',
                vendorEmail: null,
                vendorPhone: null,
                vendorGstNumber: null,
                vendorAddress: null,
                invoiceNumber: 'Unknown',
                invoiceDate: new Date().toISOString().split('T')[0],
                dueDate: null,
                serviceEndDate: null,
                subtotal: 0,
                taxAmount: null,
                totalAmount: 0,
                currency: 'INR',
                lineItems: null,
                notes: null,
                terms: null,
                confidence: {
                    vendorName: 0.1,
                    invoiceNumber: 0.1,
                    totalAmount: 0.1,
                    invoiceDate: 0.1,
                    overall: 0.1
                }
            };

            // Merge parsed data with defaults, only using valid fields
            const result = { ...defaultResponse };

            // Validate and assign vendor name
            if (parsed.vendorName && typeof parsed.vendorName === 'string' && parsed.vendorName.trim()) {
                result.vendorName = parsed.vendorName.trim();
                result.confidence.vendorName = parsed.confidence?.vendorName || 0.5;
            }

            // Validate and assign invoice number
            if (parsed.invoiceNumber && typeof parsed.invoiceNumber === 'string' && parsed.invoiceNumber.trim()) {
                result.invoiceNumber = parsed.invoiceNumber.trim();
                result.confidence.invoiceNumber = parsed.confidence?.invoiceNumber || 0.5;
            }

            // Validate and assign total amount
            if (parsed.totalAmount && typeof parsed.totalAmount === 'number' && parsed.totalAmount > 0) {
                result.totalAmount = parsed.totalAmount;
                result.confidence.totalAmount = parsed.confidence?.totalAmount || 0.5;
            }

            // Validate and assign invoice date
            if (parsed.invoiceDate && typeof parsed.invoiceDate === 'string') {
                try {
                    const date = new Date(parsed.invoiceDate);
                    if (!isNaN(date.getTime())) {
                        result.invoiceDate = parsed.invoiceDate;
                        result.confidence.invoiceDate = parsed.confidence?.invoiceDate || 0.5;
                    }
                } catch (e) {
                    console.warn('Invalid invoice date:', parsed.invoiceDate);
                }
            }

            // Assign optional fields if they exist and are valid
            if (parsed.vendorEmail && typeof parsed.vendorEmail === 'string') {
                result.vendorEmail = parsed.vendorEmail.trim() || null;
            }

            if (parsed.vendorPhone && typeof parsed.vendorPhone === 'string') {
                result.vendorPhone = parsed.vendorPhone.trim() || null;
            }

            if (parsed.vendorGstNumber && typeof parsed.vendorGstNumber === 'string') {
                result.vendorGstNumber = parsed.vendorGstNumber.trim() || null;
            }

            if (parsed.vendorAddress && typeof parsed.vendorAddress === 'string') {
                result.vendorAddress = parsed.vendorAddress.trim() || null;
            }

            if (parsed.subtotal && typeof parsed.subtotal === 'number') {
                result.subtotal = parsed.subtotal;
            }

            // Enhanced tax amount handling - default to 0 if not found
            if (parsed.taxAmount && typeof parsed.taxAmount === 'number' && parsed.taxAmount >= 0) {
                result.taxAmount = parsed.taxAmount;
            } else {
                // If no tax amount found, set to 0 instead of null
                result.taxAmount = 0;
            }

            if (parsed.currency && typeof parsed.currency === 'string') {
                result.currency = parsed.currency.toUpperCase();
            }

            if (parsed.notes && typeof parsed.notes === 'string') {
                result.notes = parsed.notes.trim() || null;
            }

            if (parsed.terms && typeof parsed.terms === 'string') {
                result.terms = parsed.terms.trim() || null;
            }

            // Handle due date
            if (parsed.dueDate && typeof parsed.dueDate === 'string') {
                try {
                    const date = new Date(parsed.dueDate);
                    if (!isNaN(date.getTime())) {
                        result.dueDate = parsed.dueDate;
                    }
                } catch (e) {
                    console.warn('Invalid due date:', parsed.dueDate);
                }
            }

            // Handle service end date
            if (parsed.serviceEndDate && typeof parsed.serviceEndDate === 'string') {
                try {
                    const date = new Date(parsed.serviceEndDate);
                    if (!isNaN(date.getTime())) {
                        result.serviceEndDate = parsed.serviceEndDate;
                    }
                } catch (e) {
                    console.warn('Invalid service end date:', parsed.serviceEndDate);
                }
            }

            // Handle line items
            if (parsed.lineItems && Array.isArray(parsed.lineItems)) {
                result.lineItems = parsed.lineItems.filter(item =>
                    item && typeof item === 'object' &&
                    item.description && typeof item.description === 'string' &&
                    item.amount && typeof item.amount === 'number'
                );
            }

            // Calculate overall confidence
            const confidences = [
                result.confidence.vendorName,
                result.confidence.invoiceNumber,
                result.confidence.totalAmount,
                result.confidence.invoiceDate
            ];
            result.confidence.overall = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;

            // Validate that we have at least some basic data
            if (result.vendorName === 'Unknown Vendor' && result.invoiceNumber === 'Unknown' && result.totalAmount === 0) {
                throw new Error('Unable to extract any meaningful data from the invoice');
            }

            console.log('Final parsed result:', result);
            return result;

        } catch (error) {
            console.error('Error parsing Gemini response:', error);
            console.error('Response was:', response);
            throw new Error(`Failed to parse AI response: ${error}`);
        }
    }

    /**
     * Process extracted data and convert types
     */
    private processExtractedData(data: GeminiExtractionResponse): ExtractedInvoiceData {
        return {
            vendorName: data.vendorName,
            vendorEmail: data.vendorEmail || undefined,
            vendorPhone: data.vendorPhone || undefined,
            vendorGstNumber: data.vendorGstNumber || undefined,
            vendorAddress: data.vendorAddress || undefined,
            invoiceNumber: data.invoiceNumber,
            invoiceDate: new Date(data.invoiceDate),
            dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            serviceEndDate: data.serviceEndDate ? new Date(data.serviceEndDate) : undefined,
            subtotal: data.subtotal,
            taxAmount: data.taxAmount || undefined,
            totalAmount: data.totalAmount,
            currency: data.currency as any,
            lineItems: data.lineItems || undefined,
            notes: data.notes || undefined,
            terms: data.terms || undefined,
            confidence: data.confidence
        };
    }

    /**
     * Parse vendor matching response
     */
    private parseVendorMatchResponse(response: string, existingVendors: Vendor[]): VendorMatchResult {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in vendor match response');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            if (parsed.bestMatch?.vendorId) {
                const vendor = existingVendors.find(v => v.id === parsed.bestMatch.vendorId);
                if (vendor) {
                    return {
                        type: parsed.bestMatch.matchType === 'exact' ? 'exact_match' : 'fuzzy_match',
                        vendor: {
                            id: vendor.id,
                            name: vendor.name,
                            email: vendor.email,
                            phone: vendor.phone,
                            gstNumber: vendor.gstNumber,
                            type: vendor.type,
                            status: vendor.status
                        },
                        confidence: parsed.bestMatch.confidence
                    };
                }
            }

            // No match found, return suggested vendor
            if (parsed.suggestedVendor) {
                return {
                    type: 'no_match',
                    confidence: 0,
                    suggestedVendor: {
                        name: parsed.suggestedVendor.name,
                        email: parsed.suggestedVendor.email || undefined,
                        phone: parsed.suggestedVendor.phone || undefined,
                        gstNumber: parsed.suggestedVendor.gstNumber || undefined,
                        type: parsed.suggestedVendor.type as VendorType
                    }
                };
            }

            return {
                type: 'no_match',
                confidence: 0
            };
        } catch (error) {
            console.error('Error parsing vendor match response:', error);
            return {
                type: 'no_match',
                confidence: 0
            };
        }
    }

    /**
     * Parse validation response
     */
    private parseValidationResponse(response: string): {
        isValid: boolean;
        errors: Array<{ field: string; message: string; severity: 'error' | 'warning' | 'info' }>;
        warnings: Array<{ field: string; message: string }>;
        suggestions: Array<{ field: string; message: string }>;
        overallConfidence: number;
    } {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in validation response');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            return {
                isValid: parsed.isValid || false,
                errors: parsed.errors || [],
                warnings: parsed.warnings || [],
                suggestions: parsed.suggestions || [],
                overallConfidence: parsed.overallConfidence || 0
            };
        } catch (error) {
            console.error('Error parsing validation response:', error);
            return {
                isValid: false,
                errors: [{ field: 'general', message: 'Validation parsing failed', severity: 'error' }],
                warnings: [],
                suggestions: [],
                overallConfidence: 0
            };
        }
    }

    /**
     * Extract line items from invoice text
     */
    async extractLineItems(invoiceText: string): Promise<Array<{
        description: string;
        quantity?: number;
        unitPrice?: number;
        amount: number;
    }>> {
        try {
            const prompt = `Extract line items from the following invoice text. Return only JSON array:
      
      INVOICE TEXT:
      ${invoiceText}
      
      Return JSON array of line items:
      [{"description": "string", "quantity": number or null, "unitPrice": number or null, "amount": number}]`;

            const response = await geminiService.generateContent(prompt, {
                temperature: 0.1,
                maxTokens: 1000
            });

            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return [];
        } catch (error) {
            console.error('Error extracting line items:', error);
            return [];
        }
    }
}

// Export singleton instance
export const geminiInvoiceService = new GeminiInvoiceService(); 