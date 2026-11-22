import { Minus, Plus, Shield, Sparkles, Trash2, User } from 'lucide-react';
import { useCharacterStore } from '../store/useCharacterStore';
import { TYPE_STYLES } from '../utils/pokemon5eRules';
import { LeagueBadgeIcon, PokeballIcon } from './PokemonAccessories';

interface PartySidebarProps {
  onOpenAddPokemon: () => void;
  onSelectCallback?: () => void;
}

export function PartySidebar({
  onOpenAddPokemon,
  onSelectCallback,
}: PartySidebarProps) {
  const party = useCharacterStore((s) => s.party);
  const activeCharacterId = useCharacterStore((s) => s.activeCharacterId);
  const setActiveCharacter = useCharacterStore((s) => s.setActiveCharacter);
  const adjustHp = useCharacterStore((s) => s.adjustHp);
  const removePokemon = useCharacterStore((s) => s.removePokemon);
  const longRestParty = useCharacterStore((s) => s.longRestParty);

  const selectCharacter = (id: 'trainer' | string) => {
    setActiveCharacter(id);
    onSelectCallback?.();
  };

  const trainerHpPct =
    party.trainer.hpMax > 0
      ? Math.max(0, Math.min(100, (party.trainer.hpCurrent / party.trainer.hpMax) * 100))
      : 0;

  return (
    <>
      {/* Compact Horizontal Party Strip for Medium Owlbear Popover & Mobile (< lg) */}
      <div className="lg:hidden border-b border-[#252A38] bg-[#13161F] px-3 py-2 shrink-0 flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => selectCharacter('trainer')}
          className={`shrink-0 px-2.5 py-1.5 rounded-md border text-left transition-colors cursor-pointer min-w-[116px] ${
            activeCharacterId === 'trainer'
              ? 'bg-[#1D2230] border-rose-500/70'
              : 'bg-[#161A24] border-[#252A38] hover:border-[#343B4F]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-100 truncate max-w-[74px]">
              <User className="w-3 h-3 text-rose-400 shrink-0" />
              <span className="truncate">{party.trainer.name}</span>
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              {party.trainer.hpCurrent}/{party.trainer.hpMax}
            </span>
          </div>
          <div className="mt-1 h-1 w-full bg-[#0F1117] rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${trainerHpPct}%` }}
            />
          </div>
        </button>

        {party.pokemon.map((mon) => {
          const isActive = activeCharacterId === mon.id;
          const hpPct =
            mon.hpMax > 0
              ? Math.max(0, Math.min(100, (mon.hpCurrent / mon.hpMax) * 100))
              : 0;
          const hpColor =
            hpPct > 50
              ? 'bg-emerald-500'
              : hpPct > 25
                ? 'bg-amber-500'
                : 'bg-rose-500';
          const primaryType = mon.types[0] ?? 'Normal';
          const typeStyle = TYPE_STYLES[primaryType];

          return (
            <button
              key={mon.id}
              type="button"
              onClick={() => selectCharacter(mon.id)}
              style={
                isActive
                  ? {
                      borderColor: `${typeStyle.hex}99`,
                      backgroundImage: `linear-gradient(135deg, ${typeStyle.hex}18, transparent)`,
                    }
                  : undefined
              }
              className={`shrink-0 px-2.5 py-1.5 rounded-md border text-left transition-colors cursor-pointer min-w-[120px] ${
                isActive
                  ? 'bg-[#1D2230]'
                  : 'bg-[#161A24] border-[#252A38] hover:border-[#343B4F]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-100 truncate max-w-[76px]">
                  <PokeballIcon
                    variant={mon.hpCurrent <= 0 ? 'fainted' : 'poke'}
                    className="w-3.5 h-3.5 shrink-0"
                  />
                  <span className="truncate">{mon.name}</span>
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  {mon.hpCurrent}/{mon.hpMax}
                </span>
              </div>
              <div className="mt-1 h-1 w-full bg-[#0F1117] rounded-full overflow-hidden">
                <div className={`h-full ${hpColor}`} style={{ width: `${hpPct}%` }} />
              </div>
            </button>
          );
        })}

        {party.pokemon.length < 6 && (
          <button
            type="button"
            onClick={onOpenAddPokemon}
            title="Add Pokémon to Party"
            className="shrink-0 px-2.5 py-2 rounded-md border border-dashed border-[#343B4F] hover:border-rose-500/60 text-xs font-medium text-rose-400 hover:text-rose-300 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        )}

        <button
          type="button"
          onClick={longRestParty}
          title="Long Rest (Restore Full HP & PP)"
          className="shrink-0 px-2.5 py-2 rounded-md bg-[#1C202B] hover:bg-[#252A38] border border-[#2A3042] text-xs font-medium text-slate-200 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Rest</span>
        </button>
      </div>

      {/* Full Left Sidebar for Wide Desktop (lg+) */}
      <aside className="hidden lg:flex w-[272px] shrink-0 border-r border-[#252A38] bg-[#13161F] flex-col">
        <div className="p-4 flex-1 overflow-y-auto space-y-5">
          {/* Trainer Section */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-medium text-slate-400">Trainer</h2>
              <span className="font-mono text-xs text-slate-500">Lv {party.trainer.level}</span>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => selectCharacter('trainer')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  selectCharacter('trainer');
                }
              }}
              className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                activeCharacterId === 'trainer'
                  ? 'bg-[#1D2230] border-rose-500/60'
                  : 'bg-[#161A24] border-[#252A38] hover:border-[#343B4F]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="font-display font-semibold text-sm text-slate-100 truncate">
                      {party.trainer.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {party.trainer.trainerClass} · AC {party.trainer.ac}
                  </p>
                </div>
                <span className="font-mono text-xs text-slate-200 shrink-0">
                  {party.trainer.hpCurrent}/{party.trainer.hpMax}
                </span>
              </div>

              <div className="mt-2.5 h-1.5 w-full bg-[#0F1117] rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-150"
                  style={{ width: `${trainerHpPct}%` }}
                />
              </div>

              <div
                className="mt-2.5 flex items-center justify-between gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                  <LeagueBadgeIcon className="w-3.5 h-3.5" />
                  <span>{party.trainer.badges} Badges · ¥{party.trainer.money.toLocaleString()}</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Decrease Trainer HP"
                    onClick={() => adjustHp('trainer', -1)}
                    className="w-6 h-6 inline-flex items-center justify-center rounded bg-[#0F1117] hover:bg-[#252A38] text-slate-300 border border-[#2A3042] cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    aria-label="Increase Trainer HP"
                    onClick={() => adjustHp('trainer', 1)}
                    className="w-6 h-6 inline-flex items-center justify-center rounded bg-[#0F1117] hover:bg-[#252A38] text-slate-300 border border-[#2A3042] cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Active Pokémon Party (Max 6) */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-medium text-slate-400">
                Pokémon Party ({party.pokemon.length}/6)
              </h2>
              {party.pokemon.length < 6 && (
                <button
                  type="button"
                  onClick={onOpenAddPokemon}
                  className="inline-flex items-center gap-1 text-xs font-medium text-rose-400 hover:text-rose-300 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              )}
            </div>

            {party.pokemon.length === 0 ? (
              <div className="p-4 rounded-lg border border-dashed border-[#2A3042] text-center space-y-2">
                <p className="text-xs text-slate-400">No Pokémon in active party.</p>
                <button
                  type="button"
                  onClick={onOpenAddPokemon}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-md cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Pokémon</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {party.pokemon.map((mon) => {
                  const isActive = activeCharacterId === mon.id;
                  const hpPct =
                    mon.hpMax > 0
                      ? Math.max(0, Math.min(100, (mon.hpCurrent / mon.hpMax) * 100))
                      : 0;
                  const hpColor =
                    hpPct > 50
                      ? 'bg-emerald-500'
                      : hpPct > 25
                        ? 'bg-amber-500'
                        : 'bg-rose-500';
                  const primaryType = mon.types[0] ?? 'Normal';
                  const typeStyle = TYPE_STYLES[primaryType];

                  return (
                    <div
                      key={mon.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => selectCharacter(mon.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          selectCharacter(mon.id);
                        }
                      }}
                      style={
                        isActive
                          ? {
                              borderColor: `${typeStyle.hex}99`,
                              backgroundImage: `linear-gradient(135deg, ${typeStyle.hex}16, transparent 65%)`,
                            }
                          : undefined
                      }
                      className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer group ${
                        isActive
                          ? 'bg-[#1D2230]'
                          : 'bg-[#161A24] border-[#252A38] hover:border-[#343B4F]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <PokeballIcon
                              variant={mon.hpCurrent <= 0 ? 'fainted' : 'poke'}
                              className="w-4 h-4 shrink-0"
                            />
                            <span className="font-display font-semibold text-sm text-slate-100 truncate">
                              {mon.name}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">
                            {mon.species !== mon.name ? `${mon.species} · ` : ''}Lv {mon.level} ·{' '}
                            {mon.types.join('/')}
                          </p>
                        </div>

                        <span className="font-mono text-xs text-slate-200 shrink-0">
                          {mon.hpCurrent}/{mon.hpMax}
                        </span>
                      </div>

                      <div className="mt-2 h-1.5 w-full bg-[#0F1117] rounded-full overflow-hidden">
                        <div
                          className={`h-full ${hpColor} transition-all duration-150`}
                          style={{ width: `${hpPct}%` }}
                        />
                      </div>

                      <div
                        className="mt-2 flex items-center justify-between gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                          <Shield className="w-3 h-3" />
                          AC {mon.ac} · SR {mon.sr}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label={`Decrease ${mon.name} HP`}
                            onClick={() => adjustHp(mon.id, -1)}
                            className="w-6 h-6 inline-flex items-center justify-center rounded bg-[#0F1117] hover:bg-[#252A38] text-slate-300 border border-[#2A3042] cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Increase ${mon.name} HP`}
                            onClick={() => adjustHp(mon.id, 1)}
                            className="w-6 h-6 inline-flex items-center justify-center rounded bg-[#0F1117] hover:bg-[#252A38] text-slate-300 border border-[#2A3042] cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${mon.name}`}
                            onClick={() => removePokemon(mon.id)}
                            className="w-6 h-6 inline-flex items-center justify-center rounded bg-[#0F1117] hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 border border-[#2A3042] cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Party Utility Footer */}
        <div className="p-3 border-t border-[#252A38] flex items-center gap-2">
          <button
            type="button"
            onClick={longRestParty}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-[#1C202B] hover:bg-[#252A38] border border-[#2A3042] rounded-md transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pokémon Center Rest</span>
          </button>
        </div>
      </aside>
    </>
  );
}
