import { Check, Dices, Edit3, Eye, EyeOff, Heart, RotateCcw, Shield, Zap } from 'lucide-react';
import { useState } from 'react';
import { selectActiveCharacter, useCharacterStore } from '../store/useCharacterStore';
import {
  AbilityKey,
  Move,
  PokemonSheet,
  PokemonType,
  SkillName,
  SkillProficiencyLevel,
  TrainerSheet,
} from '../types/pokemon5e';
import {
  ABILITY_LABELS,
  POKEMON_TYPES,
  TYPE_STYLES,
  formatSignedModifier,
  getAbilityModifier,
  getMoveAttackBonus,
  getMoveDamageBonus,
  getProficiencyBonus,
  getSavingThrowModifier,
  getSkillModifier,
  getStabValue,
  hasMoveStab,
} from '../utils/pokemon5eRules';
import { AbilityGrid } from './AbilityGrid';
import { MovesPanel } from './MovesPanel';
import {
  LeagueBadgeIcon,
  PokeballBackdrop,
  PokeballIcon,
} from './PokemonAccessories';
import { SkillsPanel } from './SkillsPanel';

export function CharacterSheet() {
  const activeChar = useCharacterStore(selectActiveCharacter);
  const updateTrainer = useCharacterStore((s) => s.updateTrainer);
  const resetTrainerToBlank = useCharacterStore((s) => s.resetTrainerToBlank);
  const updatePokemon = useCharacterStore((s) => s.updatePokemon);
  const adjustHp = useCharacterStore((s) => s.adjustHp);
  const addMove = useCharacterStore((s) => s.addMove);
  const removeMove = useCharacterStore((s) => s.removeMove);
  const adjustMovePp = useCharacterStore((s) => s.adjustMovePp);
  const performRoll = useCharacterStore((s) => s.performRoll);
  const rollMode = useCharacterStore((s) => s.rollMode);
  const rollVisibility = useCharacterStore((s) => s.rollVisibility);
  const setRollMode = useCharacterStore((s) => s.setRollMode);
  const setRollVisibility = useCharacterStore((s) => s.setRollVisibility);

  const [isEditing, setIsEditing] = useState(false);
  const [hpDeltaInput, setHpDeltaInput] = useState('5');

  const isPokemon = activeChar.kind === 'pokemon';
  const profBonus = getProficiencyBonus(activeChar.level, activeChar.proficiencyOverride);
  const stabValue = isPokemon
    ? getStabValue(activeChar.level, activeChar.stabOverride)
    : 0;
  const initBonus = getAbilityModifier(activeChar.abilities.dex);

  const primaryTypeHex = isPokemon
    ? TYPE_STYLES[activeChar.types[0] ?? 'Normal'].hex
    : '#E11D48';
  const secondaryTypeHex =
    isPokemon && activeChar.types[1]
      ? TYPE_STYLES[activeChar.types[1]].hex
      : primaryTypeHex;

  const handleUpdateAbility = (key: AbilityKey, score: number) => {
    const nextAbilities = { ...activeChar.abilities, [key]: score };
    if (isPokemon) {
      updatePokemon(activeChar.id, { abilities: nextAbilities });
    } else {
      updateTrainer({ abilities: nextAbilities });
    }
  };

  const handleToggleSaveProf = (key: AbilityKey) => {
    const nextSaves = {
      ...activeChar.savingThrows,
      [key]: !activeChar.savingThrows[key],
    };
    if (isPokemon) {
      updatePokemon(activeChar.id, { savingThrows: nextSaves });
    } else {
      updateTrainer({ savingThrows: nextSaves });
    }
  };

  const handleCycleSkillProf = (skill: SkillName) => {
    const current = activeChar.skills[skill] ?? 'none';
    const next: SkillProficiencyLevel =
      current === 'none'
        ? 'proficient'
        : current === 'proficient'
          ? 'expertise'
          : 'none';
    const nextSkills = { ...activeChar.skills, [skill]: next };
    if (isPokemon) {
      updatePokemon(activeChar.id, { skills: nextSkills });
    } else {
      updateTrainer({ skills: nextSkills });
    }
  };

  const handleRollAbility = (key: AbilityKey) => {
    const mod = getAbilityModifier(activeChar.abilities[key]);
    performRoll({
      characterId: activeChar.id,
      characterName: activeChar.name,
      label: `${ABILITY_LABELS[key].full} Check`,
      category: 'ability',
      modifier: mod,
      modifierParts: [`${ABILITY_LABELS[key].short}(${formatSignedModifier(mod)})`],
    });
  };

  const handleRollSave = (key: AbilityKey) => {
    const base = getAbilityModifier(activeChar.abilities[key]);
    const isProf = activeChar.savingThrows[key];
    const totalMod = getSavingThrowModifier(
      activeChar.abilities,
      activeChar.savingThrows,
      key,
      profBonus
    );
    const parts = [`${ABILITY_LABELS[key].short}(${formatSignedModifier(base)})`];
    if (isProf) parts.push(`Prof(${formatSignedModifier(profBonus)})`);

    performRoll({
      characterId: activeChar.id,
      characterName: activeChar.name,
      label: `${ABILITY_LABELS[key].short} Saving Throw`,
      category: 'save',
      modifier: totalMod,
      modifierParts: parts,
    });
  };

  const handleRollSkill = (skill: SkillName) => {
    const level = activeChar.skills[skill];
    const totalMod = getSkillModifier(
      activeChar.abilities,
      activeChar.skills,
      skill,
      profBonus
    );
    const parts = [`Mod(${formatSignedModifier(totalMod)})`];
    if (level === 'proficient') {
      parts[0] = `Base(${formatSignedModifier(totalMod - profBonus)})`;
      parts.push(`Prof(${formatSignedModifier(profBonus)})`);
    } else if (level === 'expertise') {
      parts[0] = `Base(${formatSignedModifier(totalMod - profBonus * 2)})`;
      parts.push(`Exp(${formatSignedModifier(profBonus * 2)})`);
    }

    performRoll({
      characterId: activeChar.id,
      characterName: activeChar.name,
      label: `${skill} Check`,
      category: 'skill',
      modifier: totalMod,
      modifierParts: parts,
    });
  };

  const handleRollInitiative = () => {
    performRoll({
      characterId: activeChar.id,
      characterName: activeChar.name,
      label: 'Initiative',
      category: 'initiative',
      modifier: initBonus,
      modifierParts: [`DEX(${formatSignedModifier(initBonus)})`],
    });
  };

  const handleRollMoveAttack = (move: Move) => {
    if (!isPokemon) return;
    const atkBonus = getMoveAttackBonus(activeChar, move);
    const powerMod = getAbilityModifier(activeChar.abilities[move.movePower]);

    if (move.ppCurrent > 0) {
      adjustMovePp(activeChar.id, move.id, -1);
    }

    performRoll({
      characterId: activeChar.id,
      characterName: activeChar.name,
      label: `${move.name} Attack`,
      category: 'attack',
      modifier: atkBonus,
      modifierParts: [
        `${ABILITY_LABELS[move.movePower].short}(${formatSignedModifier(powerMod)})`,
        `Prof(${formatSignedModifier(profBonus)})`,
      ],
      moveType: move.type,
    });
  };

  const handleRollMoveDamage = (move: Move) => {
    if (!isPokemon) return;
    const { powerMod, stabBonus, totalBonus } = getMoveDamageBonus(activeChar, move);
    const parts = [
      `${ABILITY_LABELS[move.movePower].short}(${formatSignedModifier(powerMod)})`,
    ];
    if (hasMoveStab(activeChar, move) && stabBonus > 0) {
      parts.push(`STAB(+${stabBonus})`);
    }

    performRoll({
      characterId: activeChar.id,
      characterName: activeChar.name,
      label: `${move.name} Damage`,
      category: 'damage',
      diceExpression: move.damageDice || '1d6',
      modifier: totalBonus,
      modifierParts: parts,
      moveType: move.type,
    });
  };

  const applyCustomHpDelta = (sign: 1 | -1) => {
    const val = Math.max(1, parseInt(hpDeltaInput || '1', 10) || 1);
    adjustHp(activeChar.id, sign * val);
  };

  const togglePokemonType = (mon: PokemonSheet, targetType: PokemonType) => {
    if (mon.types.includes(targetType)) {
      if (mon.types.length > 1) {
        updatePokemon(mon.id, { types: mon.types.filter((t) => t !== targetType) });
      }
      return;
    }
    if (mon.types.length >= 2) {
      updatePokemon(mon.id, { types: [mon.types[1], targetType] });
    } else {
      updatePokemon(mon.id, { types: [...mon.types, targetType] });
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-3.5 sm:p-4 lg:p-6 space-y-5 poke-canvas-bg">
      {/* Compact Roll Mode & Visibility Bar for Medium Popover (< xl) */}
      <div className="xl:hidden flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#252A38]">
        <div className="inline-flex items-center gap-0.5 p-0.5 bg-[#161A24] border border-[#252A38] rounded-md">
          {(
            [
              { id: 'disadvantage', label: 'Disadv' },
              { id: 'normal', label: 'Normal' },
              { id: 'advantage', label: 'Adv' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setRollMode(opt.id)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                rollMode === opt.id
                  ? opt.id === 'advantage'
                    ? 'bg-emerald-600 text-white'
                    : opt.id === 'disadvantage'
                      ? 'bg-amber-600 text-white'
                      : 'bg-[#252B3B] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            setRollVisibility(rollVisibility === 'visible' ? 'hidden' : 'visible')
          }
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors cursor-pointer ${
            rollVisibility === 'hidden'
              ? 'bg-violet-600 border-violet-500 text-white'
              : 'bg-[#161A24] border-[#252A38] text-slate-300 hover:text-white'
          }`}
          title="Toggle Visible vs Hidden (GM + Roller only)"
        >
          {rollVisibility === 'hidden' ? (
            <>
              <EyeOff className="w-3 h-3" />
              <span>Hidden (GM)</span>
            </>
          ) : (
            <>
              <Eye className="w-3 h-3" />
              <span>Visible Roll</span>
            </>
          )}
        </button>
      </div>

      {/* Character Header & Edit Switch */}
      <section
        style={{
          backgroundImage: `linear-gradient(125deg, ${primaryTypeHex}24 0%, ${secondaryTypeHex}12 45%, rgba(22, 26, 36, 0.92) 100%)`,
          borderColor: `${primaryTypeHex}44`,
        }}
        className="relative overflow-hidden rounded-xl border bg-[#161A24] p-4 flex flex-wrap items-start justify-between gap-4"
      >
        <div className="absolute -right-6 -bottom-10 pointer-events-none">
          <PokeballBackdrop colorHex={primaryTypeHex} />
        </div>
        <div className="space-y-1.5 min-w-0 relative z-10">
          {isEditing ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={activeChar.name}
                onChange={(e) =>
                  isPokemon
                    ? updatePokemon(activeChar.id, { name: e.target.value })
                    : updateTrainer({ name: e.target.value })
                }
                className="font-display text-xl font-bold px-2.5 py-1 bg-[#161A24] border border-[#323A4F] rounded-md text-slate-100"
                aria-label="Character Name"
              />
              {isPokemon && (
                <input
                  type="text"
                  value={activeChar.species}
                  onChange={(e) =>
                    updatePokemon(activeChar.id, { species: e.target.value })
                  }
                  placeholder="Species"
                  className="text-sm px-2.5 py-1.5 bg-[#161A24] border border-[#323A4F] rounded-md text-slate-200"
                  aria-label="Pokémon Species"
                />
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">
                {activeChar.name}
              </h1>
              {isPokemon &&
                activeChar.types.map((t) => {
                  const st = TYPE_STYLES[t];
                  return (
                    <span
                      key={t}
                      className={`px-2 py-0.5 text-xs font-semibold rounded border ${st.bg} ${st.text} ${st.border}`}
                    >
                      {t}
                    </span>
                  );
                })}
            </div>
          )}

          {isPokemon ? (
            <p className="text-sm text-slate-400">
              {activeChar.species} · Level {activeChar.level} · SR {activeChar.sr} ·{' '}
              {activeChar.nature} Nature · Ability: {activeChar.ability}
              {activeChar.heldItem ? ` · Held: ${activeChar.heldItem}` : ''}
            </p>
          ) : (
            <p className="text-sm text-slate-300 flex flex-wrap items-center gap-1.5">
              <span>{activeChar.trainerClass} · Level {activeChar.level}</span>
              {activeChar.origin && <span>· {activeChar.origin}</span>}
              <span className="inline-flex items-center gap-1">
                · <LeagueBadgeIcon className="w-3.5 h-3.5" /> {activeChar.badges} Badges
              </span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 relative z-10">
          <button
            type="button"
            onClick={handleRollInitiative}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-100 bg-[#1C212E] hover:bg-[#252B3B] border border-[#2F364B] rounded-md transition-colors cursor-pointer"
          >
            <Dices className="w-3.5 h-3.5 text-amber-400" />
            <span>Initiative</span>
            <span className="font-mono text-amber-300">
              {formatSignedModifier(initBonus)}
            </span>
          </button>

          {!isPokemon && isEditing && (
            <button
              type="button"
              onClick={resetTrainerToBlank}
              title="Clear Trainer sheet to blank level 1 defaults"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#161A24] hover:bg-[#1C212E] border border-[#2A3042] rounded-md cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Blank Trainer</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsEditing((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
              isEditing
                ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white'
                : 'bg-[#161A24] hover:bg-[#1C212E] border-[#2A3042] text-slate-200'
            }`}
          >
            {isEditing ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Done Editing</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Sheet</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Edit Metadata Row */}
      {isEditing && (
        <section className="bg-[#161A24] border border-[#2A3042] rounded-lg p-4 space-y-4">
          {isPokemon ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Level</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={activeChar.level}
                    onChange={(e) =>
                      updatePokemon(activeChar.id, {
                        level: Math.max(1, Math.min(20, parseInt(e.target.value || '1', 10))),
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Species Rating (SR)</label>
                  <input
                    type="text"
                    value={activeChar.sr}
                    onChange={(e) => updatePokemon(activeChar.id, { sr: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nature</label>
                  <input
                    type="text"
                    value={activeChar.nature}
                    onChange={(e) =>
                      updatePokemon(activeChar.id, { nature: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Ability</label>
                  <input
                    type="text"
                    value={activeChar.ability}
                    onChange={(e) =>
                      updatePokemon(activeChar.id, { ability: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Held Item</label>
                  <input
                    type="text"
                    value={activeChar.heldItem}
                    onChange={(e) =>
                      updatePokemon(activeChar.id, { heldItem: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Status</label>
                  <input
                    type="text"
                    value={activeChar.statusCondition}
                    onChange={(e) =>
                      updatePokemon(activeChar.id, { statusCondition: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Types (select 1 or 2)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {POKEMON_TYPES.map((t) => {
                    const selected = activeChar.types.includes(t);
                    const st = TYPE_STYLES[t];
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => togglePokemonType(activeChar, t)}
                        className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors cursor-pointer ${
                          selected
                            ? `${st.bg} ${st.text} ${st.border}`
                            : 'bg-[#0F1117] border-[#252A38] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Ability Description
                </label>
                <input
                  type="text"
                  value={activeChar.abilityDescription}
                  onChange={(e) =>
                    updatePokemon(activeChar.id, { abilityDescription: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
                />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Level</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={activeChar.level}
                  onChange={(e) =>
                    updateTrainer({
                      level: Math.max(1, Math.min(20, parseInt(e.target.value || '1', 10))),
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Class</label>
                <input
                  type="text"
                  value={activeChar.trainerClass}
                  onChange={(e) => updateTrainer({ trainerClass: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Origin</label>
                <input
                  type="text"
                  value={activeChar.origin}
                  onChange={(e) => updateTrainer({ origin: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Badges</label>
                <input
                  type="number"
                  min={0}
                  value={activeChar.badges}
                  onChange={(e) =>
                    updateTrainer({ badges: Math.max(0, parseInt(e.target.value || '0', 10)) })
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Money (¥)</label>
                <input
                  type="number"
                  min={0}
                  value={activeChar.money}
                  onChange={(e) =>
                    updateTrainer({ money: Math.max(0, parseInt(e.target.value || '0', 10)) })
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Paths / Specs</label>
                <input
                  type="text"
                  value={activeChar.trainerPaths}
                  onChange={(e) => updateTrainer({ trainerPaths: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
                />
              </div>
            </div>
          )}
        </section>
      )}

      {/* Combat Vitals Strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Hit Points */}
        <div className="col-span-2 bg-[#161A24] border border-[#252A38] rounded-lg p-3.5 flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              Hit Points
            </span>
            {isEditing ? (
              <div className="flex items-center gap-1 text-xs font-mono">
                <input
                  type="number"
                  value={activeChar.hpCurrent}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value || '0', 10));
                    if (isPokemon) updatePokemon(activeChar.id, { hpCurrent: val });
                    else updateTrainer({ hpCurrent: val });
                  }}
                  className="w-14 px-1.5 py-0.5 text-right bg-[#0F1117] border border-[#323A4F] rounded text-slate-100"
                />
                <span className="text-slate-500">/</span>
                <input
                  type="number"
                  value={activeChar.hpMax}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value || '1', 10));
                    if (isPokemon) updatePokemon(activeChar.id, { hpMax: val });
                    else updateTrainer({ hpMax: val });
                  }}
                  className="w-14 px-1.5 py-0.5 text-right bg-[#0F1117] border border-[#323A4F] rounded text-slate-100"
                />
              </div>
            ) : (
              <span className="font-mono text-lg font-bold text-slate-100">
                {activeChar.hpCurrent}{' '}
                <span className="text-sm font-normal text-slate-500">
                  / {activeChar.hpMax}
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => applyCustomHpDelta(-1)}
              className="px-2.5 py-1 text-xs font-medium text-rose-200 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded cursor-pointer"
            >
              Damage
            </button>
            <input
              type="number"
              min={1}
              value={hpDeltaInput}
              onChange={(e) => setHpDeltaInput(e.target.value)}
              aria-label="HP Adjustment Amount"
              className="w-16 px-2 py-1 text-center font-mono text-xs bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
            />
            <button
              type="button"
              onClick={() => applyCustomHpDelta(1)}
              className="px-2.5 py-1 text-xs font-medium text-emerald-200 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded cursor-pointer"
            >
              Heal
            </button>
          </div>
        </div>

        {/* Armor Class */}
        <div className="bg-[#161A24] border border-[#252A38] rounded-lg p-3.5 flex flex-col justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Shield className="w-3.5 h-3.5 text-sky-400" />
            Armor Class
          </span>
          {isEditing ? (
            <input
              type="number"
              value={activeChar.ac}
              onChange={(e) => {
                const ac = Math.max(1, parseInt(e.target.value || '10', 10));
                if (isPokemon) updatePokemon(activeChar.id, { ac });
                else updateTrainer({ ac });
              }}
              className="w-20 mt-2 px-2 py-1 font-mono text-lg font-bold bg-[#0F1117] border border-[#323A4F] rounded text-slate-100"
            />
          ) : (
            <span className="font-mono text-2xl font-bold text-slate-100 mt-1">
              {activeChar.ac}
            </span>
          )}
        </div>

        {/* Speed */}
        <div className="bg-[#161A24] border border-[#252A38] rounded-lg p-3.5 flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-400">Speed</span>
          {isEditing ? (
            <input
              type="number"
              value={activeChar.speed}
              onChange={(e) => {
                const speed = Math.max(0, parseInt(e.target.value || '30', 10));
                if (isPokemon) updatePokemon(activeChar.id, { speed });
                else updateTrainer({ speed });
              }}
              className="w-20 mt-2 px-2 py-1 font-mono text-lg font-bold bg-[#0F1117] border border-[#323A4F] rounded text-slate-100"
            />
          ) : (
            <span className="font-mono text-2xl font-bold text-slate-100 mt-1">
              {activeChar.speed} <span className="text-xs font-normal text-slate-500">ft</span>
            </span>
          )}
        </div>

        {/* Proficiency & STAB */}
        <div className="bg-[#161A24] border border-[#252A38] rounded-lg p-3.5 flex flex-col justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            {isPokemon ? 'Proficiency · STAB' : 'Proficiency Bonus'}
          </span>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="font-mono text-2xl font-bold text-slate-100">
              +{profBonus}
            </span>
            {isPokemon && (
              <span className="font-mono text-sm font-semibold text-amber-300">
                STAB +{stabValue}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Pokémon Ability Callout (flat hairline box, no thick left bar) */}
      {isPokemon && activeChar.abilityDescription && (
        <section className="bg-[#161A24] border border-[#252A38] rounded-lg px-4 py-3">
          <div className="text-xs font-semibold text-slate-200">
            Ability: {activeChar.ability}
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {activeChar.abilityDescription}
          </p>
        </section>
      )}

      {/* Ability Scores & Saving Throws */}
      <AbilityGrid
        abilities={activeChar.abilities}
        savingThrows={activeChar.savingThrows}
        profBonus={profBonus}
        isEditing={isEditing}
        onUpdateAbility={handleUpdateAbility}
        onToggleSaveProf={handleToggleSaveProf}
        onRollAbility={handleRollAbility}
        onRollSave={handleRollSave}
      />

      {/* Moves Panel (Pokémon) or Trainer Inventory & Paths (Trainer) */}
      {isPokemon ? (
        <MovesPanel
          pokemon={activeChar}
          onRollAttack={handleRollMoveAttack}
          onRollDamage={handleRollMoveDamage}
          onAdjustPp={(moveId, delta) => adjustMovePp(activeChar.id, moveId, delta)}
          onAddMove={(mv) => addMove(activeChar.id, mv)}
          onRemoveMove={(moveId) => removeMove(activeChar.id, moveId)}
        />
      ) : (
        <TrainerGearPanel trainer={activeChar} onUpdate={updateTrainer} />
      )}

      {/* Skills */}
      <SkillsPanel
        abilities={activeChar.abilities}
        skills={activeChar.skills}
        profBonus={profBonus}
        isEditing={isEditing}
        onCycleSkillProf={handleCycleSkillProf}
        onRollSkill={handleRollSkill}
      />

      {/* Notes */}
      <section className="bg-[#161A24] border border-[#252A38] rounded-lg p-4">
        <label className="block font-display text-sm font-semibold text-slate-200 mb-2">
          Notes & Tactics
        </label>
        <textarea
          rows={3}
          value={activeChar.notes}
          onChange={(e) => {
            if (isPokemon) updatePokemon(activeChar.id, { notes: e.target.value });
            else updateTrainer({ notes: e.target.value });
          }}
          placeholder="Track items, evolution requirements, trainer paths, or battle notes..."
          className="w-full px-3 py-2 text-xs bg-[#0F1117] border border-[#2A3042] rounded-md text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/60"
        />
      </section>
    </main>
  );
}

function TrainerGearPanel({
  trainer,
  onUpdate,
}: {
  trainer: TrainerSheet;
  onUpdate: (patch: Partial<TrainerSheet>) => void;
}) {
  const adjustBall = (key: 'pokeBall' | 'greatBall' | 'ultraBall', delta: number) => {
    onUpdate({
      pokeballs: {
        ...trainer.pokeballs,
        [key]: Math.max(0, trainer.pokeballs[key] + delta),
      },
    });
  };

  return (
    <section className="bg-[#161A24] border border-[#252A38] rounded-lg p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-sm font-semibold text-slate-200">
          Pokéballs & Trainer Specializations
        </h3>
        {trainer.trainerPaths && (
          <span className="text-xs text-slate-400">{trainer.trainerPaths}</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(
          [
            { key: 'pokeBall', label: 'Poké Balls', variant: 'poke' as const },
            { key: 'greatBall', label: 'Great Balls', variant: 'great' as const },
            { key: 'ultraBall', label: 'Ultra Balls', variant: 'ultra' as const },
          ] as const
        ).map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between px-3 py-2 bg-[#12151E] border border-[#222736] rounded-md"
          >
            <span className="inline-flex items-center gap-2 text-xs text-slate-200 font-medium">
              <PokeballIcon variant={item.variant} className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustBall(item.key, -1)}
                className="w-6 h-6 rounded bg-[#0F1117] border border-[#2A3042] text-slate-300 hover:text-white cursor-pointer"
              >
                -
              </button>
              <span className="font-mono text-sm font-semibold text-slate-100 w-6 text-center">
                {trainer.pokeballs[item.key]}
              </span>
              <button
                type="button"
                onClick={() => adjustBall(item.key, 1)}
                className="w-6 h-6 rounded bg-[#0F1117] border border-[#2A3042] text-slate-300 hover:text-white cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
