import { Download, FileUp, History, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useCharacterStore } from '../store/useCharacterStore';
import { setObrPopoverSize } from '../utils/obrBridge';
import { PokedexLens } from './PokemonAccessories';

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
    <header className="h-12 border-b-2 border-[#090D12] bg-[#9E1E2A] shadow-[inset_0_2px_0_#D84A57,inset_0_-2px_0_#6B111A] px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2 shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <PokedexLens className="w-6 h-6" />
        <span className="font-display text-xs sm:text-sm font-bold tracking-tight text-white drop-shadow-[1px_1px_0_#090D12] whitespace-nowrap shrink-0">
          POKÉMON 5E
        </span>
        {obrState.isAvailable && (
          <span className="hidden sm:inline text-xs text-rose-100/85 truncate max-w-[130px]">
            · {obrState.playerName}
          </span>
        )}
      </div>

      <nav className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenImport}
          className="gba-btn inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-100 bg-[#1E2833] hover:bg-[#2A3746] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <FileUp className="w-3.5 h-3.5 text-[#F6C445]" />
          <span>Import</span>
        </button>

        <button
          type="button"
          onClick={onExportJson}
          title="Export Party JSON"
          className="gba-btn inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-100 bg-[#1E2833] hover:bg-[#2A3746] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Export</span>
        </button>

        <button
          type="button"
          onClick={resetToStarterParty}
          title="Load sample Trainer & Pokémon party"
          className="gba-btn hidden md:inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-200 bg-[#1E2833] hover:bg-[#2A3746] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Sample</span>
        </button>

        {obrState.isAvailable && (
          <button
            type="button"
            onClick={handleToggleObrSize}
            title={isExpandedObr ? 'Shrink to Medium Popover (540×640)' : 'Expand Popover'}
            className="gba-btn inline-flex items-center justify-center p-1.5 text-slate-100 bg-[#1E2833] hover:bg-[#2A3746] shrink-0 cursor-pointer"
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
          className="gba-btn xl:hidden inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#090D12] bg-[#F6C445] hover:bg-[#FBD160] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <History className="w-3.5 h-3.5" />
          <span>Log</span>
          {unreadLogCount > 0 && (
            <span className="font-mono text-[10px]">({unreadLogCount})</span>
          )}
        </button>
      </nav>
    </header>
  );
}
