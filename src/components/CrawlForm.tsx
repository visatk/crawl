import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface CrawlFormProps {
  onJobStarted: (jobId: string) => void;
}

export function CrawlForm({ onJobStarted }: CrawlFormProps) {
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      setError('Please enter a URL to crawl.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.success) {
        onJobStarted(data.result);
        setUrl('');
      } else {
        setError(data.error || 'Failed to start crawl job.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-lg backdrop-blur-xl bg-background/60 border-muted">
      <CardHeader>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          New Crawl
        </CardTitle>
        <CardDescription>Enter a URL to start scraping its content and sub-pages.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Target URL</Label>
            <Input
              id="url"
              name="url"
              type="url"
              required
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-background/50 border-muted/50 focus-visible:ring-2 focus-visible:ring-primary transition-colors"
              aria-invalid={!!error}
              aria-describedby={error ? "url-error" : undefined}
            />
          </div>
          {error && (
            <p id="url-error" className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all duration-300 active:scale-95"
            aria-busy={loading}
          >
            {loading ? 'Starting...' : 'Start Crawling'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
