import { useUser } from '@clerk/react';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ExternalLink,
  History,
  Info,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Target,
  Timer as TimerIcon,
  Trash2,
  Trophy,
  UserRound,
  X,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'wouter';

type ViewId = 'timer' | 'history' | 'stats' | 'practice' | 'profile' | 'cubes' | 'competitions';
type SolveStatus = 'normal' | 'plus2' | 'dnf';

type Solve = {
  id: string;
  sessionId: string;
  timeMs: number;
  status: SolveStatus;
  scramble: string;
  createdAt: string;
};

type Session = { id: string; name: string; createdAt: string };
type Profile = {
  displayName: string;
  wcaId: string;
  country: string;
  favoriteEvent: string;
  goals: string;
};
type Cube = {
  id: string;
  name: string;
  puzzle: string;
  brand: string;
  size: string;
  setupNotes: string;
  current: boolean;
};
type Practice = {
  id: string;
  name: string;
  target: string;
  notes: string;
  solveCount: number;
  createdAt: string;
};
type Competition = {
  id: string;
  name: string;
  date: string;
  location: string;
  wcaId: string;
  events: string;
  round: string;
  singles: string;
  averages: string;
  placements: string;
  pbs: string;
  notes: string;
};
type CubingStore = {
  sessions: Session[];
  activeSessionId: string;
  solves: Solve[];
  profile: Profile;
  cubes: Cube[];
  practice: Practice[];
  competitions: Competition[];
};

const ink = '#182129';
const paper = '#f4f0e8';
const card = '#fbf8f2';
const coral = '#ff653f';
const lime = '#b8d94b';
const muted = '#667270';
const blankProfile: Profile = {
  displayName: '',
  wcaId: '',
  country: '',
  favoriteEvent: '3x3x3',
  goals: '',
};

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const defaultStore = (): CubingStore => {
  const id = makeId('session');
  return {
    sessions: [{ id, name: 'First session', createdAt: new Date().toISOString() }],
    activeSessionId: id,
    solves: [],
    profile: blankProfile,
    cubes: [],
    practice: [],
    competitions: [],
  };
};

const moves = ['R', 'L', 'U', 'D', 'F', 'B'];
const axis: Record<string, string> = { R: 'x', L: 'x', U: 'y', D: 'y', F: 'z', B: 'z' };
function generateScramble() {
  const result: string[] = [];
  let lastAxis = '';
  while (result.length < 20) {
    const face = moves[Math.floor(Math.random() * moves.length)];
    if (axis[face] === lastAxis) continue;
    lastAxis = axis[face];
    const suffix = ['', '', "'", '2'][Math.floor(Math.random() * 4)];
    result.push(`${face}${suffix}`);
  }
  return result.join(' ');
}

function formatTime(ms: number | null) {
  if (ms === null || !Number.isFinite(ms)) return 'DNF';
  const totalCentis = Math.round(ms / 10);
  const centis = totalCentis % 100;
  const totalSeconds = Math.floor(totalCentis / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  return minutes > 0
    ? `${minutes}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`
    : `${seconds}.${String(centis).padStart(2, '0')}`;
}

function effectiveTime(solve: Solve) {
  if (solve.status === 'dnf') return Infinity;
  return solve.timeMs + (solve.status === 'plus2' ? 2000 : 0);
}

function averageOf(solves: Solve[], count: number): number | null {
  if (solves.length < count) return null;
  const window = solves.slice(-count);
  const ranked = window.map(effectiveTime).sort((a, b) => a - b);
  if (ranked.filter(Number.isFinite).length < count - 1) return null;
  const trimmed = ranked.slice(1, -1);
  if (trimmed.some((time) => !Number.isFinite(time))) return null;
  return trimmed.reduce((sum, time) => sum + time, 0) / trimmed.length;
}

function bestSingle(solves: Solve[]) {
  const valid = solves.map(effectiveTime).filter(Number.isFinite);
  return valid.length ? Math.min(...valid) : null;
}

function statsFor(solves: Solve[]) {
  return {
    count: solves.length,
    best: bestSingle(solves),
    ao5: averageOf(solves, 5),
    ao12: averageOf(solves, 12),
    ao50: averageOf(solves, 50),
    ao100: averageOf(solves, 100),
  };
}

function useLocalCubing(userId?: string) {
  const storageKey = useMemo(() => `tnf-cubing-${userId || 'guest'}`, [userId]);
  const [data, setData] = useState<CubingStore>(() => defaultStore());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(false);
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as CubingStore;
        setData({
          ...defaultStore(),
          ...parsed,
          sessions: parsed.sessions?.length ? parsed.sessions : defaultStore().sessions,
          profile: { ...blankProfile, ...parsed.profile },
        });
      } else {
        setData(defaultStore());
      }
    } catch {
      setData(defaultStore());
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify(data));
  }, [data, hydrated, storageKey]);

  return [data, setData] as const;
}

function Panel({ children, className = '', accent = 'none' }: { children: React.ReactNode; className?: string; accent?: 'none' | 'coral' | 'lime' }) {
  const accentClass = accent === 'coral' ? 'border-l-[5px] border-l-[#ff653f]' : accent === 'lime' ? 'border-l-[5px] border-l-[#b8d94b]' : '';
  return <section className={`rounded-xl border-2 border-[#182129] bg-[#fbf8f2] ${accentClass} ${className}`}>{children}</section>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="nf-mono text-[10px] font-medium uppercase tracking-[.16em] text-[#ff653f]">{children}</div>;
}

function EmptyState({ icon: Icon, title, body, action }: { icon: React.ComponentType<{ size?: number }>; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#182129] bg-[#e7edc9] shadow-[4px_4px_0_#b8d94b]"><Icon size={21} /></div>
      <h3 className="nf-display mt-5 text-xl font-bold tracking-[-.04em]">{title}</h3>
      <p className="mt-2 max-w-[360px] text-sm leading-6 text-[#697574]">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function Field({ label, value, onChange, placeholder = '', type = 'text', textarea = false, testId }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; textarea?: boolean; testId: string }) {
  const common = {
    value,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value),
    placeholder,
    'data-testid': testId,
    className: 'mt-2 w-full rounded-lg border-2 border-[#c8c4bb] bg-[#f4f0e8] px-3 py-2.5 text-sm text-[#182129] outline-none transition-colors placeholder:text-[#89908b] focus:border-[#ff653f]',
  };
  return (
    <label className="block text-xs font-bold text-[#3d4a4a]">
      {label}
      {textarea ? <textarea {...common} rows={3} /> : <input {...common} type={type} />}
    </label>
  );
}

function ConfirmDialog({ label, onCancel, onConfirm }: { label: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#182129]/45 p-5" role="dialog" aria-modal="true" data-testid="dialog-confirm-delete">
      <div className="w-full max-w-[390px] rounded-xl border-2 border-[#182129] bg-[#fbf8f2] p-6 shadow-[7px_8px_0_#ff653f]">
        <div className="flex items-start justify-between gap-4">
          <div><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fff0eb] text-[#ff653f]"><AlertTriangle size={19} /></div><h2 className="nf-display mt-4 text-2xl font-bold tracking-[-.05em]">Remove this record?</h2></div>
          <button type="button" onClick={onCancel} className="rounded-md p-1 text-[#697574] hover:bg-[#e8e1d5]" aria-label="Close confirmation" data-testid="button-cancel-delete"><X size={18} /></button>
        </div>
        <p className="mt-3 text-sm leading-6 text-[#697574]"><strong className="text-[#182129]">{label}</strong> will be removed from this device. This cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2.5 text-sm font-bold hover:bg-[#e8e1d5]" data-testid="button-keep-record">Keep it</button>
          <button type="button" onClick={onConfirm} className="rounded-lg bg-[#ff653f] px-4 py-2.5 text-sm font-bold shadow-[3px_3px_0_#182129]" data-testid="button-confirm-delete">Remove</button>
        </div>
      </div>
    </div>
  );
}

function ScrambleTape({ scramble }: { scramble: string }) {
  return <div className="rounded-lg border border-[#c8c4bb] bg-[#e8e1d5] px-3 py-2.5 text-center nf-mono text-[11px] leading-5 text-[#3d4a4a]" data-testid="text-current-scramble">{scramble}</div>;
}

function TimerView({ data, setData, currentSolves, activeSession }: { data: CubingStore; setData: React.Dispatch<React.SetStateAction<CubingStore>>; currentSolves: Solve[]; activeSession?: Session }) {
  const [phase, setPhase] = useState<'idle' | 'inspection' | 'running'>('idle');
  const [tick, setTick] = useState(Date.now());
  const [scramble, setScramble] = useState(generateScramble);
  const [lastRecordedId, setLastRecordedId] = useState<string | null>(null);
  const inspectionRef = useRef(0);
  const timerRef = useRef(0);
  const currentTime = phase === 'running' ? tick - timerRef.current : 0;
  const inspectionLeft = Math.max(0, 15 - Math.floor((tick - inspectionRef.current) / 1000));

  const record = useCallback((timeMs: number) => {
    const solve: Solve = { id: makeId('solve'), sessionId: data.activeSessionId, timeMs, status: 'normal', scramble, createdAt: new Date().toISOString() };
    setData((current) => ({ ...current, solves: [...current.solves, solve] }));
    setLastRecordedId(solve.id);
    setScramble(generateScramble());
  }, [data.activeSessionId, scramble, setData]);

  const beginInspection = useCallback(() => {
    inspectionRef.current = Date.now();
    setTick(Date.now());
    setPhase('inspection');
  }, []);
  const beginTimer = useCallback(() => {
    timerRef.current = Date.now();
    setTick(timerRef.current);
    setPhase('running');
  }, []);
  const stopTimer = useCallback(() => {
    const elapsed = Date.now() - timerRef.current;
    setPhase('idle');
    record(elapsed);
  }, [record]);

  useEffect(() => {
    if (phase === 'idle') return;
    const interval = window.setInterval(() => {
      const now = Date.now();
      setTick(now);
      if (phase === 'inspection' && now - inspectionRef.current >= 15000) {
        timerRef.current = now;
        setPhase('running');
      }
    }, 40);
    return () => window.clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      event.preventDefault();
      if (phase === 'idle') beginInspection();
      else if (phase === 'inspection') beginTimer();
      else stopTimer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [beginInspection, beginTimer, phase, stopTimer]);

  const lastSolve = lastRecordedId ? data.solves.find((solve) => solve.id === lastRecordedId) : null;
  const updateLast = (status: SolveStatus) => {
    if (!lastRecordedId) return;
    setData((current) => ({ ...current, solves: current.solves.map((solve) => solve.id === lastRecordedId ? { ...solve, status } : solve) }));
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
      <Panel className="overflow-hidden" accent="coral">
        <div className="nf-grid relative px-5 py-5 sm:px-8 sm:py-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><SectionLabel>Timer / {activeSession?.name || 'Session'}</SectionLabel><h2 className="nf-display mt-2 text-3xl font-bold tracking-[-.06em]">One solve at a time.</h2></div>
            <div className="flex items-center gap-2 rounded-full border border-[#c8c4bb] bg-[#fbf8f2] px-3 py-1.5 nf-mono text-[9px] uppercase tracking-[.1em] text-[#697574]"><KeyboardGlyph /> space to control</div>
          </div>
          <div className="mx-auto mt-8 max-w-[650px]">
            <ScrambleTape scramble={scramble} />
            <div className="relative mt-5 flex min-h-[285px] flex-col items-center justify-center rounded-xl border-2 border-[#182129] bg-[#182129] px-4 text-[#f4f0e8] shadow-[7px_7px_0_#b8d94b]" data-testid="panel-timer">
              <div className="absolute left-4 top-4 nf-mono text-[9px] uppercase tracking-[.16em] text-[#9eaaa3]">{phase === 'inspection' ? 'inspection' : phase === 'running' ? 'timing' : 'ready'}</div>
              <div className={`nf-mono text-[clamp(4.3rem,12vw,8.5rem)] leading-none tracking-[-.08em] ${phase === 'inspection' ? 'text-[#ff653f]' : 'text-[#f4f0e8]'}`} data-testid="text-timer-value">
                {phase === 'inspection' ? inspectionLeft : formatTime(currentTime)}
              </div>
              <div className="mt-5 text-center text-xs text-[#9eaaa3]">{phase === 'idle' ? 'Press space or tap to inspect' : phase === 'inspection' ? 'Tap again to start the solve' : 'Press space or tap to stop'}</div>
              <button type="button" onClick={() => phase === 'idle' ? beginInspection() : phase === 'inspection' ? beginTimer() : stopTimer()} className="absolute inset-0 cursor-pointer rounded-xl focus:outline-none focus:ring-4 focus:ring-[#ff653f]/50" aria-label={phase === 'running' ? 'Stop timer' : 'Start timer'} data-testid="button-timer-surface" />
              <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 nf-mono text-[9px] uppercase tracking-[.1em] text-[#75837a]"><span className={`h-1.5 w-1.5 rounded-full ${phase === 'running' ? 'bg-[#ff653f]' : 'bg-[#b8d94b]'}`} /> {phase === 'running' ? 'recording' : 'local timer'}</div>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={() => { setPhase('idle'); setScramble(generateScramble()); }} className="flex items-center gap-2 rounded-lg border-2 border-[#182129] bg-[#f4f0e8] px-3 py-2 text-xs font-bold hover:bg-[#e7edc9]" data-testid="button-new-scramble"><RotateCcw size={14} /> New scramble</button>
              <span className="nf-mono text-[10px] uppercase tracking-[.1em] text-[#78827d]">{currentSolves.length} recorded this session</span>
            </div>
          </div>
        </div>
        {lastSolve && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-[#182129] bg-[#e7edc9] px-5 py-4 sm:px-8" data-testid="panel-last-solve">
            <div><div className="nf-mono text-[9px] uppercase tracking-[.14em] text-[#56652b]">last recorded</div><div className="nf-mono mt-1 text-2xl font-medium">{formatTime(effectiveTime(lastSolve))}</div></div>
            <div className="flex items-center gap-2"><span className="mr-1 text-xs font-bold text-[#56652b]">Mark:</span>{(['normal', 'plus2', 'dnf'] as SolveStatus[]).map((status) => <button type="button" key={status} onClick={() => updateLast(status)} className={`rounded-md border px-2.5 py-1.5 nf-mono text-[9px] uppercase tracking-[.06em] ${lastSolve.status === status ? 'border-[#182129] bg-[#182129] text-[#f4f0e8]' : 'border-[#aebb89] bg-[#f4f0e8] text-[#56652b]'}`} data-testid={`button-last-penalty-${status}`}>{status === 'plus2' ? '+2' : status.toUpperCase()}</button>)}</div>
          </div>
        )}
      </Panel>
      <div className="grid content-start gap-5">
        <Panel className="p-5" accent="lime">
          <SectionLabel>Session read</SectionLabel>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <Metric label="Best single" value={formatTime(bestSingle(currentSolves))} />
            <Metric label="Ao5" value={formatTime(averageOf(currentSolves, 5))} />
            <Metric label="Ao12" value={formatTime(averageOf(currentSolves, 12))} />
            <Metric label="Solves" value={String(currentSolves.length)} />
          </div>
          <p className="mt-5 border-t border-[#d7d2c8] pt-4 text-xs leading-5 text-[#697574]">DNF solves stay in the record. They are excluded from best single and trimmed under WCA-style averages.</p>
        </Panel>
        <Panel className="p-5">
          <div className="flex items-center gap-2 text-[#56652b]"><Info size={15} /><span className="nf-mono text-[9px] uppercase tracking-[.14em]">Timer notes</span></div>
          <ul className="mt-4 grid gap-2 text-xs leading-5 text-[#697574]"><li className="flex gap-2"><span className="text-[#ff653f]">01</span> Inspection gives you 15 seconds.</li><li className="flex gap-2"><span className="text-[#ff653f]">02</span> A solve saves locally as soon as you stop.</li><li className="flex gap-2"><span className="text-[#ff653f]">03</span> Use the penalty buttons on the latest solve.</li></ul>
        </Panel>
      </div>
    </div>
  );
}

function KeyboardGlyph() {
  return <span className="rounded border border-[#a9afa6] px-1.5 py-0.5 text-[8px] text-[#56652b]">SPACE</span>;
}

function Metric({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return <div><div className="text-xs text-[#697574]">{label}</div><div className={`nf-mono mt-1 text-2xl tracking-[-.06em] ${emphasis ? 'text-[#ff653f]' : 'text-[#182129]'}`} data-testid={`text-metric-${label.toLowerCase().replace(/\s+/g, '-')}`}>{value}</div></div>;
}

function SessionBar({ data, setData, onNewSession }: { data: CubingStore; setData: React.Dispatch<React.SetStateAction<CubingStore>>; onNewSession: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <select value={data.activeSessionId} onChange={(event) => setData((current) => ({ ...current, activeSessionId: event.target.value }))} className="appearance-none rounded-lg border-2 border-[#182129] bg-[#fbf8f2] py-2.5 pl-3 pr-9 text-xs font-bold outline-none focus:border-[#ff653f]" aria-label="Choose session" data-testid="select-active-session">
          {data.sessions.map((session) => <option value={session.id} key={session.id}>{session.name}</option>)}
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute right-3 top-3.5" />
      </div>
      <button type="button" onClick={onNewSession} className="flex items-center gap-1.5 rounded-lg border-2 border-[#182129] bg-[#b8d94b] px-3 py-2.5 text-xs font-bold shadow-[3px_3px_0_#182129] hover:-translate-y-0.5" data-testid="button-new-session"><Plus size={14} /> New session</button>
    </div>
  );
}

function HistoryView({ data, setData, solves, onConfirm }: { data: CubingStore; setData: React.Dispatch<React.SetStateAction<CubingStore>>; solves: Solve[]; onConfirm: (kind: 'solve' | 'session', id: string, label: string) => void }) {
  const [sessionHistoryOpen, setSessionHistoryOpen] = useState(false);
  const updateStatus = (id: string, status: SolveStatus) => setData((current) => ({ ...current, solves: current.solves.map((solve) => solve.id === id ? { ...solve, status } : solve) }));
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-[#182129] px-5 py-5 sm:px-7">
          <div><SectionLabel>Recorded work</SectionLabel><h2 className="nf-display mt-2 text-3xl font-bold tracking-[-.06em]">Solve history</h2><p className="mt-2 text-sm text-[#697574]">Only the current session is shown here.</p></div>
          <div className="nf-mono text-[10px] uppercase tracking-[.12em] text-[#78827d]" data-testid="text-history-count">{solves.length} solves</div>
        </div>
        {solves.length === 0 ? <EmptyState icon={History} title="The page is still clean." body="Start the timer and your first solve will land here with its scramble and timestamp." /> : (
          <div className="divide-y divide-[#d7d2c8]">
            {[...solves].reverse().map((solve, index) => (
              <div key={solve.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[42px_100px_1fr_auto] sm:items-center sm:px-7" data-testid={`row-solve-${solve.id}`}>
                <span className="nf-mono text-[10px] text-[#8a928b]">#{solves.length - index}</span>
                <div><div className={`nf-mono text-xl ${solve.status === 'dnf' ? 'text-[#ff653f]' : 'text-[#182129]'}`}>{formatTime(effectiveTime(solve))}</div><div className="nf-mono text-[8px] uppercase tracking-[.1em] text-[#8a928b]">{solve.status === 'plus2' ? 'penalty +2' : solve.status}</div></div>
                <div className="min-w-0"><div className="truncate nf-mono text-[10px] text-[#697574]" title={solve.scramble}>{solve.scramble}</div><div className="mt-1 text-[11px] text-[#8a928b]">{new Date(solve.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div></div>
                <div className="flex items-center gap-1">
                  {(['normal', 'plus2', 'dnf'] as SolveStatus[]).map((status) => <button type="button" key={status} onClick={() => updateStatus(solve.id, status)} className={`rounded px-2 py-1 nf-mono text-[8px] uppercase ${solve.status === status ? 'bg-[#182129] text-[#f4f0e8]' : 'bg-[#e8e1d5] text-[#697574] hover:bg-[#b8d94b]'}`} data-testid={`button-solve-${status}-${solve.id}`}>{status === 'plus2' ? '+2' : status}</button>)}
                  <button type="button" onClick={() => onConfirm('solve', solve.id, `Solve ${solves.length - index}`)} className="ml-1 rounded p-1.5 text-[#89908b] hover:bg-[#fff0eb] hover:text-[#ff653f]" aria-label="Delete solve" data-testid={`button-delete-solve-${solve.id}`}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
      <Panel className="p-5" accent="lime">
        <button type="button" onClick={() => setSessionHistoryOpen(!sessionHistoryOpen)} className="flex w-full items-center justify-between text-left" data-testid="button-toggle-session-history"><div><SectionLabel>Archive</SectionLabel><h3 className="nf-display mt-2 text-xl font-bold tracking-[-.04em]">Session history</h3></div><ChevronDown size={17} className={`transition-transform ${sessionHistoryOpen ? 'rotate-180' : ''}`} /></button>
        <p className="mt-3 text-xs leading-5 text-[#697574]">Sessions are local chapters. Switch above to revisit a set of solves.</p>
        {sessionHistoryOpen && <div className="mt-5 grid gap-2 border-t border-[#d7d2c8] pt-4">{data.sessions.map((session) => { const count = data.solves.filter((solve) => solve.sessionId === session.id).length; return <div key={session.id} className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${session.id === data.activeSessionId ? 'bg-[#e7edc9]' : 'bg-[#f4f0e8]'}`}><div><div className="text-xs font-bold">{session.name}</div><div className="nf-mono text-[9px] text-[#78827d]">{count} solves</div></div>{data.sessions.length > 1 && <button type="button" onClick={() => onConfirm('session', session.id, session.name)} className="rounded p-1 text-[#89908b] hover:text-[#ff653f]" aria-label={`Delete ${session.name}`} data-testid={`button-delete-session-${session.id}`}><Trash2 size={13} /></button>}</div>; })}</div>}
      </Panel>
    </div>
  );
}

function TrendChart({ solves }: { solves: Solve[] }) {
  const values = solves.slice(-20).map(effectiveTime).filter(Number.isFinite);
  if (!values.length) return <EmptyState icon={BarChart3} title="No trend yet." body="A few recorded solves will draw your line." />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const points = values.map((value, index) => `${(index / Math.max(1, values.length - 1)) * 100},${92 - ((value - min) / range) * 70}`).join(' ');
  return <div className="px-4 pb-4 pt-5" data-testid="chart-performance-trend"><svg viewBox="0 0 100 100" className="h-[205px] w-full overflow-visible" role="img" aria-label="Performance trend chart"><line x1="0" x2="100" y1="92" y2="92" stroke="#c8c4bb" strokeWidth=".6" /><line x1="0" x2="100" y1="57" y2="57" stroke="#d7d2c8" strokeWidth=".5" strokeDasharray="2 2" /><line x1="0" x2="100" y1="22" y2="22" stroke="#d7d2c8" strokeWidth=".5" strokeDasharray="2 2" /><polyline points={points} fill="none" stroke={coral} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />{values.map((value, index) => { const y = 92 - ((value - min) / range) * 70; const x = (index / Math.max(1, values.length - 1)) * 100; return <circle key={`${value}-${index}`} cx={x} cy={y} r="1.7" fill={lime} stroke={ink} strokeWidth=".7" />; })}</svg><div className="flex justify-between nf-mono text-[9px] uppercase tracking-[.1em] text-[#89908b]"><span>faster ↑</span><span>last {values.length} valid solves</span></div></div>;
}

function StatsView({ solves, allSolves }: { solves: Solve[]; allSolves: Solve[] }) {
  const stats = statsFor(solves);
  const lifetime = statsFor(allSolves);
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[['Best single', stats.best], ['Ao5', stats.ao5], ['Ao12', stats.ao12], ['Ao50', stats.ao50], ['Ao100', stats.ao100]].map(([label, value], index) => <Panel key={label as string} className={`p-5 ${index === 0 ? 'bg-[#182129] text-[#f4f0e8]' : ''}`} accent={index === 0 ? 'coral' : 'none'}><div className={`nf-mono text-[9px] uppercase tracking-[.14em] ${index === 0 ? 'text-[#ff9b82]' : 'text-[#78827d]'}`}>{label as string}</div><div className={`nf-mono mt-7 text-3xl tracking-[-.08em] ${index === 0 ? 'text-[#f4f0e8]' : 'text-[#182129]'}`} data-testid={`text-stat-${String(label).replace(/\W/g, '').toLowerCase()}`}>{formatTime(value as number | null)}</div><div className={`mt-2 text-xs ${index === 0 ? 'text-[#9eaaa3]' : 'text-[#89908b]'}`}>{value === null ? `Need ${String(label).replace('Ao', '')} solves` : index === 0 ? 'current session' : 'trimmed average'}</div></Panel>)}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <Panel className="overflow-hidden"><div className="border-b-2 border-[#182129] px-5 py-5 sm:px-7"><SectionLabel>Performance line</SectionLabel><h2 className="nf-display mt-2 text-2xl font-bold tracking-[-.05em]">The shape of this session</h2></div><TrendChart solves={solves} /></Panel>
        <Panel className="p-5" accent="lime"><SectionLabel>Personal bests</SectionLabel><h3 className="nf-display mt-2 text-2xl font-bold tracking-[-.05em]">Small records count.</h3><div className="mt-6 grid gap-4 border-t border-[#d7d2c8] pt-4"><Metric label="Lifetime best single" value={formatTime(lifetime.best)} emphasis /><Metric label="Lifetime solves" value={String(allSolves.length)} /><Metric label="Current session" value={String(solves.length)} /></div><p className="mt-6 text-xs leading-5 text-[#697574]">Personal bests are calculated from every local session on this account. No cloud sync, no leaderboard.</p></Panel>
      </div>
      <Panel className="p-5"><div className="flex items-center gap-2"><Info size={15} className="text-[#ff653f]" /><p className="text-xs leading-5 text-[#697574]"><strong className="text-[#182129]">How averages work.</strong> Each window uses its newest solves, removes the fastest and slowest result, and averages the middle. One DNF is trimmed as the worst result; two or more make that average DNF. +2 is counted as two seconds added.</p></div></Panel>
    </div>
  );
}

function PracticeView({ data, setData, onConfirm }: { data: CubingStore; setData: React.Dispatch<React.SetStateAction<CubingStore>>; onConfirm: (kind: 'practice', id: string, label: string) => void }) {
  const [draft, setDraft] = useState({ name: '', target: '', notes: '' });
  const addPractice = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    setData((current) => ({ ...current, practice: [{ id: makeId('practice'), ...draft, solveCount: 0, createdAt: new Date().toISOString() }, ...current.practice] }));
    setDraft({ name: '', target: '', notes: '' });
  };
  const increment = (id: string, amount: number) => setData((current) => ({ ...current, practice: current.practice.map((item) => item.id === id ? { ...item, solveCount: Math.max(0, item.solveCount + amount) } : item) }));
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
      <div className="grid gap-4">{data.practice.length === 0 ? <Panel><EmptyState icon={Target} title="Give the next block a shape." body="Practice sessions keep a target and a note beside the solve count. They are separate from your timer sessions." /></Panel> : data.practice.map((item) => <Panel key={item.id} className="p-5" accent="lime"><div className="flex items-start justify-between gap-4"><div><SectionLabel>Practice block</SectionLabel><h3 className="nf-display mt-2 text-2xl font-bold tracking-[-.05em]">{item.name}</h3></div><button type="button" onClick={() => onConfirm('practice', item.id, item.name)} className="rounded p-1.5 text-[#89908b] hover:bg-[#fff0eb] hover:text-[#ff653f]" aria-label={`Delete ${item.name}`} data-testid={`button-delete-practice-${item.id}`}><Trash2 size={15} /></button></div><div className="mt-5 grid gap-4 border-t border-[#d7d2c8] pt-4 sm:grid-cols-[1fr_130px]"><div><div className="nf-mono text-[9px] uppercase tracking-[.12em] text-[#78827d]">Target</div><p className="mt-1 text-sm">{item.target || 'No target set.'}</p><div className="mt-4 nf-mono text-[9px] uppercase tracking-[.12em] text-[#78827d]">Notes</div><p className="mt-1 text-sm leading-5 text-[#697574]">{item.notes || 'No notes yet.'}</p></div><div className="rounded-lg bg-[#e7edc9] p-4 text-center"><div className="nf-mono text-3xl">{item.solveCount}</div><div className="nf-mono text-[8px] uppercase tracking-[.1em] text-[#56652b]">solves</div><div className="mt-3 flex justify-center gap-1"><button type="button" onClick={() => increment(item.id, -1)} className="rounded border border-[#aebb89] px-2 py-1 text-sm" data-testid={`button-decrement-practice-${item.id}`}>−</button><button type="button" onClick={() => increment(item.id, 1)} className="rounded border border-[#182129] bg-[#182129] px-2 py-1 text-sm text-[#f4f0e8]" data-testid={`button-increment-practice-${item.id}`}>+</button></div></div></div></Panel>)}</div>
      <Panel className="p-5" accent="coral"><SectionLabel>New practice block</SectionLabel><h2 className="nf-display mt-2 text-2xl font-bold tracking-[-.05em]">Make the rep useful.</h2><form onSubmit={addPractice} className="mt-6 grid gap-4"><Field label="Name" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} placeholder="Cross + first pair" testId="input-practice-name" /><Field label="Target" value={draft.target} onChange={(value) => setDraft({ ...draft, target: value })} placeholder="Keep inspection under 8s" testId="input-practice-target" /><Field label="Notes" value={draft.notes} onChange={(value) => setDraft({ ...draft, notes: value })} placeholder="What are you watching for?" textarea testId="input-practice-notes" /><button type="submit" className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-[#ff653f] px-4 py-3 text-sm font-bold shadow-[4px_4px_0_#182129] hover:-translate-y-0.5" data-testid="button-save-practice"><Plus size={16} /> Add practice block</button></form></Panel>
    </div>
  );
}

function ProfileView({ data, setData }: { data: CubingStore; setData: React.Dispatch<React.SetStateAction<CubingStore>> }) {
  const [draft, setDraft] = useState(data.profile);
  useEffect(() => setDraft(data.profile), [data.profile]);
  const save = (event: React.FormEvent) => { event.preventDefault(); setData((current) => ({ ...current, profile: draft })); };
  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]"><Panel className="p-5 sm:p-7" accent="coral"><SectionLabel>Identity / local profile</SectionLabel><h2 className="nf-display mt-2 text-3xl font-bold tracking-[-.06em]">Your cubing profile</h2><p className="mt-2 max-w-[550px] text-sm leading-6 text-[#697574]">A foundation for the competitor you are becoming. WCA details are optional and stay on this device.</p><form onSubmit={save} className="mt-8 grid gap-5 sm:grid-cols-2"><Field label="Display name" value={draft.displayName} onChange={(value) => setDraft({ ...draft, displayName: value })} placeholder="How should the bench call you?" testId="input-profile-name" /><Field label="WCA ID" value={draft.wcaId} onChange={(value) => setDraft({ ...draft, wcaId: value.toUpperCase() })} placeholder="2024XXXXXX" testId="input-profile-wca-id" /><Field label="Home country" value={draft.country} onChange={(value) => setDraft({ ...draft, country: value })} placeholder="Country or region" testId="input-profile-country" /><label className="block text-xs font-bold text-[#3d4a4a]">Favorite event<select value={draft.favoriteEvent} onChange={(event) => setDraft({ ...draft, favoriteEvent: event.target.value })} className="mt-2 w-full rounded-lg border-2 border-[#c8c4bb] bg-[#f4f0e8] px-3 py-2.5 text-sm outline-none focus:border-[#ff653f]" data-testid="select-profile-event"><option>3x3x3</option><option>2x2x2</option><option>4x4x4</option><option>5x5x5</option><option>OH</option><option>Clock</option><option>Megaminx</option></select></label><div className="sm:col-span-2"><Field label="Goals" value={draft.goals} onChange={(value) => setDraft({ ...draft, goals: value })} placeholder="Sub-25 consistency; attend a local comp" textarea testId="input-profile-goals" /></div><div className="sm:col-span-2"><button type="submit" className="flex items-center gap-2 rounded-lg bg-[#182129] px-4 py-3 text-sm font-bold text-[#f4f0e8] shadow-[4px_4px_0_#b8d94b] hover:-translate-y-0.5" data-testid="button-save-profile"><Save size={16} /> Save profile</button></div></form></Panel><Panel className="relative overflow-hidden bg-[#182129] p-6 text-[#f4f0e8]" accent="lime"><div className="absolute -right-10 -top-10 h-32 w-32 rounded-full border-[18px] border-[#ff653f]/30" /><UserRound size={22} className="text-[#b8d94b]" /><div className="relative mt-12"><div className="nf-mono text-[9px] uppercase tracking-[.14em] text-[#9eaaa3]">profile card</div><h3 className="nf-display mt-3 text-3xl font-bold tracking-[-.06em]">{data.profile.displayName || 'Unnamed cuber'}</h3><p className="mt-2 text-sm text-[#bfc8bd]">{data.profile.favoriteEvent} · {data.profile.country || 'Country not set'}</p>{data.profile.wcaId && <p className="mt-5 nf-mono text-[10px] text-[#ff9b82]">{data.profile.wcaId}</p>}<div className="mt-8 border-t border-[#364449] pt-4 text-xs leading-5 text-[#bfc8bd]">{data.profile.goals || 'Write down the thing you want your next season to prove.'}</div></div></Panel></div>;
}

function CubeModal({ initial, onClose, onSave }: { initial?: Cube; onClose: () => void; onSave: (cube: Cube) => void }) {
  const [draft, setDraft] = useState<Cube>(initial || { id: makeId('cube'), name: '', puzzle: '3x3x3', brand: '', size: '56mm', setupNotes: '', current: false });
  const update = (key: keyof Cube, value: string | boolean) => setDraft((current) => ({ ...current, [key]: value }));
  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#182129]/45 p-5" role="dialog" aria-modal="true" data-testid="dialog-cube"><div className="my-8 w-full max-w-[580px] rounded-xl border-2 border-[#182129] bg-[#fbf8f2] p-6 shadow-[7px_8px_0_#b8d94b]"><div className="flex items-start justify-between"><div><SectionLabel>Cube collection</SectionLabel><h2 className="nf-display mt-2 text-2xl font-bold tracking-[-.05em]">{initial ? 'Edit cube' : 'Add a cube'}</h2></div><button type="button" onClick={onClose} aria-label="Close cube form" className="rounded p-1 hover:bg-[#e8e1d5]" data-testid="button-close-cube"><X size={18} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Name" value={draft.name} onChange={(value) => update('name', value)} placeholder="Main 3x3" testId="input-cube-name" /><Field label="Puzzle" value={draft.puzzle} onChange={(value) => update('puzzle', value)} placeholder="3x3x3" testId="input-cube-puzzle" /><Field label="Brand / model" value={draft.brand} onChange={(value) => update('brand', value)} placeholder="Tornado V3 Pioneer" testId="input-cube-brand" /><Field label="Size" value={draft.size} onChange={(value) => update('size', value)} placeholder="56mm" testId="input-cube-size" /><div className="sm:col-span-2"><Field label="Setup notes" value={draft.setupNotes} onChange={(value) => update('setupNotes', value)} placeholder="Lubes, magnets, feel, tension..." textarea testId="input-cube-notes" /></div><label className="flex items-center gap-3 text-sm font-bold sm:col-span-2"><input type="checkbox" checked={draft.current} onChange={(event) => update('current', event.target.checked)} className="h-4 w-4 accent-[#ff653f]" data-testid="checkbox-cube-current" /> This is my current main</label></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-bold hover:bg-[#e8e1d5]" data-testid="button-cancel-cube">Cancel</button><button type="button" onClick={() => draft.name.trim() && onSave(draft)} className="flex items-center gap-2 rounded-lg bg-[#ff653f] px-4 py-2.5 text-sm font-bold shadow-[3px_3px_0_#182129]" data-testid="button-save-cube"><Save size={15} /> Save cube</button></div></div></div>;
}

function CubesView({ data, setData, onConfirm }: { data: CubingStore; setData: React.Dispatch<React.SetStateAction<CubingStore>>; onConfirm: (kind: 'cube', id: string, label: string) => void }) {
  const [editing, setEditing] = useState<Cube | undefined>();
  const saveCube = (cube: Cube) => { setData((current) => ({ ...current, cubes: [...current.cubes.filter((item) => item.id !== cube.id).map((item) => cube.current ? { ...item, current: false } : item), cube] })); setEditing(undefined); };
  return <div className="grid gap-5"><div className="flex flex-wrap items-end justify-between gap-4"><div><SectionLabel>Objects in rotation</SectionLabel><h2 className="nf-display mt-2 text-3xl font-bold tracking-[-.06em]">Cube collection</h2><p className="mt-2 text-sm text-[#697574]">Keep the hardware notes close to the times.</p></div><button type="button" onClick={() => setEditing({ id: makeId('cube'), name: '', puzzle: '3x3x3', brand: '', size: '56mm', setupNotes: '', current: false })} className="flex items-center gap-2 rounded-lg bg-[#182129] px-4 py-3 text-sm font-bold text-[#f4f0e8] shadow-[4px_4px_0_#b8d94b] hover:-translate-y-0.5" data-testid="button-add-cube"><Plus size={16} /> Add cube</button></div>{data.cubes.length === 0 ? <Panel><EmptyState icon={BoxesIcon} title="No cubes on the bench." body="Add the puzzle you actually reach for. Setup notes are useful when the feel changes." action={<button type="button" onClick={() => setEditing({ id: makeId('cube'), name: '', puzzle: '3x3x3', brand: '', size: '56mm', setupNotes: '', current: false })} className="rounded-lg bg-[#b8d94b] px-4 py-2.5 text-sm font-bold shadow-[3px_3px_0_#182129]" data-testid="button-empty-add-cube">Add your first cube</button>} /></Panel> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.cubes.map((cube) => <Panel key={cube.id} className={`p-5 ${cube.current ? 'bg-[#e7edc9]' : ''}`} accent={cube.current ? 'lime' : 'none'}><div className="flex items-start justify-between gap-2"><div className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-[#182129] bg-[#ff653f] nf-mono text-xs font-bold text-[#182129]">{cube.puzzle.split('x')[0]}</div><div className="flex gap-1"><button type="button" onClick={() => setEditing(cube)} className="rounded p-1.5 text-[#697574] hover:bg-[#f4f0e8] hover:text-[#182129]" aria-label={`Edit ${cube.name}`} data-testid={`button-edit-cube-${cube.id}`}><Pencil size={14} /></button><button type="button" onClick={() => onConfirm('cube', cube.id, cube.name)} className="rounded p-1.5 text-[#697574] hover:bg-[#fff0eb] hover:text-[#ff653f]" aria-label={`Delete ${cube.name}`} data-testid={`button-delete-cube-${cube.id}`}><Trash2 size={14} /></button></div></div><div className="mt-6 flex items-center gap-2">{cube.current && <span className="rounded-full bg-[#b8d94b] px-2 py-1 nf-mono text-[8px] font-bold uppercase tracking-[.1em]">current</span>}<span className="nf-mono text-[9px] uppercase tracking-[.12em] text-[#78827d]">{cube.puzzle} · {cube.size}</span></div><h3 className="nf-display mt-2 text-2xl font-bold tracking-[-.05em]">{cube.name}</h3><p className="mt-1 text-sm text-[#697574]">{cube.brand || 'Brand not noted'}</p><p className="mt-5 border-t border-[#d7d2c8] pt-4 text-xs leading-5 text-[#697574]">{cube.setupNotes || 'No setup notes yet.'}</p></Panel>)}</div>}{editing && <CubeModal initial={editing.name ? editing : undefined} onClose={() => setEditing(undefined)} onSave={saveCube} />}</div>;
}

function BoxesIcon({ size = 21 }: { size?: number }) {
  return <span className="nf-mono text-xl" style={{ fontSize: size }}>3×3</span>;
}

function CompetitionModal({ initial, onClose, onSave }: { initial?: Competition; onClose: () => void; onSave: (competition: Competition) => void }) {
  const [draft, setDraft] = useState<Competition>(initial || { id: makeId('competition'), name: '', date: new Date().toISOString().slice(0, 10), location: '', wcaId: '', events: '', round: '', singles: '', averages: '', placements: '', pbs: '', notes: '' });
  const update = (key: keyof Competition, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#182129]/45 p-5" role="dialog" aria-modal="true" data-testid="dialog-competition"><div className="my-8 w-full max-w-[680px] rounded-xl border-2 border-[#182129] bg-[#fbf8f2] p-6 shadow-[7px_8px_0_#ff653f]"><div className="flex items-start justify-between"><div><SectionLabel>Attended in person</SectionLabel><h2 className="nf-display mt-2 text-2xl font-bold tracking-[-.05em]">{initial ? 'Edit competition' : 'Log a competition'}</h2><p className="mt-2 text-xs text-[#697574]">This is your real attendance record, not a simulated result.</p></div><button type="button" onClick={onClose} aria-label="Close competition form" className="rounded p-1 hover:bg-[#e8e1d5]" data-testid="button-close-competition"><X size={18} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Competition name" value={draft.name} onChange={(value) => update('name', value)} placeholder="River City Spring 2025" testId="input-competition-name" /><Field label="Date" value={draft.date} onChange={(value) => update('date', value)} type="date" testId="input-competition-date" /><Field label="Location / venue" value={draft.location} onChange={(value) => update('location', value)} placeholder="Community hall, city" testId="input-competition-location" /><Field label="WCA ID or link (optional)" value={draft.wcaId} onChange={(value) => update('wcaId', value)} placeholder="2025RIVE01 or https://..." testId="input-competition-wca" /><Field label="Events competed in" value={draft.events} onChange={(value) => update('events', value)} placeholder="3x3, 2x2, OH" testId="input-competition-events" /><Field label="Round reached" value={draft.round} onChange={(value) => update('round', value)} placeholder="Final, semifinal, round 1" testId="input-competition-round" /><Field label="Official singles" value={draft.singles} onChange={(value) => update('singles', value)} placeholder="3x3 24.18 · 2x2 6.40" testId="input-competition-singles" /><Field label="Official averages" value={draft.averages} onChange={(value) => update('averages', value)} placeholder="3x3 Ao5 27.91" testId="input-competition-averages" /><Field label="Placements" value={draft.placements} onChange={(value) => update('placements', value)} placeholder="3x3 18th / 42" testId="input-competition-placements" /><Field label="PBs set" value={draft.pbs} onChange={(value) => update('pbs', value)} placeholder="3x3 single" testId="input-competition-pbs" /><div className="sm:col-span-2"><Field label="Notes" value={draft.notes} onChange={(value) => update('notes', value)} placeholder="What do you want to remember?" textarea testId="input-competition-notes" /></div></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-bold hover:bg-[#e8e1d5]" data-testid="button-cancel-competition">Cancel</button><button type="button" onClick={() => draft.name.trim() && onSave(draft)} className="flex items-center gap-2 rounded-lg bg-[#ff653f] px-4 py-2.5 text-sm font-bold shadow-[3px_3px_0_#182129]" data-testid="button-save-competition"><Save size={15} /> Save attendance</button></div></div></div>;
}

function CompetitionsView({ data, setData, onConfirm }: { data: CubingStore; setData: React.Dispatch<React.SetStateAction<CubingStore>>; onConfirm: (kind: 'competition', id: string, label: string) => void }) {
  const [editing, setEditing] = useState<Competition | undefined>();
  const blankCompetition = () => setEditing({ id: makeId('competition'), name: '', date: new Date().toISOString().slice(0, 10), location: '', wcaId: '', events: '', round: '', singles: '', averages: '', placements: '', pbs: '', notes: '' });
  const saveCompetition = (competition: Competition) => { setData((current) => ({ ...current, competitions: [competition, ...current.competitions.filter((item) => item.id !== competition.id)] })); setEditing(undefined); };
  return <div className="grid gap-5"><div className="flex flex-wrap items-end justify-between gap-4"><div><SectionLabel>Real-world record</SectionLabel><h2 className="nf-display mt-2 text-3xl font-bold tracking-[-.06em]">Competition logbook</h2><p className="mt-2 max-w-[620px] text-sm leading-6 text-[#697574]">A trustworthy list of rooms you actually entered. Keep official results here; practice mode stays on the bench.</p></div><button type="button" onClick={blankCompetition} className="flex items-center gap-2 rounded-lg bg-[#ff653f] px-4 py-3 text-sm font-bold shadow-[4px_4px_0_#182129] hover:-translate-y-0.5" data-testid="button-add-competition"><Plus size={16} /> Log competition</button></div>{data.competitions.length === 0 ? <Panel><EmptyState icon={Trophy} title="Your logbook has no entries." body="After you attend a meet, record what happened while the details are still fresh." action={<button type="button" onClick={blankCompetition} className="rounded-lg bg-[#b8d94b] px-4 py-2.5 text-sm font-bold shadow-[3px_3px_0_#182129]" data-testid="button-empty-add-competition">Log your first competition</button>} /></Panel> : <div className="grid gap-4">{[...data.competitions].sort((a, b) => b.date.localeCompare(a.date)).map((competition) => <Panel key={competition.id} className="overflow-hidden" accent="coral"><div className="grid gap-5 p-5 sm:grid-cols-[1fr_1.3fr_auto] sm:p-7"><div><div className="flex items-center gap-2 nf-mono text-[9px] uppercase tracking-[.13em] text-[#ff653f]"><CalendarDays size={13} /> {competition.date ? new Date(`${competition.date}T12:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date not set'}</div><h3 className="nf-display mt-3 text-2xl font-bold tracking-[-.05em]">{competition.name}</h3><div className="mt-2 flex items-center gap-1.5 text-xs text-[#697574]"><MapPin size={13} /> {competition.location || 'Venue not noted'}</div>{competition.wcaId && (competition.wcaId.startsWith('http') ? <a href={competition.wcaId} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 nf-mono text-[9px] text-[#ff653f] hover:underline" data-testid={`link-competition-wca-${competition.id}`}>WCA listing <ExternalLink size={11} /></a> : <div className="mt-3 nf-mono text-[9px] text-[#ff653f]">{competition.wcaId}</div>)}</div><div className="grid content-start gap-4 sm:grid-cols-2"><InfoPair label="Events" value={competition.events} /><InfoPair label="Round reached" value={competition.round} /><InfoPair label="Official singles" value={competition.singles} /><InfoPair label="Official averages" value={competition.averages} /><InfoPair label="Placements" value={competition.placements} /><InfoPair label="PBs set" value={competition.pbs} /></div><div className="flex gap-1 sm:flex-col sm:items-end"><button type="button" onClick={() => setEditing(competition)} className="rounded-lg border border-[#c8c4bb] p-2 text-[#697574] hover:bg-[#e7edc9] hover:text-[#182129]" aria-label={`Edit ${competition.name}`} data-testid={`button-edit-competition-${competition.id}`}><Pencil size={15} /></button><button type="button" onClick={() => onConfirm('competition', competition.id, competition.name)} className="rounded-lg border border-[#c8c4bb] p-2 text-[#697574] hover:bg-[#fff0eb] hover:text-[#ff653f]" aria-label={`Delete ${competition.name}`} data-testid={`button-delete-competition-${competition.id}`}><Trash2 size={15} /></button></div></div>{competition.notes && <div className="border-t border-[#d7d2c8] bg-[#f4f0e8] px-5 py-3 text-xs leading-5 text-[#697574] sm:px-7"><strong className="text-[#182129]">Notes:</strong> {competition.notes}</div>}</Panel>)}</div>}{editing && <CompetitionModal initial={editing.name ? editing : undefined} onClose={() => setEditing(undefined)} onSave={saveCompetition} />}</div>;
}

function InfoPair({ label, value }: { label: string; value: string }) {
  return <div><div className="nf-mono text-[8px] uppercase tracking-[.12em] text-[#89908b]">{label}</div><div className="mt-1 text-xs leading-5 text-[#3d4a4a]">{value || '—'}</div></div>;
}

export default function CubingPage() {
  const { user } = useUser();
  const [data, setData] = useLocalCubing(user?.id);
  const [view, setView] = useState<ViewId>('timer');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sessionModal, setSessionModal] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [confirmation, setConfirmation] = useState<{ kind: 'solve' | 'session' | 'practice' | 'cube' | 'competition'; id: string; label: string } | null>(null);
  const activeSession = data.sessions.find((session) => session.id === data.activeSessionId) || data.sessions[0];
  const currentSolves = useMemo(() => data.solves.filter((solve) => solve.sessionId === data.activeSessionId), [data.solves, data.activeSessionId]);
  const navItems: { id: ViewId; label: string; icon: React.ComponentType<{ size?: number }>; short: string }[] = [
    { id: 'timer', label: 'Timer', short: 'Timer', icon: TimerIcon },
    { id: 'history', label: 'Solve history', short: 'History', icon: History },
    { id: 'stats', label: 'Statistics', short: 'Stats', icon: BarChart3 },
    { id: 'practice', label: 'Practice', short: 'Practice', icon: Target },
    { id: 'profile', label: 'Cubing profile', short: 'Profile', icon: UserRound },
    { id: 'cubes', label: 'Cube collection', short: 'Cubes', icon: BoxesIcon },
    { id: 'competitions', label: 'Competition logbook', short: 'Logbook', icon: Trophy },
  ];

  const createSession = (event: React.FormEvent) => {
    event.preventDefault();
    if (!sessionName.trim()) return;
    const session: Session = { id: makeId('session'), name: sessionName.trim(), createdAt: new Date().toISOString() };
    setData((current) => ({ ...current, sessions: [...current.sessions, session], activeSessionId: session.id }));
    setSessionName('');
    setSessionModal(false);
  };
  const confirmDelete = () => {
    if (!confirmation) return;
    const { kind, id } = confirmation;
    setData((current) => {
      if (kind === 'solve') return { ...current, solves: current.solves.filter((item) => item.id !== id) };
      if (kind === 'practice') return { ...current, practice: current.practice.filter((item) => item.id !== id) };
      if (kind === 'cube') return { ...current, cubes: current.cubes.filter((item) => item.id !== id) };
      if (kind === 'competition') return { ...current, competitions: current.competitions.filter((item) => item.id !== id) };
      if (current.sessions.length <= 1) return current;
      const sessions = current.sessions.filter((item) => item.id !== id);
      const nextActive = current.activeSessionId === id ? sessions[0].id : current.activeSessionId;
      return { ...current, sessions, activeSessionId: nextActive, solves: current.solves.filter((item) => item.sessionId !== id) };
    });
    setConfirmation(null);
  };
  const title = navItems.find((item) => item.id === view)?.label || 'Timer';

  return (
    <div className="nf-noise min-h-[100dvh] bg-[#f4f0e8] text-[#182129]">
      <div className="flex min-h-[100dvh]">
        <aside className={`fixed inset-y-0 left-0 z-40 flex w-[270px] flex-col bg-[#182129] px-5 py-6 text-[#f4f0e8] transition-transform duration-300 lg:relative lg:translate-x-0 ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#b8d94b] text-[#182129] shadow-[3px_3px_0_#ff653f]"><span className="nf-display text-lg font-bold">N</span></div><div className="nf-display text-sm font-bold tracking-[-.04em]">THE NERD<br /><span className="text-[#ff653f]">FOUNDRY</span></div></div><button type="button" onClick={() => setMobileNavOpen(false)} className="rounded p-1 text-[#9eaaa3] lg:hidden" aria-label="Close navigation" data-testid="button-close-cubing-navigation"><X size={18} /></button></div>
          <div className="mt-12"><div className="nf-mono text-[9px] uppercase tracking-[.18em] text-[#75837a]">discipline / 03</div><div className="mt-2 flex items-center gap-2 text-[#b8d94b]"><Zap size={15} /><span className="nf-display text-lg font-bold">Cubing workbench</span></div></div>
          <nav className="mt-8 grid gap-1" aria-label="Cubing views">{navItems.map((item) => { const Icon = item.icon; return <button type="button" key={item.id} onClick={() => { setView(item.id); setMobileNavOpen(false); }} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-bold transition-colors ${view === item.id ? 'bg-[#2b383c] text-[#f4f0e8] shadow-[inset_3px_0_#ff653f]' : 'text-[#aebbb1] hover:bg-[#222e32] hover:text-[#f4f0e8]'}`} data-testid={`button-cubing-nav-${item.id}`}><Icon size={17} />{item.label}</button>; })}</nav>
          <div className="mt-auto rounded-xl border border-[#364449] bg-[#202c30] p-4"><div className="nf-mono text-[9px] uppercase tracking-[.13em] text-[#b8d94b]">local first</div><p className="mt-3 text-xs leading-5 text-[#c0c9c0]">Your solves, notes, cubes, and competition records stay in this browser.</p><div className="mt-4 flex items-center gap-2 nf-mono text-[9px] text-[#75837a]"><span className="h-1.5 w-1.5 rounded-full bg-[#b8d94b]" /> {user?.id ? 'account scoped' : 'guest bench'}</div></div>
        </aside>
        {mobileNavOpen && <button type="button" onClick={() => setMobileNavOpen(false)} className="fixed inset-0 z-30 bg-[#182129]/40 lg:hidden" aria-label="Close navigation overlay" data-testid="button-cubing-nav-overlay" />}
        <div className="min-w-0 flex-1">
           <header className="flex min-h-[76px] items-center justify-between border-b border-[#d5d0c7] px-5 sm:px-8 lg:px-10"><div className="flex items-center gap-3"><button type="button" onClick={() => setMobileNavOpen(true)} className="rounded-lg p-2 lg:hidden" aria-label="Open cubing navigation" data-testid="button-open-cubing-navigation"><span className="nf-mono text-xs">N/F</span></button><Link href="/dashboard" className="hidden items-center gap-2 text-xs font-bold text-[#697574] transition-colors hover:text-[#ff653f] sm:flex" data-testid="link-cubing-workbench"><span className="h-2 w-2 rounded-full bg-[#ff653f]" /> Workbench</Link><div className="hidden items-center gap-2 sm:flex"><span className="h-2 w-px bg-[#d5d0c7]" /><span className="nf-mono text-[9px] uppercase tracking-[.14em] text-[#78827d]">practice desk / {title}</span></div></div><div className="ml-auto flex items-center gap-3"><div className="hidden text-right sm:block"><div className="text-xs font-bold">{data.profile.displayName || user?.firstName || 'Cuber'}</div><div className="nf-mono text-[9px] uppercase tracking-[.11em] text-[#78827d]">{data.solves.length} total solves</div></div><Link href="/settings" className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#182129] bg-[#ff653f] text-xs font-bold transition-transform hover:rotate-6" data-testid="link-cubing-account">{(data.profile.displayName?.[0] || user?.firstName?.[0] || 'C').toUpperCase()}</Link></div></header>
          <main className="mx-auto max-w-[1420px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-11">
            <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end"><div><div className="nf-mono text-[10px] uppercase tracking-[.2em] text-[#ff653f]">the focused desk</div><h1 className="nf-display mt-3 text-[clamp(2.6rem,5vw,4.5rem)] font-bold leading-[.9] tracking-[-.075em]" data-testid="heading-cubing-view">{title}</h1><p className="mt-4 max-w-[610px] text-sm leading-6 text-[#697574]">A timer that gets out of the way, useful trends after the session, and a record of the rooms you actually showed up for.</p></div>{(view === 'timer' || view === 'history' || view === 'stats') && <SessionBar data={data} setData={setData} onNewSession={() => setSessionModal(true)} />}</div>
            <div className="mt-8 flex gap-2 overflow-x-auto border-b-2 border-[#182129] pb-2 lg:hidden">{navItems.map((item) => <button type="button" key={item.id} onClick={() => setView(item.id)} className={`shrink-0 rounded-md px-3 py-2 nf-mono text-[9px] uppercase tracking-[.08em] ${view === item.id ? 'bg-[#182129] text-[#f4f0e8]' : 'bg-[#e8e1d5] text-[#697574]'}`} data-testid={`button-mobile-tab-${item.id}`}>{item.short}</button>)}</div>
            <div className="mt-8">{view === 'timer' && <TimerView data={data} setData={setData} currentSolves={currentSolves} activeSession={activeSession} />}{view === 'history' && <HistoryView data={data} setData={setData} solves={currentSolves} onConfirm={(kind, id, label) => setConfirmation({ kind, id, label })} />}{view === 'stats' && <StatsView solves={currentSolves} allSolves={data.solves} />}{view === 'practice' && <PracticeView data={data} setData={setData} onConfirm={(kind, id, label) => setConfirmation({ kind, id, label })} />}{view === 'profile' && <ProfileView data={data} setData={setData} />}{view === 'cubes' && <CubesView data={data} setData={setData} onConfirm={(kind, id, label) => setConfirmation({ kind, id, label })} />}{view === 'competitions' && <CompetitionsView data={data} setData={setData} onConfirm={(kind, id, label) => setConfirmation({ kind, id, label })} />}</div>
          </main>
        </div>
      </div>
      {sessionModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#182129]/45 p-5" role="dialog" aria-modal="true" data-testid="dialog-new-session"><form onSubmit={createSession} className="w-full max-w-[410px] rounded-xl border-2 border-[#182129] bg-[#fbf8f2] p-6 shadow-[7px_8px_0_#b8d94b]"><div className="flex items-start justify-between"><div><SectionLabel>Timer archive</SectionLabel><h2 className="nf-display mt-2 text-2xl font-bold tracking-[-.05em]">Name this session</h2></div><button type="button" onClick={() => setSessionModal(false)} aria-label="Close new session" className="rounded p-1 hover:bg-[#e8e1d5]" data-testid="button-close-session"><X size={18} /></button></div><div className="mt-6"><Field label="Session name" value={sessionName} onChange={setSessionName} placeholder="Tuesday evening, lookahead" testId="input-session-name" /></div><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setSessionModal(false)} className="rounded-lg px-4 py-2.5 text-sm font-bold hover:bg-[#e8e1d5]" data-testid="button-cancel-session">Cancel</button><button type="submit" className="rounded-lg bg-[#ff653f] px-4 py-2.5 text-sm font-bold shadow-[3px_3px_0_#182129]" data-testid="button-save-session">Create session</button></div></form></div>}
      {confirmation && <ConfirmDialog label={confirmation.label} onCancel={() => setConfirmation(null)} onConfirm={confirmDelete} />}
    </div>
  );
}