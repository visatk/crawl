import { Hono } from 'hono';

type Bindings = {
  JOB_HISTORY: KVNamespace;
  // We don't have a specific binding for Browser Rendering REST API right now, 
  // but we can use CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN from Env for REST API.
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_API_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Base API route
app.get('/api/', (c) => {
  return c.json({ name: 'Cloudflare Worker SaaS API' });
});

// Start a crawl job
app.post('/api/crawl', async (c) => {
  try {
    const body = await c.req.json();
    const { url, options = {}, limit = 10, depth = 1, formats = ["markdown"] } = body;
    
    if (!url) {
      return c.json({ success: false, error: "URL is required" }, 400);
    }

    const accountId = c.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = c.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      // For local testing without real token
      console.warn("Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN. Using mock ID.");
      const jobId = "mock-job-id-" + Date.now();
      await c.env.JOB_HISTORY.put(jobId, JSON.stringify({
        url,
        status: "running",
        timestamp: Date.now()
      }));
      return c.json({ success: true, result: jobId });
    }

    const cfRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/crawl`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        limit,
        depth,
        formats,
        options,
        render: false
      })
    });

    const cfData: any = await cfRes.json();
    
    if (cfData.success) {
      const jobId = cfData.result;
      // Save to KV
      await c.env.JOB_HISTORY.put(jobId, JSON.stringify({
        url,
        status: "running",
        timestamp: Date.now()
      }));
      return c.json({ success: true, result: jobId });
    } else {
      return c.json({ success: false, error: cfData.errors }, 500);
    }

  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Check crawl job status
app.get('/api/crawl/:id', async (c) => {
  const jobId = c.req.param('id');
  const accountId = c.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = c.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return c.json({ 
      success: true, 
      result: { id: jobId, status: "completed" } 
    });
  }

  try {
    const cfRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/crawl/${jobId}?limit=1`, {
      headers: { 'Authorization': `Bearer ${apiToken}` }
    });
    const cfData: any = await cfRes.json();
    
    // Update KV status
    if (cfData.success) {
      const kvDataStr = await c.env.JOB_HISTORY.get(jobId);
      if (kvDataStr) {
        const kvData = JSON.parse(kvDataStr);
        kvData.status = cfData.result.status;
        await c.env.JOB_HISTORY.put(jobId, JSON.stringify(kvData));
      }
    }

    return c.json(cfData);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get crawl results
app.get('/api/crawl/:id/results', async (c) => {
  const jobId = c.req.param('id');
  const accountId = c.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = c.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return c.json({
      success: true,
      result: {
        id: jobId,
        status: "completed",
        records: [
          { url: "https://example.com", markdown: "# Example Domain\n\nThis is a mock result.", status: "completed" }
        ]
      }
    });
  }

  try {
    const cfRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/crawl/${jobId}?status=completed`, {
      headers: { 'Authorization': `Bearer ${apiToken}` }
    });
    const cfData: any = await cfRes.json();
    return c.json(cfData);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Get job history
app.get('/api/crawl/history/list', async (c) => {
  try {
    const list = await c.env.JOB_HISTORY.list();
    const jobs = await Promise.all(
      list.keys.map(async (key) => {
        const value = await c.env.JOB_HISTORY.get(key.name);
        return {
          id: key.name,
          ...JSON.parse(value || "{}")
        };
      })
    );
    
    // Sort by timestamp descending
    jobs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    return c.json({ success: true, jobs });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
