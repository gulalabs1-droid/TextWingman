'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function TestPage() {
  const [message, setMessage] = useState("Hey, what are you up to this weekend?");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      setResult({ status: response.status, data });
    } catch (error) {
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Test & Debug</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Test OpenAI Integration</CardTitle>
          <CardDescription>
            Test the reply generation with different messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Test Message
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter a test message..."
              rows={4}
            />
          </div>
          
          <Button onClick={testGenerate} disabled={loading}>
            {loading ? 'Testing...' : 'Test Generate'}
          </Button>

          {result && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
