import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import SelectInput from "ink-select-input";
import type { PillIR } from "@archsmith/renderer";
import type { DraftIR } from "../draftIr.js";
import type { ItemFieldDescriptors } from "../itemLens.js";

// The schema's own real, governed color tokens (registries/colors.json's
// standard family layerTokens) — checked directly, not assumed, since
// item.dotColor has no enum at the JSON-schema level; resolveDotColor()
// in the renderer looks it up against this exact registry at render time,
// so offering anything else here would silently produce a broken diagram.
const DOT_COLORS = ["purple", "green", "teal", "amber", "navy", "mint"] as const;

// The 4 semantics ever offered by this guided picker — "viaEgress" is
// deliberately excluded: its color is hardcoded in registries/colors.json
// to equal the Egress lane's own mint, specifically so it reads as "this
// connects to Egress" — a claim that's only true for items on the far
// side of that gateway. It's offered instead, as a fixed yes/no, only for
// the one accessor whose pillMode is "viaEgressOnly" (issue #97). Wording
// drawn from the schema's own $defs.pill.semantic description, not
// invented fresh.
const PILL_SEMANTICS: Array<{ label: string; value: PillIR["semantic"] }> = [
  { label: "Primary      — the main, authoritative one", value: "primary" },
  { label: "Warning      — flags a risk, gap, or deprecation", value: "warning" },
  { label: "Highlight    — calls special attention to it", value: "highlight" },
  { label: "Layer accent — inherits this item's own layer color", value: "layer" },
];

type Step = "title" | "pill" | "pillSemantic" | "descriptionLines" | "eyebrow" | "dotColor";

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
 * sub-flow — title, then (per lens.pillMode) a pill, then description
 * lines, then (per lens.eyebrowEnabled) eyebrow, then a color accent —
 * instantiated identically everywhere an item is created (see
 * itemLens.ts). `icon`/`tagOverride` stay v1.1 (see issue #67's scope
 * cuts); `acronym` is a post-render fixup triggered by render()'s own
 * needsAcronym signal (#68/#67 Phase 0), not an upfront question here.
 *
 * Pill and eyebrow are the two fields where "ask everyone the same
 * question" turned out wrong (issue #97): real usage of both is
 * concentrated in specific sections, and Inbound Actors' box renderer has
 * no pill support at all. lens.pillMode/lens.eyebrowEnabled (set per
 * accessor in itemLens.ts) are what let this one shared component behave
 * differently per anchor point without the 4 screens that instantiate it
 * needing to know why.
 */
export function ItemSubFlow({ draft, lens, onEmptyTitle, onComplete }: ItemSubFlowProps): React.JSX.Element {
  const [step, setStep] = useState<Step>("title");
  const [value, setValue] = useState("");
  const [currentDraft, setCurrentDraft] = useState(draft);
  const [descriptionLines, setDescriptionLines] = useState<string[]>([]);
  const [pillLabel, setPillLabel] = useState("");

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
              setStep(lens.pillMode === "none" ? "descriptionLines" : "pill");
            }}
          />
        </Box>
      </Box>
    );
  }

  if (step === "pill" && lens.pillMode === "viaEgressOnly") {
    return (
      <Box flexDirection="column">
        <Text color="magenta" bold>
          Pill
        </Text>
        <Text dimColor>Reached via the Egress gateway?</Text>
        <Box marginTop={1}>
          <SelectInput
            items={[
              { label: 'Yes — tag it "via egress"', value: true },
              { label: "No pill", value: false },
            ]}
            onSelect={(item) => {
              const pill: PillIR | null = item.value ? { label: "via egress", semantic: "viaEgress" } : null;
              setCurrentDraft(lens.pill.write(currentDraft, pill));
              setStep("descriptionLines");
            }}
          />
        </Box>
      </Box>
    );
  }

  if (step === "pill") {
    return (
      <Box flexDirection="column">
        <Text color="magenta" bold>
          Pill
        </Text>
        <Text dimColor>{lens.pill.hint} (Enter to skip)</Text>
        <Box marginTop={1}>
          <Text color="green">{"> "}</Text>
          <TextInput
            value={value}
            onChange={setValue}
            onSubmit={(submitted) => {
              if (submitted === "") {
                setCurrentDraft(lens.pill.write(currentDraft, null));
                setValue("");
                setStep("descriptionLines");
                return;
              }
              setPillLabel(submitted);
              setValue("");
              setStep("pillSemantic");
            }}
          />
        </Box>
      </Box>
    );
  }

  if (step === "pillSemantic") {
    return (
      <Box flexDirection="column">
        <Text color="magenta" bold>
          Pill color
        </Text>
        <Text dimColor>What kind of pill is &quot;{pillLabel}&quot;?</Text>
        <Box marginTop={1}>
          <SelectInput
            items={PILL_SEMANTICS}
            onSelect={(item) => {
              setCurrentDraft(lens.pill.write(currentDraft, { label: pillLabel, semantic: item.value }));
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
                setValue("");
                setStep(lens.eyebrowEnabled ? "eyebrow" : "dotColor");
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
              setStep("dotColor");
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
