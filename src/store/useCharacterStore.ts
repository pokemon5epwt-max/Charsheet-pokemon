import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ActiveCharacter,
  DiceIntegrationMode,
  InitiativeEntry,
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

function sortInitiativeEntries(entries: InitiativeEntry[]): InitiativeEntry[] {
  return [...entries].sort((a, b) => {
    if (b.initiative !== a.initiative) return b.initiative - a.initiative;
    if (b.dexMod !== a.dexMod) return b.dexMod - a.dexMod;
    return a.characterName.localeCompare(b.characterName);
  });
}

function getNextTurnIndexAfterReorder(
  prevList: InitiativeEntry[],
  prevIndex: number,
  nextList: InitiativeEntry[]
): number {
  if (nextList.length === 0) return 0;
  const currentActiveId = prevList[prevIndex]?.id;
  if (currentActiveId) {
    const relocated = nextList.findIndex((item) => item.id === currentActiveId);
    if (relocated >= 0) return relocated;
  }
  return Math.max(0, Math.min(prevIndex, nextList.length - 1));
}

function upsertInitiativeFromRoll(
  state: {
    party: PartyWorkspace;
    initiativeList: InitiativeEntry[];
    initiativeTurnIndex: number;
  },
  roll: RollEntry
): { initiativeList: InitiativeEntry[]; initiativeTurnIndex: number } | null {
  if (roll.category !== 'initiative') return null;

  const entryId = `${roll.ownerId || 'local-player'}::${roll.characterId || roll.characterName}`;
  const dexMod =
    typeof roll.dexMod === 'number'
      ? roll.dexMod
      : typeof roll.selectedDie === 'number'
        ? roll.total - roll.selectedDie
        : 0;

  let hpText: string | undefined;
  let ac: number | undefined;
  if (roll.source === 'local') {
    const matched =
      roll.characterId === 'trainer'
        ? state.party.trainer
        : state.party.pokemon.find((p) => p.id === roll.characterId);
    if (matched) {
      hpText = `${matched.hpCurrent}/${matched.hpMax}`;
      ac = matched.ac;
    }
  } else {
    const existing = state.initiativeList.find((e) => e.id === entryId);
    hpText = existing?.hpText;
    ac = existing?.ac;
  }

  const nextEntry: InitiativeEntry = {
    id: entryId,
    characterId: roll.characterId,
    characterName: roll.characterName,
    playerName: roll.rollerName || 'Player',
    ownerId: roll.ownerId || 'local-player',
    initiative: roll.total,
    dexMod,
    breakdown: roll.breakdown,
    visibility: roll.visibility,
    hpText,
    ac,
    isNpc: false,
    updatedAt: roll.timestamp,
  };

  const withoutExisting = state.initiativeList.filter((e) => e.id !== entryId);
  const sorted = sortInitiativeEntries([...withoutExisting, nextEntry]);
  const nextIndex = getNextTurnIndexAfterReorder(
    state.initiativeList,
    state.initiativeTurnIndex,
    sorted
  );

  return {
    initiativeList: sorted,
    initiativeTurnIndex: nextIndex,
  };
}

interface CharacterStoreState {
  party: PartyWorkspace;
  activeCharacterId: 'trainer' | string;
  rollMode: RollMode;
  rollVisibility: RollVisibility;
  diceIntegrationMode: DiceIntegrationMode;
  rollLog: RollEntry[];
  rollLogClearedAt?: string;
  obrState: ObrState;

  // Initiative Tracker
  initiativeList: InitiativeEntry[];
  initiativeTurnIndex: number;
  initiativeRound: number;

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
  mergeRoomRolls: (rolls: RollEntry[]) => void;
  clearRollLog: () => void;

  // Initiative Actions
  addManualInitiative: (input: {
    name: string;
    initiative: number;
    dexMod?: number;
    ac?: number;
    hpText?: string;
  }) => void;
  updateInitiativeScore: (id: string, initiative: number) => void;
  removeInitiativeEntry: (id: string) => void;
  setInitiativeTurnIndex: (index: number) => void;
  nextInitiativeTurn: () => void;
  prevInitiativeTurn: () => void;
  clearInitiative: () => void;
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
      rollLogClearedAt: undefined,
      initiativeList: [],
      initiativeTurnIndex: 0,
      initiativeRound: 1,
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

        set((state) => {
          const initiativePatch = upsertInitiativeFromRoll(state, entry);
          return {
            rollLog: [entry, ...state.rollLog].slice(0, 60),
            ...(initiativePatch ?? {}),
          };
        });

        void broadcastRollToObr(entry, diceIntegrationMode === 'obr-dice-plus');
        return entry;
      },

      appendRemoteRoll: (roll) =>
        set((state) => {
          if (state.rollLog.some((r) => r.id === roll.id)) return state;
          if (
            roll.visibility === 'hidden' &&
            state.obrState.role !== 'GM' &&
            roll.ownerId !== state.obrState.playerId
          ) {
            return state;
          }
          const initiativePatch = upsertInitiativeFromRoll(state, roll);
          return {
            rollLog: [roll, ...state.rollLog].slice(0, 60),
            ...(initiativePatch ?? {}),
          };
        }),

      mergeRoomRolls: (incomingRolls) =>
        set((state) => {
          if (incomingRolls.length === 0) return state;
          const existingIds = new Set(state.rollLog.map((r) => r.id));
          const clearedMs = state.rollLogClearedAt
            ? Date.parse(state.rollLogClearedAt)
            : 0;

          const unseen = incomingRolls.filter((r) => {
            if (existingIds.has(r.id)) return false;
            if (r.visibility !== 'visible') return false;
            if (clearedMs > 0 && Date.parse(r.timestamp) <= clearedMs) return false;
            return true;
          });

          if (unseen.length === 0) return state;

          const combinedLog = [...unseen, ...state.rollLog]
            .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
            .slice(0, 60);

          let nextInitState = {
            party: state.party,
            initiativeList: state.initiativeList,
            initiativeTurnIndex: state.initiativeTurnIndex,
          };

          // Apply unseen initiative rolls chronologically so latest re-roll wins
          const sortedAsc = [...unseen].sort(
            (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)
          );
          for (const roll of sortedAsc) {
            const patch = upsertInitiativeFromRoll(nextInitState, roll);
            if (patch) {
              nextInitState = {
                ...nextInitState,
                ...patch,
              };
            }
          }

          return {
            rollLog: combinedLog,
            initiativeList: nextInitState.initiativeList,
            initiativeTurnIndex: nextInitState.initiativeTurnIndex,
          };
        }),

      clearRollLog: () =>
        set({
          rollLog: [],
          rollLogClearedAt: new Date().toISOString(),
        }),

      addManualInitiative: ({ name, initiative, dexMod = 0, ac, hpText }) =>
        set((state) => {
          const trimmed = name.trim();
          if (!trimmed) return state;
          const id = createId('npc-init');
          const entry: InitiativeEntry = {
            id,
            characterId: id,
            characterName: trimmed,
            playerName: state.obrState.role === 'GM' ? 'GM / NPC' : state.obrState.playerName,
            ownerId: state.obrState.playerId || 'local-player',
            initiative,
            dexMod,
            breakdown: 'Manual entry',
            visibility: 'visible',
            ac,
            hpText: hpText?.trim() || undefined,
            isNpc: true,
            updatedAt: new Date().toISOString(),
          };
          const sorted = sortInitiativeEntries([...state.initiativeList, entry]);
          const nextIndex = getNextTurnIndexAfterReorder(
            state.initiativeList,
            state.initiativeTurnIndex,
            sorted
          );
          return {
            initiativeList: sorted,
            initiativeTurnIndex: nextIndex,
          };
        }),

      updateInitiativeScore: (id, initiative) =>
        set((state) => {
          const updated = state.initiativeList.map((entry) =>
            entry.id === id
              ? { ...entry, initiative, updatedAt: new Date().toISOString() }
              : entry
          );
          const sorted = sortInitiativeEntries(updated);
          const nextIndex = getNextTurnIndexAfterReorder(
            state.initiativeList,
            state.initiativeTurnIndex,
            sorted
          );
          return {
            initiativeList: sorted,
            initiativeTurnIndex: nextIndex,
          };
        }),

      removeInitiativeEntry: (id) =>
        set((state) => {
          const filtered = state.initiativeList.filter((entry) => entry.id !== id);
          const nextIndex = getNextTurnIndexAfterReorder(
            state.initiativeList,
            state.initiativeTurnIndex,
            filtered
          );
          return {
            initiativeList: filtered,
            initiativeTurnIndex: nextIndex,
            initiativeRound: filtered.length === 0 ? 1 : state.initiativeRound,
          };
        }),

      setInitiativeTurnIndex: (index) =>
        set((state) => {
          if (state.initiativeList.length === 0) return { initiativeTurnIndex: 0 };
          const clamped = Math.max(0, Math.min(index, state.initiativeList.length - 1));
          return { initiativeTurnIndex: clamped };
        }),

      nextInitiativeTurn: () =>
        set((state) => {
          const count = state.initiativeList.length;
          if (count === 0) return state;
          if (state.initiativeTurnIndex + 1 >= count) {
            return {
              initiativeTurnIndex: 0,
              initiativeRound: state.initiativeRound + 1,
            };
          }
          return { initiativeTurnIndex: state.initiativeTurnIndex + 1 };
        }),

      prevInitiativeTurn: () =>
        set((state) => {
          const count = state.initiativeList.length;
          if (count === 0) return state;
          if (state.initiativeTurnIndex === 0) {
            if (state.initiativeRound > 1) {
              return {
                initiativeTurnIndex: count - 1,
                initiativeRound: state.initiativeRound - 1,
              };
            }
            return state;
          }
          return { initiativeTurnIndex: state.initiativeTurnIndex - 1 };
        }),

      clearInitiative: () =>
        set({
          initiativeList: [],
          initiativeTurnIndex: 0,
          initiativeRound: 1,
        }),
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
        rollLogClearedAt: state.rollLogClearedAt,
        initiativeList: state.initiativeList,
        initiativeTurnIndex: state.initiativeTurnIndex,
        initiativeRound: state.initiativeRound,
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
