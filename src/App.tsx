import { useState } from 'react';
import { CrawlForm } from './components/CrawlForm';
import { JobStatus } from './components/JobStatus';
import { ResultsViewer } from './components/ResultsViewer';
import { JobHistory } from './components/JobHistory';
import { CloudRain } from 'lucide-react';

function App() {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobCompleted, setJobCompleted] = useState<boolean>(false);

  const handleJobStarted = (jobId: string) => {
    setActiveJobId(jobId);
    setJobCompleted(false);
  };

  const handleJobCompleted = () => {
    setJobCompleted(true);
  };

  const handleSelectJob = (jobId: string) => {
    setActiveJobId(jobId);
    setJobCompleted(true);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-background to-background text-foreground selection:bg-primary/30">
      
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/40 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
        <div className="container mx-auto px-4 h-14 flex items-center">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <CloudRain className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>Crawl<span className="text-primary">Flare</span></span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            <section className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-2xl relative overflow-hidden" aria-labelledby="sidebar-title">
              <div className="absolute top-0 right-0 p-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" aria-hidden="true"></div>
              <h2 id="sidebar-title" className="text-xl font-bold mb-2">Web Scraping SaaS</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Extract markdown, HTML, or structured JSON from any website using the power of Cloudflare Browser Rendering API.
              </p>
              
              {(!activeJobId || jobCompleted) && (
                <button 
                  onClick={() => { setActiveJobId(null); setJobCompleted(false); }}
                  className="w-full py-2 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition-colors shadow-md"
                  aria-label="Start a new crawl job"
                >
                  Start New Crawl
                </button>
              )}
            </section>

            <JobHistory onSelectJob={handleSelectJob} />
          </aside>

          {/* Right Column: Main Working Area */}
          <article className="lg:col-span-8 space-y-6">
            {!activeJobId ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CrawlForm onJobStarted={handleJobStarted} />
              </div>
            ) : (
              <div className="space-y-6 animate-in zoom-in-95 duration-300">
                {!jobCompleted && (
                  <JobStatus jobId={activeJobId} onCompleted={handleJobCompleted} />
                )}
                
                {jobCompleted && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <ResultsViewer jobId={activeJobId} />
                  </div>
                )}
              </div>
            )}
          </article>
          
        </div>
      </main>
    </div>
  );
}

export default App;
