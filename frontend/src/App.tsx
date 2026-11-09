// @ts-nocheck React and JSX type declarations are missing from this prototype's dependencies.
import {useEffect, useMemo, useRef, useState} from 'react';
import {Activity, ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, AlertTriangle, CircleAlert, Clock3, FileCode2, History, Home, Info, ScanSearch, Search, Settings2, ShieldCheck, ShieldAlert, Server, Send, UserRound, RotateCcw, X,} from 'lucide-react';

// Defining the pages, verdict and other details for the application
type Page = 'home' | 'scan' | 'history' | 'settings' | 'analysing' | 'result';
type Verdict = 'Benign' | 'Malicious'
type Sample = { id: string; name: string; size: string; description: string; verdict: Verdict; score: number; explanation: string;};
type ScanRecord = { id: string; sampleId: string; name: string; size: string; scannedAt: string; verdict: Verdict; score: number; explanation: string;}

// As of 2/11, the records are fictional and exist only for the starting demonstration
const demoSamples: Sample[] = [
    {
        id: 'demo-01', name: 'invoice_update.exe', size: '284 KB',
        description: 'Suspicious invoice attachment',
        verdict: 'Malicious', score: 93,
        explanation: 'Demo prediction: the simulated executable exhibits characteristics associated with malicious Windows PE files.',
    },
    {
        id: 'demo-02', name: 'printer_setup.exe', size: '1.2 MB',
        description: 'Printer installation utility',
        verdict: 'Benign', score: 5,
        explanation: 'Demo prediction: the simulated executable has a low likelihood of being malicious, based on the fictional analysis of its features.',
    },
    {
        id: 'demo-03', name: 'update_manager.exe', size: '512 KB',
        description: 'Unverified update utility',
        verdict: 'Malicious', score: 88,
        explanation: 'Demo prediction: the simulated executable shows patterns that are commonly found in malicious software, according to the fictional model.',
    },
];

const navigation = [
    {id: 'home', label: 'Home', icon: Home},
    {id: 'scan', label: 'Scan', icon: ScanSearch},
    {id: 'history', label: 'History', icon: History},
    {id: 'settings', label: 'Settings', icon: Settings2}
] as const;

const STORAGE_KEY = 'shredr-single-user-demo-history-v1';

function VerdictPill({verdict}: {verdict: Verdict}) {
    return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        verdict === 'Malicious' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
    }`}>
        {verdict}
    </span>
}

function Panel({children, className = ''} : {children: React.ReactNode; className?: string}) {
    return <section className={`2xl border border-slate-200 bg-white p-4 ${className}`}>{children}</section>;
}

function readableDate(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
        day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
}

export default function App() {
    const [page, setPage] = useState<Page>('home');
    const [toast, setToast] = useState('');
    const [selectedId, setSelectedId] = useState(demoSamples[0].id);
    const [runningId, setRunningId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'All' | 'Malicious' | 'Benign'>('All');
    const [activeScan, setActiveScan] = useState<ScanRecord | null>(null);
    const [history, setHistory] = useState<ScanRecord[]>(() => {
        try {
            const saved = window.localStorage.getItem(STORAGE_KEY);
            const parsed = saved ? JSON.parse(saved): [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    });
    const [showBanner, setShowBanner] = useState(true);
    const [progress, setProgress] = useState(0);
    const [animatedScore, setAnimatedScore] = useState(0);
    const [notice, setNotice] = useState('');
    const mainRef = useRef<HTMLElement | null>(null);

const selectedSample = demoSamples.find(sample => sample.id === selectedId) ?? demoSamples[0];
const runningSample = demoSamples.find(sample => sample.id === runningId);
const maliciousCount = history.filter(item => item.verdict === 'Malicious').length;
const benignCount = history.filter(item => item.verdict === 'Benign').length;

const filteredHistory = useMemo(
  () =>
    history.filter(
      item =>
        item.name.toLowerCase().includes(search.toLowerCase()) &&
        (filter === 'All' || item.verdict === filter)
    ),
  [history, filter, search]
);

// const filteredScanList = useMemo(
//   () =>
//     scanList.filter(
//       item =>
//         item.name.toLowerCase().includes(search.toLowerCase()) &&
//         (filter === 'All' || item.verdict === filter)
//     ),
//   [scanList, filter, search]
// );

const handleAnalyseClick = () => {
  const selectedSample = demoSamples.find(
    sample => sample.id === selectedId
  )

  if (!selectedSample) return;

  const alreadyScanned = history.some(
    scan => 
      scan.sampleId === selectedSample.id || scan.name === selectedSample.name
  )

  if (alreadyScanned) {
    setToast(`${selectedSample.name} has already been scanned!`);
    return;
  }

  startAnalysis();
}

function startAnalysis() {
    setRunningId(selectedSample.id);
    setProgress(0);
    setPage('analysing');
};

function openScan(scan: ScanRecord) {
    setActiveScan(scan);
    setPage('result');
}

const analysisStages = [
  'Reading executable',
  'Extracting file features',
  'Running XGBoost model',
  'Generating analysis results',
];

useEffect(() =>{
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(history)
    );
  } catch {
    //storage not available yet
  }
}, [history]);  

useEffect(() => {
  if (!toast) return;
  const timer = window.setTimeout(() => {
    setToast('');
  }, 4000);
  return () => window.clearTimeout(timer);
}, [toast]);

useEffect(() => {
    mainRef.current?.scrollTo({
        top: 0,
        behavior: 'auto'
    });
}, [page]);

useEffect(() => {
  if (page !== 'analysing' || !runningId) return;
  const sample = demoSamples.find(item => item.id === runningId);
  if (!sample) return;

  const startedAt = Date.now();
  let completed = false;
  const timer = window.setInterval(() => {
    const percent = Math.min(100, Math.floor(((Date.now() - startedAt) / 8000) * 100));
    setProgress(percent);

  if (percent === 100 && !completed) {
      completed = true;
      window.clearInterval(timer);
      const scan: ScanRecord = {
          id: `${Date.now()}-${sample.id}`,
          sampleId: sample.id,
          name: sample.name,
          size: sample.size,
          scannedAt: new Date().toISOString(),
          verdict: sample.verdict,
          score: sample.score,
          explanation: sample.explanation,
      };
      setHistory(items => [scan, ...items]);
      setActiveScan(scan);
      setPage('result');
  }
}, 50);
return () => window.clearInterval(timer);
}, [page, runningId]);


useEffect(() => {
  if (page !== 'result' || !activeScan) {
    setAnimatedScore(0);
    return;
  }

  setAnimatedScore(0);
  const timer = window.setTimeout(() => {
    setAnimatedScore(
      Math.max(0, Math.min(100, activeScan.score))
    );
  }, 100);
  return () => window.clearTimeout(timer);
}, [page, activeScan?.id]);

function goTo(destination: Page) {
    setPage(destination);
    setSearch('');
}

return (
    <div className="h-dvh overflow-hidden bg-[#ffffff] sm:px-5 sm:py-8">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-md flex-col overflow-hidden bg-[#f8fafb] shadow-xl sm:border sm:border-slate-200">
        <header className="flex shrink-0 items-center justify-between bg-[#111b29] px-5 py-5 text-white">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={25} className="text-[#8dc8d0]" />
            <span className="text-[18px] font-bold tracking-wide">SHREDR</span>
            </div>
          <span className="-full bg-[#273746] px-2 py-1 text-[10px] font-semibold tracking-wide text-[#c4e6eb]">DEMO MODE</span>
        </header>

        {showBanner && (
          <div className="flex shrink-0 items-start gap-2 border-b border-[#b9dce1] bg-[#e5f4f6] px-5 py-2.5 text-xs text-[#285c65]">
            <Info size={15} className="mt-0.5 shrink-0" />
            <p className="flex-1">This is the starting demonstrational prototype. Only fictional submissions and results.</p>
            <button aria-label="Dismiss demo banner" onClick={() => setShowBanner(false)}><X size={15} /></button>
          </div>
        )}

        <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto space-y-4 p-5">
          
        {/* HOME PAGE */}
        {page === 'home' && (
          <>
            <div>
              <h1 className="text-2xl font-bold">
                Welcome, IT Analyst
              </h1>
              <p className=" text-sm text-slate-500">
                Here's an overview of your analysis activity.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Panel className="bg-[#eaf5f6]!">
                <p className="text-2xl font-bold">{history.length}</p>
                <p className="text-XS text-slate-500">Total scans</p>
              </Panel>
              <Panel>
                <p className="text-2xl  text-slate-500 font-bold">
                  {benignCount}
                </p>
                <p className="text- text-slate-500">Benign</p>
              </Panel>
              <Panel className="bg-[#F5EDEA]!">
                <p className="text-2xl font-bold">
                  {maliciousCount}
                </p>
                <p className="text-S text-slate-500">Malicious</p>
              </Panel>
              
              {/* in progress panel*/}
              <Panel>
                <p className="text-2xl font-bold  text-slate-500">
                  {runningId ? '0' : '1'}
                </p>
                <p className="text-M text-slate-500">Analysing</p>
              </Panel>

            </div>

            <div>

              <h2 className="font-semibold">Recent Scans</h2>
              {history.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  No scans completed yet.
                </p>
              ) : (
                history.slice(0, 3).map(item => (
                  <button
                    key={item.id}
                    onClick={() => openScan(item)}
                    className="mt-2 flex w-full items-center justify-between border-t border-slate-500 py-3 text-left"
                  >

                  <div className="min-w-0 flex-1">
                    <p className="break-all text-sm font-semibold">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {readableDate(item.scannedAt)}
                    </p>
                  </div>

                  <VerdictPill verdict={item.verdict} />
                  </button>
                ))
              )}
            </div>

              <button
              type="button"
              onClick={() => goTo('scan')}
              className="w-full xl bg-[#eaf5f6] px-4 py-4 font-semibold text-slate-500 border"
            >
              Start a Scan
            </button>
            

            <Panel>
              <h2 className="font-semibold text-center">How SHREDR works</h2>
              <p className="mt-2 text-sm text-slate-600 text-center">
                Select an executable sample, request analysis,
                and view its predicted threat classification.
              </p>
            </Panel>

            

          </>
        )}

        {/* SCAN PAGE */}
        {page === 'scan' && (
          <>
            <div>
              <h1 className="text-2xl font-bold">Scan a File</h1>
              <p className="text-sm text-slate-500">
                Choose an available executable sample to analyse.
              </p>
            </div>

          <label className="flex items-center gap-2 xl border border-slate-200 bg-white px-3 py-3">
              <Search size={18} className="text-slate-400" />
              <input aria-label="Search scan list" className="w-full bg-transparent text-sm outline-none" placeholder="Search filename..." value={search} onChange={event => setSearch(event.target.value)} />
            </label>

            <Panel>
              <h2 className="mb-3 font-semibold">
                Available Samples
              </h2>

              <div className="space-y-3">
                {demoSamples.map(sample => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => setSelectedId(sample.id)}
                    className={`w-full xl border p-4 text-left ${
                      selectedId === sample.id
                        ? 'border-[#276f7d] bg-[#eaf5f6]'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileCode2 size={24} className="text-[#276f7d]" />
                      <div className="min-w-0 flex-1">
                        <p className="break-all text-sm font-semibold">
                          {sample.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {sample.size}
                        </p>
                      </div>
                      <span className="font-semibold text-[#276f7d]">
                        {selectedId === sample.id ? '✓' : ''}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {sample.description}
                    </p>
                  </button>
                ))}
              </div>
            </Panel>

            <button
              type="button"
              onClick={handleAnalyseClick}
              className="w-full bg-[#eaf5f6] px-4 py-4 font-semibold text-slate-500 border"
            >
              Analyse Selected File
            </button>

            <p className="text-center text-xs text-slate-500">
              Demonstration only. No real files are processed.
            </p>
          </>
        )}

        {/* Analysing page */}
        {page === 'analysing' && (
          <>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Analysing Sample</h1>
            <p className="text-sm text-slate-500">
              Simulating executable analysis...
            </p>
          </div>

          {/* Progress indicator */}
          <div className="flex justify-center py-5">
            <div className="relative h-56 w-56">
              <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" role="progressbar" aria-label="Simulated analysis progress" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <circle
                cx="100"
                cy="100"
                r="82"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="13"
              />

              <circle
                cx="100"
                cy="100"
                r="82"
                fill="none"
                stroke="#276f7d"
                strokeWidth="13"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 82}
                strokeDashoffset={
                  2 * Math.PI * 82 * (1 - progress / 100)
                }
                className="transition-[stroke-dashoffset] duration-75 ease-linear"
              />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold">
                  {progress}%
                </span>
                <span className="mt-2 text-xs text-slate-500">
                  Analysis progress
                </span>
            </div>
          </div>
          </div>

          {/* File being analysed */}
    <Panel>
      <div className="flex items-center gap-3">
        <FileCode2 size={24} className="text-[#276f7d]" />
        <div>
          <p className="text-xs text-slate-500">
            Selected executable
          </p>
          <p className="break-all font-semibold">
            {runningSample?.name}
          </p>
        </div>
      </div>
    </Panel>

    {/* animated analysis checklist */}
    <Panel>
      <h2 className="mb-5 font-semibold">
        Analysis Stages
      </h2>

      <div className="space-y-5">
        {analysisStages.map((stage, index) => {
          const completed = progress >= (index + 1) * 25;
          const current =
            progress >= index * 25 && !completed;

          return (
            <div
              key={stage}
              className="flex items-center gap-3"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  completed
                    ? 'bg-emerald-100 text-emerald-700'
                    : current
                    ? 'bg-[#dceef1] text-[#276f7d]'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {completed ? (
                  <CheckCircle2 size={19} />
                ) : current ? (
                  <span className="h-3 w-3 animate-pulse rounded-full bg-[#276f7d]" />
                ) : (
                  <Clock3 size={18} />
                )}
              </div>

              <div>
                <p
                  className={`text-sm font-semibold ${
                    completed || current
                      ? 'text-slate-900'
                      : 'text-slate-400'
                  }`}
                >
                  {stage}
                </p>
                <p className="text-xs text-slate-500">
                  {completed
                    ? 'Completed'
                    : current
                    ? 'In progress...'
                    : 'Waiting'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>

    <p className="text-center text-xs text-slate-500">
      No executable is actually being processed.
    </p>
  </>
)}        
          {page === 'result' && activeScan && <>

            <Panel>
              <h2 className="break-all font-semibold">{activeScan.name}</h2>
              <p className="mt-1 text-xs text-slate-500">{activeScan.size} · {readableDate(activeScan.scannedAt)}</p>
              <div className="mb-2 mt-5 flex items-center justify-between text-sm">
                <span>AI Threat Score (Demo)</span>
                <strong className="tabular-nums">{activeScan.score}%</strong>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full transition-[width] duration-1500 ease-out ${activeScan.verdict === 'Malicious' ? 'bg-rose-500' : 'bg-[#7cb5bd]'}`} style={{ width: `${animatedScore}%` }} />
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">Higher scores represent greater predicted likelihood of the malicious class. These example scores are not real model outputs.</p>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                <span className="text-slate-500">AI model</span>
                <strong>XGBoost (planned)</strong>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-slate-500">Classification</span>
                <VerdictPill verdict={activeScan.verdict} />
              </div>
            </Panel>

            <Panel className="bg-[#eaf5f6]">
              <h2 className="mb-2 flex items-center gap-2 font-semibold"><Info size={18} /> What does this mean?</h2>
              <p className="text-sm leading-6 text-slate-700">{activeScan.explanation}</p>
              <p className="mt-3 text-xs font-semibold leading-5 text-[#286e79]">This is not a real malware verdict. Even a real benign prediction is not proof of safety.</p>
            </Panel>

            <button type="button" onClick={() => goTo('scan')} className="flex w-full items-center justify-center gap-2 bg-[#eaf5f6] border px-4 py-3 font-semibold text-slate-500">Scan another sample <ArrowRight size={17} /></button>
            <button type="button" onClick={() => goTo('history')} className="w-full border border-slate-200 bg-white px-4 py-3 font-semibold text-[#276f7d]">View scan history</button>
          </>}

          {page === 'history' && <>
            <div>
              <h1 className="text-2xl font-bold">Scan History</h1>
              <p className="mt-1 text-sm text-slate-500">Previous demonstrations on this device. No real files have been scanned.</p>
            </div>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
              <Search size={18} className="text-slate-400" />
              <input aria-label="Search scan history" className="w-full bg-transparent text-sm outline-none" placeholder="Search scanned filenames..." value={search} onChange={event => setSearch(event.target.value)} />
            </label>
            <div className="grid grid-cols-3 gap-2" aria-label="Filter scan history">
              {(['All', 'Malicious', 'Benign'] as const).map(option => (
                <button type="button" key={option} onClick={() => setFilter(option)} aria-pressed={filter === option}
                  className={`border px-2 py-2.5 text-xs font-semibold ${filter === option ? 'border-[#276f7d] bg-[#e7f4f5] text-[#205e6a]' : 'border-slate-200 bg-white text-slate-600'}`}>{option}</button>
              ))}
            </div>
            <Panel className="p-2">
              {filteredHistory.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <History size={28} className="mx-auto text-slate-400" />
                  <p className="mt-2 text-sm font-semibold">No matching scans</p>
                  <p className="mt-1 text-xs text-slate-500">Complete a demo scan or change your search.</p>
                </div>
              ) : filteredHistory.map(item => (
                <button type="button" key={item.id} onClick={() => openScan(item)} className="flex w-full items-center gap-2 border-b border-slate-100 px-2 py-3 text-left last:border-b-0">
                  <FileCode2 size={20} className="shrink-0 text-slate-500" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{item.name}</span>
                    <span className="text-xs text-slate-500">{readableDate(item.scannedAt)}</span>
                  </span>
                  <VerdictPill verdict={item.verdict} />
                  <ChevronRight size={16} className="shrink-0 text-slate-400" />
                </button>
              ))}
            </Panel>
            <p className="text-center text-xs text-slate-500">History is stored in this browser only for the prototype.</p>
          </>}

          {page === 'settings' && <>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="mt-1 text-sm text-slate-500">Application information and demonstration controls.</p>
            </div>
            <Panel>
              <div className="flex items-center gap-3">
                <ShieldCheck size={30} className="text-[#276f7d]" />
                <div>
                  <p className="font-semibold">SHREDR AI Mobile</p>
                  <p className="text-xs text-slate-500">Single-user mobile prototype</p>
                </div>
              </div>
            </Panel>
            <Panel>
              <h2 className="mb-3 flex items-center gap-2 font-semibold"><Server size={18} /> AI server connection</h2>
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-800"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Not connected — demo mode</div>
              <p className="mt-2 text-sm leading-6 text-slate-600">Future integration: mobile app → API/orchestration service → Python feature extraction and XGBoost model → classification returned to the app.</p>
            </Panel>
            <Panel>
              <h2 className="mb-2 font-semibold">How the finished app will work</h2>
              <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600">
                <li>Choose a server-hosted sample or upload an executable.</li>
                <li>Server performs static analysis without executing the file.</li>
                <li>Trained model returns a prediction and a threat score.</li>
                <li>View the result and revisit it in scan history.</li>
              </ol>
            </Panel>
            <Panel>
              <h2 className="mb-2 font-semibold">Prototype limitations</h2>
              <p className="text-sm leading-6 text-slate-600">No uploads, real malware detection, live progress, user accounts or server storage. All results are fictional. Demo history is stored only in this browser.</p>
            </Panel>
            <button type="button" onClick={() => { setHistory([]); setActiveScan(null); setSelectedId(demoSamples[0].id); setFilter('All'); goTo('home'); }} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-[#276f7d]"><RotateCcw size={17} /> Clear demo history</button>
          </>}
        </main>

        <nav aria-label="Main navigation" className="z-10 grid shrink-0 grid-cols-4 border-t border-slate-200 bg-white px-1 pb-[max(12px,env(safe-area-inset-bottom))] pt-2">
          {navigation.map(item => {
            const Icon = item.icon;
            const current = page === item.id || ((page === 'analysing' || page === 'result') && item.id === 'scan');
            return (
              <button type="button" key={item.id} onClick={() => goTo(item.id)} aria-current={current ? 'page' : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold ${current ? 'bg-[#e7f4f5] text-[#276f7d]' : 'text-slate-500'}`}>
                <Icon size={20} /><span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        {/* Already scanned toast */}
        {toast && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-24 left-1/2 z-50 w-[90%] max-w-sm -translate-x-1/2 rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={22}
                className="shrink-0 text-amber-600"
              />

              <div className="flex-1">
                <p className="font-semibold text-amber-900">
                  Already Scanned
                </p>

                <p className="mt-1 text-sm text-amber-800">
                  {toast}
                </p>

                <p className="mt-1 text-xs text-amber-700">
                  View the existing result in Scan History.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setToast('')}
                aria-label="Dismiss notification"
                className="text-amber-700 hover:text-amber-900"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        
      </div>
    </div>
  );
}
