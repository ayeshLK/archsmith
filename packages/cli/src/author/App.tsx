import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import type { DraftIR } from "./draftIr.js";
import { initialNavigation, advance } from "./navigation.js";
import { ingressGatewayDescriptors } from "./scalarDescriptors.js";
import { IntroScreen } from "./screens/IntroScreen.js";
import { InboundActorsScreen } from "./screens/InboundActorsScreen.js";
import { GatewayScreen } from "./screens/GatewayScreen.js";

export interface AppProps {
  onExit: (draft: DraftIR | null) => void;
}

/**
 * Ink puts the terminal into raw mode, so Ctrl+C is delivered as an
 * ordinary keypress here, not the usual SIGINT — it has to be handled
 * explicitly. v1 doesn't persist a draft across a closed terminal or a
 * crash (see issue #67's scope decisions), so this says so outright
 * rather than vanishing silently: "nothing was saved" is the honest
 * message, not a false promise of a resumable session that doesn't exist
 * yet.
 */
export function App({ onExit }: AppProps): React.JSX.Element {
  const [draft, setDraft] = useState<DraftIR>({});
  const [nav, setNav] = useState(initialNavigation());
  const [cancelled, setCancelled] = useState(false);

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      setCancelled(true);
      onExit(null);
    }
  });

  if (cancelled) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">Nothing was saved — this doesn't persist yet. Re-run `archsmith author` to start again.</Text>
      </Box>
    );
  }

  const advanceFrom = (updatedDraft: DraftIR): void => {
    setDraft(updatedDraft);
    setNav(advance(nav));
  };

  if (nav.current === "intro") {
    return <IntroScreen draft={draft} onComplete={advanceFrom} />;
  }

  if (nav.current === "inboundActors") {
    return <InboundActorsScreen draft={draft} onComplete={advanceFrom} />;
  }

  if (nav.current === "ingress") {
    return <GatewayScreen draft={draft} descriptors={ingressGatewayDescriptors} title="Ingress" onComplete={advanceFrom} />;
  }

  // corePlatform comes next in the real section order (see navigation.ts)
  // and isn't built yet — egress isn't wired into this live sequence
  // until it is, since it'd otherwise be unreachable dead code (advance()
  // from ingress goes to corePlatform, not egress). GatewayScreen itself
  // is already generic and tested against both gateways' descriptors
  // directly (see GatewayScreen.test.tsx) — only the wiring here waits.
  return <NotYetBuilt draft={draft} onExit={onExit} />;
}

function NotYetBuilt({ draft, onExit }: { draft: DraftIR; onExit: (draft: DraftIR) => void }): React.JSX.Element {
  useEffect(() => {
    onExit(draft);
  }, [draft, onExit]);
  return (
    <Box flexDirection="column">
      <Text dimColor>(everything past Ingress is still being built)</Text>
    </Box>
  );
}
