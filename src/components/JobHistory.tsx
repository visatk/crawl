import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Clock, ExternalLink } from 'lucide-react';

interface JobHistoryProps {
  onSelectJob: (jobId: string) => void;
}

interface JobEntry {
  id: string;
  url: string;
  status: string;
  timestamp: number;
}

export function JobHistory({ onSelectJob }: JobHistoryProps) {
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/crawl/history/list');
        const data = await res.json();
        if (!isMounted) return;
        
        if (data.success) {
          setJobs(data.jobs as JobEntry[]);
        }
      } catch (err) {
        console.error("Failed to fetch job history:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchHistory();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground animate-pulse" aria-busy="true">Loading history...</div>;
  }

  if (jobs.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground text-center">No past crawls found.</div>;
  }

  return (
    <Card className="w-full shadow-md border-muted bg-background/40 backdrop-blur-md">
      <CardHeader className="pb-3 border-b border-muted/50">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          Recent Crawls
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] w-full">
          <div className="flex flex-col" role="list">
            {jobs.map((job) => (
              <div 
                key={job.id} 
                role="listitem"
                className="p-4 border-b border-muted/50 last:border-0 hover:bg-muted/30 transition-colors flex justify-between items-center group cursor-pointer focus-within:bg-muted/30"
                onClick={() => onSelectJob(job.id)}
                onKeyDown={(e) => { if(e.key === 'Enter') onSelectJob(job.id); }}
                tabIndex={0}
                aria-label={`View job for ${job.url}`}
              >
                <div className="flex flex-col overflow-hidden pr-4">
                  <div className="text-sm font-medium truncate flex items-center gap-1">
                    <ExternalLink className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                    {job.url}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                    <span className="capitalize">{job.status?.replace(/_/g, ' ')}</span>
                    <span aria-hidden="true">&bull;</span>
                    <span>{new Date(job.timestamp).toLocaleString()}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity" tabIndex={-1}>
                  View
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
