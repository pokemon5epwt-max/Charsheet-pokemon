import { Download, FileUp, History, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useCharacterStore } from '../store/useCharacterStore';
import { setObrPopoverSize } from '../utils/obrBridge';

interface TopBarProps {
  onOpenImport: () => void;
  onExportJson: () => void;
  onToggleMobileLog: () => void;
  unreadLogCount: number;
}

export function TopBar({
  onOpenImport,
  onExportJson,
  onToggleMobileLog,
  unreadLogCount,
}: TopBarProps) {
  const obrState = useCharacterStore((s) => s.obrState);
  const resetToStarterParty = useCharacterStore((s) => s.resetToStarterParty);
  const [isExpandedObr, setIsExpandedObr] = useState(false);

  const handleToggleObrSize = () => {
    const next = !isExpandedObr;
    setIsExpandedObr(next);
    void setObrPopoverSize(next ? 980 : 540, next ? 700 : 640);
  };

  return (
    <header className="h-12 border-b border-[#252A38] bg-[#13161F] px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-display text-sm sm:text-base font-semibold tracking-tight text-slate-100 whitespace-nowrap shrink-0">
          Pokémon 5e
        </span>
        {obrState.isAvailable && (
          <span className="hidden sm:inline text-xs text-slate-400 truncate max-w-[140px]">
            · {obrState.playerName}
          </span>
        )}
      </div>

      <nav className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenImport}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-[#1C202B] hover:bg-[#242938] border border-[#2C3346] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <FileUp className="w-3.5 h-3.5 text-rose-400" />
          <span>Import</span>
        </button>

        <button
          type="button"
          onClick={onExportJson}
          title="Export Party JSON"
          className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-[#1C202B] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Export</span>
        </button>

        <button
          type="button"
          onClick={resetToStarterParty}
          title="Load sample Trainer & Pokémon party"
          className="hidden md:inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-[#1C202B] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Sample</span>
        </button>

        {obrState.isAvailable && (
          <button
            type="button"
            onClick={handleToggleObrSize}
            title={isExpandedObr ? 'Shrink to Medium Popover (540×640)' : 'Expand Popover'}
            className="inline-flex items-center justify-center p-1.5 text-slate-300 hover:text-white bg-[#1C202B] hover:bg-[#242938] border border-[#2C3346] rounded-md transition-colors shrink-0 cursor-pointer"
          >
            {isExpandedObr ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onToggleMobileLog}
          className="xl:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <History className="w-3.5 h-3.5" />
          <span>Log</span>
          {unreadLogCount > 0 && (
            <span className="font-mono text-[11px] opacity-90">({unreadLogCount})</span>
          )}
        </button>
      </nav>
    </header>
  );
}
