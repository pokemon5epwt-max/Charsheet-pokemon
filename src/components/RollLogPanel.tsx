import { Dices, Eye, EyeOff, Lock, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { selectActiveCharacter, useCharacterStore } from '../store/useCharacterStore';
import { TYPE_STYLES } from '../utils/pokemon5eRules';

interface RollLogPanelProps {
  onCloseMobile?: () => void;
}

export function RollLogPanel({ onCloseMobile }: RollLogPanelProps) {
  const rollMode = useCharacterStore((s) => s.rollMode);
  const rollVisibility = useCharacterStore((s) => s.rollVisibility);
  const diceIntegrationMode = useCharacterStore((s) => s.diceIntegrationMode);
  const rollLog = useCharacterStore((s) => s.rollLog);
  const obrState = useCharacterStore((s) => s.obrState);
  const activeChar = useCharacterStore(selectActiveCharacter);

  const setRollMode = useCharacterStore((s) => s.setRollMode);
  const setRollVisibility = useCharacterStore((s) => s.setRollVisibility);
  const setDiceIntegrationMode = useCharacterStore((s) => s.setDiceIntegrationMode);
  const performRoll = useCharacterStore((s) => s.performRoll);
  const clearRollLog = useCharacterStore((s) => s.clearRollLog);

  const [customExpr, setCustomExpr] = useState('1d20 + 5');

  const handleCustomRoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customExpr.trim()) return;
    performRoll({
      characterId: activeChar.id,
      characterName: activeChar.name,
      label: `Custom (${customExpr.trim()})`,
      category: 'custom',
      diceExpression: customExpr.trim(),
    });
  };

  return (
    <aside className="w-full xl:w-[340px] shrink-0 border-l border-[#252A38] bg-[#13161F] flex flex-col h-full">
      {/* Header & Roll Controls */}
      <div className="p-4 border-b border-[#252A38] space-y-3.5 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-slate-100">
            Dice & Roll Log
          </h2>
          <div className="flex items-center gap-2">
            {rollLog.length > 0 && (
              <button
                type="button"
                onClick={clearRollLog}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close Roll Log"
                className="xl:hidden p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Advantage / Normal / Disadvantage Segmented Toggle */}
        <div>
          <span className="block text-[11px] text-slate-400 mb-1.5">Roll Mode</span>
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#0F1117] border border-[#252A38] rounded-md">
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
                className={`py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
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
        </div>

        {/* Visible / Hidden Toggle */}
        <div>
          <span className="block text-[11px] text-slate-400 mb-1.5">
            Roll Visibility
          </span>
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#0F1117] border border-[#252A38] rounded-md">
            <button
              type="button"
              onClick={() => setRollVisibility('visible')}
              className={`inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                rollVisibility === 'visible'
                  ? 'bg-[#252B3B] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Visible</span>
            </button>
            <button
              type="button"
              onClick={() => setRollVisibility('hidden')}
              className={`inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                rollVisibility === 'hidden'
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Hidden (GM)</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
            {rollVisibility === 'hidden'
              ? 'Hidden rolls are broadcast privately and displayed only to you and the GM.'
              : 'Visible rolls broadcast to all players in the Owlbear Rodeo room.'}
          </p>
        </div>

        {/* Custom Dice Expression */}
        <form onSubmit={handleCustomRoll} className="flex items-center gap-1.5">
          <input
            type="text"
            value={customExpr}
            onChange={(e) => setCustomExpr(e.target.value)}
            placeholder="2d6 + 4"
            aria-label="Custom dice formula"
            className="flex-1 px-2.5 py-1.5 text-xs font-mono bg-[#0F1117] border border-[#2A3042] rounded-md text-slate-100 focus:outline-none focus:border-rose-500/60"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-md cursor-pointer shrink-0"
          >
            <Dices className="w-3.5 h-3.5" />
            <span>Roll</span>
          </button>
        </form>

        {/* Dice Integration Mode */}
        <div className="flex items-center justify-between pt-1 border-t border-[#222736] text-[11px]">
          <span className="text-slate-400">Dice Engine</span>
          <select
            value={diceIntegrationMode}
            onChange={(e) =>
              setDiceIntegrationMode(e.target.value as 'internal' | 'obr-dice-plus')
            }
            aria-label="Dice Integration Mode"
            className="bg-[#0F1117] border border-[#2A3042] rounded px-2 py-1 text-slate-200 text-[11px]"
          >
            <option value="internal">Internal Roller + OBR Sync</option>
            <option value="obr-dice-plus">Internal + Dice+ Broadcast</option>
          </select>
        </div>
      </div>

      {/* Roll Log List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {rollLog.length === 0 ? (
          <div className="p-6 text-center space-y-1.5">
            <p className="text-xs font-medium text-slate-300">No rolls yet</p>
            <p className="text-xs text-slate-500">
              Click any Ability, Saving Throw, Skill, or Move button to roll with full modifier breakdown.
            </p>
          </div>
        ) : (
          rollLog.map((roll) => {
            const typeStyle = roll.moveType ? TYPE_STYLES[roll.moveType] : null;
            const timeStr = new Date(roll.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={roll.id}
                className={`p-3 rounded-lg border ${
                  roll.visibility === 'hidden'
                    ? 'bg-violet-950/20 border-violet-500/35'
                    : 'bg-[#161A24] border-[#252A38]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {roll.visibility === 'hidden' && (
                        <Lock
                          className="w-3 h-3 text-violet-400 shrink-0"
                          aria-label="Hidden GM Roll"
                        />
                      )}
                      <span className="text-xs font-semibold text-slate-100 truncate">
                        {roll.characterName}
                      </span>
                      <span className="text-[11px] text-slate-500 shrink-0">
                        · {timeStr}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {typeStyle && (
                        <span
                          className="w-2 h-2 rounded-sm shrink-0"
                          style={{ backgroundColor: typeStyle.hex }}
                        />
                      )}
                      <span className="text-xs text-slate-300 truncate">{roll.label}</span>
                      {roll.rollMode !== 'normal' && (
                        <span className="text-[10px] font-medium text-amber-300 uppercase">
                          ({roll.rollMode === 'advantage' ? 'ADV' : 'DIS'})
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={`font-mono text-xl font-bold px-2 py-0.5 rounded shrink-0 ${
                      roll.isCrit
                        ? 'text-emerald-300 bg-emerald-500/15'
                        : roll.isFumble
                          ? 'text-rose-300 bg-rose-500/15'
                          : 'text-slate-100'
                    }`}
                  >
                    {roll.total}
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-[#222736] flex items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                  <span className="break-all">{roll.breakdown}</span>
                  {roll.isCrit && (
                    <span className="text-emerald-400 font-semibold shrink-0">CRIT</span>
                  )}
                  {roll.isFumble && (
                    <span className="text-rose-400 font-semibold shrink-0">NAT 1</span>
                  )}
                </div>

                {roll.source === 'obr-remote' && (
                  <div className="mt-1 text-[10px] text-slate-500">
                    From {roll.rollerName}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* OBR Context Footer */}
      <div className="px-4 py-2.5 border-t border-[#252A38] text-[11px] text-slate-500 flex items-center justify-between">
        <span>
          {obrState.isAvailable
            ? `Owlbear Room (${obrState.partyCount} connected)`
            : 'Standalone Browser Preview'}
        </span>
        <span className="font-mono">{obrState.role}</span>
      </div>
    </aside>
  );
}
