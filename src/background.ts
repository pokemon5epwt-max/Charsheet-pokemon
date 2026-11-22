import OBR from '@owlbear-rodeo/sdk';
import { RollEntry } from './types/pokemon5e';
import { getRollCategoryLabel } from './utils/pokemon5eRules';

const ROLL_CHANNEL = 'com.pokemon5e.character-sheet/rolls';

if (OBR.isAvailable) {
  let playerId = 'obr-player';
  let role: 'GM' | 'PLAYER' = 'PLAYER';
  let isActionOpen = false;

  OBR.onReady(() => {
    void Promise.all([
      OBR.player.getId(),
      OBR.player.getRole(),
      OBR.action.isOpen(),
    ])
      .then(([id, r, open]) => {
        playerId = id;
        role = r;
        isActionOpen = open;
        if (open) {
          void OBR.action.setBadgeText(undefined);
        }
      })
      .catch(() => {});

    OBR.player.onChange((player) => {
      playerId = player.id;
      role = player.role;
    });

    OBR.action.onOpenChange((open) => {
      isActionOpen = open;
      if (open) {
        void OBR.action.setBadgeText(undefined);
      }
    });

    OBR.broadcast.onMessage(ROLL_CHANNEL, (event) => {
      const roll = event.data as RollEntry | undefined;
      if (!roll || typeof roll !== 'object' || !roll.id) {
        return;
      }

      // Enforce hidden roll privacy: only GM or the roller sees hidden rolls
      if (
        roll.visibility === 'hidden' &&
        role !== 'GM' &&
        roll.ownerId !== playerId
      ) {
        return;
      }

      const prefix = roll.visibility === 'hidden' ? '[Hidden GM] ' : '';
      const checkType = getRollCategoryLabel(roll.category);
      const who =
        roll.rollerName && roll.rollerName !== roll.characterName
          ? `${roll.rollerName} (${roll.characterName})`
          : roll.characterName;

      void OBR.notification.show(
        `${prefix}${who} · ${checkType}: ${roll.label} → ${roll.total}`,
        roll.isCrit ? 'SUCCESS' : roll.isFumble ? 'ERROR' : 'INFO'
      );

      if (!isActionOpen) {
        const badgeColor = roll.isCrit
          ? '#267347'
          : roll.isFumble
            ? '#D62839'
            : '#D97706';
        void OBR.action.setBadgeBackgroundColor(badgeColor);
        void OBR.action.setBadgeText(String(roll.total));
      }
    });
  });
}
