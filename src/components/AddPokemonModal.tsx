import { X } from 'lucide-react';
import { useState } from 'react';
import { useCharacterStore } from '../store/useCharacterStore';
import { PokemonType } from '../types/pokemon5e';
import {
  POKEMON_TYPES,
  createEmptySaves,
  createEmptySkills,
  createId,
} from '../utils/pokemon5eRules';

interface AddPokemonModalProps {
  onClose: () => void;
}

export function AddPokemonModal({ onClose }: AddPokemonModalProps) {
  const addPokemon = useCharacterStore((s) => s.addPokemon);

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [level, setLevel] = useState(1);
  const [sr, setSr] = useState('1/2');
  const [primaryType, setPrimaryType] = useState<PokemonType>('Normal');
  const [secondaryType, setSecondaryType] = useState<PokemonType | ''>('');
  const [nature, setNature] = useState('Hardy');
  const [ability, setAbility] = useState('Run Away');
  const [hpMax, setHpMax] = useState(20);
  const [ac, setAc] = useState(13);
  const [speed, setSpeed] = useState(30);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSpecies = species.trim() || name.trim() || 'Eevee';
    const cleanName = name.trim() || cleanSpecies;
    const types: PokemonType[] = secondaryType && secondaryType !== primaryType
      ? [primaryType, secondaryType]
      : [primaryType];

    addPokemon({
      name: cleanName,
      species: cleanSpecies,
      level,
      sr,
      types,
      nature,
      ability,
      abilityDescription: '',
      hpCurrent: hpMax,
      hpMax,
      tempHp: 0,
      ac,
      speed,
      hitDice: `${level}d8`,
      abilities: { str: 12, dex: 14, con: 12, int: 8, wis: 10, cha: 12 },
      savingThrows: createEmptySaves(),
      skills: createEmptySkills(),
      moves: [
        {
          id: createId('mv'),
          name: 'Tackle',
          type: 'Normal',
          ppCurrent: 20,
          ppMax: 20,
          movePower: 'str',
          damageDice: '1d6',
          isAttack: true,
          stabEligible: true,
          range: 'Melee (5 ft)',
          castingTime: '1 Action',
          description: 'A full-body charge attack.',
        },
      ],
      heldItem: '',
      statusCondition: 'Healthy',
      notes: '',
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-pokemon-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-[#161A24] border border-[#2C3346] rounded-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-[#252A38] flex items-center justify-between">
          <h2 id="add-pokemon-title" className="font-display text-base font-semibold text-slate-100">
            Add Pokémon to Party
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Modal"
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-[#252A38] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nickname</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nimbus"
                className="w-full px-2.5 py-1.5 text-xs bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Species</label>
              <input
                type="text"
                required
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                placeholder="e.g. Eevee"
                className="w-full px-2.5 py-1.5 text-xs bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Level</label>
              <input
                type="number"
                min={1}
                max={20}
                value={level}
                onChange={(e) => setLevel(Math.max(1, Math.min(20, parseInt(e.target.value || '1', 10))))}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">SR</label>
              <input
                type="text"
                value={sr}
                onChange={(e) => setSr(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Max HP</label>
              <input
                type="number"
                min={1}
                value={hpMax}
                onChange={(e) => setHpMax(Math.max(1, parseInt(e.target.value || '20', 10)))}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">AC</label>
              <input
                type="number"
                min={1}
                value={ac}
                onChange={(e) => setAc(Math.max(1, parseInt(e.target.value || '12', 10)))}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Primary Type</label>
              <select
                value={primaryType}
                onChange={(e) => setPrimaryType(e.target.value as PokemonType)}
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
              <label className="block text-xs text-slate-400 mb-1">Secondary Type</label>
              <select
                value={secondaryType}
                onChange={(e) => setSecondaryType(e.target.value as PokemonType | '')}
                className="w-full px-2.5 py-1.5 text-xs bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
              >
                <option value="">None</option>
                {POKEMON_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nature</label>
              <input
                type="text"
                value={nature}
                onChange={(e) => setNature(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Ability</label>
              <input
                type="text"
                value={ability}
                onChange={(e) => setAbility(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Speed (ft)</label>
              <input
                type="number"
                min={0}
                value={speed}
                onChange={(e) => setSpeed(Math.max(0, parseInt(e.target.value || '30', 10)))}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
              />
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-[#252A38] flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#1C202B] border border-[#2A3042] rounded-md cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-md cursor-pointer"
          >
            Add Pokémon
          </button>
        </div>
      </form>
    </div>
  );
}
