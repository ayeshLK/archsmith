import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import type { DraftIR } from "../draftIr.js";
import type { FieldDescriptor } from "../fieldDescriptor.js";
import { titleDescriptor, subtitleDescriptor, deployedOnDescriptor } from "../scalarDescriptors.js";

interface IntroField {
  descriptor: FieldDescriptor<string>;
  label: string;
}

const FIELDS: IntroField[] = [
  { descriptor: titleDescriptor, label: "Title" },
  { descriptor: subtitleDescriptor, label: "Subtitle" },
  { descriptor: deployedOnDescriptor, label: "Deployed on" },
];

export interface IntroScreenProps {
  draft: DraftIR;
  onComplete: (draft: DraftIR) => void;
}

/**
 * The free-text fields the schema can't govern for you — title, subtitle,
 * deployed-on — asked first, one at a time, so everything after has
 * context. The first real screen in Phase 3, establishing the pattern
 * every later screen follows: a field's own hint shown before its prompt,
 * Enter to submit and move on, writing through the exact same Phase 1
 * descriptors the headless engine already uses.
 */
export function IntroScreen({ draft, onComplete }: IntroScreenProps): React.JSX.Element {
  const [fieldIndex, setFieldIndex] = useState(0);
  const [value, setValue] = useState("");
  const [currentDraft, setCurrentDraft] = useState(draft);

  const field = FIELDS[fieldIndex]!;

  const handleSubmit = (submitted: string): void => {
    const updated = field.descriptor.write(currentDraft, submitted);
    setCurrentDraft(updated);
    if (fieldIndex + 1 < FIELDS.length) {
      setFieldIndex(fieldIndex + 1);
      setValue("");
    } else {
      onComplete(updated);
    }
  };

  return (
    <Box flexDirection="column">
      <Text color="magenta" bold>
        {field.label}
      </Text>
      <Text dimColor>{field.descriptor.hint}</Text>
      <Box marginTop={1}>
        <Text color="green">{"? "}</Text>
        <TextInput value={value} onChange={setValue} onSubmit={handleSubmit} />
      </Box>
    </Box>
  );
}
