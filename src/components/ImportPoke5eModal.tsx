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
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
    >
      <div className="gba-panel w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#9E1E2A] border-b-2 border-[#090D12] flex items-center justify-between">
          <div>
            <h2
              id="import-modal-title"
              className="font-display text-sm font-bold text-white uppercase"
            >
              Import from poke5e.app
            </h2>
            <p className="text-xs text-rose-100/85 mt-0.5">
              Trainer Link, .poke5e backup file, JSON, or statblock
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Import Modal"
            className="gba-btn p-1.5 bg-[#1E2833] hover:bg-[#2A3746] text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Documentation Banner */}
        <div className="px-5 py-3 bg-[#131A22] border-b-2 border-[#090D12] flex items-start gap-2.5 text-xs text-slate-200">
          <Info className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Import via Link:</strong> Paste your Trainer share URL from{' '}
            <code className="font-mono text-[#F6C445]">poke5e.app/trainers?id=...</code> (or just
            the Trainer ID) to fetch stats, Pokémon party, skills, and moves directly.
          </p>
        </div>

        {/* Tabs */}
        <div className="px-5 py-2 bg-[#17202A] border-b-2 border-[#090D12] flex items-center gap-1.5 overflow-x-auto">
          {(
            [
              { id: 'link', label: '1. Link poke5e' },
              { id: 'file', label: '2. File .poke5e' },
              { id: 'paste-json', label: '3. Paste JSON' },
              { id: 'quick-map', label: '4. Statblock' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setStatus(null);
              }}
              className={`gba-btn px-3 py-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                tab === t.id
                  ? 'bg-[#D62839] text-white'
                  : 'bg-[#131A22] text-slate-300 hover:text-white'
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
                  className="block text-xs font-medium text-slate-200 mb-1.5"
                >
                  Link Trainer poke5e.app atau Trainer ID
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="poke5e-link-input"
                      type="text"
                      required
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value)}
                      placeholder="https://poke5e.app/trainers?id=..."
                      className="gba-well w-full pl-9 pr-3 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !linkInput.trim()}
                    className="gba-btn inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#D62839] hover:bg-[#E63946] disabled:opacity-50 cursor-pointer shrink-0"
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
                <p className="text-xs text-slate-400 mt-2">
                  Contoh: salin URL Trainer dari browser (misal{' '}
                  <code className="font-mono text-slate-300">
                    https://poke5e.app/trainers?id=abc123...
                  </code>
                  ), lalu tempel di sini.
                </p>
              </div>
            </form>
          )}

          {tab === 'file' && (
            <div className="space-y-4">
              <label className="gba-well flex flex-col items-center justify-center gap-2 p-8 cursor-pointer hover:bg-[#161F29] transition-colors">
                <FileUp className="w-7 h-7 text-[#F6C445]" />
                <span className="text-sm font-medium text-white">
                  {isLoading ? 'Reading backup file...' : 'Choose .poke5e or .json file'}
                </span>
                <span className="text-xs text-slate-400">
                  Extracts Trainer keys and fetches full stats from poke5e.app
                </span>
                <input
                  type="file"
                  accept=".poke5e,.json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {extractedKeys.length > 0 && (
                <div className="gba-well p-3.5 space-y-2">
                  <div className="text-xs font-semibold text-white">
                    Extracted poke5e.app Keys ({extractedKeys.length})
                  </div>
                  <div className="space-y-1.5">
                    {extractedKeys.map((entry, idx) => (
                      <div
                        key={idx}
                        className="text-xs font-mono text-slate-200 bg-[#18212B] px-2.5 py-1.5 border border-[#090D12] flex flex-wrap items-center justify-between gap-2"
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
                            className="text-xs font-sans font-semibold text-[#F6C445] hover:text-amber-200 cursor-pointer"
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
              <p className="text-xs text-slate-300">
                Paste a full Trainer JSON document exported from this sheet or poke5e.app.
              </p>
              <textarea
                rows={8}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder='{ "trainer": { "name": "Red", ... }, "pokemon": [ ... ] }'
                className="gba-well w-full p-3 text-xs font-mono text-white focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handlePasteJsonImport}
                  className="gba-btn px-4 py-2 text-xs font-semibold text-white bg-[#D62839] hover:bg-[#E63946] cursor-pointer"
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
                  <label className="block text-xs text-slate-300 mb-1">
                    Trainer Name (optional update)
                  </label>
                  <input
                    type="text"
                    value={trainerNameInput}
                    onChange={(e) => setTrainerNameInput(e.target.value)}
                    placeholder="Keep current trainer or enter name"
                    className="gba-well w-full px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Paste Pokémon Text / Statblock
                </label>
                <textarea
                  rows={8}
                  value={statblockText}
                  onChange={(e) => setStatblockText(e.target.value)}
                  className="gba-well w-full p-3 text-xs font-mono text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleQuickMapPokemon}
                  className="gba-btn px-4 py-2 text-xs font-semibold text-white bg-[#D62839] hover:bg-[#E63946] cursor-pointer"
                >
                  Parse &amp; Add Pokémon
                </button>
              </div>
            </div>
          )}

          {status && (
            <div
              className={`p-3.5 border-2 border-[#090D12] flex items-start gap-2.5 text-xs ${
                status.success
                  ? 'bg-[#1A4D34] text-emerald-100'
                  : 'bg-[#5A3A15] text-amber-100'
              }`}
            >
              {status.success ? (
                <CheckCircle2 className="w-4 h-4 text-[#38D46A] shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#F6C445] shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-semibold">{status.message}</p>
                {status.warnings.map((w, i) => (
                  <p key={i} className="text-slate-200">
                    {w}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t-2 border-[#090D12] bg-[#17202A] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="gba-btn px-4 py-1.5 text-xs font-semibold text-slate-100 bg-[#263547] hover:bg-[#32445A] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
