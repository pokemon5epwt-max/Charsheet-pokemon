import { useEffect, useRef, useState } from 'react';
import { AddPokemonModal } from './components/AddPokemonModal';
import { CharacterSheet } from './components/CharacterSheet';
import { ImportPoke5eModal } from './components/ImportPoke5eModal';
import { PartySidebar } from './components/PartySidebar';
import { RollLogPanel } from './components/RollLogPanel';
import { TopBar } from './components/TopBar';
import { useCharacterStore } from './store/useCharacterStore';
import { initObrBridge } from './utils/obrBridge';

export default function App() {
  const party = useCharacterStore((s) => s.party);
  const rollLog = useCharacterStore((s) => s.rollLog);
  const setObrState = useCharacterStore((s) => s.setObrState);
  const appendRemoteRoll = useCharacterStore((s) => s.appendRemoteRoll);

  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddPokemonModal, setShowAddPokemonModal] = useState(false);
  const [showMobileLog, setShowMobileLog] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const prevLogLenRef = useRef(rollLog.length);

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
    if (rollLog.length > prevLogLenRef.current && !showMobileLog) {
      setUnreadCount((c) => c + (rollLog.length - prevLogLenRef.current));
    }
    prevLogLenRef.current = rollLog.length;
  }, [rollLog.length, showMobileLog]);

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

  return (
    <div className="h-screen w-full bg-[#0F1117] text-slate-100 flex flex-col overflow-hidden">
      <TopBar
        onOpenImport={() => setShowImportModal(true)}
        onExportJson={handleExportJson}
        onToggleMobileLog={handleToggleMobileLog}
        unreadLogCount={unreadCount}
      />

      {/* Mobile Latest Roll Banner (only shown below xl when log drawer is closed) */}
      {latestRoll && !showMobileLog && (
        <button
          type="button"
          onClick={handleToggleMobileLog}
          className="xl:hidden px-4 py-2 bg-[#161A24] border-b border-[#252A38] flex items-center justify-between text-xs text-left cursor-pointer"
        >
          <span className="truncate text-slate-300">
            Last roll: <strong className="text-slate-100">{latestRoll.characterName}</strong> —{' '}
            {latestRoll.label} ({latestRoll.breakdown})
          </span>
          <span className="font-mono font-bold text-rose-400 ml-3 shrink-0">
            {latestRoll.total}
          </span>
        </button>
      )}

      {/* Main Layout: Left Party Sidebar + Center Character Sheet + Right Roll Log */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
        <PartySidebar onOpenAddPokemon={() => setShowAddPokemonModal(true)} />

        <CharacterSheet />

        {/* Desktop Docked Roll Log */}
        <div className="hidden xl:flex h-full">
          <RollLogPanel />
        </div>

        {/* Tablet/Mobile Slide-Over Roll Log Drawer */}
        {showMobileLog && (
          <div className="xl:hidden fixed inset-0 z-40 bg-black/65 flex justify-end">
            <div className="w-full max-w-sm h-full bg-[#13161F]">
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
