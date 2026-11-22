import { AlertCircle, CheckCircle2, FileUp, Info, Link2, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { useCharacterStore } from '../store/useCharacterStore';
import { Poke5eFileEntry, Poke5eImportResult } from '../types/pokemon5e';
import {
  importFromPoke5eFile,
  importFromPoke5eLink,
  normalizeJsonToWorkspace,
  parseQuickTextPokemon,
} from '../utils/poke5eImporter';

interface ImportPoke5eModalProps {
  onClose: () => void;
}

type ImportTab = 'link' | 'file' | 'paste-json' | 'quick-map';

export function ImportPoke5eModal({ onClose }: ImportPoke5eModalProps) {
  const replaceParty = useCharacterStore((s) => s.replaceParty);
  const addPokemon = useCharacterStore((s) => s.addPokemon);
  const updateTrainer = useCharacterStore((s) => s.updateTrainer);

  const [tab, setTab] = useState<ImportTab>('link');
  const [linkInput, setLinkInput] = useState('');
  const [status, setStatus] = useState<Poke5eImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedKeys, setExtractedKeys] = useState<Poke5eFileEntry[]>([]);

  const [jsonText, setJsonText] = useState('');
  const [statblockText, setStatblockText] = useState(
    `Pikachu\nLevel 5 · SR 2 · Electric · Jolly\nAbility: Static\nHP 38/38 · AC 15 · Speed 35\nSTR 10 DEX 18 CON 12 INT 10 WIS 12 CHA 14\nSkills: Acrobatics, Perception, Stealth\n- Thunderbolt (Electric, 2d8, DEX)\n- Quick Attack (Normal, 1d6, DEX)`
  );
  const [trainerNameInput, setTrainerNameInput] = useState('');

  const handleLinkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkInput.trim()) return;
    setIsLoading(true);
    setStatus(null);

    try {
      const result = await importFromPoke5eLink(linkInput);
      setStatus(result);
      if (result.success && result.workspace) {
        replaceParty(result.workspace);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setStatus(null);

    try {
      const content = await file.text();
      const result = await importFromPoke5eFile(content);
      setStatus(result);

      if (result.extractedKeys) {
        setExtractedKeys(result.extractedKeys);
        if (result.extractedKeys[0]?.name) {
          setTrainerNameInput(result.extractedKeys[0].name);
        }
      }

      if (result.success && result.workspace) {
        replaceParty(result.workspace);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteJsonImport = () => {
    setStatus(null);
    try {
      const parsed = JSON.parse(jsonText);
      const workspace = normalizeJsonToWorkspace(parsed);
      if (!workspace) {
        setStatus({
          success: false,
          tier: 'json-parse',
          message:
            'JSON was valid, but did not contain trainer attributes or Pokémon party fields.',
          warnings: [
            'If you have a poke5e.app URL, switch to the Link tab to fetch directly.',
          ],
        });
        return;
      }
      replaceParty(workspace);
      setStatus({
        success: true,
        tier: 'json-parse',
        message: `Imported "${workspace.trainer.name}" with ${workspace.pokemon.length} Pokémon.`,
        warnings: [],
        workspace,
      });
    } catch {
      setStatus({
        success: false,
        tier: 'json-parse',
        message:
          'Invalid JSON syntax. Please paste complete JSON exported from poke5e.app or this sheet.',
        warnings: [],
      });
    }
  };

  const handleQuickMapPokemon = () => {
    const mon = parseQuickTextPokemon(statblockText);
    const added = addPokemon(mon);

    if (trainerNameInput.trim() || extractedKeys[0]) {
      updateTrainer({
        name: trainerNameInput.trim() || undefined,
        poke5eMeta: extractedKeys[0]
          ? {
              trainerId: extractedKeys[0].trainerId || extractedKeys[0].id || '',
              readKey: extractedKeys[0].readKey,
              accessKey: extractedKeys[0].accessKey,
              importedAt: new Date().toISOString(),
            }
          : undefined,
      });
    }

    setStatus({
      success: added,
      tier: 'manual-map',
      message: added
        ? `Added "${mon.name}" (${mon.types.join('/')}, Lv ${mon.level}) to your party.`
        : 'Your party already has 6 Pokémon. Remove one before importing another.',
      warnings: [],
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
    >
      <div className="w-full max-w-2xl bg-[#161A24] border border-[#2C3346] rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#252A38] flex items-center justify-between">
          <div>
            <h2
              id="import-modal-title"
              className="font-display text-base font-semibold text-slate-100"
            >
              Import from poke5e.app
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Import directly via poke5e.app Trainer Link, .poke5e backup file, JSON, or statblock
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Import Modal"
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-[#252A38] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Documentation Banner */}
        <div className="px-5 py-3 bg-[#12151E] border-b border-[#252A38] flex items-start gap-2.5 text-xs text-slate-300">
          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Import via Link:</strong> Paste your Trainer share URL from{' '}
            <code className="font-mono text-rose-300">poke5e.app/trainers?id=...</code> (or just the
            Trainer ID). The sheet fetches your Trainer stats, Pokémon party (up to 6), skills,
            and moves directly from poke5e.app.
          </p>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-3 border-b border-[#252A38] flex items-center gap-2 overflow-x-auto">
          {(
            [
              { id: 'link', label: '1. Link poke5e' },
              { id: 'file', label: '2. File .poke5e / JSON' },
              { id: 'paste-json', label: '3. Paste JSON' },
              { id: 'quick-map', label: '4. Quick Statblock' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setStatus(null);
              }}
              className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                tab === t.id
                  ? 'border-rose-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {tab === 'link' && (
            <form onSubmit={handleLinkImport} className="space-y-4">
              <div>
                <label
                  htmlFor="poke5e-link-input"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Link Trainer poke5e.app atau Trainer ID
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Link2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="poke5e-link-input"
                      type="text"
                      required
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value)}
                      placeholder="https://poke5e.app/trainers?id=..."
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-[#0F1117] border border-[#2A3042] rounded-md text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/60"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !linkInput.trim()}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-md transition-colors cursor-pointer shrink-0"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Mengambil data...</span>
                      </>
                    ) : (
                      <span>Import from Link</span>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Contoh: buka Trainer kamu di poke5e.app, salin URL dari address bar browser (misal{' '}
                  <code className="font-mono text-slate-400">
                    https://poke5e.app/trainers?id=abc123...
                  </code>
                  ), lalu tempel di sini.
                </p>
              </div>
            </form>
          )}

          {tab === 'file' && (
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center gap-2 p-8 border border-dashed border-[#364059] hover:border-rose-500/60 rounded-lg bg-[#11141C] cursor-pointer transition-colors">
                <FileUp className="w-7 h-7 text-rose-400" />
                <span className="text-sm font-medium text-slate-200">
                  {isLoading ? 'Reading backup file...' : 'Choose .poke5e or .json file'}
                </span>
                <span className="text-xs text-slate-500">
                  Extracts Trainer keys and fetches full stats from poke5e.app automatically
                </span>
                <input
                  type="file"
                  accept=".poke5e,.json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {extractedKeys.length > 0 && (
                <div className="p-3.5 bg-[#12151E] border border-[#2A3042] rounded-lg space-y-2">
                  <div className="text-xs font-semibold text-slate-200">
                    Extracted poke5e.app Keys ({extractedKeys.length})
                  </div>
                  <div className="space-y-1.5">
                    {extractedKeys.map((entry, idx) => (
                      <div
                        key={idx}
                        className="text-xs font-mono text-slate-300 bg-[#0F1117] px-2.5 py-1.5 rounded border border-[#252A38] flex flex-wrap items-center justify-between gap-2"
                      >
                        <div className="flex flex-wrap gap-3">
                          {entry.name && <span>Name: {entry.name}</span>}
                          {entry.trainerId && <span>ID: {entry.trainerId}</span>}
                          {entry.readKey && <span>ReadKey: {entry.readKey}</span>}
                        </div>
                        {(entry.readKey || entry.trainerId) && (
                          <button
                            type="button"
                            onClick={() => {
                              const k = entry.readKey || entry.trainerId || '';
                              setLinkInput(k);
                              setTab('link');
                            }}
                            className="text-[11px] font-sans font-medium text-rose-400 hover:text-rose-300 cursor-pointer"
                          >
                            Fetch via Link →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'paste-json' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Paste a full Trainer JSON document (either exported from this sheet or copied from
                poke5e.app storage).
              </p>
              <textarea
                rows={8}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder='{ "trainer": { "name": "Red", ... }, "pokemon": [ ... ] }'
                className="w-full p-3 text-xs font-mono bg-[#0F1117] border border-[#2A3042] rounded-lg text-slate-100 focus:outline-none focus:border-rose-500/60"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handlePasteJsonImport}
                  className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-md cursor-pointer"
                >
                  Import JSON Workspace
                </button>
              </div>
            </div>
          )}

          {tab === 'quick-map' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Trainer Name (optional update)
                  </label>
                  <input
                    type="text"
                    value={trainerNameInput}
                    onChange={(e) => setTrainerNameInput(e.target.value)}
                    placeholder="Keep current trainer or enter name"
                    className="w-full px-2.5 py-1.5 text-xs bg-[#0F1117] border border-[#2A3042] rounded text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Paste Pokémon Text / Statblock (extracts Level, HP, AC, Ability Scores, Skills &
                  Moves)
                </label>
                <textarea
                  rows={8}
                  value={statblockText}
                  onChange={(e) => setStatblockText(e.target.value)}
                  className="w-full p-3 text-xs font-mono bg-[#0F1117] border border-[#2A3042] rounded-lg text-slate-100 focus:outline-none focus:border-rose-500/60"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleQuickMapPokemon}
                  className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-md cursor-pointer"
                >
                  Parse & Add Pokémon to Party
                </button>
              </div>
            </div>
          )}

          {status && (
            <div
              className={`p-3.5 rounded-lg border flex items-start gap-2.5 text-xs ${
                status.success
                  ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-200'
                  : 'bg-amber-500/10 border-amber-500/35 text-amber-200'
              }`}
            >
              {status.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-medium">{status.message}</p>
                {status.warnings.map((w, i) => (
                  <p key={i} className="text-slate-300">
                    {w}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#252A38] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-200 bg-[#1C202B] hover:bg-[#252A38] border border-[#2A3042] rounded-md cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
