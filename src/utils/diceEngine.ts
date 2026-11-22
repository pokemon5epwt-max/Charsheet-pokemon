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
  /** Dice expression for damage or custom rolls (e.g. "2d8", "4d6kh3 + 2") */
  diceExpression?: string;
  /** Flat modifier applied to roll */
  modifier?: number;
  /** Optional itemized breakdown parts e.g. ["DEX(+4)", "Prof(+3)"] */
  modifierParts?: string[];
  moveType?: PokemonType;
  /** Double dice count on damage roll for 5e Critical Hits */
  isCriticalDamage?: boolean;
}

/**
 * Cryptographically uniform die roll in [1, sides] using rejection sampling
 * to eliminate modulo bias.
 */
function rollSingleDie(sides: number): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const maxUnbiased = Math.floor(0x100000000 / sides) * sides;
    const arr = new Uint32Array(1);
    let rand = 0;
    do {
      crypto.getRandomValues(arr);
      rand = arr[0];
    } while (rand >= maxUnbiased);
    return (rand % sides) + 1;
  }
  return Math.floor(Math.random() * sides) + 1;
}

export type KeepDropMode = 'kh' | 'kl' | 'dh' | 'dl';

export interface ParsedDiceTerm {
  sign: 1 | -1;
  count: number;
  sides: number;
  keepDrop?: {
    mode: KeepDropMode;
    amount: number;
  };
}

export interface ParsedDiceExpression {
  isValid: boolean;
  terms: ParsedDiceTerm[];
  flatBonus: number;
  error?: string;
}

export function parseDiceExpression(expr: string): ParsedDiceExpression {
  const cleaned = expr.replace(/\s+/g, '').toLowerCase();
  if (!cleaned) {
    return { isValid: false, terms: [], flatBonus: 0, error: 'Empty dice formula' };
  }

  // Ensure every token starts with optional +/- followed by valid dice or integer
  const rawTokens = cleaned.match(/[+-]?[^+-]+/g);
  if (!rawTokens || rawTokens.join('') !== cleaned) {
    return { isValid: false, terms: [], flatBonus: 0, error: 'Invalid dice syntax' };
  }

  const terms: ParsedDiceTerm[] = [];
  let flatBonus = 0;

  for (const token of rawTokens) {
    const sign: 1 | -1 = token.startsWith('-') ? -1 : 1;
    const body = token.replace(/^[+-]/, '');
    if (!body) {
      return { isValid: false, terms: [], flatBonus: 0, error: 'Trailing operator' };
    }

    const diceMatch = body.match(/^(\d*)d(\d+)(?:(kh|kl|dh|dl)(\d+))?$/);
    if (diceMatch) {
      const count = Math.min(50, Math.max(1, parseInt(diceMatch[1] || '1', 10)));
      const sides = Math.min(1000, Math.max(2, parseInt(diceMatch[2], 10)));
      let keepDrop: ParsedDiceTerm['keepDrop'];
      if (diceMatch[3] && diceMatch[4]) {
        const amount = Math.max(1, Math.min(count, parseInt(diceMatch[4], 10)));
        keepDrop = {
          mode: diceMatch[3] as KeepDropMode,
          amount,
        };
      }
      terms.push({ sign, count, sides, keepDrop });
    } else if (/^\d+$/.test(body)) {
      flatBonus += sign * parseInt(body, 10);
    } else {
      return {
        isValid: false,
        terms: [],
        flatBonus: 0,
        error: `Unrecognized term "${body}"`,
      };
    }
  }

  return { isValid: true, terms, flatBonus };
}

function evaluateDiceTerm(
  term: ParsedDiceTerm,
  doubleCount = false
): {
  sum: number;
  allRolls: number[];
  keptRolls: number[];
  label: string;
} {
  const effectiveCount = doubleCount ? Math.min(100, term.count * 2) : term.count;
  const rolled: number[] = [];
  for (let i = 0; i < effectiveCount; i++) {
    rolled.push(rollSingleDie(term.sides));
  }

  let kept = [...rolled];
  if (term.keepDrop) {
    const sortedWithIndex = rolled
      .map((val, idx) => ({ val, idx }))
      .sort((a, b) => a.val - b.val);

    const { mode, amount } = term.keepDrop;
    let keepIndices: Set<number>;
    if (mode === 'kh') {
      keepIndices = new Set(sortedWithIndex.slice(-amount).map((x) => x.idx));
    } else if (mode === 'kl') {
      keepIndices = new Set(sortedWithIndex.slice(0, amount).map((x) => x.idx));
    } else if (mode === 'dh') {
      keepIndices = new Set(
        sortedWithIndex.slice(0, Math.max(0, rolled.length - amount)).map((x) => x.idx)
      );
    } else {
      // dl (drop lowest)
      keepIndices = new Set(sortedWithIndex.slice(amount).map((x) => x.idx));
    }
    kept = rolled.filter((_, idx) => keepIndices.has(idx));
  }

  const rawSum = kept.reduce((acc, v) => acc + v, 0);
  const kdSuffix = term.keepDrop ? `${term.keepDrop.mode}${term.keepDrop.amount}` : '';
  const rollsDisplay =
    term.keepDrop && kept.length < rolled.length
      ? `${rolled.join(', ')} → ${kept.join(', ')}`
      : rolled.join(', ');

  return {
    sum: term.sign * rawSum,
    allRolls: rolled,
    keptRolls: kept,
    label: `${effectiveCount}d${term.sides}${kdSuffix}(${rollsDisplay})`,
  };
}

function joinSignedSegments(segments: Array<{ sign: 1 | -1; text: string }>): string {
  return segments
    .map((seg, idx) => {
      if (idx === 0) {
        return seg.sign === -1 ? `-${seg.text}` : seg.text;
      }
      return seg.sign === -1 ? `- ${seg.text}` : `+ ${seg.text}`;
    })
    .join(' ');
}

export function executeRoll(req: RollRequest): RollEntry {
  const timestamp = new Date().toISOString();
  const baseMod = req.modifier ?? 0;
  const parts = req.modifierParts ? [...req.modifierParts] : [];

  // Check if a custom roll is actually a single d20 roll (e.g., "1d20 + 5" or "d20")
  const parsedCustom =
    req.category === 'custom'
      ? parseDiceExpression((req.diceExpression || '1d20').trim())
      : null;

  const isSingleD20Custom =
    Boolean(parsedCustom?.isValid) &&
    parsedCustom!.terms.length === 1 &&
    parsedCustom!.terms[0].sign === 1 &&
    parsedCustom!.terms[0].count === 1 &&
    parsedCustom!.terms[0].sides === 20 &&
    !parsedCustom!.terms[0].keepDrop;

  // D20 checks (Ability, Save, Skill, Attack, Initiative, or 1d20 Custom)
  if ((req.category !== 'damage' && req.category !== 'custom') || isSingleD20Custom) {
    const effectiveMod = isSingleD20Custom
      ? baseMod + parsedCustom!.flatBonus
      : baseMod;

    const d1 = rollSingleDie(20);
    const d2 = req.rollMode === 'normal' ? null : rollSingleDie(20);
    const diceRolls = d2 !== null ? [d1, d2] : [d1];
    const selectedDie =
      d2 === null
        ? d1
        : req.rollMode === 'advantage'
          ? Math.max(d1, d2)
          : Math.min(d1, d2);

    const total = selectedDie + effectiveMod;
    const isCrit = selectedDie === 20;
    const isFumble = selectedDie === 1;

    const dieText =
      d2 === null
        ? `d20(${d1})`
        : `2d20${req.rollMode === 'advantage' ? 'kh1' : 'kl1'}(${d1}, ${d2} → ${selectedDie})`;

    const segments: Array<{ sign: 1 | -1; text: string }> = [
      { sign: 1, text: dieText },
    ];

    if (parts.length > 0) {
      for (const p of parts) {
        segments.push({ sign: 1, text: p });
      }
    } else if (effectiveMod !== 0) {
      segments.push({
        sign: effectiveMod < 0 ? -1 : 1,
        text: String(Math.abs(effectiveMod)),
      });
    }

    const breakdown = `${joinSignedSegments(segments)} = ${total}`;
    const formula = `1d20${effectiveMod !== 0 ? ` ${formatSignedModifier(effectiveMod)}` : ''}`;

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
      dexMod: req.category === 'initiative' ? effectiveMod : undefined,
      source: 'local',
    };
  }

  // Damage or Multi-dice Custom expression roll
  const expr = (req.diceExpression || '1d6').trim();
  const parsed = parsedCustom ?? parseDiceExpression(expr);

  if (!parsed.isValid) {
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
      formula: expr,
      diceRolls: [],
      total: 0,
      breakdown: `Invalid formula (${parsed.error ?? 'check syntax'})`,
      isCrit: false,
      isFumble: false,
      moveType: req.moveType,
      source: 'local',
    };
  }

  const diceRolls: number[] = [];
  const segments: Array<{ sign: 1 | -1; text: string }> = [];
  let diceSum = 0;

  for (const term of parsed.terms) {
    const doubleDice = Boolean(req.isCriticalDamage && term.sign === 1);
    const evaluated = evaluateDiceTerm(term, doubleDice);
    diceRolls.push(...evaluated.allRolls);
    diceSum += evaluated.sum;
    segments.push({ sign: term.sign, text: evaluated.label });
  }

  if (parsed.flatBonus !== 0) {
    segments.push({
      sign: parsed.flatBonus < 0 ? -1 : 1,
      text: String(Math.abs(parsed.flatBonus)),
    });
  }

  if (parts.length > 0) {
    for (const p of parts) {
      segments.push({ sign: 1, text: p });
    }
  } else if (baseMod !== 0) {
    segments.push({
      sign: baseMod < 0 ? -1 : 1,
      text: String(Math.abs(baseMod)),
    });
  }

  const combinedMod = baseMod + parsed.flatBonus;
  const rawTotal = diceSum + combinedMod;
  const total = req.category === 'damage' ? Math.max(0, rawTotal) : rawTotal;
  const breakdown = `${joinSignedSegments(segments)} = ${total}`;

  const formulaParts = parsed.terms.map((t, i) => {
    const count = req.isCriticalDamage && t.sign === 1 ? t.count * 2 : t.count;
    const kd = t.keepDrop ? `${t.keepDrop.mode}${t.keepDrop.amount}` : '';
    const prefix = i === 0 ? (t.sign === -1 ? '-' : '') : t.sign === -1 ? '- ' : '+ ';
    return `${prefix}${count}d${t.sides}${kd}`;
  });
  if (combinedMod !== 0) {
    formulaParts.push(
      combinedMod < 0 ? `- ${Math.abs(combinedMod)}` : `+ ${combinedMod}`
    );
  }
  const formula = formulaParts.join(' ');

  return {
    id: createId('roll'),
    timestamp,
    rollerName: req.rollerName,
    ownerId: req.ownerId,
    characterId: req.characterId,
    characterName: req.characterName,
    label: req.isCriticalDamage ? `${req.label} (CRIT 2×)` : req.label,
    category: req.category,
    rollMode: 'normal',
    visibility: req.visibility,
    formula,
    diceRolls,
    total,
    breakdown,
    isCrit: Boolean(req.isCriticalDamage),
    isFumble: false,
    moveType: req.moveType,
    source: 'local',
  };
}
