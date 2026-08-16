import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import SelectInput from "ink-select-input";
import type { DraftIR } from "../draftIr.js";
import type { ItemFieldDescriptors } from "../itemLens.js";

// The schema's own real, governed color tokens (registries/colors.json's
// standard family layerTokens) — checked directly, not assumed, since
// item.dotColor has no enum at the JSON-schema level; resolveDotColor()
// in the renderer looks it up against this exact registry at render time,
// so offering anything else here would silently produce a broken diagram.
const DOT_COLORS = ["purple", "green", "teal", "amber", "navy", "mint"] as const;

type Step = "title" | "eyebrow" | "descriptionLines" | "dotColor";

export interface ItemSubFlowProps {
  draft: DraftIR;
  lens: ItemFieldDescriptors;
  /** Called after this item's title is submitted empty — the signal that
   * ends the outer repeatable list, not "this item has an empty title". */
  onEmptyTitle: () => void;
  /** Called once every field for this one item has been answered. */
  onComplete: (draft: DraftIR) => void;
}

/**
 * The schema's own generic item shape, as one reusable authoring
 * sub-flow — title, then eyebrow, then description lines, then a color
 * accent — instantiated identically everywhere an item is created (see
 * itemLens.ts). Deliberately covers only these 4 fields: pill/icon/
 * tagOverride are v1.1, and acronym is a post-render fixup, not part of
 * this sub-flow (see issue #67's scope decisions).
 */
export function ItemSubFlow({ draft, lens, onEmptyTitle, onComplete }: ItemSubFlowProps): React.JSX.Element {
  const [step, setStep] = useState<Step>("title");
  const [value, setValue] = useState("");
  const [currentDraft, setCurrentDraft] = useState(draft);
  const [descriptionLines, setDescriptionLines] = useState<string[]>([]);

  if (step === "title") {
    return (
      <Box flexDirection="column">
        <Text color="magenta" bold>
          Title
        </Text>
        <Text dimColor>{lens.title.hint} (Enter on empty to finish this list)</Text>
        <Box marginTop={1}>
          <Text color="green">{"> "}</Text>
          <TextInput
            value={value}
            onChange={setValue}
            onSubmit={(submitted) => {
              if (submitted === "") {
                onEmptyTitle();
                return;
              }
              setCurrentDraft(lens.title.write(currentDraft, submitted));
              setValue("");
              setStep("eyebrow");
            }}
          />
        </Box>
      </Box>
    );
  }

  if (step === "eyebrow") {
    return (
      <Box flexDirection="column">
        <Text color="magenta" bold>
          Category
        </Text>
        <Text dimColor>{lens.eyebrow.hint} (Enter to skip)</Text>
        <Box marginTop={1}>
          <Text color="green">{"> "}</Text>
          <TextInput
            value={value}
            onChange={setValue}
            onSubmit={(submitted) => {
              setCurrentDraft(lens.eyebrow.write(currentDraft, submitted === "" ? null : submitted));
              setValue("");
              setStep("descriptionLines");
            }}
          />
        </Box>
      </Box>
    );
  }

  if (step === "descriptionLines") {
    return (
      <Box flexDirection="column">
        <Text color="magenta" bold>
          Description line
        </Text>
        <Text dimColor>{lens.descriptionLines.hint}</Text>
        {descriptionLines.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            {descriptionLines.map((line, i) => (
              <Text key={i} dimColor>
                {"  · "}
                {line}
              </Text>
            ))}
          </Box>
        )}
        <Box marginTop={1}>
          <Text color="green">{"> "}</Text>
          <TextInput
            value={value}
            onChange={setValue}
            onSubmit={(submitted) => {
              if (submitted === "") {
                setCurrentDraft(lens.descriptionLines.write(currentDraft, descriptionLines));
                setStep("dotColor");
                return;
              }
              setDescriptionLines([...descriptionLines, submitted]);
              setValue("");
            }}
          />
        </Box>
      </Box>
    );
  }

  // step === "dotColor"
  const colorItems = [
    { label: "(skip)", value: null as string | null },
    ...DOT_COLORS.map((c) => ({ label: c, value: c as string | null })),
  ];

  return (
    <Box flexDirection="column">
      <Text color="magenta" bold>
        Color accent
      </Text>
      <Text dimColor>{lens.dotColor.hint}</Text>
      <Box marginTop={1}>
        <SelectInput
          items={colorItems}
          onSelect={(item) => {
            onComplete(lens.dotColor.write(currentDraft, item.value));
          }}
        />
      </Box>
    </Box>
  );
}
