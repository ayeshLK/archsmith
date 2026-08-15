import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { DraftIR } from "./draftIr.js";
import { initialNavigation, advance, jumpTo } from "./navigation.js";
import { ingressGatewayDescriptors, egressGatewayDescriptors } from "./scalarDescriptors.js";
import { IntroScreen } from "./screens/IntroScreen.js";
import { InboundActorsScreen } from "./screens/InboundActorsScreen.js";
import { GatewayScreen } from "./screens/GatewayScreen.js";
import { CorePlatformSubLayersScreen } from "./screens/CorePlatformSubLayersScreen.js";
import { SystemsOfRecordScreen } from "./screens/SystemsOfRecordScreen.js";
import { ExternalSystemsScreen } from "./screens/ExternalSystemsScreen.js";
import { ReviewScreen } from "./screens/ReviewScreen.js";
import { FinalStepScreen } from "./screens/FinalStepScreen.js";

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
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  // Set only while a scalar-only section (intro/ingress/egress) is being
  // re-visited via Review's "edit" option — completing it then returns to
  // Review instead of advancing forward through the rest of the sequence.
  const [cameFromReview, setCameFromReview] = useState(false);

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
    if (cameFromReview) {
      setCameFromReview(false);
      setNav(jumpTo(nav, "review"));
    } else {
      setNav(advance(nav));
    }
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

  if (nav.current === "corePlatform" && corePlatformSubLayersDone) {
    // Systems of Record closes out the corePlatform section for real —
    // advanceFrom here (unlike the sub-layers step above) since there's
    // nothing else left in this section once it's answered.
    return <SystemsOfRecordScreen draft={draft} onComplete={advanceFrom} />;
  }

  if (nav.current === "egress") {
    return <GatewayScreen draft={draft} descriptors={egressGatewayDescriptors} title="Egress" onComplete={advanceFrom} />;
  }

  if (nav.current === "externalSystems") {
    return <ExternalSystemsScreen draft={draft} onComplete={advanceFrom} />;
  }

  if (nav.current === "review" && !reviewConfirmed) {
    return (
      <ReviewScreen
        draft={draft}
        onConfirm={(confirmedDraft) => {
          setDraft(confirmedDraft);
          setReviewConfirmed(true);
        }}
        onEditSection={(section) => {
          setCameFromReview(true);
          setNav(jumpTo(nav, section));
        }}
      />
    );
  }

  // The only remaining reachable state: nav.current === "review" && reviewConfirmed.
  return <FinalStepScreen draft={draft} onExit={onExit} />;
}
