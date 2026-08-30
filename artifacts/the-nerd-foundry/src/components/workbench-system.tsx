import { type LucideIcon, ArrowRight, BookOpen, CircleDashed, Compass, Hexagon, Library, Orbit, Swords, Users, Wrench } from 'lucide-react';
import { Link } from 'wouter';

export type WorkbenchModule = {
  id: string;
  title: string;
  shortTitle: string;
  kicker: string;
  description: string;
  icon: LucideIcon;
  accent: 'coral' | 'lime' | 'ink';
  status: 'active' | 'forging';
  group: 'core' | 'discipline' | 'clubhouse' | 'future';
  href?: string;
};

export const WORKBENCH_MODULES: WorkbenchModule[] = [
  {
    id: 'workbench',
    title: 'The Workbench',
    shortTitle: 'Workbench',
    kicker: 'your home base',
    description: 'Keep your questions, rituals, and next rabbit holes close.',
    icon: Library,
    accent: 'coral',
    status: 'active',
    group: 'core',
    href: '/dashboard',
  },
  {
    id: 'dnd',
    title: 'Dungeons & Dragons',
    shortTitle: 'D&D',
    kicker: 'discipline / 01',
    description: 'Campaign craft, worldbuilding, and table magic.',
    icon: Swords,
    accent: 'coral',
    status: 'forging',
    group: 'discipline',
  },
  {
    id: 'mtg',
    title: 'Magic: The Gathering',
    shortTitle: 'MTG',
    kicker: 'discipline / 02',
    description: 'Deck theory, draft reads, and cardboard alchemy.',
    icon: Hexagon,
    accent: 'lime',
    status: 'forging',
    group: 'discipline',
  },
  {
    id: 'cubing',
    title: "Rubik's Cubing",
    shortTitle: 'Cubing',
    kicker: 'discipline / 03',
    description: 'Algorithms, finger tricks, and satisfying solves.',
    icon: Orbit,
    accent: 'lime',
    status: 'forging',
    group: 'discipline',
  },
  {
    id: 'field-notes',
    title: 'Field Notes',
    shortTitle: 'Field notes',
    kicker: 'clubhouse / 01',
    description: 'Short, useful sparks from deep in the rabbit hole.',
    icon: BookOpen,
    accent: 'coral',
    status: 'forging',
    group: 'clubhouse',
  },
  {
    id: 'communities',
    title: 'Communities',
    shortTitle: 'Communities',
    kicker: 'clubhouse / 02',
    description: 'Small rooms for big, specific interests.',
    icon: Users,
    accent: 'lime',
    status: 'forging',
    group: 'clubhouse',
  },
  {
    id: 'future-tools',
    title: 'Other future tools',
    shortTitle: 'More tools',
    kicker: 'open slot / 01',
    description: 'A place for the next obsession that earns a workbench.',
    icon: Wrench,
    accent: 'ink',
    status: 'forging',
    group: 'future',
  },
];

const accentClasses = {
  coral: {
    icon: 'text-[#ff653f]',
    dot: 'bg-[#ff653f]',
    wash: 'bg-[#fff0eb]',
  },
  lime: {
    icon: 'text-[#768a32]',
    dot: 'bg-[#b8d94b]',
    wash: 'bg-[#e7edc9]',
  },
  ink: {
    icon: 'text-[#182129]',
    dot: 'bg-[#182129]',
    wash: 'bg-[#e9e5dc]',
  },
} as const;

function ModuleIcon({ module, size = 18 }: { module: WorkbenchModule; size?: number }) {
  const Icon = module.icon;
  return <Icon size={size} strokeWidth={1.8} />;
}

export function getModuleById(id: string) {
  return WORKBENCH_MODULES.find((module) => module.id === id);
}

export function WorkbenchModuleRail({ onFutureSelect }: { onFutureSelect: (module: WorkbenchModule) => void }) {
  return (
    <section className="animate-rise delay-4 mt-12" data-testid="section-module-catalog">
      <div className="flex flex-col justify-between gap-3 border-t-2 border-[#182129] pt-6 sm:flex-row sm:items-end">
        <div>
          <div className="nf-mono text-[10px] uppercase tracking-[.2em] text-[#ff653f]">the discipline rail</div>
          <h2 className="nf-display mt-2 text-3xl font-bold tracking-[-.06em] sm:text-4xl">Choose your next deep dive.</h2>
        </div>
        <div className="flex items-center gap-2 nf-mono text-[9px] uppercase tracking-[.12em] text-[#7d8781]">
          <CircleDashed size={13} className="text-[#768a32]" /> modules are being forged in the open
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="grid-module-catalog">
        {WORKBENCH_MODULES.filter((module) => module.group !== 'future').map((module) => {
          const colors = accentClasses[module.accent];
          const content = (
            <>
              <div className="flex items-start justify-between">
                <span className={colors.icon}><ModuleIcon module={module} /></span>
                {module.status === 'active' ? (
                  <span className="rounded-full bg-[#b8d94b] px-2 py-1 nf-mono text-[8px] font-bold uppercase tracking-[.08em] text-[#182129]">open now</span>
                ) : (
                  <span className="rounded-full border border-[#c9c8bd] bg-[#f4f0e8] px-2 py-1 nf-mono text-[8px] uppercase tracking-[.08em] text-[#7d8781]">forming</span>
                )}
              </div>
              <div className="mt-8">
                <div className="nf-mono text-[9px] uppercase tracking-[.13em] text-[#ff653f]">{module.kicker}</div>
                <h3 className="nf-display mt-2 text-lg font-bold leading-[.98] tracking-[-.04em]">{module.title}</h3>
                <p className="mt-2 text-xs leading-5 text-[#697574]">{module.description}</p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-xs font-bold">
                {module.status === 'active' ? 'Open the bench' : 'See the signal'} <ArrowRight size={14} />
              </div>
            </>
          );

          return module.href ? (
            <Link
              key={module.id}
              href={module.href}
              className={`group flex min-h-[218px] flex-col rounded-xl border-2 border-[#182129] ${colors.wash} p-4 text-left shadow-[4px_4px_0_#b8d94b] transition-all hover:-translate-y-1 hover:shadow-[5px_6px_0_#ff653f]`}
              data-testid={`link-module-${module.id}`}
            >
              {content}
            </Link>
          ) : (
            <button
              key={module.id}
              type="button"
              onClick={() => onFutureSelect(module)}
              className="group flex min-h-[218px] flex-col rounded-xl border border-[#c9c8bd] bg-[#f8f5ef] p-4 text-left transition-all hover:-translate-y-1 hover:border-[#182129] hover:shadow-[4px_4px_0_#b8d94b]"
              data-testid={`button-module-${module.id}`}
            >
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function HorizonModules({ onFutureSelect }: { onFutureSelect: (module: WorkbenchModule) => void }) {
  const horizonModules = WORKBENCH_MODULES.filter((module) => module.status === 'forging').slice(0, 3);

  return (
    <section className="animate-rise delay-5 mt-12 border-t-2 border-[#182129] pt-6" data-testid="section-coming-soon">
      <div className="flex items-center justify-between">
        <div>
          <div className="nf-mono text-[10px] uppercase tracking-[.2em] text-[#ff653f]">on the horizon</div>
          <h2 className="nf-display mt-2 text-3xl font-bold tracking-[-.06em]">The foundry is warming up.</h2>
        </div>
        <span className="hidden nf-mono text-[9px] uppercase tracking-[.12em] text-[#7d8781] sm:block">built in the open</span>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {horizonModules.map((module, index) => {
          const colors = accentClasses[module.accent];
          return (
            <button
              type="button"
              key={module.id}
              onClick={() => onFutureSelect(module)}
              className="group rounded-xl border border-[#c9c8bd] bg-[#f8f5ef] p-4 text-left transition-all hover:-translate-y-1 hover:border-[#182129] hover:shadow-[4px_4px_0_#b8d94b]"
              data-testid={`button-horizon-0${index + 1}`}
            >
              <div className="flex items-center justify-between">
                <span className="nf-mono text-[9px] text-[#7d8781]">0{index + 1}</span>
                <span className={colors.icon}><ModuleIcon module={module} /></span>
              </div>
              <h3 className="mt-7 text-sm font-bold">{module.title}</h3>
              <p className="mt-1 text-xs leading-5 text-[#73807a]">{module.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 nf-mono text-[8px] uppercase tracking-[.1em] text-[#ff653f]">signal pending <ArrowRight size={12} /></span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function MemberSignal({ memberNumber = '001842', progress = 68 }: { memberNumber?: string; progress?: number }) {
  return (
    <section className="animate-rise delay-3 rounded-2xl border-2 border-[#182129] bg-[#e7edc9] p-6" data-testid="card-member-status">
      <div className="flex items-center justify-between">
        <span className="nf-mono text-[10px] uppercase tracking-[.17em] text-[#56652b]">your signal</span>
        <span className="rounded-full bg-[#b8d94b] px-2 py-1 nf-mono text-[8px] uppercase tracking-[.1em]">online</span>
      </div>
      <div className="mt-8 flex items-end justify-between">
        <div>
          <div className="nf-display text-5xl font-bold tracking-[-.08em]" data-testid="text-member-number">{memberNumber}</div>
          <div className="mt-1 text-xs text-[#687363]">member number</div>
        </div>
        <Compass className="text-[#ff653f]" size={36} strokeWidth={1.5} />
      </div>
      <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#cbd6a4]">
        <div className="h-full rounded-full bg-[#182129]" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-2 flex justify-between nf-mono text-[9px] uppercase tracking-[.1em] text-[#718067]"><span>bench setup</span><span>{progress}%</span></div>
    </section>
  );
}

export function EmptyModuleMark({ module }: { module: WorkbenchModule }) {
  const colors = accentClasses[module.accent];
  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.wash} ${colors.icon}`} aria-hidden="true">
      <ModuleIcon module={module} />
    </div>
  );
}