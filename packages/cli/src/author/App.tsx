import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { DraftIR } from "./draftIr.js";
import { IntroScreen } from "./screens/IntroScreen.js";

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

  return <IntroScreen draft={draft} onComplete={(updated) => { setDraft(updated); onExit(updated); }} />;
}
