import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface JobStatusProps {
  jobId: string;
  onCompleted?: () => void;
}

type StatusType = 'running' | 'completed' | 'errored' | 'cancelled_due_to_timeout' | 'cancelled_due_to_limits' | 'cancelled_by_user' | 'unknown';

export function JobStatus({ jobId, onCompleted }: JobStatusProps) {
  const [status, setStatus] = useState<StatusType>('running');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    let intervalId: NodeJS.Timeout;
    let isMounted = true; // Cleanup flag

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/crawl/${jobId}`);
        const data = await res.json();
        
        if (!isMounted) return;

        if (data.success && data.result) {
          const newStatus: StatusType = data.result.status;
          setStatus(newStatus);
          
          if (newStatus === 'completed' || newStatus.includes('cancelled') || newStatus === 'errored') {
            clearInterval(intervalId);
            if (newStatus === 'completed' && onCompleted) {
              onCompleted();
            }
          }
        } else {
          setError(data.error || 'Failed to fetch status');
          clearInterval(intervalId);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || 'Network error occurred');
        clearInterval(intervalId);
      }
    };

    checkStatus();
    intervalId = setInterval(checkStatus, 3000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [jobId, onCompleted]);

  const getStatusIcon = () => {
    if (status === 'running') return <Loader2 className="h-5 w-5 animate-spin text-blue-500" aria-label="Loading" />;
    if (status === 'completed') return <CheckCircle2 className="h-5 w-5 text-green-500" aria-label="Completed" />;
    if (status === 'errored') return <XCircle className="h-5 w-5 text-destructive" aria-label="Error" />;
    return <AlertCircle className="h-5 w-5 text-yellow-500" aria-label="Warning" />;
  };

  return (
    <Card className="w-full shadow-md backdrop-blur-md bg-background/60 border-muted">
      <CardHeader className="py-4">
        <CardTitle className="text-lg flex items-center gap-2">
          {getStatusIcon()}
          <span>Job Status: <span className="capitalize">{status.replace(/_/g, ' ')}</span></span>
        </CardTitle>
      </CardHeader>
      {error && (
        <CardContent>
          <p className="text-sm text-destructive" role="alert">{error}</p>
        </CardContent>
      )}
    </Card>
  );
}
