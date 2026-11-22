import {
  AbilityKey,
  AbilityScores,
  Move,
  PartyWorkspace,
  PokemonSheet,
  PokemonType,
  SavingThrowProficiencies,
  SkillName,
  SkillProficiencies,
} from '../types/pokemon5e';

export const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export const ABILITY_LABELS: Record<AbilityKey, { short: string; full: string }> = {
  str: { short: 'STR', full: 'Strength' },
  dex: { short: 'DEX', full: 'Dexterity' },
  con: { short: 'CON', full: 'Constitution' },
  int: { short: 'INT', full: 'Intelligence' },
  wis: { short: 'WIS', full: 'Wisdom' },
  cha: { short: 'CHA', full: 'Charisma' },
};

export const POKEMON_TYPES: PokemonType[] = [
  'Normal',
  'Fire',
  'Water',
  'Electric',
  'Grass',
  'Ice',
  'Fighting',
  'Poison',
  'Ground',
  'Flying',
  'Psychic',
  'Bug',
  'Rock',
  'Ghost',
  'Dragon',
  'Dark',
  'Steel',
  'Fairy',
];

export const TYPE_STYLES: Record<
  PokemonType,
  { hex: string; bg: string; text: string; border: string }
> = {
  Normal: {
    hex: '#94A3B8',
    bg: 'bg-slate-500/15',
    text: 'text-slate-200',
    border: 'border-slate-500/35',
  },
  Fire: {
    hex: '#F97316',
    bg: 'bg-orange-500/15',
    text: 'text-orange-300',
    border: 'border-orange-500/35',
  },
  Water: {
    hex: '#3B82F6',
    bg: 'bg-blue-500/15',
    text: 'text-blue-300',
    border: 'border-blue-500/35',
  },
  Electric: {
    hex: '#EAB308',
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-300',
    border: 'border-yellow-500/35',
  },
  Grass: {
    hex: '#22C55E',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    border: 'border-emerald-500/35',
  },
  Ice: {
    hex: '#38BDF8',
    bg: 'bg-sky-400/15',
    text: 'text-sky-200',
    border: 'border-sky-400/35',
  },
  Fighting: {
    hex: '#EF4444',
    bg: 'bg-red-500/15',
    text: 'text-red-300',
    border: 'border-red-500/35',
  },
  Poison: {
    hex: '#A855F7',
    bg: 'bg-purple-500/15',
    text: 'text-purple-300',
    border: 'border-purple-500/35',
  },
  Ground: {
    hex: '#D97706',
    bg: 'bg-amber-600/15',
    text: 'text-amber-300',
    border: 'border-amber-600/35',
  },
  Flying: {
    hex: '#818CF8',
    bg: 'bg-indigo-400/15',
    text: 'text-indigo-200',
    border: 'border-indigo-400/35',
  },
  Psychic: {
    hex: '#EC4899',
    bg: 'bg-pink-500/15',
    text: 'text-pink-300',
    border: 'border-pink-500/35',
  },
  Bug: {
    hex: '#84CC16',
    bg: 'bg-lime-500/15',
    text: 'text-lime-300',
    border: 'border-lime-500/35',
  },
  Rock: {
    hex: '#A16207',
    bg: 'bg-yellow-700/20',
    text: 'text-amber-200',
    border: 'border-yellow-600/40',
  },
  Ghost: {
    hex: '#8B5CF6',
    bg: 'bg-violet-500/15',
    text: 'text-violet-300',
    border: 'border-violet-500/35',
  },
  Dragon: {
    hex: '#6366F1',
    bg: 'bg-indigo-500/20',
    text: 'text-indigo-300',
    border: 'border-indigo-500/40',
  },
  Dark: {
    hex: '#71717A',
    bg: 'bg-zinc-600/25',
    text: 'text-zinc-200',
    border: 'border-zinc-500/40',
  },
  Steel: {
    hex: '#64748B',
    bg: 'bg-slate-400/15',
    text: 'text-slate-200',
    border: 'border-slate-400/35',
  },
  Fairy: {
    hex: '#F472B6',
    bg: 'bg-pink-400/15',
    text: 'text-pink-200',
    border: 'border-pink-400/35',
  },
};

export const SKILL_ABILITY_MAP: Record<SkillName, AbilityKey> = {
  Acrobatics: 'dex',
  'Animal Handling': 'wis',
  Arcana: 'int',
  Athletics: 'str',
  Deception: 'cha',
  History: 'int',
  Insight: 'wis',
  Intimidation: 'cha',
  Investigation: 'int',
  Medicine: 'wis',
  Nature: 'int',
  Perception: 'wis',
  Performance: 'cha',
  Persuasion: 'cha',
  Religion: 'int',
  'Sleight of Hand': 'dex',
  Stealth: 'dex',
  Survival: 'wis',
};

export const ALL_SKILLS = Object.keys(SKILL_ABILITY_MAP) as SkillName[];

export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatSignedModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function getProficiencyBonus(level: number, override?: number): number {
  if (typeof override === 'number' && !Number.isNaN(override)) {
    return override;
  }
  const clamped = Math.max(1, Math.min(20, Math.floor(level || 1)));
  return Math.ceil(clamped / 4) + 1;
}

/**
 * Pokémon 5e STAB Progression:
 * Lv 1-2: +1 | Lv 3-6: +2 | Lv 7-10: +3 | Lv 11-14: +4 | Lv 15-18: +5 | Lv 19-20: +6
 */
export function getStabValue(level: number, override?: number): number {
  if (typeof override === 'number' && !Number.isNaN(override)) {
    return override;
  }
  const lv = Math.max(1, Math.min(20, Math.floor(level || 1)));
  if (lv <= 2) return 1;
  if (lv <= 6) return 2;
  if (lv <= 10) return 3;
  if (lv <= 14) return 4;
  if (lv <= 18) return 5;
  return 6;
}

export function getSavingThrowModifier(
  abilities: AbilityScores,
  savingThrows: SavingThrowProficiencies,
  key: AbilityKey,
  profBonus: number
): number {
  return getAbilityModifier(abilities[key]) + (savingThrows[key] ? profBonus : 0);
}

export function getSkillModifier(
  abilities: AbilityScores,
  skills: SkillProficiencies,
  skill: SkillName,
  profBonus: number
): number {
  const ability = SKILL_ABILITY_MAP[skill];
  const base = getAbilityModifier(abilities[ability]);
  const level = skills[skill];
  if (level === 'expertise') return base + profBonus * 2;
  if (level === 'proficient') return base + profBonus;
  return base;
}

export function hasMoveStab(pokemon: PokemonSheet, move: Move): boolean {
  return move.stabEligible && pokemon.types.includes(move.type);
}

export function getMoveAttackBonus(pokemon: PokemonSheet, move: Move): number {
  const prof = getProficiencyBonus(pokemon.level, pokemon.proficiencyOverride);
  const powerMod = getAbilityModifier(pokemon.abilities[move.movePower]);
  return powerMod + prof;
}

export function getMoveSaveDc(pokemon: PokemonSheet, move: Move): number {
  const prof = getProficiencyBonus(pokemon.level, pokemon.proficiencyOverride);
  const powerMod = getAbilityModifier(pokemon.abilities[move.movePower]);
  return 8 + prof + powerMod;
}

export function getMoveDamageBonus(pokemon: PokemonSheet, move: Move): {
  powerMod: number;
  stabBonus: number;
  totalBonus: number;
} {
  const powerMod = getAbilityModifier(pokemon.abilities[move.movePower]);
  const stabBonus = hasMoveStab(pokemon, move)
    ? getStabValue(pokemon.level, pokemon.stabOverride)
    : 0;
  return {
    powerMod,
    stabBonus,
    totalBonus: powerMod + stabBonus,
  };
}

export function createEmptySkills(): SkillProficiencies {
  return ALL_SKILLS.reduce((acc, skill) => {
    acc[skill] = 'none';
    return acc;
  }, {} as SkillProficiencies);
}

export function createEmptySaves(): SavingThrowProficiencies {
  return {
    str: false,
    dex: false,
    con: false,
    int: false,
    wis: false,
    cha: false,
  };
}

export function createId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createStarterParty(): PartyWorkspace {
  const trainerSkills = createEmptySkills();
  trainerSkills.Athletics = 'proficient';
  trainerSkills['Animal Handling'] = 'proficient';
  trainerSkills.Perception = 'proficient';
  trainerSkills.Persuasion = 'proficient';

  const pikachuSkills = createEmptySkills();
  pikachuSkills.Acrobatics = 'proficient';
  pikachuSkills.Perception = 'proficient';
  pikachuSkills.Stealth = 'proficient';

  const charmeleonSkills = createEmptySkills();
  charmeleonSkills.Athletics = 'proficient';
  charmeleonSkills.Intimidation = 'proficient';

  return {
    trainer: {
      id: 'trainer',
      kind: 'trainer',
      name: 'Kael Vance',
      level: 5,
      trainerClass: 'Ace Trainer',
      origin: 'Cerulean Outpost',
      hpCurrent: 42,
      hpMax: 42,
      tempHp: 0,
      ac: 14,
      speed: 30,
      hitDice: '5d8',
      abilities: {
        str: 12,
        dex: 15,
        con: 14,
        int: 12,
        wis: 14,
        cha: 16,
      },
      savingThrows: {
        str: false,
        dex: true,
        con: false,
        int: false,
        wis: false,
        cha: true,
      },
      skills: trainerSkills,
      pokeballs: {
        pokeBall: 8,
        greatBall: 4,
        ultraBall: 1,
        other: '1x Premier Ball, 2x Dusk Ball',
      },
      money: 4250,
      badges: 3,
      trainerPaths: 'Ace Trainer (Tactician) · Field Medic Specialization',
      notes:
        'Carries 3x Super Potion, Pokedex v2, and Town Map. Bonus action to issue tactical command (+1 AC or advantage on next save).',
    },
    pokemon: [
      {
        id: 'poke-pikachu',
        kind: 'pokemon',
        name: 'Sparky',
        species: 'Pikachu',
        level: 5,
        sr: '2',
        types: ['Electric'],
        nature: 'Jolly',
        ability: 'Static',
        abilityDescription:
          'Melee attackers that hit this Pokémon must succeed on a CON save or become Paralyzed until the end of their next turn.',
        hpCurrent: 38,
        hpMax: 38,
        tempHp: 0,
        ac: 15,
        speed: 35,
        hitDice: '5d8',
        abilities: {
          str: 10,
          dex: 18,
          con: 12,
          int: 10,
          wis: 12,
          cha: 14,
        },
        savingThrows: {
          str: false,
          dex: true,
          con: false,
          int: false,
          wis: false,
          cha: true,
        },
        skills: pikachuSkills,
        heldItem: 'Light Ball',
        statusCondition: 'Healthy',
        notes: 'High initiative scout. Uses Quick Attack to close distance before Thunderbolt.',
        moves: [
          {
            id: 'mv-thunderbolt',
            name: 'Thunderbolt',
            type: 'Electric',
            ppCurrent: 15,
            ppMax: 15,
            movePower: 'dex',
            damageDice: '2d8',
            isAttack: true,
            stabEligible: true,
            range: '60 ft',
            castingTime: '1 Action',
            description:
              'A strong electric blast crashes down on a target. On a roll of 19-20 on the attack die, the target is Paralyzed.',
          },
          {
            id: 'mv-quick-attack',
            name: 'Quick Attack',
            type: 'Normal',
            ppCurrent: 20,
            ppMax: 20,
            movePower: 'dex',
            damageDice: '1d6',
            isAttack: true,
            stabEligible: true,
            range: 'Melee (5 ft)',
            castingTime: '1 Bonus Action',
            description: 'Lunges at blinding speed. Can be used as a bonus action after moving.',
          },
          {
            id: 'mv-thunder-wave',
            name: 'Thunder Wave',
            type: 'Electric',
            ppCurrent: 10,
            ppMax: 10,
            movePower: 'dex',
            damageDice: '',
            isAttack: false,
            saveAbility: 'con',
            stabEligible: false,
            range: '30 ft',
            castingTime: '1 Action',
            description: 'A weak electric charge that paralyzes the target on a failed CON save.',
          },
        ],
      },
      {
        id: 'poke-charmeleon',
        kind: 'pokemon',
        name: 'Cinder',
        species: 'Charmeleon',
        level: 5,
        sr: '5',
        types: ['Fire'],
        nature: 'Brave',
        ability: 'Blaze',
        abilityDescription:
          'When at or below 25% max HP, Fire-type moves gain +2 to damage rolls.',
        hpCurrent: 49,
        hpMax: 52,
        tempHp: 0,
        ac: 14,
        speed: 30,
        hitDice: '5d10',
        abilities: {
          str: 16,
          dex: 14,
          con: 15,
          int: 10,
          wis: 11,
          cha: 13,
        },
        savingThrows: {
          str: true,
          dex: false,
          con: true,
          int: false,
          wis: false,
          cha: false,
        },
        skills: charmeleonSkills,
        heldItem: 'Charcoal',
        statusCondition: 'Healthy',
        notes: 'Frontline striker.',
        moves: [
          {
            id: 'mv-flamethrower',
            name: 'Flamethrower',
            type: 'Fire',
            ppCurrent: 14,
            ppMax: 15,
            movePower: 'str',
            damageDice: '2d8',
            isAttack: true,
            stabEligible: true,
            range: '30 ft line',
            castingTime: '1 Action',
            description:
              'Scorches targets with intense flame. Targets failing a DEX save take burn damage.',
          },
          {
            id: 'mv-slash',
            name: 'Slash',
            type: 'Normal',
            ppCurrent: 20,
            ppMax: 20,
            movePower: 'str',
            damageDice: '1d10',
            isAttack: true,
            stabEligible: true,
            range: 'Melee (5 ft)',
            castingTime: '1 Action',
            description: 'High critical hit ratio (critical hit on 19-20).',
          },
        ],
      },
    ],
  };
}
