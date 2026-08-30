import { useEffect, useRef, useState } from 'react';
import { type ReactNode } from 'react';
import { ClerkProvider, SignIn, SignUp, UserProfile, useAuth, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  ChevronRight,
  Gamepad2,
  Hexagon,
  LayoutDashboard,
  LogOut,
  Menu,
  Orbit,
  Palette,
  Settings,
  Sparkles,
  Swords,
  Terminal,
  X,
  Zap,
} from 'lucide-react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  Redirect,
  Route,
  Link,
  Switch,
  Router as WouterRouter,
  useLocation,
} from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import {
  EmptyModuleMark,
  HorizonModules,
  MemberSignal,
  WorkbenchModuleRail,
  WORKBENCH_MODULES,
  type WorkbenchModule,
} from '@/components/workbench-system';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3" data-testid="brand-nerd-foundry">
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#182129] text-[#f4f0e8] shadow-[4px_4px_0_#b8d94b]">
        <span className="absolute inset-[8px] rounded-[5px] border-2 border-[#b8d94b]" />
        <span className="relative text-[17px] font-bold leading-none text-[#ff653f]">N</span>
      </span>
      {!compact && (
        <span className="nf-display text-[15px] font-bold tracking-[-.04em] text-[#182129]">
          THE NERD <span className="text-[#ff653f]">FOUNDRY</span>
        </span>
      )}
    </span>
  );
}

function PublicNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-[1280px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
      <Link href="/" className="shrink-0" data-testid="link-home-brand">
        <BrandMark />
      </Link>
      <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
        <a href="#disciplines" className="text-[13px] font-semibold text-[#4b5758] transition-colors hover:text-[#ff653f]" data-testid="link-disciplines">Disciplines</a>
        <a href="#manifesto" className="text-[13px] font-semibold text-[#4b5758] transition-colors hover:text-[#ff653f]" data-testid="link-manifesto">Why we gather</a>
        <a href="#field-notes" className="text-[13px] font-semibold text-[#4b5758] transition-colors hover:text-[#ff653f]" data-testid="link-field-notes">Field notes</a>
      </nav>
      <div className="hidden items-center gap-2 md:flex">
        <Link href="/sign-in" className="rounded-lg px-4 py-2.5 text-[13px] font-bold text-[#182129] transition-colors hover:bg-[#e8e1d5]" data-testid="link-sign-in">Sign in</Link>
        <Link href="/sign-up" className="group flex items-center gap-2 rounded-lg bg-[#182129] px-4 py-2.5 text-[13px] font-bold text-[#f4f0e8] shadow-[4px_4px_0_#ff653f] transition-all hover:-translate-y-0.5 hover:shadow-[5px_6px_0_#b8d94b]" data-testid="link-join-header">
          Join the clubhouse <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <button type="button" className="rounded-lg p-2 text-[#182129] md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu" data-testid="button-toggle-menu">
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
      {open && (
        <div className="absolute left-5 right-5 top-[72px] rounded-2xl border border-[#c8c4bb] bg-[#f8f5ef] p-4 shadow-[0_18px_40px_rgba(24,33,41,.15)] md:hidden">
          <div className="grid gap-1">
            <a href="#disciplines" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-[#e8e1d5]" data-testid="mobile-link-disciplines">Disciplines</a>
            <a href="#manifesto" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-[#e8e1d5]" data-testid="mobile-link-manifesto">Why we gather</a>
            <a href="#field-notes" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-[#e8e1d5]" data-testid="mobile-link-notes">Field notes</a>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#d7d2c8] pt-3">
              <Link href="/sign-in" className="rounded-lg px-3 py-3 text-center text-sm font-bold" data-testid="mobile-link-sign-in">Sign in</Link>
              <Link href="/sign-up" className="rounded-lg bg-[#182129] px-3 py-3 text-center text-sm font-bold text-[#f4f0e8]" data-testid="mobile-link-sign-up">Join free</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function OrbitalFoundry() {
  return (
    <div className="relative mx-auto h-[390px] w-full max-w-[540px] animate-drift sm:h-[490px]" aria-label="A diagram of connected curiosities" data-testid="visual-orbital-foundry">
      <div className="absolute inset-[12%] rounded-full border border-[#182129]/20" />
      <div className="absolute inset-[22%] rounded-full border border-dashed border-[#182129]/25" />
      <div className="absolute inset-[33%] rounded-full border-2 border-[#ff653f]/35" />
      <div className="absolute left-1/2 top-1/2 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 rotate-3 items-center justify-center rounded-[33%] bg-[#182129] shadow-[12px_14px_0_#b8d94b] sm:h-44 sm:w-44">
        <div className="absolute inset-4 rounded-[24%] border border-[#f4f0e8]/30" />
        <div className="text-center">
          <div className="nf-mono text-[10px] uppercase tracking-[.25em] text-[#b8d94b]">est. 2024</div>
          <div className="nf-display mt-2 text-4xl font-bold tracking-[-.1em] text-[#f4f0e8]">N/F</div>
          <div className="nf-mono mt-1 text-[9px] uppercase tracking-[.17em] text-[#ff653f]">curiosity engine</div>
        </div>
      </div>
      <OrbitNode icon={<Swords size={20} />} label="D&D" className="left-[5%] top-[29%] -rotate-6" accent="coral" />
      <OrbitNode icon={<Hexagon size={20} />} label="MTG" className="right-[3%] top-[15%] rotate-6" accent="lime" />
      <OrbitNode icon={<Gamepad2 size={20} />} label="PLAY" className="bottom-[14%] left-[5%] rotate-3" accent="lime" />
      <OrbitNode icon={<Terminal size={20} />} label="MAKE" className="bottom-[6%] right-[5%] -rotate-6" accent="coral" />
      <div className="absolute left-[15%] top-[9%] h-2.5 w-2.5 rounded-full bg-[#ff653f] shadow-[0_0_0_7px_rgba(255,101,63,.15)]" />
      <div className="absolute bottom-[24%] right-[18%] h-2.5 w-2.5 rounded-full bg-[#b8d94b] shadow-[0_0_0_7px_rgba(184,217,75,.2)]" />
    </div>
  );
}

function OrbitNode({ icon, label, className, accent }: { icon: ReactNode; label: string; className: string; accent: 'coral' | 'lime' }) {
  return (
    <div className={`absolute flex items-center gap-2 rounded-xl border-2 border-[#182129] bg-[#f8f5ef] px-3 py-2.5 shadow-[4px_5px_0_#182129] ${className}`} data-testid={`orbital-node-${label.toLowerCase()}`}>
      <span className={accent === 'coral' ? 'text-[#ff653f]' : 'text-[#7d9c22]'}>{icon}</span>
      <span className="nf-mono text-[10px] font-bold tracking-[.13em] text-[#182129]">{label}</span>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="nf-noise overflow-hidden bg-[#f4f0e8] text-[#182129]">
      <PublicNav />
      <main>
        <section className="relative mx-auto grid min-h-[680px] w-full max-w-[1280px] items-center gap-5 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.03fr_.97fr] lg:px-12 lg:pb-28 lg:pt-20">
          <div className="relative z-10 max-w-[680px]">
            <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-[#bfc5ac] bg-[#e8edcf] px-3 py-1.5 nf-mono text-[10px] font-medium uppercase tracking-[.14em] text-[#46571e]" data-testid="badge-welcome">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff653f]" /> a clubhouse for going deep
            </div>
            <h1 className="nf-display animate-rise delay-1 mt-7 max-w-[680px] text-[clamp(3.9rem,9vw,7.5rem)] font-bold leading-[.86] text-[#182129]" data-testid="heading-hero">
              Stay curious.<br /><span className="text-[#ff653f]">Make weird</span><br /><span className="nf-outline-text">things.</span>
            </h1>
            <p className="animate-rise delay-2 mt-8 max-w-[480px] text-base leading-7 text-[#526060] sm:text-lg">
              The Nerd Foundry is a home base for people who read the footnotes, learn one more technique, and happily lose an afternoon to a new obsession.
            </p>
            <div className="animate-rise delay-3 mt-9 flex flex-wrap items-center gap-4">
              <Link href="/sign-up" className="group flex items-center gap-3 rounded-lg bg-[#ff653f] px-5 py-3.5 text-sm font-bold text-[#182129] shadow-[5px_6px_0_#182129] transition-all hover:-translate-y-1 hover:shadow-[6px_8px_0_#182129]" data-testid="link-hero-join">
                Enter the foundry <ArrowDownRight size={17} className="transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
              </Link>
              <a href="#manifesto" className="group flex items-center gap-2 px-1 py-3 text-sm font-bold text-[#182129]" data-testid="link-hero-explore">
                See how it works <span className="border-b-2 border-[#b8d94b] pb-0.5 transition-colors group-hover:border-[#ff653f]">take a look</span>
              </a>
            </div>
            <div className="animate-rise delay-4 mt-14 flex items-center gap-4">
              <div className="flex -space-x-2" aria-label="Member avatars">
                {['AM', 'RJ', 'KT', 'ZS'].map((initials, index) => (
                  <span key={initials} className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#f4f0e8] text-[9px] font-bold ${index % 2 ? 'bg-[#b8d94b] text-[#182129]' : 'bg-[#182129] text-[#f4f0e8]'}`} data-testid={`avatar-member-${index}`}>{initials}</span>
                ))}
              </div>
              <span className="text-xs text-[#667171]"><strong className="text-[#182129]">1,842 curious people</strong> are already making room.</span>
            </div>
          </div>
          <div className="relative mt-2 lg:mt-0">
            <div className="absolute left-1/2 top-1/2 h-[65%] w-[65%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#dfe8b7] blur-3xl" />
            <OrbitalFoundry />
            <div className="absolute bottom-6 left-0 hidden rounded-md border border-[#c2c7bd] bg-[#f8f5ef]/90 px-3 py-2 shadow-sm backdrop-blur-sm sm:block">
              <div className="nf-mono text-[9px] uppercase tracking-[.18em] text-[#7d8781]">current signal</div>
              <div className="mt-1 flex items-center gap-2 text-xs font-bold"><span className="h-2 w-2 rounded-full bg-[#b8d94b]" /> curiosity is compounding</div>
            </div>
          </div>
        </section>

        <div className="overflow-hidden border-y-2 border-[#182129] bg-[#b8d94b] py-3.5">
          <div className="flex min-w-max animate-[marquee_24s_linear_infinite] items-center gap-8 whitespace-nowrap nf-mono text-[11px] font-bold uppercase tracking-[.15em] text-[#182129]">
            {['learn out loud', 'compare notes', 'chase the rabbit hole', 'build in public', 'teach the technique', 'learn out loud', 'compare notes', 'chase the rabbit hole'].map((item, i) => (
              <span key={`${item}-${i}`} className="flex items-center gap-8"><span>{item}</span><span className="text-[#ff653f]">✳</span></span>
            ))}
          </div>
        </div>

        <section id="disciplines" className="mx-auto max-w-[1280px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-24">
            <div>
              <div className="nf-mono text-[10px] font-bold uppercase tracking-[.22em] text-[#ff653f]">01 / the workbench</div>
              <h2 className="nf-display mt-5 text-4xl font-bold leading-[.95] tracking-[-.06em] sm:text-6xl">Five doors in.<br /><span className="text-[#768a32]">One curious</span><br />mind at a time.</h2>
              <p className="mt-6 max-w-[350px] text-sm leading-6 text-[#657070]">A starting point for every flavor of deep dive. Pick a door, bring your questions, and leave with better ones.</p>
            </div>
            <div className="grid border-t-2 border-[#182129] sm:grid-cols-2" data-testid="grid-disciplines">
              {[
                { icon: <Swords />, title: 'Dungeons & Dragons', note: 'Campaign craft, worldbuilding, table magic.', color: 'text-[#ff653f]' },
                { icon: <Hexagon />, title: 'Magic: The Gathering', note: 'Deck theory, draft reads, cardboard alchemy.', color: 'text-[#768a32]' },
                { icon: <Orbit />, title: 'Rubik’s Cubing', note: 'Algorithms, finger tricks, satisfying solves.', color: 'text-[#ff653f]' },
                { icon: <Gamepad2 />, title: 'Games & Systems', note: 'The why behind the play, not just the win.', color: 'text-[#768a32]' },
                { icon: <Palette />, title: 'Make & Create', note: 'Code, art, music, miniatures, side quests.', color: 'text-[#ff653f]' },
                { icon: <Sparkles />, title: 'The next obsession', note: 'There is always another rabbit hole.', color: 'text-[#768a32]' },
              ].map((item, index) => (
                <button type="button" key={item.title} onClick={() => document.getElementById('field-notes')?.scrollIntoView({ behavior: 'smooth' })} className="group flex min-h-[156px] flex-col justify-between border-b-2 border-[#182129] py-5 text-left transition-colors hover:bg-[#e7edc9] sm:px-5 sm:even:border-l-2" data-testid={`button-discipline-${index}`}>
                  <div className={`transition-transform duration-300 group-hover:-translate-y-1 ${item.color}`}>{item.icon}</div>
                  <div>
                    <h3 className="nf-display text-lg font-bold tracking-[-.035em]">{item.title}</h3>
                    <p className="mt-1 max-w-[235px] text-xs leading-5 text-[#697574]">{item.note}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="manifesto" className="relative overflow-hidden bg-[#182129] text-[#f4f0e8]">
          <div className="absolute inset-0 nf-grid opacity-[.08]" />
          <div className="relative mx-auto grid max-w-[1280px] gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:px-12 lg:py-32">
            <div>
              <div className="nf-mono text-[10px] font-bold uppercase tracking-[.22em] text-[#b8d94b]">02 / the house rules</div>
              <h2 className="nf-display mt-6 max-w-[700px] text-5xl font-bold leading-[.9] tracking-[-.07em] sm:text-7xl">No gatekeeping.<br /><span className="text-[#ff653f]">No cool-kid</span><br />table.</h2>
            </div>
            <div className="flex flex-col justify-end">
              <p className="max-w-[430px] text-lg leading-8 text-[#c1c8bd]">Expertise is more fun when it has an open door. We are building the kind of space where a beginner question can sit beside a 200-hour deep dive.</p>
              <div className="mt-9 flex items-center gap-3 nf-mono text-[10px] uppercase tracking-[.16em] text-[#b8d94b]"><Check size={16} /> share what you know</div>
              <div className="mt-3 flex items-center gap-3 nf-mono text-[10px] uppercase tracking-[.16em] text-[#b8d94b]"><Check size={16} /> celebrate the tiny breakthrough</div>
              <div className="mt-3 flex items-center gap-3 nf-mono text-[10px] uppercase tracking-[.16em] text-[#b8d94b]"><Check size={16} /> make room for the next question</div>
            </div>
          </div>
        </section>

        <section id="field-notes" className="mx-auto max-w-[1280px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="nf-mono text-[10px] font-bold uppercase tracking-[.22em] text-[#ff653f]">03 / from the workbench</div>
              <h2 className="nf-display mt-5 text-4xl font-bold tracking-[-.06em] sm:text-6xl">Field notes<br /><span className="text-[#768a32]">for the curious.</span></h2>
            </div>
            <span className="nf-mono text-[10px] uppercase tracking-[.12em] text-[#78827d]">A preview of what is brewing</span>
          </div>
          <div className="mt-12 grid gap-4 lg:grid-cols-[1.2fr_.8fr_.8fr]">
            <FieldNoteCard large tag="D&D / WORLDCRAFT" title="The village is a character, too." excerpt="A good setting does more than hold your story. It asks something of the people passing through." number="01" />
            <FieldNoteCard tag="MTG / DECK THEORY" title="What your sideboard is trying to tell you." excerpt="Patterns hiding in the fifteen cards you almost never talk about." number="02" />
            <FieldNoteCard tag="MAKE / PRACTICE" title="A better way to learn hard things." excerpt="Shrink the feedback loop until progress becomes visible." number="03" />
          </div>
        </section>

        <section className="mx-5 mb-20 overflow-hidden rounded-[28px] bg-[#ff653f] sm:mx-8 lg:mx-auto lg:mb-28 lg:max-w-[1184px]">
          <div className="relative px-6 py-14 sm:px-14 sm:py-20">
            <div className="absolute -right-8 -top-20 h-72 w-72 rounded-full border-[32px] border-[#182129]/10" />
            <div className="absolute -bottom-28 right-24 h-56 w-56 rounded-full border-[24px] border-[#f4f0e8]/15" />
            <div className="relative max-w-[710px]">
              <div className="nf-mono text-[10px] font-bold uppercase tracking-[.22em] text-[#182129]/65">Your next deep dive is waiting</div>
              <h2 className="nf-display mt-5 text-5xl font-bold leading-[.88] tracking-[-.07em] text-[#182129] sm:text-7xl">Bring the<br />odd interest.</h2>
              <div className="mt-9 flex flex-wrap items-center gap-5">
                <Link href="/sign-up" className="group flex items-center gap-3 rounded-lg bg-[#182129] px-5 py-3.5 text-sm font-bold text-[#f4f0e8] shadow-[5px_6px_0_#b8d94b] transition-all hover:-translate-y-1 hover:shadow-[6px_8px_0_#b8d94b]" data-testid="link-final-join">Join The Nerd Foundry <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link>
                <span className="nf-mono text-[10px] uppercase tracking-[.1em] text-[#182129]/70">Free to join · always curious</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-[1280px] flex-col gap-5 border-t border-[#d5d0c7] px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <BrandMark />
        <p className="nf-mono text-[10px] uppercase tracking-[.12em] text-[#88908b]">Made for people who ask one more question.</p>
        <span className="nf-mono text-[10px] text-[#88908b]">© 2024 N/F</span>
      </footer>
    </div>
  );
}

function FieldNoteCard({ tag, title, excerpt, number, large = false }: { tag: string; title: string; excerpt: string; number: string; large?: boolean }) {
  return (
    <article className={`group relative flex min-h-[310px] flex-col justify-between overflow-hidden rounded-2xl border-2 border-[#182129] p-5 transition-all hover:-translate-y-1 hover:shadow-[6px_7px_0_#b8d94b] ${large ? 'bg-[#e7edc9]' : 'bg-[#f8f5ef]'}`} data-testid={`card-field-note-${number}`}>
      <div className="flex items-start justify-between">
        <span className="nf-mono text-[9px] font-bold uppercase tracking-[.15em] text-[#ff653f]">{tag}</span>
        <span className="nf-mono text-[10px] text-[#88908b]">{number}</span>
      </div>
      <div>
        <div className="mb-5 h-16 w-16 rounded-full border-2 border-[#182129] bg-[#ff653f] transition-transform duration-500 group-hover:rotate-12">
          <div className="m-3 h-9 w-9 rounded-full border-2 border-[#182129] border-dashed" />
        </div>
        <h3 className="nf-display max-w-[340px] text-2xl font-bold leading-[.98] tracking-[-.055em]">{title}</h3>
        <p className="mt-3 max-w-[360px] text-sm leading-6 text-[#697574]">{excerpt}</p>
      </div>
      <button type="button" onClick={() => window.alert('Field notes are coming soon. Join the clubhouse to get the first signal.')} className="absolute bottom-5 right-5 rounded-full p-2 transition-colors hover:bg-[#182129] hover:text-[#f4f0e8]" aria-label={`Read ${title}`} data-testid={`button-read-note-${number}`}><ArrowUpRightIcon /></button>
    </article>
  );
}

function ArrowUpRightIcon() {
  return <ArrowRight size={17} className="-rotate-45" />;
}

function LoadingFrame({ label = 'Loading your workbench' }: { label?: string }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#f4f0e8] text-[#182129]">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-pulse rounded-[14px] bg-[#182129] shadow-[5px_5px_0_#b8d94b]" />
        <p className="nf-mono mt-6 text-[10px] uppercase tracking-[.18em] text-[#697574]" data-testid="status-loading">{label}</p>
      </div>
    </div>
  );
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <LoadingFrame label="Checking your pass" />;
  return isSignedIn ? <Redirect to="/dashboard" /> : <LandingPage />;
}

function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ disciplines: true, clubhouse: true, future: false });
  const [notice, setNotice] = useState<string | null>(null);
  const { signOut } = useClerk();
  const { user } = useUser();
  const [location] = useLocation();
  const displayName = user?.firstName || user?.username || 'Member';
  const workbench = WORKBENCH_MODULES.find((module) => module.id === 'workbench');
  const navGroups = [
    { id: 'disciplines', label: 'Disciplines', modules: WORKBENCH_MODULES.filter((module) => module.group === 'discipline') },
    { id: 'clubhouse', label: 'Clubhouse', modules: WORKBENCH_MODULES.filter((module) => module.group === 'clubhouse') },
    { id: 'future', label: 'Future tools', modules: WORKBENCH_MODULES.filter((module) => module.group === 'future') },
  ];
  const showFutureNotice = (module: WorkbenchModule) => {
    setNotice(`${module.title} is being forged now. We will share the first signal here.`);
    setMobileOpen(false);
  };
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  return (
    <div className="flex min-h-[100dvh] bg-[#f4f0e8] text-[#182129]">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col bg-[#182129] px-5 py-6 text-[#f4f0e8] transition-transform duration-300 lg:relative lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between">
          <Link href="/dashboard" onClick={() => setMobileOpen(false)} data-testid="link-dashboard-brand"><span className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#b8d94b] text-[#182129]"><span className="nf-display text-lg font-bold">N</span></span><span className="nf-display text-sm font-bold tracking-[-.04em]">THE NERD<br /><span className="text-[#ff653f]">FOUNDRY</span></span></span></Link>
          <button type="button" className="rounded-md p-1 text-[#9eaaa3] lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation" data-testid="button-close-navigation"><X size={18} /></button>
        </div>
        <div className="mt-10 flex items-center justify-between nf-mono text-[9px] uppercase tracking-[.18em] text-[#75837a]">
          <span>Your clubhouse</span>
          <span className="text-[#52635b]">member os</span>
        </div>
        <nav className="mt-3 grid gap-1" aria-label="Member navigation">
          {workbench && (
            <Link
              href={workbench.href || '/dashboard'}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold transition-colors ${location === '/dashboard' ? 'bg-[#273338] text-[#f4f0e8] shadow-[inset_3px_0_#ff653f]' : 'text-[#aebbb1] hover:bg-[#222e32] hover:text-[#f4f0e8]'}`}
              data-testid="link-nav-workbench"
            >
              <LayoutDashboard size={17} /> {workbench.shortTitle}
            </Link>
          )}
          {navGroups.map((group) => (
            <div key={group.id} className="mt-2">
              <button
                type="button"
                onClick={() => setExpandedGroups((current) => ({ ...current, [group.id]: !current[group.id] }))}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left nf-mono text-[9px] uppercase tracking-[.14em] text-[#75837a] transition-colors hover:bg-[#222e32] hover:text-[#f4f0e8]"
                aria-expanded={expandedGroups[group.id]}
                data-testid={`button-toggle-nav-${group.id}`}
              >
                <span>{group.label}</span>
                <ChevronRight size={13} className={`transition-transform ${expandedGroups[group.id] ? 'rotate-90' : ''}`} />
              </button>
              {expandedGroups[group.id] && (
                <div className="mt-1 grid gap-0.5">
                  {group.modules.map((module) => {
                    const Icon = module.icon;
                    return (
                      <button
                        type="button"
                        key={module.id}
                        onClick={() => showFutureNotice(module)}
                        className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#8f9b94] transition-colors hover:bg-[#222e32] hover:text-[#f4f0e8]"
                        data-testid={`button-nav-${module.id}`}
                      >
                        <span className="flex items-center gap-3 leading-4"><Icon size={16} />{module.title}</span>
                        <span className="nf-mono text-[8px] uppercase tracking-[.1em] text-[#ff653f]">soon</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-[#364449] bg-[#202c30] p-4">
          <div className="flex items-center gap-2 text-[#b8d94b]"><Zap size={15} /><span className="nf-mono text-[9px] uppercase tracking-[.1em]">Foundry signal</span></div>
          <p className="mt-3 text-sm leading-5 text-[#c0c9c0]">Your member profile is ready. The workbench is yours to shape.</p>
          <Link href="/settings" onClick={() => setMobileOpen(false)} className="mt-4 flex items-center gap-1 text-xs font-bold text-[#f4f0e8] hover:text-[#ff653f]" data-testid="link-sidebar-settings">Tune your profile <ChevronRight size={14} /></Link>
        </div>
        <button type="button" onClick={() => signOut({ redirectUrl: basePath || '/' })} className="mt-5 flex items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-bold text-[#8f9b94] transition-colors hover:bg-[#222e32] hover:text-[#f4f0e8]" data-testid="button-sign-out"><LogOut size={16} /> Sign out</button>
      </aside>
      {mobileOpen && <button type="button" className="fixed inset-0 z-30 bg-[#182129]/40 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu overlay" data-testid="button-menu-overlay" />}
      <div className="min-w-0 flex-1">
        <header className="flex h-[76px] items-center justify-between border-b border-[#d5d0c7] px-5 sm:px-8 lg:px-10">
          <button type="button" className="rounded-lg p-2 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation" data-testid="button-open-navigation"><Menu size={21} /></button>
          <div className="hidden items-center gap-2 text-xs text-[#748079] sm:flex"><span className="h-2 w-2 rounded-full bg-[#b8d94b]" /> all systems curious</div>
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden text-right sm:block"><span className="block text-xs font-bold">{displayName}</span><span className="nf-mono block text-[9px] uppercase tracking-[.1em] text-[#7a8580]">member / 001842</span></span>
            <Link href="/settings" className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#182129] bg-[#b8d94b] text-xs font-bold transition-transform hover:rotate-6" data-testid="link-account-avatar">{(user?.firstName?.[0] || 'N') + (user?.lastName?.[0] || 'F')}</Link>
          </div>
        </header>
        {notice && (
          <div className="pointer-events-none fixed bottom-5 left-5 right-5 z-50 flex justify-center sm:left-auto sm:right-8" role="status" data-testid="status-future-module">
            <div className="pointer-events-auto flex max-w-[390px] items-center gap-3 rounded-xl border-2 border-[#182129] bg-[#182129] px-4 py-3 text-sm text-[#f4f0e8] shadow-[5px_5px_0_#ff653f]">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#b8d94b]" />
              <span className="flex-1">{notice}</span>
              <button type="button" onClick={() => setNotice(null)} className="rounded p-1 text-[#aebbb1] transition-colors hover:bg-[#273338] hover:text-[#f4f0e8]" aria-label="Dismiss message" data-testid="button-dismiss-future-message"><X size={15} /></button>
            </div>
          </div>
        )}
        <main>{children}</main>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <LoadingFrame />;
  return isSignedIn ? <AppShell>{children}</AppShell> : <Redirect to="/" />;
}

function DashboardPage() {
  const { user } = useUser();
  const [ritualStep, setRitualStep] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const displayName = user?.firstName || 'curious human';
  const ritualSteps = [
    'Name one question you keep returning to.',
    'Choose the discipline that might help you answer it.',
    'Leave yourself one next move for later.',
  ];
  const fieldNotes = WORKBENCH_MODULES.find((module) => module.id === 'field-notes');
  const ritualComplete = ritualStep === ritualSteps.length;
  const showFutureNotice = (module: WorkbenchModule) => {
    setNotice(`${module.title} is still on the horizon. We will share the first signal here.`);
  };
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  return (
    <div className="nf-grid min-h-[calc(100dvh-76px)] px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1160px]">
        <div className="animate-rise flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div>
            <div className="nf-mono text-[10px] uppercase tracking-[.2em] text-[#ff653f]">member home / personal workbench</div>
            <h1 className="nf-display mt-3 text-5xl font-bold leading-[.9] tracking-[-.07em] sm:text-7xl" data-testid="heading-dashboard">Good to see you,<br /><span className="text-[#768a32]">{displayName}.</span></h1>
            <p className="mt-5 max-w-[480px] text-sm leading-6 text-[#66716f]">A quiet place to choose what you are curious about next, then make the first move.</p>
          </div>
          <Link href="/settings" className="group flex w-fit items-center gap-2 rounded-lg border-2 border-[#182129] bg-[#f8f5ef] px-4 py-3 text-sm font-bold shadow-[4px_4px_0_#b8d94b] transition-all hover:-translate-y-0.5" data-testid="link-dashboard-settings"><Settings size={16} /> Account settings <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></Link>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <section className="animate-rise delay-2 overflow-hidden rounded-2xl border-2 border-[#182129] bg-[#182129] p-6 text-[#f4f0e8] shadow-[6px_7px_0_#ff653f] sm:p-8" data-testid="card-welcome">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-[#b8d94b]"><Sparkles size={18} /><span className="nf-mono text-[10px] uppercase tracking-[.17em]">first ritual / {ritualComplete ? 'captured' : `${ritualStep + 1} of 3`}</span></div>
              <span className="nf-mono text-[10px] text-[#73827a]">01 / 03</span>
            </div>
            <h2 className="nf-display mt-14 max-w-[560px] text-4xl font-bold leading-[.92] tracking-[-.06em] sm:text-6xl">Start with a<br /><span className="text-[#ff653f]">small obsession.</span></h2>
            <p className="mt-5 max-w-[430px] text-sm leading-6 text-[#bec8bf]">{ritualComplete ? 'That is enough for today. Your first thread is on the bench, ready whenever you are.' : ritualSteps[ritualStep]}</p>
            <div className="mt-7 flex gap-1.5" aria-label="First ritual progress" data-testid="progress-first-ritual">
              {ritualSteps.map((step, index) => <span key={step} className={`h-1.5 flex-1 rounded-full ${index < ritualStep || ritualComplete ? 'bg-[#b8d94b]' : 'bg-[#46534d]'}`} />)}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button type="button" disabled={ritualComplete} onClick={() => setRitualStep((step) => Math.min(step + 1, ritualSteps.length))} className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-bold transition-colors ${ritualComplete ? 'cursor-default bg-[#b8d94b] text-[#182129]' : 'bg-[#ff653f] text-[#182129] hover:bg-[#b8d94b]'}`} data-testid="button-start-ritual">{ritualComplete ? <Check size={16} /> : <Zap size={16} />}{ritualComplete ? 'Ritual captured' : ritualStep === 0 ? 'Begin the ritual' : 'Mark this step complete'}</button>
              <span className="nf-mono text-[9px] uppercase tracking-[.12em] text-[#78867e]">{ritualComplete ? 'your first thread is ready' : 'takes about 30 seconds'}</span>
            </div>
          </section>
          <div className="grid gap-5">
            <MemberSignal />
            <section className="animate-rise delay-4 rounded-2xl border-2 border-[#182129] bg-[#f8f5ef] p-6" data-testid="card-next-signal">
              <div className="flex items-center justify-between"><span className="nf-mono text-[10px] uppercase tracking-[.17em] text-[#ff653f]">next signal</span><ArrowRight size={16} /></div>
              <div className="mt-6 flex items-start gap-3">
                {fieldNotes && <EmptyModuleMark module={fieldNotes} />}
                <div><h3 className="nf-display text-2xl font-bold leading-[.95] tracking-[-.05em]">Field notes are<br />coming online.</h3><p className="mt-3 text-xs leading-5 text-[#707b77]">Short, useful sparks from deep in the rabbit hole.</p></div>
              </div>
              <button type="button" onClick={() => fieldNotes && showFutureNotice(fieldNotes)} className="mt-5 flex items-center gap-2 text-xs font-bold hover:text-[#ff653f]" data-testid="button-notify-notes">Keep me in the loop <ChevronRight size={14} /></button>
            </section>
          </div>
        </div>
        <WorkbenchModuleRail onFutureSelect={showFutureNotice} />
        <HorizonModules onFutureSelect={showFutureNotice} />
        {notice && (
          <div className="mt-6 flex items-center gap-3 border-l-2 border-[#ff653f] bg-[#f8f5ef] px-4 py-3 text-sm shadow-[4px_4px_0_#b8d94b]" role="status" data-testid="status-dashboard-future-module">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#ff653f]" />
            <span className="flex-1">{notice}</span>
            <button type="button" onClick={() => setNotice(null)} className="rounded p-1 text-[#7d8781] hover:bg-[#e7edc9] hover:text-[#182129]" aria-label="Dismiss message" data-testid="button-dismiss-dashboard-message"><X size={15} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="min-h-[calc(100dvh-76px)] bg-[#e9e5dc] px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1160px]">
        <div className="animate-rise">
          <div className="nf-mono text-[10px] uppercase tracking-[.2em] text-[#ff653f]">member controls</div>
          <h1 className="nf-display mt-3 text-5xl font-bold tracking-[-.07em] sm:text-7xl" data-testid="heading-settings">Tune your<br /><span className="text-[#768a32]">presence.</span></h1>
          <p className="mt-5 max-w-[480px] text-sm leading-6 text-[#66716f]">Keep your account details current. The good stuff is ahead; this is just the tuning room.</p>
        </div>
        <div className="mt-10 overflow-hidden rounded-2xl border-2 border-[#182129] bg-[#f8f5ef] p-2 shadow-[6px_7px_0_#b8d94b]">
          <UserProfile routing="path" path={`${basePath}/settings`} />
        </div>
      </div>
    </div>
  );
}

function SignInPage() {
  return <AuthFrame eyebrow="welcome back" title="Pick up where you left off."><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></AuthFrame>;
}

function SignUpPage() {
  return <AuthFrame eyebrow="new around here" title="There is always room at the table."><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></AuthFrame>;
}

function AuthFrame({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <div className="nf-grid flex min-h-[100dvh] items-center justify-center bg-[#e9e5dc] px-4 py-12">
      <div className="grid w-full max-w-[1080px] overflow-hidden rounded-[26px] border-2 border-[#182129] bg-[#f4f0e8] shadow-[10px_12px_0_#182129] lg:grid-cols-[.78fr_1.22fr]">
        <div className="relative hidden overflow-hidden bg-[#182129] p-10 text-[#f4f0e8] lg:block">
          <div className="absolute inset-0 nf-grid opacity-[.08]" />
          <div className="relative flex h-full flex-col">
            <Link href="/" data-testid="link-auth-brand"><span className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#b8d94b] text-[#182129]"><span className="nf-display text-lg font-bold">N</span></span><span className="nf-display text-sm font-bold tracking-[-.04em]">THE NERD <span className="text-[#ff653f]">FOUNDRY</span></span></span></Link>
            <div className="mt-auto">
              <div className="mb-6 h-20 w-20 rounded-[24px] border-2 border-[#b8d94b] p-3"><div className="h-full rounded-[15px] border-2 border-dashed border-[#ff653f]" /></div>
              <div className="nf-mono text-[10px] uppercase tracking-[.2em] text-[#b8d94b]">{eyebrow}</div>
              <h1 className="nf-display mt-4 text-5xl font-bold leading-[.9] tracking-[-.07em]">{title}</h1>
              <p className="mt-5 max-w-[275px] text-sm leading-6 text-[#aebbb1]">A welcoming clubhouse for curious people who love going deep.</p>
            </div>
            <div className="mt-12 flex items-center gap-2 nf-mono text-[9px] uppercase tracking-[.15em] text-[#7b8c83]"><span className="h-1.5 w-1.5 rounded-full bg-[#ff653f]" /> built for the beautifully obsessed</div>
          </div>
        </div>
        <div className="flex min-h-[620px] flex-col items-center justify-center bg-[#f8f5ef] px-4 py-10 sm:px-10">
          <div className="mb-8 lg:hidden"><Link href="/" data-testid="link-auth-brand-mobile"><BrandMark /></Link></div>
          {children}
        </div>
      </div>
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (previousUserId.current !== undefined && previousUserId.current !== userId) client.clear();
      previousUserId.current = userId;
    });
    return unsubscribe;
  }, [addListener, client]);
  return null;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsVariant: 'blockButton' as const,
  },
  variables: {
    colorPrimary: '#ff653f',
    colorForeground: '#182129',
    colorMutedForeground: '#687574',
    colorDanger: '#b53f38',
    colorBackground: '#f8f5ef',
    colorInput: '#f1ede4',
    colorInputForeground: '#182129',
    colorNeutral: '#c8c4b9',
    fontFamily: 'Space Grotesk, sans-serif',
    borderRadius: '0.7rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#f8f5ef] rounded-2xl w-[440px] max-w-full overflow-hidden',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#182129] font-bold tracking-tight',
    headerSubtitle: 'text-[#687574]',
    socialButtonsBlockButtonText: 'text-[#182129] font-semibold',
    formFieldLabel: 'text-[#182129] font-semibold',
    footerActionLink: 'text-[#d95238] font-bold',
    footerActionText: 'text-[#687574]',
    dividerText: 'text-[#687574]',
    identityPreviewEditButton: 'text-[#d95238]',
    formFieldSuccessText: 'text-[#60751e]',
    alertText: 'text-[#b53f38]',
    logoBox: 'h-12',
    logoImage: 'max-h-12',
    socialButtonsBlockButton: 'border-[#c8c4b9] bg-[#f1ede4] hover:bg-[#e7edc9]',
    formButtonPrimary: 'bg-[#182129] text-[#f4f0e8] hover:bg-[#26363b] font-bold',
    formFieldInput: 'border-[#c8c4b9] bg-[#f1ede4] text-[#182129] focus:border-[#ff653f] focus:ring-[#ff653f]',
    footerAction: 'border-t border-[#ded8cd]',
    dividerLine: 'bg-[#d8d3c8]',
    alert: 'border-[#e0aaa3] bg-[#f7e7e2]',
    otpCodeFieldInput: 'border-[#c8c4b9] bg-[#f1ede4]',
    formFieldRow: 'gap-2',
    main: 'gap-5',
  },
};

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: 'Welcome back, maker', subtitle: 'Your workbench has been waiting.' } },
        signUp: { start: { title: 'Make room for curiosity', subtitle: 'A better clubhouse starts with one good question.' } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/dashboard">
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          </Route>
          <Route path="/settings/*?">
            <ProtectedRoute><SettingsPage /></ProtectedRoute>
          </Route>
          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <RoutedErrorBoundary>
        <ClerkProviderWithRoutes />
      </RoutedErrorBoundary>
    </WouterRouter>
  );
}

export default App;