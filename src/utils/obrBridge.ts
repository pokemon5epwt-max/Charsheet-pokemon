import OBR from '@owlbear-rodeo/sdk';
import { ObrState, RollEntry } from '../types/pokemon5e';

const ROLL_CHANNEL = 'com.pokemon5e.character-sheet/rolls';
const DICE_PLUS_CHANNEL = 'dice-plus/roll-request';

export interface ObrBridgeCallbacks {
  onObrStateChange: (state: ObrState) => void;
  onRemoteRoll: (roll: RollEntry) => void;
}

export function initObrBridge(callbacks: ObrBridgeCallbacks): () => void {
  if (!OBR.isAvailable) {
    callbacks.onObrStateChange({
      isAvailable: false,
      isReady: false,
      playerId: 'local-player',
      playerName: 'Local Trainer',
      role: 'GM',
      partyCount: 1,
    });
    return () => {};
  }

  let unsubPlayer: (() => void) | undefined;
  let unsubParty: (() => void) | undefined;
  let unsubBroadcast: (() => void) | undefined;

  let currentState: ObrState = {
    isAvailable: true,
    isReady: false,
    playerId: 'obr-player',
    playerName: 'Player',
    role: 'PLAYER',
    partyCount: 1,
  };

  const syncPlayerInfo = async () => {
    try {
      const [id, name, role, party] = await Promise.all([
        OBR.player.getId(),
        OBR.player.getName(),
        OBR.player.getRole(),
        OBR.party.getPlayers(),
      ]);
      currentState = {
        isAvailable: true,
        isReady: true,
        playerId: id,
        playerName: name,
        role,
        partyCount: party.length + 1,
      };
      callbacks.onObrStateChange(currentState);
    } catch {
      // Ignore transient OBR readiness issues
    }
  };

  OBR.onReady(() => {
    void syncPlayerInfo();
    void OBR.action.setWidth(540);
    void OBR.action.setHeight(640);

    unsubPlayer = OBR.player.onChange((player) => {
      currentState = {
        ...currentState,
        isReady: true,
        playerId: player.id,
        playerName: player.name,
        role: player.role,
      };
      callbacks.onObrStateChange(currentState);
    });

    unsubParty = OBR.party.onChange((players) => {
      currentState = {
        ...currentState,
        partyCount: players.length + 1,
      };
      callbacks.onObrStateChange(currentState);
    });

    unsubBroadcast = OBR.broadcast.onMessage(ROLL_CHANNEL, (event) => {
      const payload = event.data as RollEntry | undefined;
      if (!payload || typeof payload !== 'object' || !payload.id) {
        return;
      }

      // Enforce hidden roll privacy:
      // Hidden rolls are only visible to the GM and the rolling player.
      if (
        payload.visibility === 'hidden' &&
        currentState.role !== 'GM' &&
        payload.ownerId !== currentState.playerId
      ) {
        return;
      }

      callbacks.onRemoteRoll({
        ...payload,
        source: 'obr-remote',
      });
    });
  });

  return () => {
    unsubPlayer?.();
    unsubParty?.();
    unsubBroadcast?.();
  };
}

export async function broadcastRollToObr(
  roll: RollEntry,
  syncDicePlus: boolean
): Promise<void> {
  if (!OBR.isAvailable || !OBR.isReady) {
    return;
  }

  try {
    await OBR.broadcast.sendMessage(ROLL_CHANNEL, roll, {
      destination: 'REMOTE',
    });

    // Optional integration path for Dice+ / OBR Dice listeners
    if (syncDicePlus && roll.visibility === 'visible') {
      await OBR.broadcast.sendMessage(
        DICE_PLUS_CHANNEL,
        {
          notation: roll.formula,
          label: `${roll.characterName}: ${roll.label}`,
          senderName: roll.rollerName,
          result: roll.total,
        },
        { destination: 'ALL' }
      );
    }

    const prefix = roll.visibility === 'hidden' ? '[Hidden] ' : '';
    await OBR.notification.show(
      `${prefix}${roll.characterName} rolled ${roll.label}: ${roll.total}`,
      roll.isCrit ? 'SUCCESS' : 'INFO'
    );
  } catch {
    // Graceful fallback if broadcast or notification is unavailable
  }
}

export async function setObrPopoverSize(
  width: number,
  height: number
): Promise<void> {
  if (!OBR.isAvailable || !OBR.isReady) return;
  try {
    await Promise.all([OBR.action.setWidth(width), OBR.action.setHeight(height)]);
  } catch {
    // Ignore if action resize is unsupported
  }
}
