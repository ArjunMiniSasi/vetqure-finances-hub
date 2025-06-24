// Vendor Matching Service

import { Vendor, VendorType } from '@/types/vendor';
import { VendorMatchResult, ExtractedInvoiceData } from '../types/extractionTypes';
import { createVendor } from '@/services/vendorService';
import { geminiInvoiceService } from './geminiInvoiceService';

export class VendorMatchingService {

    /**
     * Match vendor from extracted invoice data with existing vendors
     */
    async matchVendor(
        extractedData: ExtractedInvoiceData,
        existingVendors: Vendor[]
    ): Promise<VendorMatchResult> {
        try {
            // First, try AI-powered matching
            const aiMatch = await geminiInvoiceService.matchVendor(
                extractedData.vendorName,
                existingVendors
            );

            // If AI found a good match, return it
            if (aiMatch.type === 'exact_match' && aiMatch.confidence > 0.9) {
                return aiMatch;
            }

            // Fallback to traditional matching
            const traditionalMatch = this.traditionalVendorMatching(
                extractedData.vendorName,
                existingVendors
            );

            // Combine AI and traditional results
            return this.combineMatchingResults(aiMatch, traditionalMatch);
        } catch (error) {
            console.error('Error in vendor matching:', error);
            return this.createNoMatchResult(extractedData);
        }
    }

    /**
     * Traditional vendor matching using string similarity
     */
    private traditionalVendorMatching(
        vendorName: string,
        existingVendors: Vendor[]
    ): VendorMatchResult {
        const normalizedSearchName = this.normalizeVendorName(vendorName);
        const matches: Array<{
            vendor: Vendor;
            confidence: number;
            matchType: 'exact' | 'fuzzy' | 'partial';
        }> = [];

        for (const vendor of existingVendors) {
            const normalizedVendorName = this.normalizeVendorName(vendor.name);

            // Exact match
            if (normalizedSearchName === normalizedVendorName) {
                matches.push({
                    vendor,
                    confidence: 1.0,
                    matchType: 'exact'
                });
                break;
            }

            // Fuzzy match using similarity
            const similarity = this.calculateStringSimilarity(
                normalizedSearchName,
                normalizedVendorName
            );

            if (similarity > 0.8) {
                matches.push({
                    vendor,
                    confidence: similarity,
                    matchType: 'fuzzy'
                });
            } else if (similarity > 0.6) {
                matches.push({
                    vendor,
                    confidence: similarity,
                    matchType: 'partial'
                });
            }
        }

        // Sort by confidence
        matches.sort((a, b) => b.confidence - a.confidence);

        if (matches.length === 0) {
            return {
                type: 'no_match',
                confidence: 0
            };
        }

        const bestMatch = matches[0];

        if (bestMatch.matchType === 'exact') {
            return {
                type: 'exact_match',
                vendor: {
                    id: bestMatch.vendor.id,
                    name: bestMatch.vendor.name,
                    email: bestMatch.vendor.email,
                    phone: bestMatch.vendor.phone,
                    gstNumber: bestMatch.vendor.gstNumber,
                    type: bestMatch.vendor.type,
                    status: bestMatch.vendor.status
                },
                confidence: bestMatch.confidence
            };
        }

        if (matches.length === 1) {
            return {
                type: 'fuzzy_match',
                vendor: {
                    id: bestMatch.vendor.id,
                    name: bestMatch.vendor.name,
                    email: bestMatch.vendor.email,
                    phone: bestMatch.vendor.phone,
                    gstNumber: bestMatch.vendor.gstNumber,
                    type: bestMatch.vendor.type,
                    status: bestMatch.vendor.status
                },
                confidence: bestMatch.confidence
            };
        }

        // Multiple matches
        return {
            type: 'multiple_matches',
            confidence: bestMatch.confidence,
            multipleMatches: matches.slice(0, 5).map(match => ({
                id: match.vendor.id,
                name: match.vendor.name,
                email: match.vendor.email,
                phone: match.vendor.phone,
                confidence: match.confidence
            }))
        };
    }

    /**
     * Create a new vendor from extracted data
     */
    async createVendorFromExtractedData(
        extractedData: ExtractedInvoiceData
    ): Promise<string> {
        try {
            const vendorData = {
                name: extractedData.vendorName,
                type: this.determineVendorType(extractedData),
                status: 'active' as const,
                email: extractedData.vendorEmail || '',
                phone: extractedData.vendorPhone || '',
                gstNumber: extractedData.vendorGstNumber || '',
                notes: `Auto-created from invoice: ${extractedData.invoiceNumber}`
            };

            const vendorId = await createVendor(vendorData);
            console.log('Created new vendor:', vendorId);

            return vendorId;
        } catch (error) {
            console.error('Error creating vendor:', error);
            throw new Error(`Failed to create vendor: ${error}`);
        }
    }

    /**
     * Determine vendor type based on extracted data
     */
    private determineVendorType(extractedData: ExtractedInvoiceData): VendorType {
        const text = `${extractedData.vendorName} ${extractedData.notes || ''}`.toLowerCase();

        // Keywords for different vendor types
        const typeKeywords: Record<VendorType, string[]> = {
            'Software': ['software', 'saas', 'license', 'subscription', 'app', 'platform'],
            'Services': ['service', 'consulting', 'maintenance', 'support', 'repair'],
            'Equipment': ['equipment', 'machinery', 'hardware', 'device'],
            'Electronics': ['electronics', 'computer', 'laptop', 'phone', 'tablet'],
            'Maintenance': ['maintenance', 'repair', 'service', 'upkeep'],
            'Goods': ['goods', 'product', 'item', 'material'],
            'Consumables': ['consumable', 'supply', 'material', 'paper', 'ink'],
            'Infrastructure': ['infrastructure', 'network', 'server', 'cloud']
        };

        for (const [type, keywords] of Object.entries(typeKeywords)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return type as VendorType;
            }
        }

        // Default to Services if no specific type is determined
        return 'Services';
    }

    /**
     * Normalize vendor name for comparison
     */
    private normalizeVendorName(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove special characters
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    /**
     * Calculate string similarity using Levenshtein distance
     */
    private calculateStringSimilarity(str1: string, str2: string): number {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;

        if (longer.length === 0) return 1.0;

        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    /**
     * Calculate Levenshtein distance between two strings
     */
    private levenshteinDistance(str1: string, str2: string): number {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    /**
     * Combine AI and traditional matching results
     */
    private combineMatchingResults(
        aiMatch: VendorMatchResult,
        traditionalMatch: VendorMatchResult
    ): VendorMatchResult {
        // If AI found an exact match, prefer it
        if (aiMatch.type === 'exact_match' && aiMatch.confidence > 0.9) {
            return aiMatch;
        }

        // If traditional matching found an exact match, prefer it
        if (traditionalMatch.type === 'exact_match') {
            return traditionalMatch;
        }

        // If both found fuzzy matches, use the one with higher confidence
        if (aiMatch.type === 'fuzzy_match' && traditionalMatch.type === 'fuzzy_match') {
            return aiMatch.confidence > traditionalMatch.confidence ? aiMatch : traditionalMatch;
        }

        // If only one found a match, use that one
        if (aiMatch.type !== 'no_match' && traditionalMatch.type === 'no_match') {
            return aiMatch;
        }

        if (traditionalMatch.type !== 'no_match' && aiMatch.type === 'no_match') {
            return traditionalMatch;
        }

        // If both found multiple matches, combine them
        if (aiMatch.type === 'multiple_matches' && traditionalMatch.type === 'multiple_matches') {
            return {
                type: 'multiple_matches',
                confidence: Math.max(aiMatch.confidence, traditionalMatch.confidence),
                multipleMatches: [
                    ...(aiMatch.multipleMatches || []),
                    ...(traditionalMatch.multipleMatches || [])
                ].slice(0, 5) // Limit to top 5 matches
            };
        }

        // Default to no match
        return {
            type: 'no_match',
            confidence: 0
        };
    }

    /**
     * Create a no-match result with suggested vendor
     */
    private createNoMatchResult(extractedData: ExtractedInvoiceData): VendorMatchResult {
        return {
            type: 'no_match',
            confidence: 0,
            suggestedVendor: {
                name: extractedData.vendorName,
                email: extractedData.vendorEmail,
                phone: extractedData.vendorPhone,
                gstNumber: extractedData.vendorGstNumber,
                type: this.determineVendorType(extractedData)
            }
        };
    }

    /**
     * Validate vendor data before creation
     */
    validateVendorData(vendorData: {
        name: string;
        email?: string;
        phone?: string;
        gstNumber?: string;
    }): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!vendorData.name || vendorData.name.trim().length === 0) {
            errors.push('Vendor name is required');
        }

        if (vendorData.email && !this.isValidEmail(vendorData.email)) {
            errors.push('Invalid email format');
        }

        if (vendorData.phone && !this.isValidPhone(vendorData.phone)) {
            errors.push('Invalid phone number format');
        }

        if (vendorData.gstNumber && !this.isValidGST(vendorData.gstNumber)) {
            errors.push('Invalid GST number format');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate email format
     */
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate phone number format
     */
    private isValidPhone(phone: string): boolean {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    /**
     * Validate GST number format
     */
    private isValidGST(gst: string): boolean {
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        return gstRegex.test(gst);
    }
}

// Export singleton instance
export const vendorMatchingService = new VendorMatchingService(); 