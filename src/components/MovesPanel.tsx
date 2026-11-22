import { Crosshair, Flame, Minus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AbilityKey, Move, PokemonSheet, PokemonType } from '../types/pokemon5e';
import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  POKEMON_TYPES,
  TYPE_STYLES,
  formatSignedModifier,
  getMoveAttackBonus,
  getMoveDamageBonus,
  getMoveSaveDc,
  hasMoveStab,
} from '../utils/pokemon5eRules';

interface MovesPanelProps {
  pokemon: PokemonSheet;
  onRollAttack: (move: Move) => void;
  onRollDamage: (move: Move, isCriticalDamage?: boolean) => void;
  onAdjustPp: (moveId: string, delta: number) => void;
  onAddMove: (move: Omit<Move, 'id'>) => void;
  onRemoveMove: (moveId: string) => void;
}

export function MovesPanel({
  pokemon,
  onRollAttack,
  onRollDamage,
  onAdjustPp,
  onAddMove,
  onRemoveMove,
}: MovesPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<PokemonType>(pokemon.types[0] ?? 'Normal');
  const [movePower, setMovePower] = useState<AbilityKey>('str');
  const [damageDice, setDamageDice] = useState('1d8');
  const [ppMax, setPpMax] = useState(15);
  const [isAttack, setIsAttack] = useState(true);
  const [saveAbility, setSaveAbility] = useState<AbilityKey>('dex');
  const [stabEligible, setStabEligible] = useState(true);
  const [range, setRange] = useState('Melee (5 ft)');
  const [castingTime, setCastingTime] = useState('1 Action');
  const [description, setDescription] = useState('');

  const handleCreateMove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddMove({
      name: name.trim(),
      type,
      ppCurrent: ppMax,
      ppMax,
      movePower,
      damageDice: damageDice.trim(),
      isAttack,
      saveAbility: isAttack ? undefined : saveAbility,
      stabEligible,
      range: range.trim() || 'Melee (5 ft)',
      castingTime: castingTime.trim() || '1 Action',
      description: description.trim(),
    });
    setName('');
    setDescription('');
    setShowAddForm(false);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold text-slate-200">
            Moves ({pokemon.moves.length})
          </h3>
          <p className="text-xs text-slate-400">
            Attack uses Move Power + Proficiency · Damage adds Move Power + STAB when type matches
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-md transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? 'Cancel' : 'Add Move'}</span>
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleCreateMove}
          className="p-4 bg-[#161A24] border border-[#2C3346] rounded-lg space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Move Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Thunderbolt"
                className="w-full px-2.5 py-1.5 text-xs bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PokemonType)}
                className="w-full px-2.5 py-1.5 text-xs bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
              >
                {POKEMON_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Move Power</label>
              <select
                value={movePower}
                onChange={(e) => setMovePower(e.target.value as AbilityKey)}
                className="w-full px-2.5 py-1.5 text-xs bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
              >
                {ABILITY_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {ABILITY_LABELS[k].short} ({ABILITY_LABELS[k].full})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Damage Dice</label>
              <input
                type="text"
                value={damageDice}
                onChange={(e) => setDamageDice(e.target.value)}
                placeholder="2d8 or empty"
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Max PP</label>
              <input
                type="number"
                min={1}
                max={40}
                value={ppMax}
                onChange={(e) => setPpMax(Math.max(1, parseInt(e.target.value || '10', 10)))}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Range</label>
              <input
                type="text"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Targeting</label>
              <select
                value={isAttack ? 'attack' : 'save'}
                onChange={(e) => setIsAttack(e.target.value === 'attack')}
                className="w-full px-2.5 py-1.5 text-xs bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
              >
                <option value="attack">Attack Roll</option>
                <option value="save">Saving Throw DC</option>
              </select>
            </div>

            {!isAttack ? (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Target Save</label>
                <select
                  value={saveAbility}
                  onChange={(e) => setSaveAbility(e.target.value as AbilityKey)}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
                >
                  {ABILITY_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {ABILITY_LABELS[k].short} Save
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <label className="inline-flex items-center gap-2 text-xs text-slate-300 pb-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stabEligible}
                  onChange={(e) => setStabEligible(e.target.checked)}
                  className="rounded border-[#2A3042] bg-[#0F1117] text-rose-500"
                />
                <span>Allow STAB bonus</span>
              </label>
            )}
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Move rules, status effects, range..."
              className="w-full px-2.5 py-1.5 text-xs bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-md cursor-pointer"
            >
              Save Move
            </button>
          </div>
        </form>
      )}

      {pokemon.moves.length === 0 ? (
        <div className="p-6 bg-[#161A24] border border-dashed border-[#2A3042] rounded-lg text-center">
          <p className="text-sm text-slate-400">
            No moves learned yet. Add a move to unlock one-click Attack & Damage rolls.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {pokemon.moves.map((move) => {
            const typeStyle = TYPE_STYLES[move.type];
            const atkBonus = getMoveAttackBonus(pokemon, move);
            const saveDc = getMoveSaveDc(pokemon, move);
            const dmgInfo = getMoveDamageBonus(pokemon, move);
            const isStab = hasMoveStab(pokemon, move);

            return (
              <div
                key={move.id}
                className="bg-[#161A24] border border-[#252A38] rounded-lg p-3.5 flex flex-col gap-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-[11px] font-semibold rounded border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
                      >
                        {move.type}
                      </span>
                      <h4 className="font-display text-sm font-semibold text-slate-100">
                        {move.name}
                      </h4>
                      <span className="text-xs text-slate-400">
                        · {ABILITY_LABELS[move.movePower].short} · {move.castingTime} · {move.range}
                        {isStab ? ' · STAB' : ''}
                      </span>
                    </div>

                    {move.description && (
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        {move.description}
                      </p>
                    )}
                  </div>

                  {/* PP Tracker + Delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-[#0F1117] border border-[#2A3042] rounded-md px-2 py-1">
                      <span className="text-[11px] text-slate-400 mr-1">PP</span>
                      <button
                        type="button"
                        aria-label={`Spend 1 PP for ${move.name}`}
                        onClick={() => onAdjustPp(move.id, -1)}
                        className="w-5 h-5 inline-flex items-center justify-center rounded hover:bg-[#252A38] text-slate-300 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span
                        className={`font-mono text-xs font-semibold px-1 ${
                          move.ppCurrent === 0 ? 'text-rose-400' : 'text-slate-100'
                        }`}
                      >
                        {move.ppCurrent}/{move.ppMax}
                      </span>
                      <button
                        type="button"
                        aria-label={`Restore 1 PP for ${move.name}`}
                        onClick={() => onAdjustPp(move.id, 1)}
                        className="w-5 h-5 inline-flex items-center justify-center rounded hover:bg-[#252A38] text-slate-300 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      aria-label={`Delete ${move.name}`}
                      onClick={() => onRemoveMove(move.id)}
                      className="p-1.5 rounded-md text-slate-500 hover:text-rose-400 hover:bg-[#1C202B] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Big Clear Roll Action Row */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#222736]">
                  {move.isAttack ? (
                    <button
                      type="button"
                      onClick={() => onRollAttack(move)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#232A3B] hover:bg-[#2C354A] border border-[#38435E] hover:border-rose-500/60 rounded-md transition-colors cursor-pointer"
                    >
                      <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                      <span>Roll Attack</span>
                      <span className="font-mono text-rose-300">
                        {formatSignedModifier(atkBonus)}
                      </span>
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-200 bg-[#12151E] border border-[#2A3042] rounded-md">
                      <span>
                        Target {ABILITY_LABELS[move.saveAbility ?? 'dex'].short} Save
                      </span>
                      <span className="font-mono font-semibold text-amber-300">
                        DC {saveDc}
                      </span>
                    </div>
                  )}

                  {move.damageDice && (
                    <>
                      <button
                        type="button"
                        onClick={() => onRollDamage(move, false)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600/90 hover:bg-rose-500 rounded-md transition-colors cursor-pointer"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        <span>Roll Damage</span>
                        <span className="font-mono">
                          {move.damageDice}
                          {dmgInfo.totalBonus !== 0
                            ? ` ${formatSignedModifier(dmgInfo.totalBonus)}`
                            : ''}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onRollDamage(move, true)}
                        title="Roll Critical Hit Damage (2× damage dice)"
                        className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 rounded-md transition-colors cursor-pointer"
                      >
                        <span>Crit 2×</span>
                      </button>
                    </>
                  )}

                  {!move.isAttack && !move.damageDice && (
                    <button
                      type="button"
                      onClick={() => onAdjustPp(move.id, -1)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-[#1C202B] hover:bg-[#252A38] border border-[#2C3346] rounded-md cursor-pointer"
                    >
                      <span>Use Move (-1 PP)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
