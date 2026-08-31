import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useUser } from '@clerk/react';
import {
  Archive,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Coins,
  Crosshair,
  Dices,
  Flame,
  FolderPlus,
  History,
  Library,
  Map,
  Minus,
  Plus,
  RotateCcw,
  Save,
  ScrollText,
  Shield,
  Skull,
  Sparkles,
  Swords,
  Trash2,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react';
import { Link } from 'wouter';

type ForgeView = 'characters' | 'campaigns' | 'world' | 'kit';
type Ability = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';
type CollectionItem = { id: string; name: string; detail: string };
type Session = CollectionItem & { date: string };

type Character = {
  id: string;
  name: string;
  player: string;
  race: string;
  className: string;
  subclass: string;
  level: number;
  multiclass: string[];
  abilityScores: Record<Ability, number>;
  skills: string[];
  saves: string[];
  hp: number;
  ac: number;
  initiative: number;
  proficiency: number;
  feats: string[];
  inventory: string[];
  equipment: string[];
  currency: string;
  spells: string[];
  notes: string;
};

type Campaign = {
  id: string;
  name: string;
  pitch: string;
  playerCharacters: string[];
  sessions: Session[];
  npcs: CollectionItem[];
  quests: CollectionItem[];
  locations: CollectionItem[];
  factions: CollectionItem[];
  items: CollectionItem[];
  lore: CollectionItem[];
  notes: string;
  world: World;
};

type World = {
  regions: CollectionItem[];
  nations: CollectionItem[];
  npcs: CollectionItem[];
  factions: CollectionItem[];
  deities: CollectionItem[];
  cultures: CollectionItem[];
  events: CollectionItem[];
  timelines: CollectionItem[];
};

type InitiativeEntry = { id: string; name: string; initiative: number; hp: number; note: string };
type EncounterEntry = { id: string; name: string; quantity: number; xp: number };
type RollRecord = { id: string; expression: string; total: number; rolls: number[]; timestamp: string };

type ForgeData = {
  characters: Character[];
  campaigns: Campaign[];
  initiative: InitiativeEntry[];
  encounter: EncounterEntry[];
  rolls: RollRecord[];
};

const abilities: Ability[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
const skillOptions = ['Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival'];
const generatorLists = {
  names: ['Mara Vell', 'Orin Calder', 'Sable Quill', 'Tamsin Rook', 'Edrik Vale', 'Nera Foxglove', 'Kestrel Thorne', 'Bram Hollow'],
  npc: ['a retired cartographer hiding a royal seal', 'an earnest goblin archivist with a dangerous map', 'a knight who cannot remember their oath', 'a river witch collecting promises in glass jars', 'a cheerful undertaker with a living shadow'],
  encounters: ['a bridge toll run by polite revenants', 'a storm that speaks in the voice of a lost ally', 'a shrine guarded by an invisible predator', 'two rival treasure crews at the same locked door', 'a market where every bargain costs a memory'],
  loot: ['a compass that points toward the last lie told nearby', 'three moon-silver trade bars', 'a cloak stitched with a forgotten family tree', 'a sealed letter addressed to the party in their own handwriting', 'a small brass key that is warm at midnight'],
  hooks: ['The town bell rings from beneath the lake.', 'A beloved saint has started appearing in enemy dreams.', 'The party inherits a debt from someone they have never met.', 'A road on every map has moved three miles east.', 'The next eclipse will reveal a door in the oldest wall.'],
  events: ['A rival adventuring party offers an uneasy truce.', 'Every candle flame leans toward the same empty chair.', 'A courier arrives with tomorrow’s newspaper.', 'The local animals refuse to cross one particular shadow.', 'A trusted contact asks for help without using their name.'],
};

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const emptyWorld = (): World => ({ regions: [], nations: [], npcs: [], factions: [], deities: [], cultures: [], events: [], timelines: [] });
const starterCharacter = (): Character => ({
  id: uid('char'),
  name: 'Aster Vale',
  player: 'Table seat 01',
  race: 'Half-elf',
  className: 'Ranger',
  subclass: 'Gloom Stalker',
  level: 5,
  multiclass: [],
  abilityScores: { STR: 10, DEX: 18, CON: 14, INT: 12, WIS: 16, CHA: 10 },
  skills: ['Perception', 'Stealth', 'Survival'],
  saves: ['DEX', 'WIS'],
  hp: 42,
  ac: 16,
  initiative: 4,
  proficiency: 3,
  feats: ['Sharpshooter'],
  inventory: ['Signet of the Northroad', 'Cure wounds draught'],
  equipment: ['Longbow', 'Studded leather', 'Two shortswords'],
  currency: '37 gp · 8 sp',
  spells: ['Hunter’s mark', 'Pass without trace', 'Goodberry'],
  notes: 'Owes the Ferryman one honest answer.',
});
const starterCampaign = (): Campaign => ({
  id: uid('camp'),
  name: 'The Ashen Meridian',
  pitch: 'A vanished sun, a road that remembers, and five weeks until the border burns.',
  playerCharacters: [],
  sessions: [],
  npcs: [],
  quests: [],
  locations: [],
  factions: [],
  items: [],
  lore: [],
  notes: '',
  world: emptyWorld(),
});
const initialData = (): ForgeData => ({ characters: [starterCharacter()], campaigns: [starterCampaign()], initiative: [], encounter: [], rolls: [] });

function Field({ label, value, onChange, placeholder, type = 'text', testId }: { label: string; value: string | number; onChange: (value: string) => void; placeholder?: string; type?: string; testId: string }) {
  return (
    <label className="grid gap-1.5 text-[11px] font-semibold text-[#526060]">
      <span className="nf-mono text-[9px] uppercase tracking-[.13em] text-[#77827b]">{label}</span>
      <input data-testid={testId} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="min-w-0 rounded-md border border-[#bdb9af] bg-[#fbf8f2] px-3 py-2.5 text-sm text-[#182129] outline-none transition-colors placeholder:text-[#a0a39b] focus:border-[#ff653f] focus:ring-2 focus:ring-[#ff653f]/15" />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder, testId, rows = 4 }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; testId: string; rows?: number }) {
  return (
    <label className="grid gap-1.5 text-[11px] font-semibold text-[#526060]">
      <span className="nf-mono text-[9px] uppercase tracking-[.13em] text-[#77827b]">{label}</span>
      <textarea data-testid={testId} rows={rows} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="resize-y rounded-md border border-[#bdb9af] bg-[#fbf8f2] px-3 py-2.5 text-sm leading-6 text-[#182129] outline-none transition-colors placeholder:text-[#a0a39b] focus:border-[#ff653f] focus:ring-2 focus:ring-[#ff653f]/15" />
    </label>
  );
}

function ActionButton({ children, onClick, tone = 'ink', testId, disabled = false }: { children: ReactNode; onClick: () => void; tone?: 'ink' | 'coral' | 'lime' | 'quiet'; testId: string; disabled?: boolean }) {
  const tones = {
    ink: 'bg-[#182129] text-[#f4f0e8] shadow-[3px_3px_0_#ff653f] hover:-translate-y-0.5',
    coral: 'bg-[#ff653f] text-[#182129] shadow-[3px_3px_0_#182129] hover:-translate-y-0.5',
    lime: 'bg-[#b8d94b] text-[#182129] shadow-[3px_3px_0_#182129] hover:-translate-y-0.5',
    quiet: 'border border-[#bdb9af] bg-[#f8f5ef] text-[#526060] hover:border-[#182129] hover:text-[#182129]',
  };
  return <button data-testid={testId} type="button" disabled={disabled} onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-45 ${tones[tone]}`}>{children}</button>;
}

function Panel({ children, className = '', title, kicker, action }: { children: ReactNode; className?: string; title?: string; kicker?: string; action?: ReactNode }) {
  return (
    <section className={`rounded-xl border-2 border-[#182129] bg-[#fbf8f2] shadow-[5px_5px_0_#b8d94b] ${className}`}>
      {(title || kicker || action) && <div className="flex items-start justify-between gap-4 border-b border-[#d5d0c7] px-4 py-4 sm:px-5"><div>{kicker && <div className="nf-mono text-[9px] uppercase tracking-[.16em] text-[#ff653f]">{kicker}</div>}{title && <h2 className="nf-display mt-1 text-xl font-bold tracking-[-.045em]">{title}</h2>}</div>{action}</div>}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function ChipList({ label, items, onChange, placeholder, testId }: { label: string; items: string[]; onChange: (items: string[]) => void; placeholder: string; testId: string }) {
  const [value, setValue] = useState('');
  const add = () => { const next = value.trim(); if (next) { onChange([...items, next]); setValue(''); } };
  return (
    <div className="grid gap-2">
      <div className="nf-mono text-[9px] uppercase tracking-[.13em] text-[#77827b]">{label}</div>
      <div className="flex flex-wrap gap-1.5">{items.map((item, index) => <span key={`${item}-${index}`} data-testid={`${testId}-item-${index}`} className="inline-flex items-center gap-1 rounded-md border border-[#c7c3b8] bg-[#e9edcf] px-2 py-1 text-[11px] font-semibold text-[#46571e]">{item}<button type="button" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} className="rounded p-0.5 text-[#75862d] hover:bg-[#b8d94b] hover:text-[#182129]" aria-label={`Remove ${item}`} data-testid={`${testId}-remove-${index}`}><X size={12} /></button></span>)}</div>
      <div className="flex gap-2"><input data-testid={`${testId}-input`} value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add(); } }} placeholder={placeholder} className="min-w-0 flex-1 rounded-md border border-[#bdb9af] bg-[#f8f5ef] px-2.5 py-2 text-xs outline-none focus:border-[#ff653f]" /><button data-testid={`${testId}-add`} type="button" onClick={add} className="rounded-md border border-[#182129] px-2.5 text-[#182129] transition-colors hover:bg-[#182129] hover:text-[#f4f0e8]"><Plus size={15} /></button></div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, copy }: { icon: typeof Archive; title: string; copy: string }) {
  return <div className="grid place-items-center rounded-lg border border-dashed border-[#bdb9af] bg-[#f4f0e8]/70 px-5 py-10 text-center"><Icon size={25} strokeWidth={1.5} className="text-[#ff653f]" /><h3 className="mt-3 text-sm font-bold">{title}</h3><p className="mt-1 max-w-[320px] text-xs leading-5 text-[#77827b]">{copy}</p></div>;
}

function CollectionPanel({ title, kicker, items, onAdd, onDelete, placeholder, icon: Icon, testId }: { title: string; kicker: string; items: CollectionItem[]; onAdd: (item: CollectionItem) => void; onDelete: (id: string) => void; placeholder: string; icon: typeof Archive; testId: string }) {
  const [name, setName] = useState('');
  const [detail, setDetail] = useState('');
  const add = () => { if (!name.trim()) return; onAdd({ id: uid(testId), name: name.trim(), detail: detail.trim() }); setName(''); setDetail(''); };
  return (
    <Panel title={title} kicker={kicker}>
      <div className="flex flex-col gap-2 sm:flex-row"><input data-testid={`input-${testId}-name`} value={name} onChange={(event) => setName(event.target.value)} placeholder={placeholder} className="min-w-0 flex-1 rounded-md border border-[#bdb9af] bg-[#f8f5ef] px-3 py-2 text-xs outline-none focus:border-[#ff653f]" /><input data-testid={`input-${testId}-detail`} value={detail} onChange={(event) => setDetail(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') add(); }} placeholder="One-line detail" className="min-w-0 flex-1 rounded-md border border-[#bdb9af] bg-[#f8f5ef] px-3 py-2 text-xs outline-none focus:border-[#ff653f]" /><ActionButton testId={`button-add-${testId}`} tone="coral" onClick={add}><Plus size={14} /> Add</ActionButton></div>
      <div className="mt-4 grid gap-2">{items.length === 0 ? <EmptyState icon={Icon} title={`No ${title.toLowerCase()} yet`} copy="Add the first piece while it is fresh at the table." /> : items.map((item) => <div key={item.id} data-testid={`row-${testId}-${item.id}`} className="group flex items-start gap-3 rounded-md border border-[#ddd8cd] bg-[#f8f5ef] p-3"><Icon size={16} className="mt-0.5 shrink-0 text-[#ff653f]" /><div className="min-w-0 flex-1"><div className="text-sm font-bold">{item.name}</div>{item.detail && <div className="mt-1 text-xs leading-5 text-[#77827b]">{item.detail}</div>}</div><button type="button" onClick={() => onDelete(item.id)} aria-label={`Delete ${item.name}`} data-testid={`button-delete-${testId}-${item.id}`} className="rounded p-1 text-[#9b9e96] opacity-70 transition-colors hover:bg-[#ffe0d6] hover:text-[#c8462c] group-hover:opacity-100"><Trash2 size={14} /></button></div>)}</div>
    </Panel>
  );
}

export default function DndModule() {
  const { user } = useUser();
  const scope = user?.id ?? 'guest';
  const storageKey = `nerd-foundry:dnd:${scope}:v1`;
  const [data, setData] = useState<ForgeData>(() => initialData());
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<ForgeView>('characters');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      const parsed = stored ? JSON.parse(stored) as ForgeData : initialData();
      setData(parsed);
      setSelectedCharacterId(parsed.characters[0]?.id ?? null);
      setSelectedCampaignId(parsed.campaigns[0]?.id ?? null);
    } catch {
      setData(initialData());
    }
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (loaded) window.localStorage.setItem(storageKey, JSON.stringify(data));
  }, [data, loaded, storageKey]);

  const selectedCharacter = data.characters.find((character) => character.id === selectedCharacterId) ?? null;
  const selectedCampaign = data.campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? null;
  const updateData = (updater: (current: ForgeData) => ForgeData) => setData((current) => updater(current));
  const updateCharacter = (id: string, patch: Partial<Character>) => updateData((current) => ({ ...current, characters: current.characters.map((character) => character.id === id ? { ...character, ...patch } : character) }));
  const updateCampaign = (id: string, patch: Partial<Campaign>) => updateData((current) => ({ ...current, campaigns: current.campaigns.map((campaign) => campaign.id === id ? { ...campaign, ...patch } : campaign) }));
  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(''), 2600); };

  const createCharacter = () => {
    const next: Character = { ...starterCharacter(), id: uid('char'), name: 'Untitled adventurer', player: '', level: 1, hp: 8, ac: 10, initiative: 0, proficiency: 2, feats: [], inventory: [], equipment: [], spells: [], notes: '' };
    updateData((current) => ({ ...current, characters: [...current.characters, next] }));
    setSelectedCharacterId(next.id);
    setView('characters');
  };
  const deleteCharacter = (id: string) => {
    updateData((current) => ({ ...current, characters: current.characters.filter((character) => character.id !== id), campaigns: current.campaigns.map((campaign) => ({ ...campaign, playerCharacters: campaign.playerCharacters.filter((characterId) => characterId !== id) })) }));
    setSelectedCharacterId(data.characters.find((character) => character.id !== id)?.id ?? null);
    notify('Character sheet archived.');
  };
  const createCampaign = () => {
    const next = { ...starterCampaign(), id: uid('camp'), name: 'Untitled campaign', pitch: '' };
    updateData((current) => ({ ...current, campaigns: [...current.campaigns, next] }));
    setSelectedCampaignId(next.id);
    setView('campaigns');
  };
  const deleteCampaign = (id: string) => {
    updateData((current) => ({ ...current, campaigns: current.campaigns.filter((campaign) => campaign.id !== id) }));
    setSelectedCampaignId(data.campaigns.find((campaign) => campaign.id !== id)?.id ?? null);
    notify('Campaign removed from this bench.');
  };

  const tabs: { id: ForgeView; label: string; icon: typeof Swords; note: string }[] = [
    { id: 'characters', label: 'Character Forge', icon: Shield, note: 'sheets & math' },
    { id: 'campaigns', label: 'Campaign Forge', icon: ScrollText, note: 'table memory' },
    { id: 'world', label: 'World Forge', icon: Map, note: 'setting foundation' },
    { id: 'kit', label: 'DM Kit', icon: Dices, note: 'live table tools' },
  ];

  return (
    <div className="nf-noise min-h-[100dvh] bg-[#f4f0e8] text-[#182129]">
      <header className="border-b-2 border-[#182129] bg-[#f8f5ef]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-5 px-4 py-4 sm:px-7 lg:px-10">
           <div className="flex items-center gap-3"><Link href="/dashboard" className="flex h-10 w-10 items-center justify-center rounded-[10px] border-2 border-[#182129] bg-[#182129] text-[#f4f0e8] shadow-[4px_4px_0_#ff653f] transition-transform hover:-translate-y-0.5" aria-label="Return to Workbench" data-testid="link-dnd-workbench"><Swords size={19} /></Link><div><div className="nf-display text-sm font-bold tracking-[-.045em]">THE NERD <span className="text-[#ff653f]">FOUNDRY</span></div><div className="nf-mono text-[9px] uppercase tracking-[.18em] text-[#7b8580]">dungeons & dragons / module 01</div></div></div>
           <div className="hidden items-center gap-3 sm:flex"><Link href="/settings" className="text-xs font-bold text-[#697574] transition-colors hover:text-[#ff653f]" data-testid="link-dnd-account">Account</Link><span className="h-2 w-2 rounded-full bg-[#b8d94b]" /><span className="nf-mono text-[9px] uppercase tracking-[.15em] text-[#77827b]">local bench · {user?.firstName || 'guest hand'}</span><span className="rounded border border-[#c8c4b9] bg-[#e9edcf] px-2 py-1 nf-mono text-[8px] uppercase text-[#52621f]">saved</span></div>
        </div>
        <div className="nf-grid border-t border-[#ded9cf]"><nav className="mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-4 py-2 sm:px-7 lg:px-10" aria-label="D&D module views">{tabs.map((tab) => { const Icon = tab.icon; return <button type="button" key={tab.id} data-testid={`tab-${tab.id}`} onClick={() => setView(tab.id)} className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-left transition-colors ${view === tab.id ? 'bg-[#182129] text-[#f4f0e8] shadow-[3px_3px_0_#b8d94b]' : 'text-[#526060] hover:bg-[#e9edcf]'}`}><Icon size={15} /><span><span className="block text-xs font-bold">{tab.label}</span><span className={`nf-mono hidden text-[8px] uppercase tracking-[.1em] sm:block ${view === tab.id ? 'text-[#b8d94b]' : 'text-[#89928b]'}`}>{tab.note}</span></span></button>; })}</nav></div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="nf-mono text-[10px] font-bold uppercase tracking-[.2em] text-[#ff653f]">the campaign maker’s bench</div><h1 className="nf-display mt-2 max-w-[760px] text-4xl font-bold leading-[.92] tracking-[-.07em] sm:text-6xl">{view === 'characters' ? 'Keep the numbers honest.' : view === 'campaigns' ? 'Leave the table better than you found it.' : view === 'world' ? 'Give the map somewhere to go.' : 'Tools for the six-second decision.'}</h1><p className="mt-4 max-w-[620px] text-sm leading-6 text-[#697574]">{view === 'characters' ? 'A reliable character sheet for the details that matter in play, from proficiency math to the thing nobody remembers until session three.' : view === 'campaigns' ? 'Campaign memory that sits beside the moving parts: people, places, promises, and the last thing the players definitely did not expect.' : view === 'world' ? 'Build outward from the table. Keep regions, powers, gods, and history close enough to collide.' : 'Initiative, encounters, dice, and sparks. Small instruments, ready before the room gets loud.'}</p></div><div className="nf-mono max-w-[200px] border-l-2 border-[#ff653f] pl-3 text-[10px] uppercase leading-5 tracking-[.12em] text-[#77827b]">No account sync.<br />No hidden rolls.<br /><span className="text-[#182129]">Just your local bench.</span></div></div>

        {!loaded ? <div className="grid gap-3 md:grid-cols-3"><div className="h-36 animate-pulse rounded-xl bg-[#e7e1d6]" /><div className="h-36 animate-pulse rounded-xl bg-[#e7e1d6]" /><div className="h-36 animate-pulse rounded-xl bg-[#e7e1d6]" /></div> : view === 'characters' ? (
          <CharacterForge characters={data.characters} selected={selectedCharacter} selectedId={selectedCharacterId} onSelect={setSelectedCharacterId} onCreate={createCharacter} onDelete={deleteCharacter} onUpdate={updateCharacter} onNotify={notify} />
        ) : view === 'campaigns' ? (
          <CampaignForge campaigns={data.campaigns} characters={data.characters} selected={selectedCampaign} selectedId={selectedCampaignId} onSelect={setSelectedCampaignId} onCreate={createCampaign} onDelete={deleteCampaign} onUpdate={updateCampaign} onNotify={notify} />
        ) : view === 'world' ? (
          <WorldForge campaign={selectedCampaign} onUpdate={updateCampaign} onNotify={notify} />
        ) : (
          <DmKit data={data} campaigns={data.campaigns} selectedCampaign={selectedCampaign} onUpdate={updateData} onCampaignUpdate={updateCampaign} onNotify={notify} />
        )}
      </main>
      {notice && <div data-testid="status-notice" className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-md border-2 border-[#182129] bg-[#182129] px-4 py-3 text-xs font-bold text-[#f4f0e8] shadow-[5px_5px_0_#ff653f]"><Check size={15} className="text-[#b8d94b]" />{notice}</div>}
    </div>
  );
}

function CharacterForge({ characters, selected, selectedId, onSelect, onCreate, onDelete, onUpdate, onNotify }: { characters: Character[]; selected: Character | null; selectedId: string | null; onSelect: (id: string) => void; onCreate: () => void; onDelete: (id: string) => void; onUpdate: (id: string, patch: Partial<Character>) => void; onNotify: (message: string) => void }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Panel title="Character sheets" kicker={`${characters.length} on the bench`} action={<button type="button" data-testid="button-create-character" onClick={onCreate} className="rounded-md bg-[#ff653f] p-2 text-[#182129] shadow-[2px_2px_0_#182129] hover:translate-y-[-1px]" aria-label="Create character"><Plus size={16} /></button>}>
        <div className="grid gap-2">{characters.length === 0 ? <EmptyState icon={Shield} title="No sheets yet" copy="Start with a name, then let the numbers catch up." /> : characters.map((character) => <button type="button" key={character.id} data-testid={`button-select-character-${character.id}`} onClick={() => onSelect(character.id)} className={`group rounded-md border p-3 text-left transition-all ${selectedId === character.id ? 'border-[#182129] bg-[#e9edcf] shadow-[3px_3px_0_#ff653f]' : 'border-[#d5d0c7] bg-[#f8f5ef] hover:border-[#182129]'}`}><div className="flex items-start justify-between gap-2"><span className="truncate text-sm font-bold">{character.name || 'Unnamed adventurer'}</span><ChevronRight size={15} className={`shrink-0 ${selectedId === character.id ? 'text-[#ff653f]' : 'text-[#a4a8a0]'}`} /></div><div className="mt-1 text-xs text-[#77827b]">{character.level} · {character.race || 'Unshaped'} {character.className || 'class'}</div><div className="mt-3 flex gap-1 nf-mono text-[8px] uppercase tracking-[.1em] text-[#9a9e96]"><span>{character.player || 'open seat'}</span><span>·</span><span>hp {character.hp}</span></div></button>)}</div>
        <ActionButton tone="quiet" testId="button-create-character-bottom" onClick={onCreate}><FolderPlus size={14} /> New character</ActionButton>
      </Panel>
      {selected ? <CharacterEditor character={selected} onUpdate={onUpdate} onDelete={onDelete} onNotify={onNotify} /> : <EmptyState icon={Shield} title="Choose a character" copy="Your next adventurer belongs here." />}
    </div>
  );
}

function CharacterEditor({ character, onUpdate, onDelete, onNotify }: { character: Character; onUpdate: (id: string, patch: Partial<Character>) => void; onDelete: (id: string) => void; onNotify: (message: string) => void }) {
  const [levelUpOpen, setLevelUpOpen] = useState(false);
  const [levelNote, setLevelNote] = useState('');
  const patch = (key: keyof Character, value: string | number | string[] | Record<Ability, number>) => onUpdate(character.id, { [key]: value } as Partial<Character>);
  const abilityModifier = (score: number) => Math.floor((score - 10) / 2);
  const levelUp = () => { const nextLevel = character.level + 1; const note = levelNote.trim(); patch('level', nextLevel); if (note) patch('feats', [...character.feats, `Level ${nextLevel}: ${note}`]); setLevelNote(''); setLevelUpOpen(false); onNotify(`Level ${nextLevel} recorded for ${character.name || 'this adventurer'}.`); };
  return (
    <div className="grid min-w-0 gap-5">
      <Panel className="bg-[#e7edc9]" title={character.name || 'Unnamed adventurer'} kicker="active character sheet" action={<div className="flex gap-2"><ActionButton tone="lime" testId="button-level-up" onClick={() => setLevelUpOpen((open) => !open)}><Zap size={14} /> Level up</ActionButton><button type="button" data-testid="button-delete-character" onClick={() => onDelete(character.id)} aria-label="Delete character" className="rounded-md border border-[#c7aaa0] bg-[#ffe7de] px-2.5 text-[#a53c27] hover:bg-[#ffdbcf]"><Trash2 size={15} /></button></div>}>
        {levelUpOpen && <div className="mb-5 flex flex-col gap-2 rounded-md border border-[#a7b56c] bg-[#f8f5ef]/70 p-3 sm:flex-row sm:items-end"><div className="flex-1"><Field label={`Level ${character.level} → ${character.level + 1} note or feat / ASI`} value={levelNote} onChange={setLevelNote} placeholder="e.g. +2 DEX, Fey Touched, new oath" testId="input-level-up-note" /></div><ActionButton tone="coral" testId="button-confirm-level-up" onClick={levelUp}><Check size={14} /> Record level up</ActionButton></div>}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Field label="Name" value={character.name} onChange={(value) => patch('name', value)} placeholder="Character name" testId="input-character-name" /><Field label="Player" value={character.player} onChange={(value) => patch('player', value)} placeholder="Player or seat" testId="input-character-player" /><Field label="Race / lineage" value={character.race} onChange={(value) => patch('race', value)} placeholder="Lineage" testId="input-character-race" /><Field label="Class" value={character.className} onChange={(value) => patch('className', value)} placeholder="Class" testId="input-character-class" /><Field label="Subclass" value={character.subclass} onChange={(value) => patch('subclass', value)} placeholder="Subclass or path" testId="input-character-subclass" /><Field label="Level" type="number" value={character.level} onChange={(value) => patch('level', Number(value) || 1)} placeholder="1" testId="input-character-level" /><Field label="HP max" type="number" value={character.hp} onChange={(value) => patch('hp', Number(value) || 0)} placeholder="0" testId="input-character-hp" /><Field label="AC" type="number" value={character.ac} onChange={(value) => patch('ac', Number(value) || 0)} placeholder="10" testId="input-character-ac" /><Field label="Initiative" type="number" value={character.initiative} onChange={(value) => patch('initiative', Number(value) || 0)} placeholder="0" testId="input-character-initiative" /><Field label="Proficiency bonus" type="number" value={character.proficiency} onChange={(value) => patch('proficiency', Number(value) || 0)} placeholder="2" testId="input-character-proficiency" /></div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <Panel title="Ability scores" kicker="core math">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{abilities.map((ability) => <label key={ability} className="grid gap-1 rounded-md border border-[#d5d0c7] bg-[#f8f5ef] p-2 text-center"><span className="nf-mono text-[9px] font-bold tracking-[.12em] text-[#ff653f]">{ability}</span><input data-testid={`input-ability-${ability}`} type="number" value={character.abilityScores[ability]} onChange={(event) => patch('abilityScores', { ...character.abilityScores, [ability]: Number(event.target.value) || 0 })} className="w-full bg-transparent text-center text-xl font-bold outline-none" /><span className="nf-mono text-[10px] text-[#77827b]">{abilityModifier(character.abilityScores[ability]) >= 0 ? '+' : ''}{abilityModifier(character.abilityScores[ability])}</span></label>)}</div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2"><ChipList label="Saving throws" items={character.saves} onChange={(items) => patch('saves', items)} placeholder="Add saving throw" testId="character-saves" /><ChipList label="Skills" items={character.skills} onChange={(items) => patch('skills', items)} placeholder="Add trained skill" testId="character-skills" /></div>
        </Panel>
        <Panel title="Multiclass & advancement" kicker="build history"><div className="grid gap-4"><ChipList label="Multiclass entries" items={character.multiclass} onChange={(items) => patch('multiclass', items)} placeholder="e.g. Rogue 2" testId="character-multiclass" /><ChipList label="Feats / ASI / level notes" items={character.feats} onChange={(items) => patch('feats', items)} placeholder="Add feat or ASI" testId="character-feats" /></div></Panel>
      </div>
      <div className="grid gap-5 xl:grid-cols-3"><Panel title="Pack & purse" kicker="what is within reach"><div className="grid gap-4"><ChipList label="Inventory" items={character.inventory} onChange={(items) => patch('inventory', items)} placeholder="Add carried item" testId="character-inventory" /><ChipList label="Equipment" items={character.equipment} onChange={(items) => patch('equipment', items)} placeholder="Add equipped item" testId="character-equipment" /><Field label="Currency" value={character.currency} onChange={(value) => patch('currency', value)} placeholder="12 gp · 4 sp" testId="input-character-currency" /></div></Panel><Panel title="Spellbook" kicker="prepared & known"><ChipList label="Spells" items={character.spells} onChange={(items) => patch('spells', items)} placeholder="Add spell" testId="character-spells" /></Panel><Panel title="Table notes" kicker="the details that become plot"><TextArea label="Notes" value={character.notes} onChange={(value) => patch('notes', value)} placeholder="Bonds, clues, promises, rules questions..." testId="textarea-character-notes" rows={9} /></Panel></div>
    </div>
  );
}

function CampaignForge({ campaigns, characters, selected, selectedId, onSelect, onCreate, onDelete, onUpdate, onNotify }: { campaigns: Campaign[]; characters: Character[]; selected: Campaign | null; selectedId: string | null; onSelect: (id: string) => void; onCreate: () => void; onDelete: (id: string) => void; onUpdate: (id: string, patch: Partial<Campaign>) => void; onNotify: (message: string) => void }) {
  return <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]"><Panel title="Campaigns" kicker={`${campaigns.length} worlds in motion`} action={<button type="button" data-testid="button-create-campaign" onClick={onCreate} className="rounded-md bg-[#ff653f] p-2 shadow-[2px_2px_0_#182129]" aria-label="Create campaign"><Plus size={16} /></button>}><div className="grid gap-2">{campaigns.length === 0 ? <EmptyState icon={ScrollText} title="No campaigns yet" copy="A blank page is a perfectly good beginning." /> : campaigns.map((campaign) => <button type="button" key={campaign.id} data-testid={`button-select-campaign-${campaign.id}`} onClick={() => onSelect(campaign.id)} className={`rounded-md border p-3 text-left transition-all ${selectedId === campaign.id ? 'border-[#182129] bg-[#ffe0d6] shadow-[3px_3px_0_#b8d94b]' : 'border-[#d5d0c7] bg-[#f8f5ef] hover:border-[#182129]'}`}><div className="flex justify-between gap-2"><span className="truncate text-sm font-bold">{campaign.name}</span><ChevronRight size={15} /></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#77827b]">{campaign.pitch || 'No campaign pitch yet.'}</p></button>)}</div><ActionButton tone="quiet" testId="button-create-campaign-bottom" onClick={onCreate}><FolderPlus size={14} /> New campaign</ActionButton></Panel>{selected ? <CampaignWorkspace campaign={selected} characters={characters} onUpdate={onUpdate} onDelete={onDelete} onNotify={onNotify} /> : <EmptyState icon={ScrollText} title="Choose a campaign" copy="Select a world in motion, or make the first one." />}</div>;
}

function CampaignWorkspace({ campaign, characters, onUpdate, onDelete, onNotify }: { campaign: Campaign; characters: Character[]; onUpdate: (id: string, patch: Partial<Campaign>) => void; onDelete: (id: string) => void; onNotify: (message: string) => void }) {
  const patch = (key: keyof Campaign, value: string | string[] | Session[] | CollectionItem[]) => onUpdate(campaign.id, { [key]: value } as Partial<Campaign>);
  const addCollection = (key: 'npcs' | 'quests' | 'locations' | 'factions' | 'items' | 'lore', item: CollectionItem) => patch(key, [...campaign[key], item]);
  const deleteCollection = (key: 'npcs' | 'quests' | 'locations' | 'factions' | 'items' | 'lore', id: string) => patch(key, campaign[key].filter((item) => item.id !== id));
  const addSession = (item: CollectionItem) => patch('sessions', [...campaign.sessions, { ...item, date: new Date().toISOString().slice(0, 10) }]);
  const linked = characters.filter((character) => campaign.playerCharacters.includes(character.id));
  const unlinked = characters.filter((character) => !campaign.playerCharacters.includes(character.id));
  return <div className="grid min-w-0 gap-5"><Panel className="bg-[#ffe0d6]" title={campaign.name} kicker="selected campaign workspace" action={<button type="button" data-testid="button-delete-campaign" onClick={() => onDelete(campaign.id)} className="rounded-md border border-[#d0a59a] bg-[#f8f5ef] p-2 text-[#a53c27] hover:bg-[#ffcec0]" aria-label="Delete campaign"><Trash2 size={15} /></button>}><div className="grid gap-3 md:grid-cols-[1fr_1.6fr]"><Field label="Campaign name" value={campaign.name} onChange={(value) => patch('name', value)} placeholder="Campaign name" testId="input-campaign-name" /><Field label="Pitch / current arc" value={campaign.pitch} onChange={(value) => patch('pitch', value)} placeholder="What is moving right now?" testId="input-campaign-pitch" /></div><div className="mt-4 flex flex-wrap items-center gap-2"><span className="nf-mono text-[9px] uppercase tracking-[.12em] text-[#8f594c]">Player characters</span>{linked.map((character) => <button type="button" key={character.id} data-testid={`button-unlink-character-${character.id}`} onClick={() => patch('playerCharacters', campaign.playerCharacters.filter((id) => id !== character.id))} className="rounded bg-[#182129] px-2 py-1 text-[10px] font-bold text-[#f4f0e8]">{character.name} <X size={11} className="ml-1 inline" /></button>)}{unlinked.length > 0 && <select data-testid="select-link-character" value="" onChange={(event) => { if (event.target.value) patch('playerCharacters', [...campaign.playerCharacters, event.target.value]); }} className="rounded border border-[#caa197] bg-[#f8f5ef] px-2 py-1.5 text-[10px] font-semibold"><option value="">+ link a sheet</option>{unlinked.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}</select>}{characters.length === 0 && <span className="text-xs text-[#8f6c63]">Create a character sheet to link it here.</span>}</div></Panel><div className="grid gap-5 xl:grid-cols-2"><CollectionPanel title="Sessions" kicker="what happened" items={campaign.sessions.map((session) => ({ id: session.id, name: `${session.date} · ${session.name}`, detail: session.detail }))} onAdd={addSession} onDelete={(id) => patch('sessions', campaign.sessions.filter((session) => session.id !== id))} placeholder="Session title" icon={History} testId="sessions" /><CollectionPanel title="NPCs" kicker="faces at the table" items={campaign.npcs} onAdd={(item) => addCollection('npcs', item)} onDelete={(id) => deleteCollection('npcs', id)} placeholder="NPC name" icon={CircleDot} testId="npcs" /><CollectionPanel title="Quests" kicker="open threads" items={campaign.quests} onAdd={(item) => addCollection('quests', item)} onDelete={(id) => deleteCollection('quests', id)} placeholder="Quest or promise" icon={Crosshair} testId="quests" /><CollectionPanel title="Locations" kicker="places with pressure" items={campaign.locations} onAdd={(item) => addCollection('locations', item)} onDelete={(id) => deleteCollection('locations', id)} placeholder="Location name" icon={Map} testId="locations" /><CollectionPanel title="Factions" kicker="who wants what" items={campaign.factions} onAdd={(item) => addCollection('factions', item)} onDelete={(id) => deleteCollection('factions', id)} placeholder="Faction name" icon={Shield} testId="factions" /><CollectionPanel title="Items" kicker="objects with a past" items={campaign.items} onAdd={(item) => addCollection('items', item)} onDelete={(id) => deleteCollection('items', id)} placeholder="Item name" icon={Sparkles} testId="items" /><CollectionPanel title="Lore" kicker="the connective tissue" items={campaign.lore} onAdd={(item) => addCollection('lore', item)} onDelete={(id) => deleteCollection('lore', id)} placeholder="Lore fragment" icon={BookOpen} testId="lore" /></div><Panel title="Campaign notes" kicker="the living page"><TextArea label="Notes" value={campaign.notes} onChange={(value) => patch('notes', value)} placeholder="Session recap, table agreements, clues still warm..." testId="textarea-campaign-notes" rows={7} /><div className="mt-3 flex items-center gap-2 text-[10px] text-[#77827b]"><Save size={13} className="text-[#768a32]" /> Saved locally as you type.</div></Panel></div>;
}

function WorldForge({ campaign, onUpdate, onNotify }: { campaign: Campaign | null; onUpdate: (id: string, patch: Partial<Campaign>) => void; onNotify: (message: string) => void }) {
  if (!campaign) return <EmptyState icon={Map} title="Choose a campaign first" copy="World foundations belong to a campaign. Open Campaign Forge and make a workspace." />;
  const world = campaign.world;
  const updateWorld = (patch: Partial<World>) => onUpdate(campaign.id, { world: { ...world, ...patch } });
  const add = (key: keyof World, item: CollectionItem) => updateWorld({ [key]: [...world[key], item] } as Partial<World>);
  const remove = (key: keyof World, id: string) => updateWorld({ [key]: world[key].filter((item) => item.id !== id) } as Partial<World>);
  const sections: { key: keyof World; title: string; kicker: string; placeholder: string; icon: typeof Map }[] = [
    { key: 'regions', title: 'Regions', kicker: 'shape the horizon', placeholder: 'Region name', icon: Map },
    { key: 'nations', title: 'Nations', kicker: 'borders & banners', placeholder: 'Nation name', icon: Archive },
    { key: 'npcs', title: 'World NPCs', kicker: 'voices beyond the party', placeholder: 'NPC name', icon: CircleDot },
    { key: 'factions', title: 'World factions', kicker: 'pressure systems', placeholder: 'Faction name', icon: Shield },
    { key: 'deities', title: 'Deities', kicker: 'what answers back', placeholder: 'Deity name', icon: Sparkles },
    { key: 'cultures', title: 'Cultures', kicker: 'customs & friction', placeholder: 'Culture name', icon: Library },
    { key: 'events', title: 'Historical events', kicker: 'scars on the map', placeholder: 'Event name', icon: Flame },
    { key: 'timelines', title: 'Timelines', kicker: 'when it all moves', placeholder: 'Date or era', icon: History },
  ];
  return <div className="grid gap-5"><Panel className="bg-[#dce8ed]" title={`${campaign.name} / world foundation`} kicker="selected campaign world"><p className="max-w-2xl text-sm leading-6 text-[#526060]">A flat foundation is enough to play. Add the detail that makes your table ask a second question, not an encyclopedia no one opens.</p><div className="mt-4 flex flex-wrap gap-2 nf-mono text-[9px] uppercase tracking-[.12em] text-[#64767a]"><span className="rounded bg-[#f8f5ef] px-2 py-1">{Object.values(world).flat().length} artifacts</span><span className="rounded bg-[#f8f5ef] px-2 py-1">bound to {campaign.name}</span></div></Panel><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{sections.map((section) => <CollectionPanel key={section.key} title={section.title} kicker={section.kicker} items={world[section.key]} onAdd={(item) => add(section.key, item)} onDelete={(id) => remove(section.key, id)} placeholder={section.placeholder} icon={section.icon} testId={`world-${section.key}`} />)}</div><div className="nf-mono flex items-center gap-2 text-[10px] uppercase tracking-[.1em] text-[#77827b]"><Check size={14} className="text-[#768a32]" /> World notes save inside the selected campaign workspace.</div></div>;
}

function DmKit({ data, campaigns, selectedCampaign, onUpdate, onCampaignUpdate, onNotify }: { data: ForgeData; campaigns: Campaign[]; selectedCampaign: Campaign | null; onUpdate: (updater: (current: ForgeData) => ForgeData) => void; onCampaignUpdate: (id: string, patch: Partial<Campaign>) => void; onNotify: (message: string) => void }) {
  const [initiativeName, setInitiativeName] = useState('');
  const [initiativeValue, setInitiativeValue] = useState('10');
  const [initiativeHp, setInitiativeHp] = useState('10');
  const [activeTurn, setActiveTurn] = useState(0);
  const [encounterName, setEncounterName] = useState('');
  const [encounterQuantity, setEncounterQuantity] = useState('1');
  const [encounterXp, setEncounterXp] = useState('50');
  const [expression, setExpression] = useState('d20');
  const [generated, setGenerated] = useState<{ kind: string; value: string } | null>(null);
  const [generatorIndex, setGeneratorIndex] = useState<Record<string, number>>({});
  const totalXp = useMemo(() => data.encounter.reduce((total, entry) => total + entry.quantity * entry.xp, 0), [data.encounter]);
  const addInitiative = () => { if (!initiativeName.trim()) return; onUpdate((current) => ({ ...current, initiative: [...current.initiative, { id: uid('turn'), name: initiativeName.trim(), initiative: Number(initiativeValue) || 0, hp: Number(initiativeHp) || 0, note: '' }].sort((a, b) => b.initiative - a.initiative) })); setInitiativeName(''); };
  const addEncounter = () => { if (!encounterName.trim()) return; onUpdate((current) => ({ ...current, encounter: [...current.encounter, { id: uid('enc'), name: encounterName.trim(), quantity: Math.max(1, Number(encounterQuantity) || 1), xp: Math.max(0, Number(encounterXp) || 0) }] })); setEncounterName(''); };
  const roll = () => { const clean = expression.toLowerCase().replace(/\s/g, ''); const match = clean.match(/^(\d*)d(\d+)([+-]\d+)?$/); if (!match) { onNotify('Use a dice expression like d20 or 2d6+3.'); return; } const count = Math.min(50, Math.max(1, Number(match[1]) || 1)); const sides = Math.min(1000, Math.max(2, Number(match[2]))); const modifier = Number(match[3] || 0); const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1); const total = rolls.reduce((sum, value) => sum + value, 0) + modifier; onUpdate((current) => ({ ...current, rolls: [{ id: uid('roll'), expression, total, rolls, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...current.rolls].slice(0, 20) })); };
  const generate = (kind: keyof typeof generatorLists, label: string) => { const index = (generatorIndex[kind] ?? 0) % generatorLists[kind].length; const value = generatorLists[kind][index]; setGeneratorIndex((current) => ({ ...current, [kind]: index + 1 })); setGenerated({ kind: label, value }); };
  const saveGenerated = () => { if (!generated || !selectedCampaign) { onNotify(selectedCampaign ? 'Generate a result first.' : 'Choose a campaign in Campaign Forge first.'); return; } onCampaignUpdate(selectedCampaign.id, { notes: `${selectedCampaign.notes}${selectedCampaign.notes ? '\n\n' : ''}[${generated.kind}] ${generated.value}` }); onNotify('Generator result added to campaign notes.'); };
  const advance = () => { if (data.initiative.length) setActiveTurn((turn) => (turn + 1) % data.initiative.length); };
  const reset = () => setActiveTurn(0);
  const removeInitiative = (id: string) => onUpdate((current) => ({ ...current, initiative: current.initiative.filter((entry) => entry.id !== id) }));
  return <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]"><Panel className="bg-[#dce8ed]" title="Initiative tracker" kicker="the room is live" action={<div className="flex gap-2"><ActionButton tone="quiet" testId="button-reset-initiative" onClick={reset}><RotateCcw size={13} /> Reset</ActionButton><ActionButton tone="coral" testId="button-advance-initiative" onClick={advance}><ArrowRight size={13} /> Advance</ActionButton></div>}><div className="grid gap-2 sm:grid-cols-[1fr_80px_80px_auto]"><input data-testid="input-initiative-name" value={initiativeName} onChange={(event) => setInitiativeName(event.target.value)} placeholder="Creature or character" className="rounded-md border border-[#bdb9af] bg-[#f8f5ef] px-3 py-2 text-xs outline-none focus:border-[#ff653f]" /><input data-testid="input-initiative-value" type="number" value={initiativeValue} onChange={(event) => setInitiativeValue(event.target.value)} aria-label="Initiative value" className="rounded-md border border-[#bdb9af] bg-[#f8f5ef] px-2 py-2 text-xs outline-none focus:border-[#ff653f]" /><input data-testid="input-initiative-hp" type="number" value={initiativeHp} onChange={(event) => setInitiativeHp(event.target.value)} aria-label="Hit points" className="rounded-md border border-[#bdb9af] bg-[#f8f5ef] px-2 py-2 text-xs outline-none focus:border-[#ff653f]" /><ActionButton tone="ink" testId="button-add-initiative" onClick={addInitiative}><Plus size={14} /> Add</ActionButton></div><div className="mt-4 grid gap-2">{data.initiative.length === 0 ? <EmptyState icon={Swords} title="No combatants yet" copy="Add the creatures and heroes before the first roll." /> : data.initiative.map((entry, index) => <div key={entry.id} data-testid={`row-initiative-${entry.id}`} className={`flex items-center gap-3 rounded-md border p-3 ${index === activeTurn ? 'border-[#ff653f] bg-[#ffe0d6]' : 'border-[#d5d0c7] bg-[#f8f5ef]'}`}><span className="nf-mono w-7 text-center text-sm font-bold text-[#ff653f]">{entry.initiative}</span><div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{entry.name}</div><div className="nf-mono mt-1 text-[9px] uppercase tracking-[.1em] text-[#77827b]">HP {entry.hp} {index === activeTurn && <span className="ml-2 text-[#c8462c]">current turn</span>}</div></div><button type="button" data-testid={`button-remove-initiative-${entry.id}`} onClick={() => removeInitiative(entry.id)} aria-label={`Remove ${entry.name}`} className="rounded p-1 text-[#9b9e96] hover:bg-[#ffdbcf] hover:text-[#c8462c]"><Minus size={15} /></button></div>)}</div></Panel><Panel title="Encounter builder" kicker="budget the trouble"><div className="grid gap-2 sm:grid-cols-[1fr_68px_78px_auto]"><input data-testid="input-encounter-name" value={encounterName} onChange={(event) => setEncounterName(event.target.value)} placeholder="Monster or group" className="rounded-md border border-[#bdb9af] bg-[#f8f5ef] px-3 py-2 text-xs outline-none focus:border-[#ff653f]" /><input data-testid="input-encounter-quantity" type="number" value={encounterQuantity} onChange={(event) => setEncounterQuantity(event.target.value)} aria-label="Quantity" className="rounded-md border border-[#bdb9af] bg-[#f8f5ef] px-2 py-2 text-xs outline-none focus:border-[#ff653f]" /><input data-testid="input-encounter-xp" type="number" value={encounterXp} onChange={(event) => setEncounterXp(event.target.value)} aria-label="XP each" className="rounded-md border border-[#bdb9af] bg-[#f8f5ef] px-2 py-2 text-xs outline-none focus:border-[#ff653f]" /><ActionButton tone="coral" testId="button-add-encounter" onClick={addEncounter}><Plus size={14} /> Add</ActionButton></div><div className="mt-4 flex items-center justify-between rounded-md border border-[#a7b56c] bg-[#e9edcf] px-3 py-2"><span className="nf-mono text-[9px] uppercase tracking-[.12em] text-[#64752b]">total XP</span><strong data-testid="text-total-xp" className="nf-display text-xl">{totalXp.toLocaleString()}</strong></div><div className="mt-3 grid gap-2">{data.encounter.length === 0 ? <EmptyState icon={Skull} title="Encounter is quiet" copy="Add an entry to start a rough XP budget." /> : data.encounter.map((entry) => <div key={entry.id} className="flex items-center gap-3 rounded-md border border-[#d5d0c7] bg-[#f8f5ef] p-3"><div className="flex-1 text-sm font-bold">{entry.quantity} × {entry.name}</div><span className="nf-mono text-[10px] text-[#77827b]">{(entry.quantity * entry.xp).toLocaleString()} XP</span><button type="button" data-testid={`button-remove-encounter-${entry.id}`} onClick={() => onUpdate((current) => ({ ...current, encounter: current.encounter.filter((item) => item.id !== entry.id) }))} className="text-[#9b9e96] hover:text-[#c8462c]" aria-label={`Remove ${entry.name}`}><Trash2 size={14} /></button></div>)}</div></Panel><Panel title="Dice roller" kicker="no browser tab required"><div className="flex gap-2"><input data-testid="input-dice-expression" value={expression} onChange={(event) => setExpression(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') roll(); }} placeholder="d20, 2d6+3" className="min-w-0 flex-1 rounded-md border border-[#bdb9af] bg-[#f8f5ef] px-3 py-2.5 font-mono text-sm outline-none focus:border-[#ff653f]" /><ActionButton tone="ink" testId="button-roll-dice" onClick={roll}><Dices size={15} /> Roll</ActionButton></div><div className="mt-4 grid gap-2">{data.rolls.length === 0 ? <EmptyState icon={Dices} title="No rolls yet" copy="The table is waiting for your first expression." /> : data.rolls.slice(0, 6).map((record) => <div key={record.id} data-testid={`row-roll-${record.id}`} className="flex items-center gap-3 border-b border-[#e0dcd2] pb-2 text-xs"><span className="nf-mono w-16 text-[#ff653f]">{record.expression}</span><strong className="text-lg">{record.total}</strong><span className="min-w-0 flex-1 truncate text-[#77827b]">[{record.rolls.join(', ')}]</span><span className="nf-mono text-[9px] text-[#a0a39b]">{record.timestamp}</span></div>)}</div></Panel><GeneratorPanel generated={generated} onGenerate={generate} onSave={saveGenerated} /></div>;
}

function GeneratorPanel({ generated, onGenerate, onSave }: { generated: { kind: string; value: string } | null; onGenerate: (kind: keyof typeof generatorLists, label: string) => void; onSave: () => void }) {
  const generators: { key: keyof typeof generatorLists; label: string; icon: typeof Sparkles }[] = [{ key: 'names', label: 'Name', icon: WandSparkles }, { key: 'npc', label: 'NPC', icon: CircleDot }, { key: 'encounters', label: 'Encounter', icon: Swords }, { key: 'loot', label: 'Loot', icon: Coins }, { key: 'hooks', label: 'Plot hook', icon: Crosshair }, { key: 'events', label: 'Random event', icon: Zap }];
  return <Panel className="bg-[#182129] text-[#f4f0e8]" title="Generators" kicker="deterministic sparks" action={generated ? <ActionButton tone="lime" testId="button-save-generated" onClick={onSave}><Save size={13} /> Save to campaign notes</ActionButton> : undefined}><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{generators.map((generator) => { const Icon = generator.icon; return <button type="button" key={generator.key} data-testid={`button-generate-${generator.key}`} onClick={() => onGenerate(generator.key, generator.label)} className="flex items-center gap-2 rounded-md border border-[#43504d] bg-[#202c30] px-3 py-2.5 text-left text-xs font-bold text-[#dce4d9] transition-colors hover:border-[#b8d94b] hover:bg-[#27383a]"><Icon size={14} className="text-[#ff653f]" />{generator.label}</button>; })}</div>{generated ? <div data-testid="card-generated-result" className="mt-4 border-l-2 border-[#ff653f] bg-[#202c30] p-4"><div className="nf-mono text-[9px] uppercase tracking-[.15em] text-[#b8d94b]">{generated.kind}</div><p className="mt-2 text-base font-bold leading-6">{generated.value}</p></div> : <div className="mt-4 rounded-md border border-dashed border-[#43504d] px-4 py-5 text-xs text-[#aebbb1]">Pick a generator. Results advance through a small deterministic table so the same bench stays reproducible.</div>}</Panel>;
}