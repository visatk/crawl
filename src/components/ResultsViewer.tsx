import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';

interface ResultsViewerProps {
  jobId: string;
}

interface RecordData {
  url: string;
  status: string;
  markdown?: string;
  html?: string;
  metadata?: any;
}

interface CrawlResult {
  id: string;
  status: string;
  finished: number;
  total: number;
  records: RecordData[];
}

export function ResultsViewer({ jobId }: ResultsViewerProps) {
  const [results, setResults] = useState<CrawlResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    let isMounted = true;

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/crawl/${jobId}/results`);
        const data = await res.json();
        
        if (!isMounted) return;

        if (data.success && data.result) {
          setResults(data.result as CrawlResult);
        } else {
          setError(data.error || 'Failed to fetch results');
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Network error fetching results.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchResults();

    return () => {
      isMounted = false;
    };
  }, [jobId]);

  const handleDownload = () => {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crawl-${jobId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card className="w-full animate-pulse border-muted" aria-busy="true">
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          Loading results...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-destructive/50">
        <CardContent className="pt-6 text-destructive" role="alert">
          Error loading results: {error}
        </CardContent>
      </Card>
    );
  }

  if (!results || !results.records || results.records.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 text-muted-foreground text-center">
          No records found for this crawl job.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg border-muted">
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="text-xl">Crawl Results ({results.finished} pages)</CardTitle>
        <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2" aria-label="Download JSON results">
          <Download className="h-4 w-4" aria-hidden="true" />
          Download JSON
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] w-full rounded-md border p-4 bg-muted/20">
          <div className="space-y-6">
            {results.records.map((record: RecordData, idx: number) => (
              <div key={idx} className="space-y-2 pb-6 border-b border-muted last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-primary" aria-hidden="true" />
                  <a href={record.url} target="_blank" rel="noreferrer" className="text-sm font-medium hover:underline break-all text-primary focus-visible:ring-2 focus-visible:outline-none rounded-sm">
                    {record.url}
                  </a>
                </div>
                <div className="bg-background rounded-md p-4 shadow-sm border overflow-x-auto text-sm">
                  {record.markdown ? (
                    <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">{record.markdown}</pre>
                  ) : record.html ? (
                    <div className="text-xs text-muted-foreground italic">HTML content extracted (length: {record.html.length})</div>
                  ) : (
                    <div className="text-xs text-muted-foreground italic">No content available. Status: {record.status}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
