import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react'; // আইকন আপনার প্রজেক্ট অনুযায়ী পরিবর্তন করুন

export function JobStatus({ jobId }: { jobId: string }) {
  const [status, setStatus] = useState<string>('pending');

  useEffect(() => {
    if (!jobId) return;

    // ✅ সঠিক (Vite/Browser-এর জন্য)
    let timer: ReturnType<typeof setTimeout>;
    
    // অথবা ইন্টারভালের জন্য:
    let interval: ReturnType<typeof setInterval>;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();
        setStatus(data.status);

        if (data.status !== 'completed' && data.status !== 'failed') {
          // পোলিং কন্টিনিউ করার জন্য
          timer = setTimeout(fetchStatus, 2000);
        }
      } catch (error) {
        console.error("Error fetching job status:", error);
        setStatus('failed');
      }
    };

    fetchStatus();

    // ক্লিনআপ ফাংশন
    return () => {
      if (timer) clearTimeout(timer);
      if (interval) clearInterval(interval);
    };
  }, [jobId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          {status === 'pending' && <Loader2 className="animate-spin text-blue-500" />}
          {status === 'completed' && <CheckCircle className="text-green-500" />}
          {status === 'failed' && <XCircle className="text-red-500" />}
          <span className="capitalize">{status}</span>
        </div>
      </CardContent>
    </Card>
  );
}
