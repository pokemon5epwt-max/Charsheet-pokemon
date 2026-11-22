import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ActiveCharacter,
  DiceIntegrationMode,
  Move,
  ObrState,
  PartyWorkspace,
  PokemonSheet,
  RollEntry,
  RollMode,
  RollVisibility,
  TrainerSheet,
} from '../types/pokemon5e';
import { executeRoll, RollRequest } from '../utils/diceEngine';
import { broadcastRollToObr } from '../utils/obrBridge';
import {
  createEmptySaves,
  createEmptySkills,
  createId,
  createStarterParty,
} from '../utils/pokemon5eRules';

interface CharacterStoreState {
  party: PartyWorkspace;
  activeCharacterId: 'trainer' | string;
  rollMode: RollMode;
  rollVisibility: RollVisibility;
  diceIntegrationMode: DiceIntegrationMode;
  rollLog: RollEntry[];
  obrState: ObrState;

  // Selection & Controls
  setActiveCharacter: (id: 'trainer' | string) => void;
  setRollMode: (mode: RollMode) => void;
  setRollVisibility: (vis: RollVisibility) => void;
  setDiceIntegrationMode: (mode: DiceIntegrationMode) => void;
  setObrState: (obrState: ObrState) => void;

  // Trainer CRUD
  updateTrainer: (patch: Partial<TrainerSheet>) => void;
  resetTrainerToBlank: () => void;

  // Pokémon CRUD (up to 6)
  addPokemon: (pokemon: Omit<PokemonSheet, 'id' | 'kind'> & { id?: string }) => boolean;
  updatePokemon: (id: string, patch: Partial<PokemonSheet>) => void;
  removePokemon: (id: string) => void;
  adjustHp: (characterId: 'trainer' | string, delta: number) => void;

  // Move CRUD
  addMove: (pokemonId: string, move: Omit<Move, 'id'>) => void;
  updateMove: (pokemonId: string, moveId: string, patch: Partial<Move>) => void;
  removeMove: (pokemonId: string, moveId: string) => void;
  adjustMovePp: (pokemonId: string, moveId: string, delta: number) => void;

  // Rest & Utility
  longRestParty: () => void;
  replaceParty: (workspace: PartyWorkspace) => void;
  resetToStarterParty: () => void;

  // Rolling
  performRoll: (
    req: Omit<RollRequest, 'rollMode' | 'visibility' | 'rollerName' | 'ownerId'>
  ) => RollEntry;
  appendRemoteRoll: (roll: RollEntry) => void;
  clearRollLog: () => void;
}

export const useCharacterStore = create<CharacterStoreState>()(
  persist(
    (set, get) => ({
      party: createStarterParty(),
      activeCharacterId: 'trainer',
      rollMode: 'normal',
      rollVisibility: 'visible',
      diceIntegrationMode: 'internal',
      rollLog: [],
      obrState: {
        isAvailable: false,
        isReady: false,
        playerId: 'local-player',
        playerName: 'Local Trainer',
        role: 'GM',
        partyCount: 1,
      },

      setActiveCharacter: (id) => set({ activeCharacterId: id }),
      setRollMode: (rollMode) => set({ rollMode }),
      setRollVisibility: (rollVisibility) => set({ rollVisibility }),
      setDiceIntegrationMode: (diceIntegrationMode) => set({ diceIntegrationMode }),
      setObrState: (obrState) => set({ obrState }),

      updateTrainer: (patch) =>
        set((state) => ({
          party: {
            ...state.party,
            trainer: {
              ...state.party.trainer,
              ...patch,
              id: 'trainer',
              kind: 'trainer',
            },
          },
        })),

      resetTrainerToBlank: () =>
        set((state) => ({
          activeCharacterId: 'trainer',
          party: {
            ...state.party,
            trainer: {
              id: 'trainer',
              kind: 'trainer',
              name: 'New Trainer',
              level: 1,
              trainerClass: 'Pokémon Trainer',
              origin: '',
              hpCurrent: 20,
              hpMax: 20,
              tempHp: 0,
              ac: 12,
              speed: 30,
              hitDice: '1d8',
              abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
              savingThrows: createEmptySaves(),
              skills: createEmptySkills(),
              pokeballs: { pokeBall: 5, greatBall: 0, ultraBall: 0, other: '' },
              money: 500,
              badges: 0,
              trainerPaths: '',
              notes: '',
            },
          },
        })),

      addPokemon: (pokemonInput) => {
        const current = get().party.pokemon;
        if (current.length >= 6) return false;
        const newId = pokemonInput.id || createId('poke');
        const created: PokemonSheet = {
          ...pokemonInput,
          id: newId,
          kind: 'pokemon',
        };
        set((state) => ({
          activeCharacterId: newId,
          party: {
            ...state.party,
            pokemon: [...state.party.pokemon, created],
          },
        }));
        return true;
      },

      updatePokemon: (id, patch) =>
        set((state) => ({
          party: {
            ...state.party,
            pokemon: state.party.pokemon.map((p) =>
              p.id === id ? { ...p, ...patch, id, kind: 'pokemon' } : p
            ),
          },
        })),

      removePokemon: (id) =>
        set((state) => {
          const remaining = state.party.pokemon.filter((p) => p.id !== id);
          const nextActive =
            state.activeCharacterId === id ? 'trainer' : state.activeCharacterId;
          return {
            activeCharacterId: nextActive,
            party: {
              ...state.party,
              pokemon: remaining,
            },
          };
        }),

      adjustHp: (characterId, delta) =>
        set((state) => {
          if (characterId === 'trainer') {
            const t = state.party.trainer;
            const nextHp = Math.max(0, Math.min(t.hpMax, t.hpCurrent + delta));
            return {
              party: {
                ...state.party,
                trainer: { ...t, hpCurrent: nextHp },
              },
            };
          }
          return {
            party: {
              ...state.party,
              pokemon: state.party.pokemon.map((p) =>
                p.id === characterId
                  ? {
                      ...p,
                      hpCurrent: Math.max(0, Math.min(p.hpMax, p.hpCurrent + delta)),
                    }
                  : p
              ),
            },
          };
        }),

      addMove: (pokemonId, move) =>
        set((state) => ({
          party: {
            ...state.party,
            pokemon: state.party.pokemon.map((p) =>
              p.id === pokemonId
                ? { ...p, moves: [...p.moves, { ...move, id: createId('mv') }] }
                : p
            ),
          },
        })),

      updateMove: (pokemonId, moveId, patch) =>
        set((state) => ({
          party: {
            ...state.party,
            pokemon: state.party.pokemon.map((p) =>
              p.id === pokemonId
                ? {
                    ...p,
                    moves: p.moves.map((m) =>
                      m.id === moveId ? { ...m, ...patch, id: moveId } : m
                    ),
                  }
                : p
            ),
          },
        })),

      removeMove: (pokemonId, moveId) =>
        set((state) => ({
          party: {
            ...state.party,
            pokemon: state.party.pokemon.map((p) =>
              p.id === pokemonId
                ? { ...p, moves: p.moves.filter((m) => m.id !== moveId) }
                : p
            ),
          },
        })),

      adjustMovePp: (pokemonId, moveId, delta) =>
        set((state) => ({
          party: {
            ...state.party,
            pokemon: state.party.pokemon.map((p) =>
              p.id === pokemonId
                ? {
                    ...p,
                    moves: p.moves.map((m) =>
                      m.id === moveId
                        ? {
                            ...m,
                            ppCurrent: Math.max(0, Math.min(m.ppMax, m.ppCurrent + delta)),
                          }
                        : m
                    ),
                  }
                : p
            ),
          },
        })),

      longRestParty: () =>
        set((state) => ({
          party: {
            trainer: {
              ...state.party.trainer,
              hpCurrent: state.party.trainer.hpMax,
              tempHp: 0,
            },
            pokemon: state.party.pokemon.map((p) => ({
              ...p,
              hpCurrent: p.hpMax,
              tempHp: 0,
              statusCondition: 'Healthy',
              moves: p.moves.map((m) => ({ ...m, ppCurrent: m.ppMax })),
            })),
          },
        })),

      replaceParty: (workspace) =>
        set({
          party: {
            trainer: { ...workspace.trainer, id: 'trainer', kind: 'trainer' },
            pokemon: workspace.pokemon.slice(0, 6),
          },
          activeCharacterId: 'trainer',
        }),

      resetToStarterParty: () =>
        set({
          party: createStarterParty(),
          activeCharacterId: 'trainer',
        }),

      performRoll: (req) => {
        const { rollMode, rollVisibility, obrState, diceIntegrationMode } = get();
        const entry = executeRoll({
          ...req,
          rollMode,
          visibility: rollVisibility,
          rollerName: obrState.playerName || 'Local Trainer',
          ownerId: obrState.playerId || 'local-player',
        });

        set((state) => ({
          rollLog: [entry, ...state.rollLog].slice(0, 60),
        }));

        void broadcastRollToObr(entry, diceIntegrationMode === 'obr-dice-plus');
        return entry;
      },

      appendRemoteRoll: (roll) =>
        set((state) => {
          if (state.rollLog.some((r) => r.id === roll.id)) return state;
          return {
            rollLog: [roll, ...state.rollLog].slice(0, 60),
          };
        }),

      clearRollLog: () => set({ rollLog: [] }),
    }),
    {
      name: 'pokemon5e-obr-sheet-v1',
      partialize: (state) => ({
        party: state.party,
        activeCharacterId: state.activeCharacterId,
        rollMode: state.rollMode,
        rollVisibility: state.rollVisibility,
        diceIntegrationMode: state.diceIntegrationMode,
        rollLog: state.rollLog.slice(0, 30),
      }),
    }
  )
);

export function selectActiveCharacter(state: CharacterStoreState): ActiveCharacter {
  if (state.activeCharacterId === 'trainer') {
    return state.party.trainer;
  }
  return (
    state.party.pokemon.find((p) => p.id === state.activeCharacterId) ??
    state.party.trainer
  );
}
