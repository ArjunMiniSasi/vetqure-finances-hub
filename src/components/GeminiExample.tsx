import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { geminiService } from '@/services/geminiService';

const GeminiExample: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const handleGenerateContent = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setLoading(true);
    setResponse('');
    
    try {
      const result = await geminiService.generateContent(prompt, {
        temperature: 0.7,
        maxTokens: 500
      });
      setResponse(result);
      toast.success('Content generated successfully!');
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content. Please check your API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleStreamingContent = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsStreaming(true);
    setStreamingResponse('');
    
    try {
      await geminiService.generateContentStream(
        prompt,
        (chunk) => {
          setStreamingResponse(prev => prev + chunk);
        },
        {
          temperature: 0.7,
          maxTokens: 500
        }
      );
      toast.success('Streaming completed!');
    } catch (error) {
      console.error('Error in streaming:', error);
      toast.error('Failed to stream content. Please check your API key.');
    } finally {
      setIsStreaming(false);
    }
  };

  const handleValidateApiKey = async () => {
    setLoading(true);
    try {
      const isValid = await geminiService.validateApiKey();
      if (isValid) {
        toast.success('API key is valid!');
      } else {
        toast.error('API key is invalid');
      }
    } catch (error) {
      toast.error('Failed to validate API key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gemini AI Integration Example</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={handleValidateApiKey} 
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Validating...' : 'Validate API Key'}
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Enter your prompt:</label>
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask Gemini anything..."
              disabled={loading || isStreaming}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleGenerateContent} 
              disabled={loading || isStreaming || !prompt.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Generating...' : 'Generate Content'}
            </Button>
            <Button 
              onClick={handleStreamingContent} 
              disabled={loading || isStreaming || !prompt.trim()}
              variant="outline"
            >
              {isStreaming ? 'Streaming...' : 'Stream Content'}
            </Button>
          </div>

          {response && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Generated Response:</label>
              <div className="p-4 bg-gray-50 rounded-md border">
                <pre className="whitespace-pre-wrap text-sm">{response}</pre>
              </div>
            </div>
          )}

          {streamingResponse && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Streaming Response:</label>
              <div className="p-4 bg-gray-50 rounded-md border">
                <pre className="whitespace-pre-wrap text-sm">{streamingResponse}</pre>
                {isStreaming && <span className="animate-pulse">|</span>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GeminiExample; 