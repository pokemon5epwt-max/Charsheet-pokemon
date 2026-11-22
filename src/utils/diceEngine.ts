import {
  PokemonType,
  RollCategory,
  RollEntry,
  RollMode,
  RollVisibility,
} from '../types/pokemon5e';
import { createId, formatSignedModifier } from './pokemon5eRules';

export interface RollRequest {
  characterId: string;
  characterName: string;
  label: string;
  category: RollCategory;
  rollMode: RollMode;
  visibility: RollVisibility;
  rollerName: string;
  ownerId: string;
  /** Dice expression for damage or custom rolls (e.g. "2d8", "1d6 + 1d4") */
  diceExpression?: string;
  /** Flat modifier applied to roll */
  modifier?: number;
  /** Optional itemized breakdown parts e.g. ["DEX(+4)", "Prof(+3)"] */
  modifierParts?: string[];
  moveType?: PokemonType;
}

function rollSingleDie(sides: number): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return (arr[0] % sides) + 1;
  }
  return Math.floor(Math.random() * sides) + 1;
}

interface ParsedDiceTerm {
  sign: 1 | -1;
  count: number;
  sides: number;
}

export function parseDiceExpression(expr: string): {
  terms: ParsedDiceTerm[];
  flatBonus: number;
} {
  const cleaned = expr.replace(/\s+/g, '').toLowerCase();
  if (!cleaned) {
    return { terms: [], flatBonus: 0 };
  }

  const tokens = cleaned.match(/[+-]?[^+-]+/g) || [];
  const terms: ParsedDiceTerm[] = [];
  let flatBonus = 0;

  for (const token of tokens) {
    const sign: 1 | -1 = token.startsWith('-') ? -1 : 1;
    const body = token.replace(/^[+-]/, '');
    const diceMatch = body.match(/^(\d*)d(\d+)$/);
    if (diceMatch) {
      const count = Math.min(50, Math.max(1, parseInt(diceMatch[1] || '1', 10)));
      const sides = Math.min(1000, Math.max(2, parseInt(diceMatch[2], 10)));
      terms.push({ sign, count, sides });
    } else if (/^\d+$/.test(body)) {
      flatBonus += sign * parseInt(body, 10);
    }
  }

  return { terms, flatBonus };
}

export function executeRoll(req: RollRequest): RollEntry {
  const timestamp = new Date().toISOString();
  const baseMod = req.modifier ?? 0;
  const parts = req.modifierParts ? [...req.modifierParts] : [];

  // D20 checks (Ability, Save, Skill, Attack, Initiative)
  if (req.category !== 'damage' && req.category !== 'custom') {
    const d1 = rollSingleDie(20);
    const d2 = req.rollMode === 'normal' ? null : rollSingleDie(20);
    const diceRolls = d2 !== null ? [d1, d2] : [d1];
    const selectedDie =
      d2 === null
        ? d1
        : req.rollMode === 'advantage'
          ? Math.max(d1, d2)
          : Math.min(d1, d2);

    const total = selectedDie + baseMod;
    const isCrit = selectedDie === 20;
    const isFumble = selectedDie === 1;

    const dieText =
      d2 === null
        ? `d20(${d1})`
        : `2d20${req.rollMode === 'advantage' ? 'kh1' : 'kl1'}(${d1}, ${d2} → ${selectedDie})`;

    const modText =
      parts.length > 0
        ? parts.join(' + ')
        : baseMod !== 0
          ? formatSignedModifier(baseMod)
          : '';

    const breakdown = modText ? `${dieText} + ${modText} = ${total}` : `${dieText} = ${total}`;
    const formula = `1d20${baseMod !== 0 ? ` ${formatSignedModifier(baseMod)}` : ''}`;

    return {
      id: createId('roll'),
      timestamp,
      rollerName: req.rollerName,
      ownerId: req.ownerId,
      characterId: req.characterId,
      characterName: req.characterName,
      label: req.label,
      category: req.category,
      rollMode: req.rollMode,
      visibility: req.visibility,
      formula,
      diceRolls,
      selectedDie,
      total,
      breakdown,
      isCrit,
      isFumble,
      moveType: req.moveType,
      source: 'local',
    };
  }

  // Damage or Custom expression roll
  const expr = (req.diceExpression || '1d6').trim();
  const parsed = parseDiceExpression(expr);
  const diceRolls: number[] = [];
  const termStrings: string[] = [];
  let diceSum = 0;

  for (const term of parsed.terms) {
    const rolled: number[] = [];
    for (let i = 0; i < term.count; i++) {
      const val = rollSingleDie(term.sides);
      rolled.push(val);
      diceRolls.push(val);
      diceSum += term.sign * val;
    }
    const prefix = term.sign === -1 ? '-' : '';
    termStrings.push(`${prefix}${term.count}d${term.sides}(${rolled.join(', ')})`);
  }

  const combinedMod = baseMod + parsed.flatBonus;
  const total = Math.max(0, diceSum + combinedMod);

  if (parsed.flatBonus !== 0) {
    parts.unshift(`Flat(${formatSignedModifier(parsed.flatBonus)})`);
  }

  const modString = parts.length > 0 ? parts.join(' + ') : combinedMod !== 0 ? formatSignedModifier(combinedMod) : '';
  const diceSegment = termStrings.length > 0 ? termStrings.join(' + ') : '0';
  const breakdown = modString
    ? `${diceSegment} + ${modString} = ${total}`
    : `${diceSegment} = ${total}`;

  const formula = `${expr}${baseMod !== 0 ? ` ${formatSignedModifier(baseMod)}` : ''}`;

  return {
    id: createId('roll'),
    timestamp,
    rollerName: req.rollerName,
    ownerId: req.ownerId,
    characterId: req.characterId,
    characterName: req.characterName,
    label: req.label,
    category: req.category,
    rollMode: 'normal',
    visibility: req.visibility,
    formula,
    diceRolls,
    total,
    breakdown,
    isCrit: false,
    isFumble: false,
    moveType: req.moveType,
    source: 'local',
  };
}
