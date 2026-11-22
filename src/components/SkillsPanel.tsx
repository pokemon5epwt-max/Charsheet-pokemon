import { Search } from 'lucide-react';
import { useState } from 'react';
import {
  AbilityScores,
  SkillName,
  SkillProficiencies,
  SkillProficiencyLevel,
} from '../types/pokemon5e';
import {
  ABILITY_LABELS,
  ALL_SKILLS,
  SKILL_ABILITY_MAP,
  formatSignedModifier,
  getSkillModifier,
} from '../utils/pokemon5eRules';

interface SkillsPanelProps {
  abilities: AbilityScores;
  skills: SkillProficiencies;
  profBonus: number;
  isEditing: boolean;
  onCycleSkillProf: (skill: SkillName) => void;
  onRollSkill: (skill: SkillName) => void;
}

const PROF_LABEL: Record<SkillProficiencyLevel, string> = {
  none: '—',
  proficient: 'Prof',
  expertise: 'Exp',
};

export function SkillsPanel({
  abilities,
  skills,
  profBonus,
  isEditing,
  onCycleSkillProf,
  onRollSkill,
}: SkillsPanelProps) {
  const [query, setQuery] = useState('');

  const filtered = ALL_SKILLS.filter((skill) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const ab = ABILITY_LABELS[SKILL_ABILITY_MAP[skill]].short.toLowerCase();
    return skill.toLowerCase().includes(q) || ab.includes(q);
  });

  return (
    <section className="bg-[#161A24] border border-[#252A38] rounded-lg p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="font-display text-sm font-semibold text-slate-200">Skills</h3>
          <p className="text-xs text-slate-400">
            {isEditing
              ? 'Click Prof/Exp badge to cycle proficiency'
              : 'Click any skill row to roll check'}
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter skills..."
            className="pl-8 pr-3 py-1.5 text-xs bg-[#0F1117] border border-[#2A3042] rounded-md text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/60 w-40"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
        {filtered.map((skill) => {
          const abilityKey = SKILL_ABILITY_MAP[skill];
          const profState = skills[skill] ?? 'none';
          const mod = getSkillModifier(abilities, skills, skill, profBonus);

          return (
            <div
              key={skill}
              className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-md bg-[#12151E] hover:bg-[#1C212E] border border-[#222736] transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => (isEditing ? onCycleSkillProf(skill) : onRollSkill(skill))}
                  title={
                    isEditing
                      ? 'Cycle None / Proficient / Expertise'
                      : `Toggle proficiency or roll ${skill}`
                  }
                  className={`px-1.5 py-0.5 text-[10px] font-mono rounded border shrink-0 cursor-pointer ${
                    profState === 'expertise'
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : profState === 'proficient'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-[#0F1117] border-[#2A3042] text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {PROF_LABEL[profState]}
                </button>
                <button
                  type="button"
                  onClick={() => onRollSkill(skill)}
                  className="text-left min-w-0 flex items-center gap-1.5 cursor-pointer truncate"
                >
                  <span className="text-xs text-slate-200 truncate hover:text-white">
                    {skill}
                  </span>
                  <span className="text-[11px] text-slate-500 shrink-0">
                    ({ABILITY_LABELS[abilityKey].short})
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => onRollSkill(skill)}
                className="font-mono text-xs font-semibold text-slate-100 hover:text-rose-300 px-2 py-0.5 rounded bg-[#1A1F2B] border border-[#2A3042] shrink-0 cursor-pointer"
              >
                {formatSignedModifier(mod)}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
