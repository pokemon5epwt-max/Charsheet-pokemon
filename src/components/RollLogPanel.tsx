import { Dices, Eye, EyeOff, Lock, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { selectActiveCharacter, useCharacterStore } from '../store/useCharacterStore';
import { parseDiceExpression } from '../utils/diceEngine';
import { TYPE_STYLES } from '../utils/pokemon5eRules';
import { PokeballIcon } from './PokemonAccessories';

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
  const [customError, setCustomError] = useState<string | null>(null);

  const handleCustomRoll = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customExpr.trim();
    if (!trimmed) return;
    const parsed = parseDiceExpression(trimmed);
    if (!parsed.isValid) {
      setCustomError(
        `Format tidak valid (${parsed.error ?? 'contoh: 1d20 + 5 atau 4d6kh3'})`
      );
      return;
    }
    setCustomError(null);
    performRoll({
      characterId: activeChar.id,
      characterName: activeChar.name,
      label: `Custom (${trimmed})`,
      category: 'custom',
      diceExpression: trimmed,
    });
  };

  return (
    <aside className="w-full xl:w-[340px] shrink-0 border-l-2 border-[#090D12] bg-[#17202A] flex flex-col h-full">
      {/* Header & Roll Controls */}
      <div className="p-3.5 border-b-2 border-[#090D12] space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xs font-bold text-white uppercase">
            Battle Log &amp; Dice
          </h2>
          <div className="flex items-center gap-2">
            {rollLog.length > 0 && (
              <button
                type="button"
                onClick={clearRollLog}
                className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-[#F04848] cursor-pointer"
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
                className="xl:hidden p-1 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Advantage / Normal / Disadvantage Segmented Toggle */}
        <div>
          <span className="block text-xs text-slate-300 mb-1">Roll Mode</span>
          <div className="gba-well grid grid-cols-3 gap-1 p-1">
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
                className={`py-1 text-xs font-semibold cursor-pointer transition-colors ${
                  rollMode === opt.id
                    ? opt.id === 'advantage'
                      ? 'bg-[#267347] text-white'
                      : opt.id === 'disadvantage'
                        ? 'bg-[#A66316] text-white'
                        : 'bg-[#2A394A] text-white'
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
          <span className="block text-xs text-slate-300 mb-1">
            Roll Visibility
          </span>
          <div className="gba-well grid grid-cols-2 gap-1 p-1">
            <button
              type="button"
              onClick={() => setRollVisibility('visible')}
              className={`inline-flex items-center justify-center gap-1.5 py-1 text-xs font-semibold cursor-pointer ${
                rollVisibility === 'visible'
                  ? 'bg-[#2A394A] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Visible</span>
            </button>
            <button
              type="button"
              onClick={() => setRollVisibility('hidden')}
              className={`inline-flex items-center justify-center gap-1.5 py-1 text-xs font-semibold cursor-pointer ${
                rollVisibility === 'hidden'
                  ? 'bg-[#5B328A] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Hidden (GM)</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
            {rollVisibility === 'hidden'
              ? 'Hidden rolls are broadcast privately and displayed only to you and the GM.'
              : 'Visible rolls broadcast to all players in the Owlbear Rodeo room.'}
          </p>
        </div>

        {/* Custom Dice Expression */}
        <div>
          <form onSubmit={handleCustomRoll} className="flex items-center gap-1.5">
            <input
              type="text"
              value={customExpr}
              onChange={(e) => {
                setCustomExpr(e.target.value);
                if (customError) setCustomError(null);
              }}
              placeholder="2d6 + 4 atau 4d6kh3"
              aria-label="Custom dice formula"
              className="gba-well flex-1 px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none"
            />
            <button
              type="submit"
              className="gba-btn inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#D62839] hover:bg-[#E63946] cursor-pointer shrink-0"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>Roll</span>
            </button>
          </form>
          {customError && (
            <p className="text-xs text-[#F04848] mt-1">{customError}</p>
          )}
        </div>

        {/* Dice Integration Mode */}
        <div className="flex items-center justify-between pt-2 border-t-2 border-[#090D12] text-xs">
          <span className="text-slate-300">Dice Engine</span>
          <select
            value={diceIntegrationMode}
            onChange={(e) =>
              setDiceIntegrationMode(e.target.value as 'internal' | 'obr-dice-plus')
            }
            aria-label="Dice Integration Mode"
            className="gba-well px-2 py-1 text-slate-100 text-xs"
          >
            <option value="internal">Internal Roller + OBR Sync</option>
            <option value="obr-dice-plus">Internal + Dice+ Broadcast</option>
          </select>
        </div>
      </div>

      {/* Roll Log List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 gba-canvas-bg">
        {rollLog.length === 0 ? (
          <div className="gba-panel p-6 text-center space-y-2 flex flex-col items-center">
            <PokeballIcon variant="poke" className="w-8 h-8" />
            <p className="font-display text-xs font-bold text-white">NO ROLLS YET</p>
            <p className="text-xs text-slate-300">
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
                className={`p-3 border-2 border-[#090D12] ${
                  roll.visibility === 'hidden'
                    ? 'bg-[#2A1D3D] shadow-[inset_2px_2px_0_#6B3FA0,inset_-2px_-2px_0_#140D1E]'
                    : 'gba-panel'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {roll.visibility === 'hidden' && (
                        <Lock
                          className="w-3 h-3 text-[#C084FC] shrink-0"
                          aria-label="Hidden GM Roll"
                        />
                      )}
                      <span className="font-display text-[11px] font-bold text-white truncate">
                        {roll.characterName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0">
                        · {timeStr}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {typeStyle && (
                        <span
                          className="w-2 h-2 border border-[#090D12] shrink-0"
                          style={{ backgroundColor: typeStyle.hex }}
                        />
                      )}
                      <span className="text-xs text-slate-200 truncate">{roll.label}</span>
                      {roll.rollMode !== 'normal' && (
                        <span className="font-mono text-[10px] font-bold text-[#F6C445] uppercase">
                          ({roll.rollMode === 'advantage' ? 'ADV' : 'DIS'})
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={`font-mono text-lg font-bold px-2 py-0.5 border-2 border-[#090D12] shrink-0 ${
                      roll.isCrit
                        ? 'text-[#090D12] bg-[#38D46A]'
                        : roll.isFumble
                          ? 'text-white bg-[#D62839]'
                          : 'text-[#F6C445] bg-[#10161D]'
                    }`}
                  >
                    {roll.total}
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t-2 border-[#090D12] flex items-center justify-between gap-2 text-[11px] font-mono text-slate-300">
                  <span className="break-all">{roll.breakdown}</span>
                  {roll.isCrit && (
                    <span className="text-[#38D46A] font-bold shrink-0">CRIT</span>
                  )}
                  {roll.isFumble && (
                    <span className="text-[#F04848] font-bold shrink-0">NAT1</span>
                  )}
                </div>

                {roll.source === 'obr-remote' && (
                  <div className="mt-1 text-[11px] text-slate-400">
                    From {roll.rollerName}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* OBR Context Footer */}
      <div className="px-4 py-2 border-t-2 border-[#090D12] bg-[#131A22] text-xs text-slate-300 flex items-center justify-between">
        <span>
          {obrState.isAvailable
            ? `Owlbear Room (${obrState.partyCount})`
            : 'Browser Preview'}
        </span>
        <span className="font-mono text-[10px] text-[#F6C445]">{obrState.role}</span>
      </div>
    </aside>
  );
}
