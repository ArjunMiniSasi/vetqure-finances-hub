// Gemini API Service
// This service provides functions to interact with Google's Gemini AI API

interface GeminiRequest {
    contents: {
        parts: {
            text: string;
        }[];
    }[];
}

interface GeminiResponse {
    candidates: {
        content: {
            parts: {
                text: string;
            }[];
        };
    }[];
}

interface GeminiError {
    error: {
        code: number;
        message: string;
        status: string;
    };
}

class GeminiService {
    private apiKey: string;
    private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
    private retryAttempts = 3;
    private baseDelay = 1000; // 1 second

    constructor() {
        this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!this.apiKey) {
            throw new Error('GEMINI_API_KEY is not configured in environment variables');
        }
    }

    /**
     * Check if error is a quota exceeded error
     */
    private isQuotaExceededError(error: any): boolean {
        const errorMessage = error.message || '';
        return errorMessage.includes('quota') ||
            errorMessage.includes('rate limit') ||
            errorMessage.includes('billing') ||
            errorMessage.includes('exceeded');
    }

    /**
     * Sleep for a given number of milliseconds
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generate content using Gemini AI with retry logic
     * @param prompt - The text prompt to send to Gemini
     * @param options - Optional parameters for the request
     * @returns Promise with the generated text response
     */
    async generateContent(
        prompt: string,
        options: {
            temperature?: number;
            maxTokens?: number;
            topP?: number;
            topK?: number;
        } = {}
    ): Promise<string> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const requestBody: GeminiRequest = {
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt
                                }
                            ]
                        }
                    ]
                };

                // Add generation config if options are provided
                if (Object.keys(options).length > 0) {
                    (requestBody as any).generationConfig = {
                        temperature: options.temperature ?? 0.7,
                        maxOutputTokens: options.maxTokens ?? 2048,
                        topP: options.topP ?? 0.8,
                        topK: options.topK ?? 40
                    };
                }

                const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorData: GeminiError = await response.json();
                    const errorMessage = errorData.error?.message || response.statusText;

                    // Check if it's a quota exceeded error
                    if (this.isQuotaExceededError({ message: errorMessage })) {
                        throw new Error(`API quota exceeded. Please check your billing and try again later. (Attempt ${attempt}/${this.retryAttempts})`);
                    }

                    throw new Error(`Gemini API error: ${errorMessage}`);
                }

                const data: GeminiResponse = await response.json();

                if (!data.candidates || data.candidates.length === 0) {
                    throw new Error('No response generated from Gemini API');
                }

                return data.candidates[0].content.parts[0].text;

            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                console.error(`Gemini API attempt ${attempt} failed:`, lastError);

                // If it's a quota exceeded error, don't retry
                if (this.isQuotaExceededError(lastError)) {
                    throw new Error('API quota exceeded. Please check your billing and try again later.');
                }

                // If this is the last attempt, throw the error
                if (attempt === this.retryAttempts) {
                    throw lastError;
                }

                // Wait before retrying with exponential backoff
                const delay = this.baseDelay * Math.pow(2, attempt - 1);
                console.log(`Retrying in ${delay}ms...`);
                await this.sleep(delay);
            }
        }

        throw lastError || new Error('Unknown error occurred');
    }

    /**
     * Generate content with streaming (for real-time responses)
     * @param prompt - The text prompt to send to Gemini
     * @param onChunk - Callback function for each chunk of response
     * @param options - Optional parameters for the request
     */
    async generateContentStream(
        prompt: string,
        onChunk: (chunk: string) => void,
        options: {
            temperature?: number;
            maxTokens?: number;
        } = {}
    ): Promise<void> {
        try {
            const requestBody: any = {
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: options.temperature ?? 0.7,
                    maxOutputTokens: options.maxTokens ?? 2048,
                }
            };

            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Response body is not readable');
            }

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') return;

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
                                onChunk(parsed.candidates[0].content.parts[0].text);
                            }
                        } catch (e) {
                            // Ignore parsing errors for incomplete chunks
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error in streaming Gemini API:', error);
            throw error;
        }
    }

    /**
     * Check if the API key is valid by making a simple test request
     * @returns Promise<boolean> - true if API key is valid
     */
    async validateApiKey(): Promise<boolean> {
        try {
            await this.generateContent('Hello', { maxTokens: 10 });
            return true;
        } catch (error) {
            console.error('API key validation failed:', error);
            return false;
        }
    }
}

// Export a singleton instance
export const geminiService = new GeminiService();

// Export the class for testing or custom instances
export { GeminiService }; 