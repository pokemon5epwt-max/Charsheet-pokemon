import { Dices, ShieldCheck } from 'lucide-react';
import { AbilityKey, AbilityScores, SavingThrowProficiencies } from '../types/pokemon5e';
import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  formatSignedModifier,
  getAbilityModifier,
  getSavingThrowModifier,
} from '../utils/pokemon5eRules';

interface AbilityGridProps {
  abilities: AbilityScores;
  savingThrows: SavingThrowProficiencies;
  profBonus: number;
  isEditing: boolean;
  onUpdateAbility: (key: AbilityKey, score: number) => void;
  onToggleSaveProf: (key: AbilityKey) => void;
  onRollAbility: (key: AbilityKey) => void;
  onRollSave: (key: AbilityKey) => void;
}

export function AbilityGrid({
  abilities,
  savingThrows,
  profBonus,
  isEditing,
  onUpdateAbility,
  onToggleSaveProf,
  onRollAbility,
  onRollSave,
}: AbilityGridProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-sm font-semibold text-slate-200">
          Ability Scores & Saving Throws
        </h3>
        <span className="text-xs text-slate-400">Click Check or Save to roll</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {ABILITY_KEYS.map((key) => {
          const score = abilities[key];
          const mod = getAbilityModifier(score);
          const saveMod = getSavingThrowModifier(abilities, savingThrows, key, profBonus);
          const isProficientSave = savingThrows[key];
          const label = ABILITY_LABELS[key];

          return (
            <div
              key={key}
              className="bg-[#161A24] border border-[#252A38] rounded-lg p-3 flex flex-col justify-between gap-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wide text-slate-400">
                  {label.short}
                </span>
                {isEditing ? (
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={score}
                    onChange={(e) =>
                      onUpdateAbility(
                        key,
                        Math.max(1, Math.min(30, parseInt(e.target.value || '10', 10)))
                      )
                    }
                    className="w-12 px-1.5 py-0.5 text-right font-mono text-xs bg-[#0F1117] border border-[#323A4F] rounded text-slate-100"
                    aria-label={`${label.full} score`}
                  />
                ) : (
                  <span className="font-mono text-xs text-slate-400">({score})</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => onRollAbility(key)}
                className="w-full py-2 px-2 rounded-md bg-[#1C212E] hover:bg-[#252B3B] border border-[#2D3448] hover:border-rose-500/50 transition-colors flex flex-col items-center justify-center gap-0.5 cursor-pointer group"
                title={`Roll ${label.full} Check (${formatSignedModifier(mod)})`}
              >
                <span className="font-mono text-xl font-bold text-slate-100 group-hover:text-white">
                  {formatSignedModifier(mod)}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-rose-300">
                  <Dices className="w-3 h-3" />
                  <span>Check</span>
                </span>
              </button>

              <div className="flex items-center gap-1.5">
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => onToggleSaveProf(key)}
                    title="Toggle Saving Throw Proficiency"
                    className={`p-1.5 rounded border text-xs cursor-pointer ${
                      isProficientSave
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-[#0F1117] border-[#2A3042] text-slate-500'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRollSave(key)}
                  className={`flex-1 py-1.5 px-2 rounded text-xs font-medium border transition-colors flex items-center justify-between cursor-pointer ${
                    isProficientSave
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/35 text-emerald-200'
                      : 'bg-[#12151E] hover:bg-[#1C202B] border-[#252A38] text-slate-300'
                  }`}
                  title={`Roll ${label.full} Saving Throw`}
                >
                  <span>Save</span>
                  <span className="font-mono font-semibold">
                    {formatSignedModifier(saveMod)}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
