import { SRD } from '@zeeuw/bag-of-holding';

export type CompendiumCategory =
  | 'spell'
  | 'weapon'
  | 'armor'
  | 'equipment'
  | 'creature'
  | 'class'
  | 'subclass'
  | 'class-feature'
  | 'species'
  | 'species-feature'
  | 'feat'
  | 'condition'
  | 'skill'
  | 'background'
  | 'magic-item'
  | 'rule';

export type CompendiumRecord = {
  id: string;
  name: string;
  category: CompendiumCategory;
  summary: string;
  tags: string[];
  source: 'SRD 5.2';
  data: Record<string, unknown>;
  parentId?: string;
};

export const COMPENDIUM_VERSION = 'SRD 5.2 (2025)';
export const COMPENDIUM_ATTRIBUTION =
  'This work includes material from the System Reference Document 5.2 by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is licensed under the Creative Commons Attribution 4.0 International License.';

const source = SRD as unknown as Record<string, Record<string, Record<string, unknown>>>;

const titleCase = (value: string) =>
  value
    .split(/[-_ ]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const text = (value: unknown) => (typeof value === 'string' ? value : '');

const record = (
  category: CompendiumCategory,
  id: string,
  name: string,
  data: Record<string, unknown>,
  summary: string,
  tags: string[] = [],
  parentId?: string,
): CompendiumRecord => ({
  category,
  id,
  name,
  summary,
  tags,
  source: 'SRD 5.2',
  data,
  ...(parentId ? { parentId } : {}),
});

const spellRecords = Object.entries(source.spells ?? {}).map(([id, data]) => {
  const level = Number(data.level ?? 0);
  const school = text(data.school);
  const details = [
    level === 0 ? 'Cantrip' : `Level ${level}`,
    school ? titleCase(school) : '',
    text(data.damage) ? `Damage ${text(data.damage)}` : '',
    data.concentration ? 'Concentration' : '',
    text(data.range) ? text(data.range) : '',
  ].filter(Boolean);
  return record('spell', id, text(data.name) || titleCase(id), data, details.join(' · '), [
    `level-${level}`,
    school,
    data.concentration ? 'concentration' : '',
  ].filter(Boolean));
});

const itemRecords = Object.entries(source.items ?? {}).map(([id, data]) => {
  const type = text(data.type);
  const category: CompendiumCategory =
    type === 'weapon'
      ? 'weapon'
      : type === 'armor'
        ? 'armor'
        : ['consumable', 'wand', 'staff', 'rod', 'ring', 'wondrous'].includes(type)
          ? 'magic-item'
          : 'equipment';
  const details = [
    type ? titleCase(type) : '',
    text(data.damage) ? text(data.damage) : '',
    text(data.damageType) ? text(data.damageType) : '',
    text(data.rarity) ? titleCase(text(data.rarity)) : '',
    text(data.mastery) ? `Mastery: ${titleCase(text(data.mastery))}` : '',
    typeof data.ac === 'number' ? `AC ${data.ac}` : '',
  ].filter(Boolean);
  return record(category, id, text(data.name) || titleCase(id), data, details.join(' · '), [
    type,
    text(data.category),
    text(data.rarity),
  ].filter(Boolean));
});

const creatureRecords = Object.entries(source.monsters ?? {}).map(([id, data]) => {
  const details = [
    `CR ${String(data.cr ?? '—')}`,
    typeof data.ac === 'number' ? `AC ${data.ac}` : '',
    typeof data.hp === 'number' ? `${data.hp} HP` : '',
    text(data.size) ? titleCase(text(data.size)) : '',
  ].filter(Boolean);
  return record('creature', id, text(data.name) || titleCase(id), data, details.join(' · '), [
    text(data.size),
    `cr-${String(data.cr ?? 'unknown')}`,
  ].filter(Boolean));
});

const classRecords: CompendiumRecord[] = [];
const subclassRecords: CompendiumRecord[] = [];
const classFeatureRecords: CompendiumRecord[] = [];

Object.entries(source.classes ?? {}).forEach(([id, rawData]) => {
  const data = asRecord(rawData);
  const featureMap = asRecord(data.features);
  const featureCount = Object.values(featureMap).flatMap((value) => Array.isArray(value) ? value : []).length;
  classRecords.push(record(
    'class',
    id,
    text(data.name) || titleCase(id),
    data,
    `${text(data.primaryAbility).toUpperCase()} · d${String(data.hitDie ?? '—')} Hit Die · ${featureCount} level features`,
    [text(data.primaryAbility), `d${String(data.hitDie ?? '')}`].filter(Boolean),
  ));
  Object.entries(asRecord(data.subclasses)).forEach(([subclassId, rawSubclass]) => {
    const subclass = asRecord(rawSubclass);
    const fullId = `${id}:${subclassId}`;
    subclassRecords.push(record(
      'subclass',
      fullId,
      text(subclass.name) || titleCase(subclassId),
      { ...subclass, classId: id },
      `${text(data.name) || titleCase(id)} subclass · ${Object.keys(asRecord(subclass.features)).length} feature levels`,
      [id],
      id,
    ));
    Object.entries(asRecord(subclass.features)).forEach(([level, features]) => {
      (Array.isArray(features) ? features : []).forEach((feature) => {
        const featureName = text(feature);
        if (!featureName) return;
        classFeatureRecords.push(record(
          'class-feature',
          `${fullId}:feature-${level}-${featureName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          featureName,
          { level: Number(level), classId: id, subclassId: fullId },
          `Level ${level} · ${text(subclass.name) || titleCase(subclassId)}`,
          [id, fullId, `level-${level}`],
          fullId,
        ));
      });
    });
  });
  Object.entries(featureMap).forEach(([level, features]) => {
    (Array.isArray(features) ? features : []).forEach((feature) => {
      const featureName = text(feature);
      if (!featureName) return;
      classFeatureRecords.push(record(
        'class-feature',
        `${id}:feature-${level}-${featureName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        featureName,
        { level: Number(level), classId: id },
        `Level ${level} · ${text(data.name) || titleCase(id)}`,
        [id, `level-${level}`],
        id,
      ));
    });
  });
});

const speciesRecords: CompendiumRecord[] = [];
const speciesFeatureRecords: CompendiumRecord[] = [];
Object.entries(source.species ?? {}).forEach(([id, rawData]) => {
  const data = asRecord(rawData);
  const traits = Array.isArray(data.traits) ? data.traits : [];
  speciesRecords.push(record(
    'species',
    id,
    text(data.name) || titleCase(id),
    data,
    `${titleCase(text(data.size) || 'medium')} · ${String(data.speed ?? 30)} ft · ${traits.length} traits`,
    [text(data.size)].filter(Boolean),
  ));
  traits.forEach((trait) => {
    const traitName = text(trait);
    if (!traitName) return;
    speciesFeatureRecords.push(record(
      'species-feature',
      `${id}:trait-${traitName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      traitName,
      { speciesId: id },
      `${text(data.name) || titleCase(id)} species trait`,
      [id],
      id,
    ));
  });
});

const backgroundRecords = Object.entries(source.backgrounds ?? {}).map(([id, data]) => {
  const skillProficiencies = Array.isArray(data.skillProficiencies) ? data.skillProficiencies : [];
  return record(
    'background',
    id,
    text(data.name) || titleCase(id),
    data,
    `${skillProficiencies.map((skill) => titleCase(text(skill))).join(', ')} · origin feat: ${text(asRecord(data.originFeat).id) || '—'}`,
    skillProficiencies.map(text).filter(Boolean),
  );
});

const featRecords = Object.entries(source.feats ?? {}).map(([id, data]) =>
  record(
    'feat',
    id,
    text(data.name) || titleCase(id),
    data,
    `${text(data.category) ? titleCase(text(data.category)) : 'Feat'} feat${data.repeatable ? ' · repeatable' : ''}`,
    [text(data.category)].filter(Boolean),
  ),
);

const conditions: Array<[string, string, string]> = [
  ['blinded', 'Blinded', 'You cannot see and automatically fail sight-based checks. Attack rolls against you have Advantage; your attack rolls have Disadvantage.'],
  ['charmed', 'Charmed', 'You cannot attack the charmer or target the charmer with harmful abilities. The charmer has Advantage on social checks against you.'],
  ['deafened', 'Deafened', 'You cannot hear and automatically fail checks that require hearing.'],
  ['exhaustion', 'Exhaustion', 'Each level imposes a cumulative −2 penalty on D20 Tests. At level 10, you die.'],
  ['frightened', 'Frightened', 'You have Disadvantage on checks and attacks while the source of fear is in line of sight, and you cannot willingly move closer to it.'],
  ['grappled', 'Grappled', 'Your Speed is 0 and cannot increase. Attacks against targets other than the grappler have Disadvantage.'],
  ['incapacitated', 'Incapacitated', 'You cannot take actions, Bonus Actions, or Reactions, and you lose Concentration.'],
  ['invisible', 'Invisible', 'You cannot be seen without special senses. You have Advantage on attacks and attacks against you have Disadvantage.'],
  ['paralyzed', 'Paralyzed', 'You are Incapacitated, fail Strength and Dexterity saves, and attacks within 5 feet are Critical Hits.'],
  ['petrified', 'Petrified', 'You are transformed into a solid substance, incapacitated, unaware, and resistant to all damage.'],
  ['poisoned', 'Poisoned', 'You have Disadvantage on attacks and ability checks.'],
  ['prone', 'Prone', 'You can only crawl, have Disadvantage on attacks, and attacks within 5 feet have Advantage against you.'],
  ['restrained', 'Restrained', 'Your Speed is 0, attacks against you have Advantage, your attacks have Disadvantage, and you have Disadvantage on Dexterity saves.'],
  ['stunned', 'Stunned', 'You are Incapacitated, fail Strength and Dexterity saves, and attacks against you have Advantage.'],
  ['unconscious', 'Unconscious', 'You are Incapacitated, unaware, drop held items, fall Prone, and fail Strength and Dexterity saves.'],
];

const conditionRecords = conditions.map(([id, name, summary]) => record('condition', id, name, {}, summary));

const skills = [
  ['acrobatics', 'Acrobatics', 'DEX'], ['animal-handling', 'Animal Handling', 'WIS'],
  ['arcana', 'Arcana', 'INT'], ['athletics', 'Athletics', 'STR'], ['deception', 'Deception', 'CHA'],
  ['history', 'History', 'INT'], ['insight', 'Insight', 'WIS'], ['intimidation', 'Intimidation', 'CHA'],
  ['investigation', 'Investigation', 'INT'], ['medicine', 'Medicine', 'WIS'], ['nature', 'Nature', 'INT'],
  ['perception', 'Perception', 'WIS'], ['performance', 'Performance', 'CHA'], ['persuasion', 'Persuasion', 'CHA'],
  ['religion', 'Religion', 'INT'], ['sleight-of-hand', 'Sleight of Hand', 'DEX'],
  ['stealth', 'Stealth', 'DEX'], ['survival', 'Survival', 'WIS'],
] as const;

const skillRecords = skills.map(([id, name, ability]) =>
  record('skill', id, name, { ability }, `${ability} ability skill`),
);

const ruleRecords = [
  record('rule', 'ability-scores', 'Ability Scores', {}, 'Six scores define a creature’s physical and mental capabilities: Strength, Dexterity, Constitution, Intelligence, Wisdom, and Charisma.'),
  record('rule', 'proficiency-bonus', 'Proficiency Bonus', {}, 'Your proficiency bonus is added to checks, attacks, and saving throws when your training applies. It scales with character level.'),
  record('rule', 'd20-tests', 'D20 Tests', {}, 'Ability checks, attack rolls, and saving throws use a D20 Test; Advantage and Disadvantage change how many dice are rolled.'),
  record('rule', 'weapon-mastery', 'Weapon Mastery', {}, 'The 2024 rules give qualifying characters mastery properties that add tactical effects to weapon attacks.'),
  record('rule', 'spellcasting', 'Spellcasting', {}, 'Spells use spell slots and a spellcasting ability; a spell save DC is 8 + proficiency bonus + spellcasting modifier.'),
  record('rule', 'actions', 'Actions in Combat', {}, 'A turn can include movement, one Action, one Bonus Action when available, and one Reaction between turns.'),
];

export const DND_COMPENDIUM: CompendiumRecord[] = [
  ...spellRecords,
  ...itemRecords,
  ...creatureRecords,
  ...classRecords,
  ...subclassRecords,
  ...classFeatureRecords,
  ...speciesRecords,
  ...speciesFeatureRecords,
  ...featRecords,
  ...conditionRecords,
  ...skillRecords,
  ...backgroundRecords,
  ...ruleRecords,
];

export const COMPENDIUM_CATEGORIES: Array<{ id: CompendiumCategory; label: string }> = [
  { id: 'spell', label: 'Spells' },
  { id: 'weapon', label: 'Weapons' },
  { id: 'armor', label: 'Armor' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'creature', label: 'Creatures' },
  { id: 'class', label: 'Classes' },
  { id: 'subclass', label: 'Subclasses' },
  { id: 'class-feature', label: 'Class features' },
  { id: 'species', label: 'Species' },
  { id: 'species-feature', label: 'Species features' },
  { id: 'feat', label: 'Feats' },
  { id: 'condition', label: 'Conditions' },
  { id: 'skill', label: 'Skills' },
  { id: 'background', label: 'Backgrounds' },
  { id: 'magic-item', label: 'Magic items' },
  { id: 'rule', label: 'Rules' },
];

export const compendiumById = (id: string | undefined) =>
  id ? DND_COMPENDIUM.find((entry) => entry.id === id) : undefined;

export const compendiumRecords = (category?: CompendiumCategory) =>
  category ? DND_COMPENDIUM.filter((entry) => entry.category === category) : DND_COMPENDIUM;

export const searchCompendium = (query: string, category?: CompendiumCategory) => {
  const normalized = query.trim().toLowerCase();
  return compendiumRecords(category)
    .filter((entry) => !normalized || `${entry.name} ${entry.summary} ${entry.tags.join(' ')}`.toLowerCase().includes(normalized))
    .slice(0, 80);
};

export const idsForNames = (names: string[], category?: CompendiumCategory) => {
  const normalized = new Set(names.map((name) => name.trim().toLowerCase()));
  return compendiumRecords(category)
    .filter((entry) => normalized.has(entry.name.toLowerCase()))
    .map((entry) => entry.id);
};

export const xpForChallenge = (challenge: unknown) => {
  const cr = String(challenge);
  const xp: Record<string, number> = {
    '0': 10, '0.125': 25, '0.25': 50, '0.5': 100, '1': 200, '2': 450,
    '3': 700, '4': 1100, '5': 1800, '6': 2300, '7': 2900, '8': 3900,
    '9': 5000, '10': 5900, '11': 7200, '12': 8400, '13': 10000, '14': 11500,
    '15': 13000, '16': 15000, '17': 18000, '18': 20000, '19': 22000,
    '20': 25000, '21': 33000, '22': 41000, '23': 50000, '24': 62000,
    '25': 75000, '26': 90000, '27': 105000, '28': 120000, '29': 135000, '30': 155000,
  };
  return xp[cr] ?? 0;
};

export const classForId = (id: string) => compendiumById(id);
export const speciesForId = (id: string) => compendiumById(id);
export const subclassForClass = (classId: string, subclassId: string) =>
  DND_COMPENDIUM.find((entry) => entry.category === 'subclass' && entry.parentId === classId && entry.id === `${classId}:${subclassId}`);