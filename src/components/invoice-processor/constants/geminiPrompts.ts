// AI Prompts for Invoice Data Extraction

export const INVOICE_EXTRACTION_PROMPT = `
You are an expert invoice data extraction system. Your task is to extract structured data from invoice text and return it in JSON format.

INSTRUCTIONS:
1. Extract all relevant invoice information from the provided text
2. Return ONLY valid JSON with the exact structure specified
3. Use null for missing values, not empty strings
4. Ensure all monetary values are numbers (not strings)
5. Parse dates in YYYY-MM-DD format
6. Provide confidence scores (0-1) for each extracted field

REQUIRED JSON STRUCTURE:
{
  "vendorName": "string",
  "vendorEmail": "string or null",
  "vendorPhone": "string or null", 
  "vendorGstNumber": "string or null",
  "vendorAddress": "string or null",
  "invoiceNumber": "string",
  "invoiceDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD or null",
  "serviceEndDate": "YYYY-MM-DD or null",
  "subtotal": number,
  "taxAmount": number or null,
  "totalAmount": number,
  "currency": "INR|USD|EUR|GBP",
  "lineItems": [
    {
      "description": "string",
      "quantity": number or null,
      "unitPrice": number or null,
      "amount": number
    }
  ] or null,
  "notes": "string or null",
  "terms": "string or null",
  "confidence": {
    "vendorName": number,
    "invoiceNumber": number,
    "totalAmount": number,
    "invoiceDate": number,
    "overall": number
  }
}

EXTRACTION GUIDELINES:
- Vendor Name: Look for company/business names, usually in header or footer
- Invoice Number: Find invoice ID, bill number, or reference number
- Dates: Parse invoice date, due date, and service period dates
- Amounts: Extract subtotal, tax, and total amounts (ignore currency symbols)
- Currency: Identify currency from symbols or text (₹=INR, $=USD, €=EUR, £=GBP)
- Line Items: Extract itemized charges if available
- GST Number: Look for GSTIN format (22AAAAA0000A1Z5)
- Contact Info: Extract email and phone numbers

CONFIDENCE SCORING:
- 0.9-1.0: Very clear and unambiguous
- 0.7-0.8: Clear but some ambiguity
- 0.5-0.6: Somewhat clear, reasonable confidence
- 0.3-0.4: Unclear, low confidence
- 0.1-0.2: Very unclear, minimal confidence

INVOICE TEXT:
`;

export const VENDOR_MATCHING_PROMPT = `
You are a vendor matching system. Given a vendor name from an invoice, determine if it matches any existing vendors in our database.

EXISTING VENDORS:
{vendorList}

INVOICE VENDOR NAME: {invoiceVendorName}

INSTRUCTIONS:
1. Compare the invoice vendor name with existing vendors
2. Consider variations in spelling, abbreviations, and formatting
3. Return a JSON response with matching results

RESPONSE FORMAT:
{
  "matches": [
    {
      "vendorId": "string",
      "vendorName": "string", 
      "confidence": number,
      "matchType": "exact|fuzzy|partial"
    }
  ],
  "bestMatch": {
    "vendorId": "string or null",
    "vendorName": "string or null",
    "confidence": number,
    "matchType": "exact|fuzzy|partial|none"
  },
  "suggestedVendor": {
    "name": "string",
    "email": "string or null",
    "phone": "string or null",
    "gstNumber": "string or null",
    "type": "Goods|Services|Equipment|Electronics|Maintenance|Software|Consumables|Infrastructure"
  } or null
}

MATCHING RULES:
- Exact Match: Identical names (case-insensitive)
- Fuzzy Match: Similar names with minor differences
- Partial Match: One name contains the other
- No Match: No reasonable similarity found

CONFIDENCE SCORING:
- 1.0: Exact match
- 0.8-0.9: Very similar names
- 0.6-0.7: Similar names with minor differences
- 0.4-0.5: Partial matches
- 0.0-0.3: No meaningful match
`;

export const INVOICE_VALIDATION_PROMPT = `
You are an invoice validation system. Review the extracted invoice data for accuracy and completeness.

EXTRACTED DATA:
{extractedData}

VALIDATION RULES:
1. Vendor name should not be empty
2. Invoice number should be present and unique
3. Invoice date should be a valid date
4. Total amount should be a positive number
5. Currency should be one of: INR, USD, EUR, GBP
6. If tax amount is present, it should be positive
7. If line items exist, their sum should approximately equal subtotal

VALIDATION RESPONSE:
{
  "isValid": boolean,
  "errors": [
    {
      "field": "string",
      "message": "string",
      "severity": "error|warning|info"
    }
  ],
  "warnings": [
    {
      "field": "string", 
      "message": "string"
    }
  ],
  "suggestions": [
    {
      "field": "string",
      "message": "string"
    }
  ],
  "overallConfidence": number
}
`;

export const LINE_ITEM_EXTRACTION_PROMPT = `
Extract line items from the following invoice text. Look for itemized charges, services, or products.

INVOICE TEXT:
{invoiceText}

EXTRACT LINE ITEMS IN JSON FORMAT:
{
  "lineItems": [
    {
      "description": "string",
      "quantity": number or null,
      "unitPrice": number or null,
      "amount": number
    }
  ]
}

GUIDELINES:
- Look for itemized lists, service descriptions, or product names
- Extract quantities if available (numbers, units)
- Extract unit prices if available
- Calculate or extract line item amounts
- Use null for missing quantity or unit price
- Ensure descriptions are clear and meaningful
`; 