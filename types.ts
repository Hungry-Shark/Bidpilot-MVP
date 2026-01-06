export interface LogEntry {
  id: number;
  agent: 'Historian' | 'Gatekeeper' | 'Architect' | 'Quant' | 'Auditor' | 'System';
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'thinking';
}

export interface Constraint {
  id: string;
  label: string;
  value: string;
  type: 'text' | 'number';
}

export interface Document {
  id: number;
  name: string;
  size: string;
  date: string;
  tags: string[];
  type: 'pdf' | 'docx' | 'xlsx';
  status: 'indexed' | 'pending' | 'error';
}

export interface SimulationState {
  isActive: boolean;
  currentAgent: string | null;
  progress: number;
  verdict: 'pending' | 'go' | 'no-go';
}
