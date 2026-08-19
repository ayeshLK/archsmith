import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

export interface AcronymFixupScreenProps {
  /** Titles render()'s own needsAcronym signal (issue #68) flagged —
   * each didn't fit wrapped to two lines with no acronym supplied. */
  titles: string[];
  onComplete: (answers: string[]) => void;
}

/**
 * A title only reaches this screen once the whole diagram has actually
 * been assembled and a real render attempt flags it — a rendering-time
 * fact no earlier per-item screen could know (see AGENTS.md's wizard
 * notes on why this is a fixup, not an upfront question). Runs once,
 * after Review, right before the Save prompt. Skippable per title (Enter
 * on empty): the renderer's own existing overflow handling still applies
 * to whatever's left unresolved, honestly, rather than the wizard
 * inventing a placeholder acronym.
 */
export function AcronymFixupScreen({ titles, onComplete }: AcronymFixupScreenProps): React.JSX.Element {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [value, setValue] = useState("");

  const title = titles[index]!;

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>
        {`Acronym needed (${index + 1}/${titles.length})`}
      </Text>
      <Text dimColor>
        {`"${title}" doesn't fit wrapped to two lines. Give it a short acronym (e.g. "CRM"), or Enter to leave it as-is.`}
      </Text>
      <Box marginTop={1}>
        <Text color="green">{"> "}</Text>
        <TextInput
          value={value}
          onChange={setValue}
          onSubmit={(submitted) => {
            const next = [...answers, submitted];
            if (index + 1 < titles.length) {
              setAnswers(next);
              setValue("");
              setIndex(index + 1);
            } else {
              onComplete(next);
            }
          }}
        />
      </Box>
    </Box>
  );
}
