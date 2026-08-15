import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import type { DraftIR } from "../draftIr.js";
import type { GatewayFieldDescriptors } from "../scalarDescriptors.js";

type Step = "label" | "sublabel";

export interface GatewayScreenProps {
  draft: DraftIR;
  descriptors: GatewayFieldDescriptors;
  title: string;
  onComplete: (draft: DraftIR) => void;
}

/**
 * Ingress and Egress share the exact same shape (a label, an optional
 * sublabel) — one component, instantiated with each column's own
 * descriptors and title, rather than two nearly-identical files. Same
 * "one factory, not two copies" principle as itemLens.ts, one layer up.
 */
export function GatewayScreen({ draft, descriptors, title, onComplete }: GatewayScreenProps): React.JSX.Element {
  const [step, setStep] = useState<Step>("label");
  // Seeded from the draft's own existing value — this screen can now be
  // re-entered with real data already in it (Review's "edit" option), and
  // a blank prompt over an already-answered field would silently discard
  // it the moment Enter is pressed on an empty submission.
  const [value, setValue] = useState(() => descriptors.label.read(draft) ?? "");
  const [currentDraft, setCurrentDraft] = useState(draft);

  if (step === "label") {
    return (
      <Box flexDirection="column">
        <Text color="cyan" bold>
          {title}
        </Text>
        <Text dimColor>{descriptors.label.hint}</Text>
        <Box marginTop={1}>
          <Text color="green">{"? "}</Text>
          <TextInput
            value={value}
            onChange={setValue}
            onSubmit={(submitted) => {
              const updated = descriptors.label.write(currentDraft, submitted);
              setCurrentDraft(updated);
              setValue(descriptors.sublabel.read(updated) ?? "");
              setStep("sublabel");
            }}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>
        {title}
      </Text>
      <Text dimColor>{descriptors.sublabel.hint} (Enter to skip)</Text>
      <Box marginTop={1}>
        <Text color="green">{"? "}</Text>
        <TextInput
          value={value}
          onChange={setValue}
          onSubmit={(submitted) => {
            onComplete(descriptors.sublabel.write(currentDraft, submitted === "" ? null : submitted));
          }}
        />
      </Box>
    </Box>
  );
}
