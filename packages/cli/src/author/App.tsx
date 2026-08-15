import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import type { DraftIR } from "./draftIr.js";
import { initialNavigation, advance } from "./navigation.js";
import { ingressGatewayDescriptors } from "./scalarDescriptors.js";
import { IntroScreen } from "./screens/IntroScreen.js";
import { InboundActorsScreen } from "./screens/InboundActorsScreen.js";
import { GatewayScreen } from "./screens/GatewayScreen.js";
import { CorePlatformSubLayersScreen } from "./screens/CorePlatformSubLayersScreen.js";

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
  // corePlatform is one nav section but two screens (sub-layers, then
  // Systems of Record) — only the first exists so far. This tracks
  // finishing that first screen without advancing nav past corePlatform,
  // the same way ingress doesn't advance into an unbuilt egress.
  const [corePlatformSubLayersDone, setCorePlatformSubLayersDone] = useState(false);

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

  if (nav.current === "corePlatform" && !corePlatformSubLayersDone) {
    return (
      <CorePlatformSubLayersScreen
        draft={draft}
        onComplete={(updatedDraft) => {
          setDraft(updatedDraft);
          setCorePlatformSubLayersDone(true);
        }}
      />
    );
  }

  // Systems of Record (still part of the corePlatform section) and
  // everything after it — egress, externalSystems, review — aren't built
  // yet. Stopping here rather than advancing nav past corePlatform, since
  // that section genuinely isn't complete without Systems of Record.
  return <NotYetBuilt draft={draft} onExit={onExit} />;
}

function NotYetBuilt({ draft, onExit }: { draft: DraftIR; onExit: (draft: DraftIR) => void }): React.JSX.Element {
  useEffect(() => {
    onExit(draft);
  }, [draft, onExit]);
  return (
    <Box flexDirection="column">
      <Text dimColor>(Systems of Record and everything past it is still being built)</Text>
    </Box>
  );
}
