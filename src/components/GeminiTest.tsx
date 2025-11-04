import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { GeminiService } from '../services/geminiService';

export const GeminiTest: React.FC = () => {
  const [testText, setTestText] = useState('Test invoice with amount 1000 and tax 180');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const testGemini = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      const geminiService = new GeminiService();
      const response = await geminiService.generateContent(testText);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Gemini API Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="test-text">Test Text</Label>
          <Textarea
            id="test-text"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Enter text to test with Gemini API"
            rows={3}
          />
        </div>
        
        <Button onClick={testGemini} disabled={loading}>
          {loading ? 'Testing...' : 'Test Gemini API'}
        </Button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 font-medium">Error:</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 font-medium">Response:</p>
            <pre className="text-green-700 text-sm whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
