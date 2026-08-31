import { useEffect, useMemo, useState, type ButtonHTMLAttributes, type FormEvent, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { useUser } from '@clerk/react';
import {
  Archive,
  ArrowDownToLine,
  ArrowLeftRight,
  Boxes,
  Check,
  ChevronRight,
  ClipboardList,
  Dices,
  FlaskConical,
  Gauge,
  Hammer,
  Layers3,
  Minus,
  PackageOpen,
  Pencil,
  Plus,
  RotateCcw,
  ScrollText,
  Search,
  Shield,
  Skull,
  Swords,
  Trash2,
  WandSparkles,
  X,
} from 'lucide-react';
import { Link } from 'wouter';

type DeckSection = 'deck' | 'sideboard' | 'maybeboard';
type MTGTab = 'decks' | 'collection' | 'playtest' | 'custom';

type DeckCard = {
  id: string;
  name: string;
  quantity: number;
  type: string;
  manaValue: number;
  colors: string[];
  role: string;
  manaSource: boolean;
  ramp: boolean;
  removal: boolean;
  draw: boolean;
};

type Deck = {
  id: string;
  name: string;
  format: string;
  commander: string;
  colorIdentity: string[];
  deck: DeckCard[];
  sideboard: DeckCard[];
  maybeboard: DeckCard[];
};

type OwnedCard = {
  id: string;
  name: string;
  quantity: number;
  printing: string;
  set: string;
  collectorNumber: string;
  condition: string;
  foil: boolean;
  language: string;
  tradeStatus: string;
  notes: string;
};

type CustomCard = {
  id: string;
  name: string;
  manaCost: string;
  type: string;
  colors: string[];
  power: string;
  toughness: string;
  rulesText: string;
  flavorText: string;
  set: string;
  rarity: string;
  collectorNumber: string;
  artist: string;
  setMetadata: { code: string; name: string; releaseYear: string };
};

type TestCard = DeckCard & { uid: string };
type Playtest = {
  deckId: string | null;
  library: TestCard[];
  hand: TestCard[];
  battlefield: TestCard[];
  graveyard: TestCard[];
  exile: TestCard[];
  life: [number, number];
  commanderDamage: [number, number];
  mana: number;
  counters: number;
  tokens: number;
};

type Store = {
  decks: Deck[];
  collection: OwnedCard[];
  customCards: CustomCard[];
  playtest: Playtest;
};

const ink = '#182129';
const paper = '#f4f0e8';
const coral = '#ff653f';
const lime = '#b8d94b';
const muted = '#6d7875';
const blankDeck: Deck = {
  id: '',
  name: '',
  format: 'Commander',
  commander: '',
  colorIdentity: [],
  deck: [],
  sideboard: [],
  maybeboard: [],
};
const blankDeckCard: Omit<DeckCard, 'id'> = {
  name: '',
  quantity: 1,
  type: 'Creature',
  manaValue: 0,
  colors: [],
  role: 'Threat',
  manaSource: false,
  ramp: false,
  removal: false,
  draw: false,
};
const blankOwned: Omit<OwnedCard, 'id'> = {
  name: '',
  quantity: 1,
  printing: '',
  set: '',
  collectorNumber: '',
  condition: 'Near Mint',
  foil: false,
  language: 'English',
  tradeStatus: 'Keep',
  notes: '',
};
const blankCustom: Omit<CustomCard, 'id'> = {
  name: '',
  manaCost: '',
  type: 'Creature',
  colors: [],
  power: '',
  toughness: '',
  rulesText: '',
  flavorText: '',
  set: '',
  rarity: 'Common',
  collectorNumber: '',
  artist: '',
  setMetadata: { code: '', name: '', releaseYear: '' },
};

const emptyTest: Playtest = {
  deckId: null,
  library: [],
  hand: [],
  battlefield: [],
  graveyard: [],
  exile: [],
  life: [20, 20],
  commanderDamage: [0, 0],
  mana: 0,
  counters: 0,
  tokens: 0,
};

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function shuffle<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

function newStore(): Store {
  return { decks: [], collection: [], customCards: [], playtest: emptyTest };
}

function readStore(key: string): Store {
  try {
    const value = window.localStorage.getItem(key);
    if (!value) return newStore();
    const parsed = JSON.parse(value) as Partial<Store>;
    return {
      decks: Array.isArray(parsed.decks) ? parsed.decks : [],
      collection: Array.isArray(parsed.collection) ? parsed.collection : [],
      customCards: Array.isArray(parsed.customCards) ? parsed.customCards : [],
      playtest: parsed.playtest ?? emptyTest,
    };
  } catch {
    return newStore();
  }
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={cx('grid gap-1.5', wide && 'sm:col-span-2')}>
      <span className="nf-mono text-[9px] font-medium uppercase tracking-[.14em] text-[#68736f]">{label}</span>
      {children}
    </label>
  );
}

function Input({
  testId,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { testId: string }) {
  return (
    <input
      {...props}
      data-testid={testId}
      className={cx(
        'min-h-9 w-full rounded-md border border-[#bfc1b9] bg-[#fbf8f2] px-2.5 text-sm text-[#182129] outline-none transition-colors placeholder:text-[#9da39d] focus:border-[#ff653f] focus:ring-2 focus:ring-[#ff653f]/15',
        props.className,
      )}
    />
  );
}

function Select({
  testId,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { testId: string }) {
  return (
    <select
      {...props}
      data-testid={testId}
      className={cx(
        'min-h-9 w-full rounded-md border border-[#bfc1b9] bg-[#fbf8f2] px-2.5 text-sm text-[#182129] outline-none focus:border-[#ff653f] focus:ring-2 focus:ring-[#ff653f]/15',
        props.className,
      )}
    >
      {children}
    </select>
  );
}

function Button({
  children,
  tone = 'quiet',
  testId,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'quiet' | 'ink' | 'coral' | 'lime' | 'danger';
  testId: string;
}) {
  const tones = {
    quiet: 'border-[#c5c7be] bg-[#fbf8f2] text-[#182129] hover:border-[#182129]',
    ink: 'border-[#182129] bg-[#182129] text-[#f4f0e8] hover:bg-[#273338]',
    coral: 'border-[#182129] bg-[#ff653f] text-[#182129] hover:bg-[#ff7857]',
    lime: 'border-[#182129] bg-[#b8d94b] text-[#182129] hover:bg-[#c6e35c]',
    danger: 'border-[#e5aaa0] bg-[#fff0eb] text-[#ae3c27] hover:border-[#ae3c27]',
  };
  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      data-testid={testId}
      className={cx(
        'inline-flex min-h-9 items-center justify-center gap-2 rounded-md border px-3 text-xs font-bold transition-all hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0',
        tones[tone],
        props.className,
      )}
    >
      {children}
    </button>
  );
}

function SectionHeading({ eyebrow, title, note }: { eyebrow: string; title: string; note: string }) {
  return (
    <div className="flex flex-col justify-between gap-4 border-b-2 border-[#182129] pb-5 sm:flex-row sm:items-end">
      <div>
        <div className="nf-mono text-[10px] font-medium uppercase tracking-[.2em] text-[#ff653f]">{eyebrow}</div>
        <h1 className="nf-display mt-2 text-4xl font-bold leading-[.9] tracking-[-.07em] sm:text-5xl">{title}</h1>
      </div>
      <p className="max-w-[340px] text-xs leading-5 text-[#6b7671]">{note}</p>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  copy,
}: {
  icon: typeof PackageOpen;
  title: string;
  copy: string;
}) {
  return (
    <div className="nf-dot-grid flex min-h-[190px] flex-col items-center justify-center rounded-xl border border-dashed border-[#aeb4a9] bg-[#eee9de] px-6 text-center">
      <Icon size={25} strokeWidth={1.5} className="text-[#768a32]" />
      <h3 className="mt-4 text-sm font-bold">{title}</h3>
      <p className="mt-1 max-w-[330px] text-xs leading-5 text-[#75807a]">{copy}</p>
    </div>
  );
}

function ColorDots({
  colors,
  onChange,
  testPrefix,
}: {
  colors: string[];
  onChange: (next: string[]) => void;
  testPrefix: string;
}) {
  const options = [
    ['W', '#e9dfb7'],
    ['U', '#79a9c5'],
    ['B', '#657078'],
    ['R', '#df745b'],
    ['G', '#79a675'],
    ['C', '#b9b5aa'],
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(([code, color]) => {
        const selected = colors.includes(code);
        return (
          <button
            key={code}
            type="button"
            onClick={() => onChange(selected ? colors.filter((item) => item !== code) : [...colors, code])}
            className={cx(
              'flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-bold transition-all',
              selected ? 'border-[#182129] shadow-[2px_2px_0_#182129]' : 'border-[#b9bcb2] opacity-65 hover:opacity-100',
            )}
            style={{ backgroundColor: color }}
            data-testid={`${testPrefix}-${code}`}
            aria-label={`Toggle ${code} color`}
            aria-pressed={selected}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}

function DeckCardForm({
  section,
  onAdd,
}: {
  section: DeckSection;
  onAdd: (card: DeckCard) => void;
}) {
  const [form, setForm] = useState(blankDeckCard);
  const [colors, setColors] = useState<string[]>([]);
  const update = <K extends keyof typeof blankDeckCard>(key: K, value: (typeof blankDeckCard)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    onAdd({ ...form, name: form.name.trim(), id: uid('card'), colors });
    setForm(blankDeckCard);
    setColors([]);
  };
  return (
    <form onSubmit={submit} className="rounded-lg border border-[#c8c7be] bg-[#eee9de] p-3" data-testid={`form-add-${section}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="nf-mono text-[9px] font-medium uppercase tracking-[.16em] text-[#68736f]">Add to {section}</span>
        <Plus size={14} className="text-[#ff653f]" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Card name" wide><Input testId={`input-${section}-card-name`} value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Solemn Simulacrum" /></Field>
        <Field label="Quantity"><Input testId={`input-${section}-quantity`} type="number" min={1} max={99} value={form.quantity} onChange={(event) => update('quantity', Math.max(1, Number(event.target.value) || 1))} /></Field>
        <Field label="Card type"><Select testId={`select-${section}-type`} value={form.type} onChange={(event) => update('type', event.target.value)}><option>Creature</option><option>Instant</option><option>Sorcery</option><option>Artifact</option><option>Enchantment</option><option>Planeswalker</option><option>Land</option><option>Battle</option></Select></Field>
        <Field label="Mana value"><Input testId={`input-${section}-mana-value`} type="number" min={0} value={form.manaValue} onChange={(event) => update('manaValue', Math.max(0, Number(event.target.value) || 0))} /></Field>
        <Field label="Role"><Select testId={`select-${section}-role`} value={form.role} onChange={(event) => update('role', event.target.value)}><option>Threat</option><option>Interaction</option><option>Card advantage</option><option>Protection</option><option>Utility</option><option>Land</option><option>Combo piece</option></Select></Field>
        <Field label="Colors"><ColorDots colors={colors} onChange={setColors} testPrefix={`button-${section}-color`} /></Field>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#d2d0c5] pt-3">
        {([['manaSource', 'Mana source'], ['ramp', 'Ramp'], ['removal', 'Removal'], ['draw', 'Draw']] as const).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-xs text-[#52605c]">
            <input type="checkbox" checked={form[key]} onChange={(event) => update(key, event.target.checked)} data-testid={`checkbox-${section}-${key}`} className="accent-[#ff653f]" />
            {label}
          </label>
        ))}
      </div>
      <Button tone="ink" testId={`button-add-${section}-card`} className="mt-3 w-full"><Plus size={14} /> Add card</Button>
    </form>
  );
}

function CardList({
  cards,
  section,
  onRemove,
  onQuantity,
}: {
  cards: DeckCard[];
  section: DeckSection;
  onRemove: (id: string) => void;
  onQuantity: (id: string, quantity: number) => void;
}) {
  if (!cards.length) {
    return <div className="rounded-lg border border-dashed border-[#bfc1b9] px-4 py-8 text-center text-xs text-[#7c8680]">No cards in this section yet. Add the decisions you are considering.</div>;
  }
  return (
    <div className="nf-scrollbar max-h-[365px] overflow-y-auto rounded-lg border border-[#c8c7be] bg-[#fbf8f2]">
      {cards.map((card) => (
        <div key={card.id} className="flex items-center gap-2 border-b border-[#e1ded4] px-3 py-2 last:border-b-0" data-testid={`row-${section}-card-${card.id}`}>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-bold">{card.name}</div>
            <div className="nf-mono mt-0.5 flex flex-wrap gap-x-2 text-[9px] uppercase tracking-[.06em] text-[#7b8580]">
              <span>{card.type}</span><span>MV {card.manaValue}</span><span>{card.role}</span>
              {card.ramp && <span className="text-[#768a32]">ramp</span>}
              {card.removal && <span className="text-[#ff653f]">removal</span>}
              {card.draw && <span className="text-[#768a32]">draw</span>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => onQuantity(card.id, card.quantity - 1)} disabled={card.quantity <= 1} className="rounded p-1 text-[#6d7875] hover:bg-[#eee9de] disabled:opacity-30" data-testid={`button-decrement-card-${card.id}`} aria-label={`Decrease ${card.name}`}><Minus size={13} /></button>
            <span className="w-5 text-center nf-mono text-[10px]" data-testid={`text-card-quantity-${card.id}`}>{card.quantity}</span>
            <button type="button" onClick={() => onQuantity(card.id, card.quantity + 1)} className="rounded p-1 text-[#6d7875] hover:bg-[#eee9de]" data-testid={`button-increment-card-${card.id}`} aria-label={`Increase ${card.name}`}><Plus size={13} /></button>
            <button type="button" onClick={() => onRemove(card.id)} className="ml-1 rounded p-1 text-[#ae3c27] hover:bg-[#fff0eb]" data-testid={`button-remove-card-${card.id}`} aria-label={`Remove ${card.name}`}><Trash2 size={13} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

function DeckAnalysis({ deck }: { deck: Deck }) {
  const cards = deck.deck;
  const count = cards.reduce((sum, card) => sum + card.quantity, 0);
  const categories = ['Creature', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Planeswalker', 'Land', 'Other'];
  const typeCounts = categories.map((type) => ({
    type,
    value: cards.filter((card) => (type === 'Other' ? !categories.slice(0, -1).includes(card.type) : card.type === type)).reduce((sum, card) => sum + card.quantity, 0),
  })).filter((item) => item.value);
  const curve = Array.from({ length: 8 }, (_, manaValue) => cards.filter((card) => card.manaValue === manaValue).reduce((sum, card) => sum + card.quantity, 0));
  const maxCurve = Math.max(...curve, 1);
  const statItems = [
    ['Mana sources', cards.filter((card) => card.manaSource).reduce((sum, card) => sum + card.quantity, 0)],
    ['Ramp', cards.filter((card) => card.ramp).reduce((sum, card) => sum + card.quantity, 0)],
    ['Removal', cards.filter((card) => card.removal).reduce((sum, card) => sum + card.quantity, 0)],
    ['Draw', cards.filter((card) => card.draw).reduce((sum, card) => sum + card.quantity, 0)],
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2" data-testid="panel-deck-analysis">
      <div className="rounded-xl border-2 border-[#182129] bg-[#182129] p-4 text-[#f4f0e8] shadow-[4px_4px_0_#b8d94b] sm:col-span-2">
        <div className="flex items-start justify-between">
          <div><div className="nf-mono text-[9px] uppercase tracking-[.15em] text-[#b8d94b]">list readout</div><div className="nf-display mt-1 text-3xl font-bold tracking-[-.06em]" data-testid="text-deck-total">{count}<span className="ml-2 text-sm font-normal tracking-normal text-[#9ca89f]">cards in deck</span></div></div>
          <Gauge size={25} className="text-[#ff653f]" strokeWidth={1.6} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#3a474a] pt-3 sm:grid-cols-4">
          {statItems.map(([label, value]) => <div key={label}><div className="nf-mono text-[9px] uppercase tracking-[.09em] text-[#8f9b94]">{label}</div><div className="mt-1 text-xl font-bold text-[#f4f0e8]" data-testid={`text-analysis-${String(label).toLowerCase().replace(' ', '-')}`}>{value}</div></div>)}
        </div>
      </div>
      <div className="rounded-xl border border-[#c8c7be] bg-[#fbf8f2] p-4">
        <div className="flex items-center justify-between"><h3 className="text-xs font-bold">Mana curve</h3><span className="nf-mono text-[9px] text-[#7b8580]">MV 0–7+</span></div>
        <div className="mt-5 flex h-28 items-end gap-1.5 border-b border-[#c8c7be]">
          {curve.map((value, index) => <div key={index} className="flex h-full flex-1 flex-col items-center justify-end gap-1"><span className="nf-mono text-[8px] text-[#7b8580]">{value || ''}</span><div className="w-full rounded-t-sm bg-[#ff653f] transition-all" style={{ height: `${Math.max(value ? (value / maxCurve) * 78 : 3, 3)}%` }} /><span className="nf-mono mt-1 text-[8px] text-[#7b8580]">{index === 7 ? '7+' : index}</span></div>)}
        </div>
      </div>
      <div className="rounded-xl border border-[#c8c7be] bg-[#fbf8f2] p-4">
        <h3 className="text-xs font-bold">Card-type breakdown</h3>
        <div className="mt-4 grid gap-2">
          {typeCounts.length ? typeCounts.map((item) => <div key={item.type} className="flex items-center gap-2 text-xs"><span className="w-24 text-[#6d7875]">{item.type}</span><div className="h-2 flex-1 rounded-full bg-[#e6e1d7]"><div className="h-full rounded-full bg-[#768a32]" style={{ width: `${Math.min(100, (item.value / Math.max(count, 1)) * 100 * 2.4)}%` }} /></div><span className="nf-mono w-5 text-right text-[10px]">{item.value}</span></div>) : <span className="text-xs text-[#7c8680]">Add cards to see the shape of the list.</span>}
        </div>
      </div>
    </div>
  );
}

function DeckForge({ store, updateStore }: { store: Store; updateStore: (next: Store) => void }) {
  const [selectedId, setSelectedId] = useState(store.decks[0]?.id ?? '');
  const [deckForm, setDeckForm] = useState<Deck>(store.decks.find((deck) => deck.id === selectedId) ?? blankDeck);
  const [editing, setEditing] = useState(false);
  const selected = store.decks.find((deck) => deck.id === selectedId);
  useEffect(() => {
    if (selected) setDeckForm(selected);
  }, [selected]);
  useEffect(() => {
    if (!editing && !selectedId && store.decks[0]) setSelectedId(store.decks[0].id);
  }, [editing, selectedId, store.decks]);
  const saveDeck = (event: FormEvent) => {
    event.preventDefault();
    if (!deckForm.name.trim()) return;
    const normalized = { ...deckForm, name: deckForm.name.trim(), id: deckForm.id || uid('deck') };
    const decks = deckForm.id ? store.decks.map((deck) => deck.id === normalized.id ? normalized : deck) : [...store.decks, normalized];
    updateStore({ ...store, decks });
    setSelectedId(normalized.id);
    setDeckForm(normalized);
    setEditing(false);
  };
  const createDeck = () => {
    setSelectedId('');
    setDeckForm({ ...blankDeck, id: '' });
    setEditing(true);
  };
  const deleteDeck = () => {
    if (!selected) return;
    if (!window.confirm(`Delete ${selected.name}? This removes the list and its analysis.`)) return;
    const decks = store.decks.filter((deck) => deck.id !== selected.id);
    updateStore({ ...store, decks });
    const next = decks[0];
    setSelectedId(next?.id ?? '');
    setDeckForm(next ?? blankDeck);
    setEditing(false);
  };
  const updateCards = (section: DeckSection, cards: DeckCard[]) => {
    if (!selected) return;
    const next = { ...selected, [section]: cards } as Deck;
    updateStore({ ...store, decks: store.decks.map((deck) => deck.id === selected.id ? next : deck) });
    setDeckForm(next);
  };
  const addCard = (section: DeckSection, card: DeckCard) => updateCards(section, [...(selected?.[section] ?? []), card]);
  const removeCard = (section: DeckSection, id: string) => updateCards(section, (selected?.[section] ?? []).filter((card) => card.id !== id));
  const quantityCard = (section: DeckSection, id: string, quantity: number) => updateCards(section, (selected?.[section] ?? []).map((card) => card.id === id ? { ...card, quantity } : card));

  return (
    <div className="grid gap-6 xl:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="space-y-3">
        <div className="flex items-center justify-between"><span className="nf-mono text-[10px] uppercase tracking-[.16em] text-[#68736f]">Your decks</span><button type="button" onClick={createDeck} className="rounded-md bg-[#ff653f] p-1.5 text-[#182129] hover:bg-[#ff7857]" data-testid="button-create-deck" aria-label="Create deck"><Plus size={15} /></button></div>
        {store.decks.length ? <div className="grid gap-2">{store.decks.map((deck) => <button type="button" key={deck.id} onClick={() => { setSelectedId(deck.id); setEditing(false); }} className={cx('group rounded-lg border p-3 text-left transition-all', selectedId === deck.id ? 'border-[#182129] bg-[#e7edc9] shadow-[3px_3px_0_#182129]' : 'border-[#c8c7be] bg-[#fbf8f2] hover:border-[#182129]')} data-testid={`button-select-deck-${deck.id}`}><div className="flex items-start justify-between gap-2"><span className="truncate text-sm font-bold">{deck.name}</span><ChevronRight size={14} className={cx('shrink-0 text-[#ff653f] transition-transform', selectedId === deck.id && 'translate-x-0.5')} /></div><span className="nf-mono mt-2 block text-[9px] uppercase tracking-[.1em] text-[#7a8580]">{deck.format} · {deck.deck.reduce((sum, card) => sum + card.quantity, 0)} cards</span></button>)}</div> : <div className="rounded-lg border border-dashed border-[#bfc1b9] px-3 py-5 text-xs leading-5 text-[#7c8680]">Your bench is clear. Start a deck when an idea earns a list.</div>}
        <button type="button" onClick={createDeck} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#aeb4a9] py-2.5 text-xs font-bold text-[#6d7875] hover:border-[#182129] hover:text-[#182129]" data-testid="button-new-deck-secondary"><Plus size={14} /> New deck</button>
      </aside>
      <div className="min-w-0">
        {!selected && !editing ? <EmptyState icon={Hammer} title="Nothing on the stand yet" copy="Create a deck shell for the list you are circling. The analysis will follow the cards, not the other way around." /> : editing ? (
          <form onSubmit={saveDeck} className="rounded-xl border-2 border-[#182129] bg-[#e7edc9] p-5 shadow-[5px_5px_0_#ff653f]" data-testid="form-deck-details">
            <div className="flex items-center justify-between"><div><div className="nf-mono text-[9px] uppercase tracking-[.16em] text-[#56652b]">deck identity</div><h2 className="nf-display mt-1 text-2xl font-bold tracking-[-.05em]">Name the idea.</h2></div><button type="button" onClick={() => setEditing(false)} className="rounded-md p-1 hover:bg-[#cbd6a4]" data-testid="button-cancel-deck"><X size={18} /></button></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Field label="Deck name" wide><Input testId="input-deck-name" autoFocus value={deckForm.name} onChange={(event) => setDeckForm({ ...deckForm, name: event.target.value })} placeholder="e.g. The Long Way Home" /></Field>
              <Field label="Format"><Select testId="select-deck-format" value={deckForm.format} onChange={(event) => setDeckForm({ ...deckForm, format: event.target.value })}><option>Commander</option><option>Modern</option><option>Legacy</option><option>Pioneer</option><option>Standard</option><option>Cube</option><option>Casual</option></Select></Field>
              <Field label="Commander"><Input testId="input-deck-commander" value={deckForm.commander} onChange={(event) => setDeckForm({ ...deckForm, commander: event.target.value })} placeholder="Optional · card name" /></Field>
              <Field label="Color identity"><ColorDots colors={deckForm.colorIdentity} onChange={(colorIdentity) => setDeckForm({ ...deckForm, colorIdentity })} testPrefix="button-deck-identity-color" /></Field>
            </div>
            <Button tone="ink" testId="button-save-deck" className="mt-5 w-full sm:w-auto"><Check size={14} /> Save deck shell</Button>
          </form>
        ) : selected ? (
          <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 border-b-2 border-[#182129] pb-4 sm:flex-row sm:items-start">
              <div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#b8d94b] px-2 py-1 nf-mono text-[9px] font-bold uppercase tracking-[.1em]">{selected.format}</span>{selected.colorIdentity.map((color) => <span key={color} className="nf-mono text-[10px] font-bold text-[#6d7875]">{color}</span>)}</div><h2 className="nf-display mt-3 text-3xl font-bold tracking-[-.06em]" data-testid="text-selected-deck-name">{selected.name}</h2><p className="mt-1 text-xs text-[#6d7875]">{selected.commander ? `Commander · ${selected.commander}` : 'No commander assigned yet'}</p></div>
              <div className="flex gap-2"><Button tone="quiet" onClick={() => setEditing(true)} testId="button-edit-deck"><Pencil size={14} /> Edit</Button><Button tone="danger" onClick={deleteDeck} testId="button-delete-deck"><Trash2 size={14} /> Delete</Button></div>
            </div>
            <DeckAnalysis deck={selected} />
            <div className="grid gap-4 lg:grid-cols-3">
              {(['deck', 'sideboard', 'maybeboard'] as DeckSection[]).map((section) => <div key={section} className="space-y-3"><div className="flex items-center justify-between"><h3 className="nf-display text-lg font-bold tracking-[-.04em]">{section === 'deck' ? 'Main deck' : section === 'maybeboard' ? 'Maybeboard' : 'Sideboard'}</h3><span className="nf-mono text-[9px] text-[#7c8680]">{selected[section].reduce((sum, card) => sum + card.quantity, 0)} cards</span></div><DeckCardForm section={section} onAdd={(card) => addCard(section, card)} /><CardList cards={selected[section]} section={section} onRemove={(id) => removeCard(section, id)} onQuantity={(id, quantity) => quantityCard(section, id, quantity)} /></div>)}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CollectionForge({ store, updateStore }: { store: Store; updateStore: (next: Store) => void }) {
  const [form, setForm] = useState(blankOwned);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const update = <K extends keyof typeof blankOwned>(key: K, value: (typeof blankOwned)[K]) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    const card = { ...form, name: form.name.trim(), id: editingId ?? uid('owned') };
    updateStore({ ...store, collection: editingId ? store.collection.map((item) => item.id === editingId ? card : item) : [card, ...store.collection] });
    setForm(blankOwned); setEditingId(null);
  };
  const edit = (card: OwnedCard) => { setEditingId(card.id); setForm({ ...card }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const filtered = store.collection.filter((card) => `${card.name} ${card.set} ${card.printing}`.toLowerCase().includes(query.toLowerCase()));
  const ownedCount = store.collection.reduce((sum, card) => sum + card.quantity, 0);
  return (
    <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      <form onSubmit={submit} className="rounded-xl border-2 border-[#182129] bg-[#eee9de] p-4 shadow-[4px_4px_0_#b8d94b]" data-testid="form-collection-card">
        <div className="flex items-start justify-between"><div><div className="nf-mono text-[9px] uppercase tracking-[.16em] text-[#ff653f]">{editingId ? 'edit specimen' : 'log a specimen'}</div><h2 className="nf-display mt-1 text-2xl font-bold tracking-[-.06em]">{editingId ? 'Refine the record.' : 'What is in the box?'}</h2></div>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(blankOwned); }} className="rounded p-1 hover:bg-[#dedbd0]" data-testid="button-cancel-collection-edit"><X size={16} /></button>}</div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <Field label="Card name"><Input testId="input-owned-name" value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Lightning Bolt" /></Field>
          <Field label="Quantity"><Input testId="input-owned-quantity" type="number" min={1} value={form.quantity} onChange={(event) => update('quantity', Math.max(1, Number(event.target.value) || 1))} /></Field>
          <Field label="Printing / version"><Input testId="input-owned-printing" value={form.printing} onChange={(event) => update('printing', event.target.value)} placeholder="e.g. retro frame" /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Set"><Input testId="input-owned-set" value={form.set} onChange={(event) => update('set', event.target.value)} placeholder="MKM" /></Field><Field label="Collector no."><Input testId="input-owned-collector-number" value={form.collectorNumber} onChange={(event) => update('collectorNumber', event.target.value)} placeholder="123" /></Field></div>
          <div className="grid grid-cols-2 gap-3"><Field label="Condition"><Select testId="select-owned-condition" value={form.condition} onChange={(event) => update('condition', event.target.value)}><option>Near Mint</option><option>Lightly Played</option><option>Moderately Played</option><option>Heavily Played</option><option>Damaged</option></Select></Field><Field label="Language"><Select testId="select-owned-language" value={form.language} onChange={(event) => update('language', event.target.value)}><option>English</option><option>Japanese</option><option>German</option><option>French</option><option>Other</option></Select></Field></div>
          <Field label="Trade status"><Select testId="select-owned-trade-status" value={form.tradeStatus} onChange={(event) => update('tradeStatus', event.target.value)}><option>Keep</option><option>Maybe trade</option><option>Trade</option><option>Loaned</option></Select></Field>
          <label className="flex items-center gap-2 text-xs text-[#52605c]"><input type="checkbox" checked={form.foil} onChange={(event) => update('foil', event.target.checked)} data-testid="checkbox-owned-foil" className="accent-[#ff653f]" /> Foil finish</label>
          <Field label="Notes"><textarea data-testid="textarea-owned-notes" value={form.notes} onChange={(event) => update('notes', event.target.value)} rows={3} placeholder="Where it came from, what it is waiting for…" className="w-full resize-y rounded-md border border-[#bfc1b9] bg-[#fbf8f2] px-2.5 py-2 text-sm outline-none focus:border-[#ff653f]" /></Field>
        </div>
        <Button tone="coral" testId="button-save-owned-card" className="mt-4 w-full">{editingId ? <Check size={14} /> : <Plus size={14} />} {editingId ? 'Save changes' : 'Add to collection'}</Button>
      </form>
      <div className="min-w-0">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><div className="nf-mono text-[9px] uppercase tracking-[.16em] text-[#68736f]">physical inventory</div><div className="mt-1 text-2xl font-bold tracking-[-.05em]" data-testid="text-owned-total">{ownedCount} <span className="text-sm font-normal text-[#7c8680]">cards logged</span></div></div><label className="relative block sm:w-56"><Search size={15} className="absolute left-2.5 top-2.5 text-[#7c8680]" /><Input testId="input-collection-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your box" className="pl-8" /></label></div>
        {filtered.length ? <div className="overflow-hidden rounded-xl border border-[#c8c7be] bg-[#fbf8f2]">{filtered.map((card) => <div key={card.id} className="grid gap-3 border-b border-[#dedbd1] p-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_150px_auto] sm:items-center" data-testid={`row-owned-card-${card.id}`}><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold">{card.name}</span><span className="nf-mono rounded bg-[#e7edc9] px-1.5 py-0.5 text-[8px] uppercase tracking-[.08em] text-[#56652b]">{card.tradeStatus}</span>{card.foil && <span className="nf-mono rounded bg-[#fff0eb] px-1.5 py-0.5 text-[8px] uppercase tracking-[.08em] text-[#ae3c27]">foil</span>}</div><div className="nf-mono mt-1 text-[9px] uppercase tracking-[.07em] text-[#7c8680]">{card.quantity} copies · {card.set || 'set unknown'} {card.collectorNumber && `· #${card.collectorNumber}`} · {card.condition} · {card.language}</div>{card.notes && <p className="mt-2 text-xs text-[#6d7875]">{card.notes}</p>}</div><div className="text-xs text-[#6d7875]">{card.printing || 'Original printing not noted'}</div><div className="flex gap-1 sm:justify-end"><Button tone="quiet" onClick={() => edit(card)} testId={`button-edit-owned-${card.id}`}><Pencil size={13} /> Edit</Button><Button tone="danger" onClick={() => { if (window.confirm(`Remove ${card.name} from the collection?`)) updateStore({ ...store, collection: store.collection.filter((item) => item.id !== card.id) }); }} testId={`button-delete-owned-${card.id}`} aria-label={`Delete ${card.name}`}><Trash2 size={13} /></Button></div></div>)}</div> : <EmptyState icon={Boxes} title={query ? 'No cards match that search' : 'The collection ledger is empty'} copy={query ? 'Try a card name, set code, or printing.' : 'Log the physical cards you actually own. The box is the source of truth.'} />}
      </div>
    </div>
  );
}

function makeTestDeck(deck: Deck) {
  return shuffle(deck.deck.flatMap((card) => Array.from({ length: card.quantity }, (_, index) => ({ ...card, uid: `${card.id}-${index}-${Date.now()}` }))));
}

function PlaytestLab({ store, updateStore }: { store: Store; updateStore: (next: Store) => void }) {
  const decks = store.decks;
  const [deckId, setDeckId] = useState(store.playtest.deckId ?? decks[0]?.id ?? '');
  const [test, setTest] = useState<Playtest>(store.playtest);
  useEffect(() => {
    if (!deckId && decks[0]) setDeckId(decks[0].id);
  }, [deckId, decks]);
  useEffect(() => {
    if (store.playtest.deckId || store.playtest.library.length || store.playtest.hand.length) setTest(store.playtest);
  }, [store.playtest]);
  const deck = decks.find((item) => item.id === deckId);
  const patch = (next: Playtest) => { setTest(next); updateStore({ ...store, playtest: next }); };
  const start = () => { if (!deck) return; const library = makeTestDeck(deck); patch({ ...emptyTest, deckId: deck.id, library: library.slice(7), hand: library.slice(0, 7) }); };
  const draw = () => { if (!test.library.length) return; patch({ ...test, library: test.library.slice(1), hand: [...test.hand, test.library[0]] }); };
  const mulligan = () => { const library = shuffle([...test.library, ...test.hand]); patch({ ...test, library: library.slice(7), hand: library.slice(0, 7) }); };
  const move = (from: 'hand' | 'battlefield' | 'graveyard', to: 'battlefield' | 'graveyard' | 'exile', uidValue: string) => {
    const source = test[from];
    const card = source.find((item) => item.uid === uidValue);
    if (!card) return;
    patch({ ...test, [from]: source.filter((item) => item.uid !== uidValue), [to]: [...test[to], card] });
  };
  const updatePair = (key: 'life' | 'commanderDamage', player: 0 | 1, delta: number) => {
    const next = [...test[key]] as [number, number]; next[player] = Math.max(0, next[player] + delta); patch({ ...test, [key]: next });
  };
  const active = Boolean(test.deckId);
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b-2 border-[#182129] pb-5 sm:flex-row sm:items-end"><div><div className="nf-mono text-[10px] uppercase tracking-[.2em] text-[#ff653f]">ritual simulator</div><h2 className="nf-display mt-2 text-4xl font-bold tracking-[-.07em]">Playtest Lab</h2></div><div className="flex gap-2"><Select testId="select-playtest-deck" value={deckId} onChange={(event) => setDeckId(event.target.value)} className="max-w-[220px]" disabled={!decks.length}><option value="">Choose a deck</option>{decks.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Button tone="coral" onClick={start} disabled={!deck} testId="button-start-playtest"><Dices size={14} /> {active ? 'Restart test' : 'Start test'}</Button></div></div>
      {!active ? <EmptyState icon={FlaskConical} title="The table is waiting" copy={decks.length ? 'Choose a deck, then deal an opening hand. This is for feel, not a win-rate spreadsheet.' : 'Build a deck first. A playtest needs a real list to shuffle.'} /> : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1].map((player) => <div key={player} className="rounded-xl border-2 border-[#182129] bg-[#fbf8f2] p-3 shadow-[3px_3px_0_#b8d94b]"><div className="nf-mono text-[9px] uppercase tracking-[.12em] text-[#7b8580]">Player {player + 1} life</div><div className="mt-2 flex items-center justify-between"><button type="button" onClick={() => updatePair('life', player as 0 | 1, -1)} className="rounded bg-[#fff0eb] p-1 text-[#ae3c27]" data-testid={`button-life-minus-${player + 1}`}><Minus size={15} /></button><span className="nf-display text-3xl font-bold" data-testid={`text-life-${player + 1}`}>{test.life[player]}</span><button type="button" onClick={() => updatePair('life', player as 0 | 1, 1)} className="rounded bg-[#e7edc9] p-1 text-[#56652b]" data-testid={`button-life-plus-${player + 1}`}><Plus size={15} /></button></div><div className="mt-3 flex items-center justify-between border-t border-[#e0ddd3] pt-2"><span className="nf-mono text-[8px] uppercase text-[#7b8580]">Commander damage</span><div className="flex items-center gap-1"><button type="button" onClick={() => updatePair('commanderDamage', player as 0 | 1, -1)} className="rounded p-1 hover:bg-[#eee9de]" data-testid={`button-commander-minus-${player + 1}`}><Minus size={12} /></button><span className="nf-mono text-xs" data-testid={`text-commander-damage-${player + 1}`}>{test.commanderDamage[player]}</span><button type="button" onClick={() => updatePair('commanderDamage', player as 0 | 1, 1)} className="rounded p-1 hover:bg-[#eee9de]" data-testid={`button-commander-plus-${player + 1}`}><Plus size={12} /></button></div></div></div>)}
            <div className="rounded-xl border border-[#c8c7be] bg-[#e7edc9] p-3"><div className="nf-mono text-[9px] uppercase tracking-[.12em] text-[#56652b]">Available mana</div><div className="mt-2 flex items-center justify-between"><button type="button" onClick={() => patch({ ...test, mana: Math.max(0, test.mana - 1) })} className="rounded bg-[#fbf8f2] p-1" data-testid="button-mana-minus"><Minus size={15} /></button><span className="nf-display text-3xl font-bold" data-testid="text-available-mana">{test.mana}</span><button type="button" onClick={() => patch({ ...test, mana: test.mana + 1 })} className="rounded bg-[#fbf8f2] p-1" data-testid="button-mana-plus"><Plus size={15} /></button></div><div className="mt-2 text-[10px] text-[#687363]">Tap your lands mentally.</div></div>
            <div className="rounded-xl border border-[#c8c7be] bg-[#fbf8f2] p-3"><div className="nf-mono text-[9px] uppercase tracking-[.12em] text-[#7b8580]">Table counters</div><div className="mt-2 flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-xs">Counters</span><span className="nf-mono text-sm" data-testid="text-counters">{test.counters}</span></div><div className="flex gap-1"><button type="button" onClick={() => patch({ ...test, counters: Math.max(0, test.counters - 1) })} className="rounded border border-[#c8c7be] p-1" data-testid="button-counters-minus"><Minus size={12} /></button><button type="button" onClick={() => patch({ ...test, counters: test.counters + 1 })} className="rounded border border-[#c8c7be] p-1" data-testid="button-counters-plus"><Plus size={12} /></button></div></div><div className="mt-3 flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-xs">Tokens</span><span className="nf-mono text-sm" data-testid="text-tokens">{test.tokens}</span></div><div className="flex gap-1"><button type="button" onClick={() => patch({ ...test, tokens: Math.max(0, test.tokens - 1) })} className="rounded border border-[#c8c7be] p-1" data-testid="button-tokens-minus"><Minus size={12} /></button><button type="button" onClick={() => patch({ ...test, tokens: test.tokens + 1 })} className="rounded border border-[#c8c7be] p-1" data-testid="button-tokens-plus"><Plus size={12} /></button></div></div></div>
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#c8c7be] bg-[#eee9de] p-3"><span className="nf-mono mr-auto text-[9px] uppercase tracking-[.14em] text-[#68736f]">Library · {test.library.length} cards</span><Button tone="ink" onClick={draw} disabled={!test.library.length} testId="button-draw-card"><ArrowDownToLine size={14} /> Draw</Button><Button tone="quiet" onClick={mulligan} testId="button-mulligan"><RotateCcw size={14} /> Mulligan</Button><span className="nf-mono text-[9px] uppercase tracking-[.1em] text-[#7b8580]">hand {test.hand.length}</span></div>
          <div className="grid gap-4 lg:grid-cols-4">
            <TestZone title="Hand" icon={ClipboardList} cards={test.hand} actionLabel="To battlefield" onCardAction={(uidValue) => move('hand', 'battlefield', uidValue)} actionTest="button-hand-to-battlefield" />
            <TestZone title="Battlefield" icon={Swords} cards={test.battlefield} actionLabel="To graveyard" onCardAction={(uidValue) => move('battlefield', 'graveyard', uidValue)} actionTest="button-battlefield-to-graveyard" />
            <TestZone title="Graveyard" icon={Skull} cards={test.graveyard} actionLabel="To exile" onCardAction={(uidValue) => move('graveyard', 'exile', uidValue)} actionTest="button-graveyard-to-exile" />
            <TestZone title="Exile" icon={Archive} cards={test.exile} />
          </div>
        </div>
      )}
    </div>
  );
}

function TestZone({ title, icon: Icon, cards, actionLabel, onCardAction, actionTest }: { title: string; icon: typeof Swords; cards: TestCard[]; actionLabel?: string; onCardAction?: (id: string) => void; actionTest?: string }) {
  return <div className="min-h-[220px] rounded-xl border border-[#c8c7be] bg-[#fbf8f2] p-3" data-testid={`zone-${title.toLowerCase()}`}><div className="flex items-center justify-between border-b border-[#e0ddd3] pb-2"><h3 className="flex items-center gap-2 text-xs font-bold"><Icon size={14} className="text-[#ff653f]" />{title}</h3><span className="nf-mono text-[9px] text-[#7b8580]">{cards.length}</span></div>{cards.length ? <div className="mt-2 grid gap-1.5">{cards.map((card) => <div key={card.uid} className="group rounded-md border border-[#dedbd1] bg-[#eee9de] p-2"><div className="flex items-start justify-between gap-2"><span className="text-[11px] font-bold leading-4">{card.name}</span>{onCardAction && <button type="button" onClick={() => onCardAction(card.uid)} className="shrink-0 rounded bg-[#fbf8f2] p-1 text-[#182129] opacity-75 hover:opacity-100" data-testid={`${actionTest}-${card.uid}`} aria-label={`${actionLabel} ${card.name}`}><ArrowLeftRight size={12} /></button>}</div><span className="nf-mono text-[8px] uppercase text-[#7b8580]">MV {card.manaValue} · {card.type}</span></div>)}</div> : <div className="flex h-[170px] items-center justify-center text-center nf-mono text-[9px] uppercase tracking-[.08em] text-[#a0a69f]">zone is clear</div>}</div>;
}

function CustomCardForge({ store, updateStore }: { store: Store; updateStore: (next: Store) => void }) {
  const [form, setForm] = useState(blankCustom);
  const [editingId, setEditingId] = useState<string | null>(null);
  const update = <K extends keyof typeof blankCustom>(key: K, value: (typeof blankCustom)[K]) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    const card = { ...form, name: form.name.trim(), id: editingId ?? uid('custom') };
    updateStore({ ...store, customCards: editingId ? store.customCards.map((item) => item.id === editingId ? card : item) : [card, ...store.customCards] });
    setForm(blankCustom); setEditingId(null);
  };
  const edit = (card: CustomCard) => { setEditingId(card.id); setForm({ ...card }); };
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <form onSubmit={submit} className="rounded-xl border-2 border-[#182129] bg-[#eee9de] p-4" data-testid="form-custom-card">
        <div className="flex items-start justify-between border-b border-[#c8c7be] pb-4"><div><div className="nf-mono text-[9px] uppercase tracking-[.16em] text-[#ff653f]">{editingId ? 'revise prototype' : 'custom card forge'}</div><h2 className="nf-display mt-1 text-2xl font-bold tracking-[-.06em]">{editingId ? 'Tune the card.' : 'Give the idea a frame.'}</h2></div>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(blankCustom); }} className="rounded p-1 hover:bg-[#dedbd0]" data-testid="button-cancel-custom-edit"><X size={16} /></button>}</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Name" wide><Input testId="input-custom-name" value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. Workshop Prodigy" /></Field>
          <Field label="Mana cost"><Input testId="input-custom-mana-cost" value={form.manaCost} onChange={(event) => update('manaCost', event.target.value)} placeholder="{2}{G}{G}" /></Field>
          <Field label="Type line"><Input testId="input-custom-type" value={form.type} onChange={(event) => update('type', event.target.value)} placeholder="Creature — Artificer" /></Field>
          <Field label="Colors"><ColorDots colors={form.colors} onChange={(colors) => update('colors', colors)} testPrefix="button-custom-color" /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Power"><Input testId="input-custom-power" value={form.power} onChange={(event) => update('power', event.target.value)} placeholder="3" /></Field><Field label="Toughness"><Input testId="input-custom-toughness" value={form.toughness} onChange={(event) => update('toughness', event.target.value)} placeholder="3" /></Field></div>
          <Field label="Rarity"><Select testId="select-custom-rarity" value={form.rarity} onChange={(event) => update('rarity', event.target.value)}><option>Common</option><option>Uncommon</option><option>Rare</option><option>Mythic Rare</option><option>Special</option></Select></Field>
          <Field label="Rules text" wide><textarea data-testid="textarea-custom-rules" value={form.rulesText} onChange={(event) => update('rulesText', event.target.value)} rows={4} placeholder="Write what the card does…" className="w-full resize-y rounded-md border border-[#bfc1b9] bg-[#fbf8f2] px-2.5 py-2 text-sm outline-none focus:border-[#ff653f]" /></Field>
          <Field label="Flavor text" wide><textarea data-testid="textarea-custom-flavor" value={form.flavorText} onChange={(event) => update('flavorText', event.target.value)} rows={2} placeholder="The line people remember." className="w-full resize-y rounded-md border border-[#bfc1b9] bg-[#fbf8f2] px-2.5 py-2 text-sm italic outline-none focus:border-[#ff653f]" /></Field>
          <div className="sm:col-span-2"><div className="mb-2 flex items-center gap-2 text-xs font-bold"><Layers3 size={14} className="text-[#768a32]" /> Set metadata <span className="font-normal text-[#7b8580]">· ready for a future set editor</span></div><div className="grid gap-3 sm:grid-cols-3"><Field label="Set name"><Input testId="input-custom-set" value={form.set} onChange={(event) => { update('set', event.target.value); update('setMetadata', { ...form.setMetadata, name: event.target.value }); }} placeholder="The Foundry" /></Field><Field label="Set code"><Input testId="input-custom-set-code" value={form.setMetadata.code} onChange={(event) => update('setMetadata', { ...form.setMetadata, code: event.target.value.toUpperCase() })} placeholder="NFD" /></Field><Field label="Release year"><Input testId="input-custom-release-year" value={form.setMetadata.releaseYear} onChange={(event) => update('setMetadata', { ...form.setMetadata, releaseYear: event.target.value })} placeholder="2026" /></Field></div></div>
          <Field label="Collector number"><Input testId="input-custom-collector-number" value={form.collectorNumber} onChange={(event) => update('collectorNumber', event.target.value)} placeholder="001/120" /></Field>
          <Field label="Artist credit"><Input testId="input-custom-artist" value={form.artist} onChange={(event) => update('artist', event.target.value)} placeholder="Your name or collaborator" /></Field>
        </div>
        <Button tone="coral" testId="button-save-custom-card" className="mt-5 w-full sm:w-auto">{editingId ? <Check size={14} /> : <WandSparkles size={14} />} {editingId ? 'Save prototype' : 'Save custom card'}</Button>
      </form>
      <div className="space-y-5">
        <CustomPreview card={form} />
        <div><div className="mb-3 flex items-center justify-between"><span className="nf-mono text-[9px] uppercase tracking-[.15em] text-[#68736f]">Saved prototypes</span><span className="nf-mono text-[9px] text-[#7b8580]">{store.customCards.length}</span></div>{store.customCards.length ? <div className="grid gap-2">{store.customCards.map((card) => <div key={card.id} className="rounded-lg border border-[#c8c7be] bg-[#fbf8f2] p-3" data-testid={`row-custom-card-${card.id}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm font-bold">{card.name}</div><div className="nf-mono mt-1 text-[9px] uppercase text-[#7b8580]">{card.set || 'untitled set'} · {card.rarity} · {card.collectorNumber || 'no number'}</div></div><div className="flex gap-1"><button type="button" onClick={() => edit(card)} className="rounded p-1.5 text-[#6d7875] hover:bg-[#e7edc9]" data-testid={`button-edit-custom-${card.id}`}><Pencil size={13} /></button><button type="button" onClick={() => { if (window.confirm(`Delete ${card.name} prototype?`)) updateStore({ ...store, customCards: store.customCards.filter((item) => item.id !== card.id) }); }} className="rounded p-1.5 text-[#ae3c27] hover:bg-[#fff0eb]" data-testid={`button-delete-custom-${card.id}`}><Trash2 size={13} /></button></div></div></div>)}</div> : <p className="rounded-lg border border-dashed border-[#bfc1b9] p-4 text-xs leading-5 text-[#7c8680]">Saved cards will stay here while you work toward a complete custom set.</p>}</div>
      </div>
    </div>
  );
}

function CustomPreview({ card }: { card: Omit<CustomCard, 'id'> }) {
  return (
    <div className="relative overflow-hidden rounded-[15px] border-2 border-[#182129] bg-[#d8c7a6] p-2.5 shadow-[5px_5px_0_#ff653f]" data-testid="preview-custom-card">
      <div className="rounded-[9px] border-2 border-[#182129] bg-[#f0dfbd] p-2.5">
        <div className="flex items-center justify-between gap-2 border-b-2 border-[#182129] pb-1"><span className="truncate text-sm font-bold">{card.name || 'Unnamed prototype'}</span><span className="nf-mono text-xs">{card.manaCost || '—'}</span></div>
        <div className="mt-2 flex h-[130px] items-center justify-center border border-[#b2a17f] bg-[#c6b18c] text-center"><ScrollText size={25} className="text-[#8e7953]" /><span className="sr-only">Card art placeholder</span></div>
        <div className="mt-2 border-2 border-[#182129] bg-[#f0dfbd] px-2 py-1 text-[10px] font-bold">{card.type || 'Type line'}</div>
        <div className="mt-2 min-h-[90px] border border-[#b2a17f] bg-[#f7e8c8] p-2 text-[10px] leading-4 text-[#38413e]">{card.rulesText || 'Rules text will appear here.'}<div className="mt-3 border-t border-[#b2a17f] pt-2 italic text-[#6e6a59]">{card.flavorText || 'Flavor text belongs here.'}</div></div>
        <div className="mt-1 flex items-center justify-between text-[8px] text-[#5e604f]"><span>{card.artist || 'Artist credit'}</span><span>{card.setMetadata.code || card.set || 'SET'} {card.collectorNumber || '—'}</span></div>
        {(card.power || card.toughness) && <div className="mt-1 text-right text-xs font-bold">{card.power || '0'} / {card.toughness || '0'}</div>}
      </div>
    </div>
  );
}

export function MTGModule() {
  const { user } = useUser();
  const storageKey = `nf-mtg-v1:${user?.id ?? 'guest'}`;
  const [store, setStore] = useState<Store>(newStore);
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<MTGTab>('decks');
  useEffect(() => {
    setHydrated(false);
    setStore(readStore(storageKey));
    setHydrated(true);
  }, [storageKey]);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem(storageKey, JSON.stringify(store));
  }, [hydrated, storageKey, store]);
  const updateStore = (next: Store) => setStore(next);
  const activeDecks = useMemo(() => store.decks.reduce((sum, deck) => sum + deck.deck.reduce((total, card) => total + card.quantity, 0), 0), [store.decks]);
  const tabs = [
    { id: 'decks' as const, label: 'Deck Forge', short: 'Decks', icon: Hammer, note: 'decisions behind the list' },
    { id: 'collection' as const, label: 'Collection Forge', short: 'Collection', icon: PackageOpen, note: 'cards you actually own' },
    { id: 'playtest' as const, label: 'Playtest Lab', short: 'Playtest', icon: FlaskConical, note: 'feel the opening hand' },
    { id: 'custom' as const, label: 'Custom Card Forge', short: 'Custom cards', icon: WandSparkles, note: 'prototype the strange idea' },
  ];
  if (!hydrated) {
    return (
      <div className="nf-noise min-h-[100dvh] bg-[#f4f0e8] px-5 py-10 text-[#182129] sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1480px] animate-pulse">
          <div className="h-14 w-full rounded-xl bg-[#e7e2d8]" />
          <div className="mt-8 h-10 w-72 rounded-lg bg-[#e7e2d8]" />
          <div className="mt-8 grid gap-4 lg:grid-cols-3"><div className="h-56 rounded-xl bg-[#e7e2d8]" /><div className="h-56 rounded-xl bg-[#e7e2d8]" /><div className="h-56 rounded-xl bg-[#e7e2d8]" /></div>
          <span className="sr-only" data-testid="status-loading">Loading your local workbench</span>
        </div>
      </div>
    );
  }
  return (
    <div className="nf-noise min-h-[100dvh] bg-[#f4f0e8] text-[#182129]">
      <header className="border-b-2 border-[#182129] bg-[#182129] text-[#f4f0e8]">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-5 px-5 py-4 sm:px-8 lg:px-10">
           <div className="flex items-center gap-3"><Link href="/dashboard" className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#b8d94b] text-[#182129] shadow-[4px_4px_0_#ff653f] transition-transform hover:-translate-y-0.5" aria-label="Return to Workbench" data-testid="link-mtg-workbench"><HexMark /></Link><div><div className="nf-mono text-[9px] uppercase tracking-[.17em] text-[#b8d94b]">The Nerd Foundry / discipline 02</div><div className="nf-display text-xl font-bold tracking-[-.06em]">Magic: The Gathering</div></div></div>
           <div className="hidden items-center gap-5 sm:flex"><Link href="/settings" className="text-xs font-bold text-[#aebbb1] transition-colors hover:text-[#b8d94b]" data-testid="link-mtg-account">Account</Link><div className="text-right"><div className="nf-mono text-[9px] uppercase tracking-[.12em] text-[#8f9b94]">active bench</div><div className="text-xs font-bold">{activeDecks} cards in lists</div></div><div className="h-8 w-px bg-[#3a474a]" /><div className="flex items-center gap-2 nf-mono text-[9px] uppercase tracking-[.12em] text-[#b8d94b]"><span className="h-2 w-2 rounded-full bg-[#ff653f]" /> local ledger</div></div>
        </div>
      </header>
      <div className="mx-auto max-w-[1480px] px-5 py-6 sm:px-8 lg:px-10">
        <div className="mb-8 overflow-x-auto border-b-2 border-[#182129]">
          <nav className="flex min-w-max gap-1" aria-label="Magic module views">
            {tabs.map(({ id, label, short, icon: Icon, note }) => <button type="button" key={id} onClick={() => setTab(id)} className={cx('group relative flex items-center gap-2 px-3 py-3 text-left transition-colors sm:px-4', tab === id ? 'text-[#182129]' : 'text-[#7b8580] hover:text-[#182129]')} data-testid={`button-tab-${id}`}><Icon size={16} className={cx('transition-transform group-hover:-translate-y-px', tab === id ? 'text-[#ff653f]' : 'text-[#7b8580]')} /><span><span className="block text-xs font-bold sm:hidden">{short}</span><span className="hidden text-xs font-bold sm:block">{label}</span><span className="hidden nf-mono text-[8px] uppercase tracking-[.08em] text-[#8b948d] lg:block">{note}</span></span>{tab === id && <span className="absolute inset-x-2 -bottom-[2px] h-1 bg-[#ff653f]" />}</button>)}
          </nav>
        </div>
        <main className="animate-rise">
          {tab === 'decks' && <><SectionHeading eyebrow="01 / list architecture" title="Deck Forge" note="A deck is a set of bets. Keep the main deck, sideboard, and maybeboard separate so the tradeoffs stay visible." /><div className="mt-7"><DeckForge store={store} updateStore={updateStore} /></div></>}
          {tab === 'collection' && <><SectionHeading eyebrow="02 / cardboard inventory" title="Collection Forge" note="Track the copies in your actual binders and boxes. Printing details matter when the card is in your hand." /><div className="mt-7"><CollectionForge store={store} updateStore={updateStore} /></div></>}
          {tab === 'playtest' && <PlaytestLab store={store} updateStore={updateStore} />}
          {tab === 'custom' && <><SectionHeading eyebrow="04 / cardboard alchemy" title="Custom Card Forge" note="Prototype one card at a time. Saved cards carry set metadata now, ready for a set editor later." /><div className="mt-7"><CustomCardForge store={store} updateStore={updateStore} /></div></>}
        </main>
      </div>
      <footer className="mx-auto flex max-w-[1480px] flex-col gap-2 border-t border-[#d5d0c7] px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"><div className="flex items-center gap-2 nf-mono text-[9px] uppercase tracking-[.14em] text-[#7c8680]"><Shield size={13} className="text-[#768a32]" /> Your workbench is stored locally</div><div className="nf-mono text-[9px] uppercase tracking-[.12em] text-[#9aa19a]">make the call · then draw seven</div></footer>
    </div>
  );
}

function HexMark() {
  return <span className="relative flex h-5 w-5 items-center justify-center"><span className="absolute inset-0 rotate-30 border-2 border-[#182129]" /><span className="nf-mono relative text-[9px] font-bold">M</span></span>;
}

export default MTGModule;