import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  FileText,
  CheckCircle2,
  XCircle,
  Settings,
  Terminal,
  Activity,
  ChevronRight,
  BrainCircuit,
  FileSpreadsheet,
  AlertTriangle,
  Play,
  LayoutDashboard,
  Database,
  PenTool,
  Code,
  Search,
  Cpu,
  MoreHorizontal,
  Plus,
  ArrowUpRight,
  Command,
  Clock,
  User,
  Trash2,
  Upload,
  Save,
  Moon,
  Sun,
  Download,
  Printer
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LogEntry, SimulationState, Document, Constraint } from './types';
import { INITIAL_CONSTRAINTS, MOCK_KNOWLEDGE_BASE, MOCK_RFP_CONTENT } from './constants';
import * as GeminiService from './services/geminiService';
import { GridScan } from './GridScan';

// --- Reusable Shadcn-like Components ---

interface ButtonProps {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "outline" | "destructive";
  size?: "default" | "sm" | "icon";
  className?: string;
  onClick?: (e?: any) => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = "primary", 
  size = "default", 
  className = "", 
  onClick, 
  disabled 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95";
  
  const variants = {
    primary: "bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 shadow-md hover:shadow-lg dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90",
    secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800/80",
    ghost: "hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
    outline: "border border-zinc-200 bg-white hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
    destructive: "bg-red-500 text-zinc-50 hover:bg-red-500/90",
  };

  const sizes = {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
    icon: "h-9 w-9",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

interface CardProps {
  children?: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = "default" }: { children?: React.ReactNode, variant?: string }) => {
  const styles: Record<string, string> = {
    default: "border-transparent bg-zinc-900 text-zinc-50 hover:bg-zinc-900/80 dark:bg-zinc-50 dark:text-zinc-900",
    secondary: "border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80 dark:bg-zinc-800 dark:text-zinc-50",
    outline: "text-zinc-950 border-zinc-200 dark:text-zinc-50 dark:border-zinc-800",
    destructive: "border-transparent bg-red-500 text-zinc-50 hover:bg-red-500/80",
    success: "border-transparent bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:bg-emerald-500/20 dark:text-emerald-400",
    warning: "border-transparent bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:bg-amber-500/20 dark:text-amber-400",
    error: "border-transparent bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 dark:bg-rose-500/20 dark:text-rose-400",
    thinking: "border-transparent bg-violet-500/15 text-violet-700 animate-pulse dark:bg-violet-500/20 dark:text-violet-400",
  };

  return (
    <div className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 ${styles[variant] || styles.default}`}>
      {children}
    </div>
  );
};

// --- Main App ---

export default function BidPilotApp() {
  const [view, setView] = useState<'dashboard' | 'setup' | 'analysis' | 'knowledge' | 'draft'>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // App State
  const [documents, setDocuments] = useState<Document[]>(MOCK_KNOWLEDGE_BASE);
  const [constraints, setConstraints] = useState<Constraint[]>(INITIAL_CONSTRAINTS);
  const [rfpInput, setRfpInput] = useState(MOCK_RFP_CONTENT);
  
  // Simulation State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [simState, setSimState] = useState<SimulationState>({
    isActive: false,
    currentAgent: null,
    progress: 0,
    verdict: 'pending'
  });
  const [draftContent, setDraftContent] = useState("");
  const [gatekeeperReasoning, setGatekeeperReasoning] = useState("");
  const logsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (view === 'analysis') {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, view]);

  // Dark Mode Toggle with Radial Transition from Bottom Left
  const toggleDarkMode = () => {
    const isDark = !isDarkMode;
    
    // @ts-ignore - View Transition API
    if (!document.startViewTransition) {
      setIsDarkMode(isDark);
      if (isDark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      return;
    }

    // Origin: Bottom Left corner
    const x = 0;
    const y = window.innerHeight;
    
    // Calculate distance to furthest corner (Top Right)
    const endRadius = Math.hypot(window.innerWidth, window.innerHeight);

    // @ts-ignore
    const transition = document.startViewTransition(() => {
      setIsDarkMode(isDark);
      if (isDark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 800, // Slower for "smooth gradient" feel
          easing: "cubic-bezier(0.25, 1, 0.5, 1)", // Smooth ease out
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  const addLog = (agent: LogEntry['agent'], message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Date.now(),
      agent,
      message,
      timestamp: new Date().toLocaleTimeString().split(' ')[0],
      type
    }]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newDoc: Document = {
      id: Date.now(),
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      tags: ["New", "Pending"],
      type: file.name.endsWith('xlsx') ? 'xlsx' : 'pdf',
      status: 'pending'
    };

    setDocuments(prev => [newDoc, ...prev]);
    addLog('System', `Queued ${file.name} for indexing in next analysis.`, 'info');
  };

  const handleExport = (type: 'pdf' | 'txt') => {
    if (type === 'pdf') {
       window.print(); 
    } else {
       const element = document.createElement("a");
       const file = new Blob([draftContent || "No content generated yet."], {type: 'text/plain'});
       element.href = URL.createObjectURL(file);
       element.download = "BidPilot_Proposal_Draft.txt";
       document.body.appendChild(element);
       element.click();
       document.body.removeChild(element);
    }
    addLog('System', `Exported proposal as ${type.toUpperCase()}`, 'success');
  };

  const runSimulation = async () => {
    if (simState.isActive) return;
    
    setView('analysis');
    setSimState({ isActive: true, currentAgent: 'Historian', progress: 0, verdict: 'pending' });
    setLogs([]);
    setDraftContent("");
    setGatekeeperReasoning("");

    addLog('System', 'Initializing Agent Swarm...', 'info');
    await new Promise(r => setTimeout(r, 800));
    
    const latestDoc = documents[0];
    
    addLog('Historian', `Scanning Knowledge Base (${documents.length} documents)...`, 'thinking');
    
    if (latestDoc.status === 'pending') {
        addLog('Historian', `Detecting new file: ${latestDoc.name}`, 'info');
        setDocuments(prev => prev.map(d => d.id === latestDoc.id ? { ...d, status: 'indexed', tags: d.tags.filter(t => t !== 'Pending') } : d));
    }

    setSimState(prev => ({ ...prev, currentAgent: 'Historian', progress: 10 }));
    
    const histMsg = await GeminiService.runHistorianAgent(latestDoc.name);
    addLog('Historian', histMsg, 'success');
    addLog('Historian', 'Context vector database updated.', 'info');
    await new Promise(r => setTimeout(r, 1000));

    addLog('Gatekeeper', 'Analyzing RFP against Deal Breaker constraints...', 'thinking');
    setSimState(prev => ({ ...prev, currentAgent: 'Gatekeeper', progress: 30 }));
    
    const gkResult = await GeminiService.runGatekeeperAgent(rfpInput, constraints);
    
    setGatekeeperReasoning(gkResult.reasoning);
    
    if (gkResult.verdict === 'NO-GO') {
        addLog('Gatekeeper', 'CRITICAL STOP: No-Go signal triggered.', 'error');
        addLog('Gatekeeper', gkResult.reasoning, 'info');
        setSimState(prev => ({ ...prev, isActive: false, currentAgent: null, verdict: 'no-go' }));
        return;
    }

    addLog('Gatekeeper', `Verdict: ${gkResult.verdict}. Proceeding to drafting.`, 'success');
    setSimState(prev => ({ ...prev, verdict: 'go', progress: 50 }));
    await new Promise(r => setTimeout(r, 1000));

    setSimState(prev => ({ ...prev, currentAgent: 'Quant', progress: 65 }));
    addLog('Quant', 'Detected Security Requirements section.', 'info');
    addLog('Quant', 'Generating Python script validation logic...', 'thinking');
    const pythonCode = await GeminiService.runQuantAgent("Encryption Standards");
    addLog('Quant', `Generated Validator:\n${pythonCode}`, 'info');
    addLog('Quant', 'Compliance checks passed.', 'success');
    await new Promise(r => setTimeout(r, 1000));

    setSimState(prev => ({ ...prev, currentAgent: 'Architect', progress: 85 }));
    addLog('Architect', 'Synthesizing "Executive Summary" based on Winning DNA...', 'thinking');
    const draft = await GeminiService.runArchitectAgent(rfpInput);
    setDraftContent(draft);
    addLog('Architect', 'Draft generation complete. Handing off to Auditor.', 'success');
    
    setSimState(prev => ({ ...prev, currentAgent: 'Auditor', progress: 95 }));
    await new Promise(r => setTimeout(r, 800));
    addLog('Auditor', 'Verifying font compliance (Arial 11pt)... OK', 'success');
    addLog('Auditor', 'Checking page limit constraints... OK', 'success');

    setSimState(prev => ({ ...prev, isActive: false, currentAgent: null, progress: 100 }));
    addLog('System', 'Workflow Complete. Proposal ready for review.', 'success');
  };

  // --- Views ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight dark:text-zinc-50 drop-shadow-sm">Dashboard</h2>
        <div className="flex items-center space-x-2">
           <Button variant="outline" size="sm" className="hidden md:flex">
              <Clock className="mr-2 h-4 w-4" />
              History
           </Button>
           <Button onClick={() => setView('setup')} className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900">
              <Play className="mr-2 h-4 w-4" />
              New Analysis
           </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         <Card className="p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Win Rate</div>
              <Activity className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div className="text-2xl font-bold">42.5%</div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">+12% from last month</p>
         </Card>
         <Card className="p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Active Proposals</div>
              <FileText className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">3 due this week</p>
         </Card>
         <Card className="p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Time Saved</div>
              <Clock className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div className="text-2xl font-bold">124h</div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">This quarter</p>
         </Card>
         <Card className="p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Knowledge Base</div>
              <Database className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Indexed documents</p>
         </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <div className="p-6">
             <h3 className="text-lg font-medium leading-6 text-zinc-900 dark:text-zinc-50">Efficiency Metrics</h3>
             <p className="text-sm text-zinc-500 dark:text-zinc-400">Manual vs. Autonomous Proposal Generation</p>
             <div className="mt-6 h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Oct', manual: 400, ai: 40 },
                      { name: 'Nov', manual: 300, ai: 35 },
                      { name: 'Dec', manual: 500, ai: 50 },
                      { name: 'Jan', manual: 200, ai: 15 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#27272a" : "#e4e4e7"} />
                      <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}h`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: isDarkMode ? '#18181b' : '#fff', borderRadius: '8px', border: isDarkMode ? '1px solid #27272a' : '1px solid #e4e4e7' }}
                        itemStyle={{ color: isDarkMode ? '#fff' : '#09090b', fontSize: '12px' }}
                      />
                      <Bar dataKey="manual" fill={isDarkMode ? "#3f3f46" : "#e4e4e7"} radius={[4, 4, 0, 0]} name="Manual Hours" />
                      <Bar dataKey="ai" fill={isDarkMode ? "#fafafa" : "#18181b"} radius={[4, 4, 0, 0]} name="AI Hours" />
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
        </Card>
        <Card className="col-span-3 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-medium mb-1">Recent Activity</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Latest agent actions</p>
              <div className="space-y-4">
                 {[1,2,3].map(i => (
                   <div key={i} className="flex items-start space-x-3 pb-3 border-b border-zinc-50 dark:border-zinc-800 last:border-0">
                      <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                        <BrainCircuit size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Analyzed Project {i}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">2 hours ago</p>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4">View All Logs</Button>
        </Card>
      </div>
    </div>
  );

  const renderSetup = () => (
    <div className="space-y-6 animate-in max-w-4xl mx-auto">
      <div className="flex items-center space-x-2 mb-6">
        <Button variant="ghost" size="sm" onClick={() => setView('dashboard')}>
          <ChevronRight className="h-4 w-4 rotate-180 mr-1" /> Back
        </Button>
        <h2 className="text-2xl font-bold tracking-tight dark:text-zinc-50">Setup New Analysis</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 md:col-span-2">
           <div className="flex justify-between items-center mb-4">
             <h3 className="font-semibold text-lg">1. Input RFP Content</h3>
             <Badge variant="outline">Text or Paste</Badge>
           </div>
           <textarea 
              className="w-full h-64 p-4 rounded-md border border-zinc-200 bg-zinc-50 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 transition-shadow focus:shadow-md"
              value={rfpInput}
              onChange={(e) => setRfpInput(e.target.value)}
              placeholder="Paste RFP content here..."
           />
        </Card>

        <Card className="p-6 md:col-span-2">
           <div className="flex justify-between items-center mb-4">
             <div>
               <h3 className="font-semibold text-lg">2. Deal Breakers & Acceptors</h3>
               <p className="text-sm text-zinc-500 dark:text-zinc-400">The Gatekeeper will reject the bid if these constraints are violated.</p>
             </div>
             <Button variant="outline" size="sm" onClick={() => {
                const newId = (constraints.length + 1).toString();
                setConstraints([...constraints, { id: newId, label: 'New Constraint', value: '', type: 'text' }]);
             }}>
               <Plus className="h-4 w-4 mr-2" /> Add
             </Button>
           </div>
           <div className="space-y-3">
             {constraints.map((c, idx) => (
               <div key={c.id} className="flex items-center space-x-3">
                  <div className="w-1/3">
                    <input 
                      type="text" 
                      value={c.label}
                      onChange={(e) => {
                        const newC = [...constraints];
                        newC[idx].label = e.target.value;
                        setConstraints(newC);
                      }}
                      className="w-full px-3 py-2 rounded-md border border-zinc-200 text-sm focus:outline-none focus:border-zinc-400 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300"
                    />
                  </div>
                  <div className="flex-1">
                    <input 
                      type="text" 
                      value={c.value}
                      onChange={(e) => {
                        const newC = [...constraints];
                        newC[idx].value = e.target.value;
                        setConstraints(newC);
                      }}
                      className="w-full px-3 py-2 rounded-md border border-zinc-200 text-sm focus:outline-none focus:border-zinc-400 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300"
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => {
                     setConstraints(constraints.filter(item => item.id !== c.id));
                  }}>
                    <Trash2 className="h-4 w-4 text-zinc-400 hover:text-red-500" />
                  </Button>
               </div>
             ))}
           </div>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <Button size="default" className="w-full md:w-auto px-8" onClick={runSimulation}>
           <Play className="h-4 w-4 mr-2" /> Start Autonomous Agents
        </Button>
      </div>
    </div>
  );

  const renderAnalysis = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)] animate-in">
      <div className="lg:col-span-2 flex flex-col rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl relative transition-all duration-300">
        
        {/* Grid Scan Background Effect */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-black">
            <GridScan
                linesColor="#2a2a2a"
                scanColor="#ffffff"
                lineThickness={1}
                sensitivity={0}
                scanOpacity={0.3}
                bloomIntensity={0.5}
                gridScale={0.1}
                scanDuration={3}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950 pointer-events-none" />
        </div>

        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4 py-3 relative z-10 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="ml-2 font-mono text-xs text-zinc-400">bidpilot-cli — node agent.js</span>
          </div>
          <div className="flex items-center space-x-2">
            {simState.isActive && <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />}
            <span className="text-xs text-zinc-500">{simState.isActive ? 'RUNNING' : 'IDLE'}</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs md:text-sm text-zinc-300 terminal-scroll relative z-10">
          {logs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-4 text-zinc-600">
              <Terminal className="h-12 w-12 opacity-50" />
              <p>Ready to initialize agent swarm...</p>
            </div>
          ) : (
            <div className="space-y-3">
               {logs.map((log) => (
                <div key={log.id} className="flex space-x-2">
                  <span className="shrink-0 text-zinc-600 select-none">[{log.timestamp}]</span>
                  <div className="flex-1 break-words">
                    <span className={`mr-2 font-bold ${
                       log.agent === 'Gatekeeper' ? 'text-rose-400' :
                       log.agent === 'Historian' ? 'text-amber-400' :
                       log.agent === 'Architect' ? 'text-blue-400' :
                       log.agent === 'Quant' ? 'text-violet-400' :
                       log.agent === 'Auditor' ? 'text-emerald-400' :
                       'text-zinc-400'
                    }`}>{log.agent}:</span>
                    <span className={
                       log.type === 'error' ? 'text-rose-400' : 
                       log.type === 'thinking' ? 'text-zinc-500 italic' : 
                       log.type === 'success' ? 'text-emerald-400' :
                       'text-zinc-300'
                    }>{log.message}</span>
                  </div>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col space-y-4">
         <Card className="p-6">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4 uppercase tracking-wider">Mission Control</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Agent Progress</span>
                  <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{simState.progress}%</span>
                </div>
                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-zinc-900 dark:bg-zinc-50 transition-all duration-500 ease-out" 
                    style={{ width: `${simState.progress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">Go/No-Go Verdict</span>
                  {simState.verdict === 'pending' && <Badge variant="secondary">Pending</Badge>}
                  {simState.verdict === 'go' && <Badge variant="success">GO</Badge>}
                  {simState.verdict === 'no-go' && <Badge variant="error">NO-GO</Badge>}
                </div>
                
                {/* Dynamic Verdict Card */}
                {gatekeeperReasoning && (
                  <div className={`rounded-md p-3 text-xs border transition-colors ${
                      simState.verdict === 'go' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/20 dark:border-emerald-900/30 dark:text-emerald-300' 
                        : simState.verdict === 'no-go'
                          ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-900/20 dark:border-rose-900/30 dark:text-rose-300'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400'
                  }`}>
                    <p className="font-semibold mb-1">Gatekeeper Reasoning:</p>
                    {gatekeeperReasoning}
                  </div>
                )}
              </div>
            </div>
         </Card>

         {draftContent && (
            <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center dark:bg-zinc-900 dark:border-zinc-800">
                 <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Draft Preview</h3>
                 <Button variant="ghost" size="sm" onClick={() => setView('draft')}>
                    Expand <ArrowUpRight className="ml-1 h-3 w-3" />
                 </Button>
              </div>
              <div className="p-4 flex-1 overflow-y-auto text-xs font-mono text-zinc-600 leading-relaxed dark:text-zinc-400">
                 {draftContent}
              </div>
            </Card>
         )}
      </div>
    </div>
  );

  const renderKnowledge = () => (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight dark:text-zinc-50">Knowledge Base</h2>
          <p className="text-zinc-500 text-sm dark:text-zinc-400">Manage indexed documents and data sources.</p>
        </div>
        <div>
           <input 
             type="file" 
             ref={fileInputRef} 
             className="hidden" 
             onChange={handleFileUpload}
           />
           <Button onClick={() => fileInputRef.current?.click()}>
             <Upload className="mr-2 h-4 w-4" />
             Add Source
           </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {documents.map(doc => (
           <Card key={doc.id} className="group hover:border-zinc-400 transition-colors cursor-pointer dark:hover:border-zinc-600">
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                   <div className="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                      {doc.type === 'pdf' ? <FileText size={20} /> : <FileSpreadsheet size={20} />}
                   </div>
                   <div className="flex -space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={14} /></Button>
                   </div>
                </div>
                <div>
                   <h4 className="font-semibold text-zinc-900 truncate dark:text-zinc-50">{doc.name}</h4>
                   <p className="text-xs text-zinc-500 mt-1 dark:text-zinc-400">{doc.size} • {doc.date}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2">
                   {doc.tags.map(tag => (
                     <span key={tag} className="px-2 py-0.5 rounded-full bg-zinc-50 border border-zinc-200 text-[10px] font-medium text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400">
                       {tag}
                     </span>
                   ))}
                </div>
                <div className="pt-2 flex items-center gap-2">
                   {doc.status === 'indexed' ? (
                     <Badge variant="success"><CheckCircle2 size={10} className="mr-1" /> Indexed</Badge>
                   ) : doc.status === 'pending' ? (
                      <Badge variant="thinking">Pending</Badge>
                   ) : (
                     <Badge variant="warning">Processing</Badge>
                   )}
                </div>
              </div>
           </Card>
         ))}
      </div>
    </div>
  );

  const renderDraft = () => (
    <div className="h-[calc(100vh-100px)] animate-in flex flex-col md:flex-row gap-6">
       <div className="flex-1 flex flex-col rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden dark:bg-zinc-950 dark:border-zinc-800">
         <div className="border-b border-zinc-200 bg-zinc-50/50 p-4 flex justify-between items-center dark:border-zinc-800 dark:bg-zinc-900">
             <div className="flex items-center space-x-2">
               <div className="h-8 w-8 rounded-md bg-zinc-900 text-white flex items-center justify-center dark:bg-zinc-50 dark:text-zinc-900">
                 <PenTool size={16} />
               </div>
               <div>
                 <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Proposal Draft</h3>
                 <p className="text-xs text-zinc-500 dark:text-zinc-400">Auto-generated by The Architect</p>
               </div>
             </div>
             <div className="flex space-x-2">
               <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                  <Printer className="h-4 w-4 mr-2" /> PDF
               </Button>
               <Button size="sm" onClick={() => handleExport('txt')}>
                  <Download className="h-4 w-4 mr-2" /> Download
               </Button>
             </div>
         </div>
         <div className="flex-1 p-8 overflow-y-auto bg-white dark:bg-zinc-950">
            <div className="max-w-3xl mx-auto">
               {draftContent ? (
                 <div className="prose prose-zinc prose-sm md:prose-base max-w-none dark:prose-invert">
                   <h1 className="text-zinc-900 dark:text-zinc-50">Executive Summary</h1>
                   <div className="whitespace-pre-wrap leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {draftContent}
                   </div>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center h-full text-zinc-400 py-20 dark:text-zinc-600">
                   <PenTool size={48} className="mb-4 opacity-20" />
                   <p className="text-sm">No draft content available.</p>
                   <Button variant="outline" className="mt-4" onClick={() => setView('dashboard')}>Return Home</Button>
                 </div>
               )}
            </div>
         </div>
       </div>

       <div className="w-80 hidden lg:flex flex-col gap-4">
          <Card className="p-4">
             <h4 className="font-semibold text-sm mb-3">AI Suggestions</h4>
             <div className="space-y-3">
               <div className="p-3 bg-zinc-50 rounded-md border border-zinc-100 text-xs text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400">
                  <p className="mb-1 font-medium text-zinc-900 dark:text-zinc-50">Tone Analysis</p>
                  The tone is professional but could be more persuasive in the "Solution" section.
               </div>
               <div className="p-3 bg-zinc-50 rounded-md border border-zinc-100 text-xs text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400">
                  <p className="mb-1 font-medium text-zinc-900 dark:text-zinc-50">Compliance</p>
                  ISO 27001 mentioned 3 times. Requirement met.
               </div>
             </div>
          </Card>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 font-sans flex flex-col md:flex-row dark:bg-zinc-950 dark:text-zinc-50">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-zinc-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 transition-colors z-20">
        <div className="p-6 flex items-center space-x-2">
           <div className="h-6 w-6 rounded bg-zinc-900 flex items-center justify-center dark:bg-zinc-50">
             <BrainCircuit className="text-white h-4 w-4 dark:text-zinc-900" />
           </div>
           <span className="font-bold text-lg tracking-tight">BidPilot</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <button 
             onClick={() => setView('dashboard')}
             className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${view === 'dashboard' ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <button 
             onClick={() => setView('analysis')}
             className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${view === 'analysis' ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'}`}
          >
            <Terminal size={18} />
            <span>Live Analysis</span>
          </button>
          <button 
             onClick={() => setView('knowledge')}
             className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${view === 'knowledge' ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'}`}
          >
            <Database size={18} />
            <span>Knowledge Base</span>
          </button>
          <button 
             onClick={() => setView('draft')}
             className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${view === 'draft' ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50'}`}
          >
            <PenTool size={18} />
            <span>Drafting Room</span>
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
           <div className="flex items-center justify-between">
             <div className="flex items-center space-x-3 px-2">
                <div className="h-8 w-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  JD
                </div>
                <div className="text-sm">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">John Doe</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Free Plan</p>
                </div>
             </div>
             
             {/* Dark Mode Toggle in Footer */}
             <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="rounded-full h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
               {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
             </Button>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:bg-zinc-950 dark:border-zinc-800">
           <div className="flex items-center space-x-2">
             <div className="h-6 w-6 rounded bg-zinc-900 flex items-center justify-center dark:bg-zinc-50">
               <BrainCircuit className="text-white h-4 w-4 dark:text-zinc-900" />
             </div>
             <span className="font-bold text-lg">BidPilot</span>
           </div>
           <Button variant="ghost" size="icon"><Settings size={20} /></Button>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8 relative z-10">
           <div className="mx-auto max-w-7xl">
              {view === 'dashboard' && renderDashboard()}
              {view === 'setup' && renderSetup()}
              {view === 'analysis' && renderAnalysis()}
              {view === 'knowledge' && renderKnowledge()}
              {view === 'draft' && renderDraft()}
           </div>
        </div>
      </main>
    </div>
  );
}