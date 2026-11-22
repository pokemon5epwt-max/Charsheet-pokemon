import { ListOrdered, ScrollText } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AddPokemonModal } from './components/AddPokemonModal';
import { CharacterSheet } from './components/CharacterSheet';
import { ImportPoke5eModal } from './components/ImportPoke5eModal';
import { InitiativeTable } from './components/InitiativeTable';
import { PartySidebar } from './components/PartySidebar';
import { PixelCursor } from './components/PokemonAccessories';
import { RollLogPanel } from './components/RollLogPanel';
import { TopBar } from './components/TopBar';
import { useCharacterStore } from './store/useCharacterStore';
import { initObrBridge } from './utils/obrBridge';

export default function App() {
  const party = useCharacterStore((s) => s.party);
  const rollLog = useCharacterStore((s) => s.rollLog);
  const initiativeList = useCharacterStore((s) => s.initiativeList);
  const initiativeTurnIndex = useCharacterStore((s) => s.initiativeTurnIndex);
  const initiativeRound = useCharacterStore((s) => s.initiativeRound);
  const setObrState = useCharacterStore((s) => s.setObrState);
  const appendRemoteRoll = useCharacterStore((s) => s.appendRemoteRoll);

  const [activeTab, setActiveTab] = useState<'sheet' | 'initiative'>('sheet');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddPokemonModal, setShowAddPokemonModal] = useState(false);
  const [showMobileLog, setShowMobileLog] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const latestRollId = rollLog[0]?.id;
  const prevLatestIdRef = useRef<string | undefined>(latestRollId);

  // Initialize Owlbear Rodeo SDK bridge (gracefully falls back when outside OBR)
  useEffect(() => {
    const cleanup = initObrBridge({
      onObrStateChange: setObrState,
      onRemoteRoll: appendRemoteRoll,
    });
    return cleanup;
  }, [setObrState, appendRemoteRoll]);

  // Track unread rolls on viewports where the Roll Log drawer is collapsed
  useEffect(() => {
    if (latestRollId && latestRollId !== prevLatestIdRef.current && !showMobileLog) {
      setUnreadCount((c) => c + 1);
    }
    prevLatestIdRef.current = latestRollId;
  }, [latestRollId, showMobileLog]);

  const handleToggleMobileLog = () => {
    setShowMobileLog((prev) => {
      const next = !prev;
      if (next) setUnreadCount(0);
      return next;
    });
  };

  const handleExportJson = () => {
    const payload = JSON.stringify(party, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (party.trainer.name || 'trainer')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    a.href = url;
    a.download = `pokemon5e-${safeName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const latestRoll = rollLog[0];
  const currentTurn = initiativeList[initiativeTurnIndex];

  return (
    <div className="h-screen w-full bg-[#141A21] text-[#EDF2F7] flex flex-col overflow-hidden">
      <TopBar
        onOpenImport={() => setShowImportModal(true)}
        onExportJson={handleExportJson}
        onToggleMobileLog={handleToggleMobileLog}
        unreadLogCount={unreadCount}
      />

      {/* GBA PokéNav Mode Switcher: Character Sheet vs Initiative Table */}
      <div className="bg-[#18212B] border-b-2 border-[#090D12] px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-1 py-1" role="tablist" aria-label="Workspace View">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'sheet'}
            onClick={() => setActiveTab('sheet')}
            className={`gba-btn inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'sheet'
                ? 'bg-[#283747] text-white'
                : 'bg-[#131A22] text-slate-400 hover:text-slate-100'
            }`}
          >
            {activeTab === 'sheet' ? (
              <PixelCursor className="w-2.5 h-2.5 text-[#E63946]" />
            ) : (
              <ScrollText className="w-3.5 h-3.5" />
            )}
            <span>Sheet</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'initiative'}
            onClick={() => setActiveTab('initiative')}
            className={`gba-btn inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'initiative'
                ? 'bg-[#283747] text-[#F6C445]'
                : 'bg-[#131A22] text-slate-400 hover:text-slate-100'
            }`}
          >
            {activeTab === 'initiative' ? (
              <PixelCursor className="w-2.5 h-2.5 text-[#F6C445]" />
            ) : (
              <ListOrdered className="w-3.5 h-3.5" />
            )}
            <span>Initiative</span>
            <span className="font-mono tabular-nums text-[10px] text-slate-300">
              ({initiativeList.length})
            </span>
          </button>
        </div>

        {currentTurn && (
          <button
            type="button"
            onClick={() => setActiveTab('initiative')}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#F6C445] hover:text-amber-200 truncate max-w-[240px] cursor-pointer"
          >
            <span className="font-mono tabular-nums text-[10px] text-slate-400">
              R{initiativeRound}
            </span>
            <span>·</span>
            <span className="truncate">▶ {currentTurn.characterName}</span>
          </button>
        )}
      </div>

      {/* GBA Battle Dialogue Roll Banner (only shown below xl when log drawer is closed) */}
      {latestRoll && !showMobileLog && (
        <button
          type="button"
          onClick={handleToggleMobileLog}
          className={`xl:hidden px-3.5 py-1.5 border-b-2 border-[#090D12] flex items-center justify-between text-xs text-left cursor-pointer ${
            latestRoll.visibility === 'hidden'
              ? 'bg-[#2A1D3D]'
              : 'bg-[#1C2530]'
          }`}
        >
          <span className="truncate text-slate-200">
            {latestRoll.visibility === 'hidden' ? '[GM] ' : ''}
            <strong className="text-white">{latestRoll.characterName}</strong> —{' '}
            {latestRoll.label} ({latestRoll.breakdown})
          </span>
          <span
            className={`font-mono font-bold ml-3 shrink-0 text-xs ${
              latestRoll.isCrit
                ? 'text-[#38D46A]'
                : latestRoll.isFumble
                  ? 'text-[#F04848]'
                  : 'text-[#F6C445]'
            }`}
          >
            {latestRoll.total}
            {latestRoll.isCrit ? ' CRIT' : latestRoll.isFumble ? ' NAT1' : ''}
          </span>
        </button>
      )}

      {/* Main Layout: Left Party Sidebar + Center Sheet/Initiative + Right Roll Log */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
        <PartySidebar onOpenAddPokemon={() => setShowAddPokemonModal(true)} />

        {activeTab === 'sheet' ? <CharacterSheet /> : <InitiativeTable />}

        {/* Desktop Docked Roll Log */}
        <div className="hidden xl:flex h-full">
          <RollLogPanel />
        </div>

        {/* Tablet/Mobile Slide-Over Roll Log Drawer */}
        {showMobileLog && (
          <div className="xl:hidden fixed inset-0 z-40 bg-black/75 flex justify-end">
            <div className="w-full max-w-sm h-full bg-[#18212B]">
              <RollLogPanel onCloseMobile={() => setShowMobileLog(false)} />
            </div>
          </div>
        )}
      </div>

      {showImportModal && (
        <ImportPoke5eModal onClose={() => setShowImportModal(false)} />
      )}

      {showAddPokemonModal && (
        <AddPokemonModal onClose={() => setShowAddPokemonModal(false)} />
      )}
    </div>
  );
}
