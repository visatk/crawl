import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface JobStatusProps {
  jobId: string;
  onCompleted?: () => void;
}

export function JobStatus({ jobId, onCompleted }: JobStatusProps) {
  const [status, setStatus] = useState<string>('initializing');
  const [error, setError] = useState<string | null>(null);
  
  // To prevent state updates on unmounted components
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    let timer: ReturnType<typeof setTimeout>;

    const fetchStatus = async () => {
      if (!isMounted.current) return;

      try {
        // Hitting the correct endpoint defined in worker/index.ts
        const res = await fetch(`/api/crawl/${jobId}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch job status from server.');
        }
        
        const data = await res.json();
        
        if (data.success && data.result) {
          const currentStatus = data.result.status || 'pending';
          
          if (isMounted.current) {
            setStatus(currentStatus);
          }

          if (currentStatus === 'completed') {
            if (onCompleted) onCompleted();
          } else if (currentStatus === 'failed') {
            if (isMounted.current) {
              setError(data.error || 'Job failed during execution.');
            }
          } else {
            // Continue polling every 3 seconds if still running/pending
            timer = setTimeout(fetchStatus, 3000);
          }
        } else {
          throw new Error(data.error || 'Invalid response from server.');
        }
      } catch (err: any) {
        console.error("Error fetching job status:", err);
        if (isMounted.current) {
          setStatus('failed');
          setError(err.message || "An unexpected network error occurred.");
        }
      }
    };

    // Initial call
    fetchStatus();

    // Cleanup function
    return () => {
      isMounted.current = false;
      if (timer) clearTimeout(timer);
    };
  }, [jobId, onCompleted]);

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-xl overflow-hidden relative">
      {/* Decorative gradient blur for modern UI feel */}
      <div className="absolute top-0 right-0 p-24 bg-primary/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" aria-hidden="true" />
      
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Job Execution Status</span>
          <span className="text-xs font-normal text-muted-foreground font-mono bg-background/50 px-2 py-1 rounded border border-white/5">
            ID: {jobId.slice(0, 8)}...
          </span>
        </CardTitle>
        <CardDescription>
          Tracking the progress of your web scraping task.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-background/40 border border-white/5">
            {/* Status Icons */}
            {status === 'initializing' || status === 'pending' || status === 'running' ? (
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            ) : status === 'completed' ? (
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            ) : (
              <XCircle className="h-6 w-6 text-rose-500" />
            )}
            
            {/* Status Text */}
            <div className="flex flex-col">
              <span className="font-medium capitalize tracking-wide text-foreground">
                {status}
              </span>
              <span className="text-xs text-muted-foreground">
                {status === 'completed' 
                  ? 'Data extraction finished successfully.' 
                  : status === 'failed' 
                  ? 'Failed to extract data.' 
                  : 'Processing target URL...'}
              </span>
            </div>
          </div>

          {/* Error Message Display */}
          {error && (
            <div className="flex items-start gap-2 text-sm text-rose-400 bg-rose-500/10 p-3 rounded-md border border-rose-500/20">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
