import React from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import type { DraftIR } from "../draftIr.js";

export interface LegendScreenProps {
  draft: DraftIR;
  onComplete: (draft: DraftIR) => void;
}

const OPTIONS = [
  { label: "Include legend — explain colors and the Core Platform boundary", value: true },
  { label: "Omit legend", value: false },
];

export function LegendScreen({ draft, onComplete }: LegendScreenProps): React.JSX.Element {
  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>
        Legend
      </Text>
      <Text dimColor>Show a legend below the diagram?</Text>
      <Box marginTop={1}>
        <SelectInput
          items={OPTIONS}
          initialIndex={draft.includeLegend === false ? 1 : 0}
          onSelect={(item) => onComplete({ ...draft, includeLegend: item.value })}
        />
      </Box>
    </Box>
  );
}
