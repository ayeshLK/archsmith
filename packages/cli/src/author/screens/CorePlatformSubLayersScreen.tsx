import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import SelectInput from "ink-select-input";
import { getAuthoringHint } from "@archsmith/schema";
import type { DraftIR } from "../draftIr.js";
import type { SectionStatus } from "../fieldDescriptor.js";
import { itemLens, subLayerItemsAccessor, applySuggestedRowGrouping } from "../itemLens.js";
import { resolveSubLayerAsAbsent } from "../gapResolution.js";
import { governedCoreSubLayers } from "../derived.js";
import { ItemSubFlow } from "./ItemSubFlow.js";

type Phase = "decide" | "items" | "absentTitle" | "absentDescription";

export interface CorePlatformSubLayersScreenProps {
  draft: DraftIR;
  onComplete: (draft: DraftIR) => void;
}

const GOVERNED_LAYERS = governedCoreSubLayers();

const DECIDE_OPTIONS: Array<{ label: string; value: SectionStatus }> = [
  { label: "Yes — I'll add its items", value: "done" },
  { label: "No — doesn't apply to this diagram", value: "absent" },
  { label: "Not sure yet — skip for now", value: "pending" },
];

/**
 * Walks through the 3 governed Core Platform sub-layers in registry order
 * (Discovery and Governance, Execution and Capability, Entity Layer),
 * deciding each one's status before moving to the next — Systems of
 * Record is a distinct, always-required section handled by its own
 * screen, not part of this walk (see governedCoreSubLayers).
 *
 * "Not sure yet" and a real instance with zero items both leave a layer
 * exactly as pending — the same underlying state gapResolution.ts already
 * derives from draft shape, not a status this screen tracks separately.
 * Revisiting a layer already marked pending before finishing this screen
 * (the nested "resume cursor") is intentionally not built yet — deferred
 * for the same reason it was deferred out of Phase 2 and navigation.ts:
 * it needs a real multi-layer screen to validate its shape against, and
 * this is the first one. A pending layer simply stays pending; assemble()
 * already handles that honestly (no subLayers entry, no gap note).
 */
export function CorePlatformSubLayersScreen({ draft, onComplete }: CorePlatformSubLayersScreenProps): React.JSX.Element {
  const [layerIdx, setLayerIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("decide");
  const [currentDraft, setCurrentDraft] = useState(draft);
  const [itemIndex, setItemIndex] = useState(0);
  const [subLayerArrayIndex, setSubLayerArrayIndex] = useState(0);
  const [absentTitle, setAbsentTitle] = useState("");
  const [value, setValue] = useState("");

  const entry = GOVERNED_LAYERS[layerIdx]!;

  function advanceLayer(updatedDraft: DraftIR): void {
    if (layerIdx + 1 >= GOVERNED_LAYERS.length) {
      onComplete(updatedDraft);
      return;
    }
    setCurrentDraft(updatedDraft);
    setLayerIdx(layerIdx + 1);
    setPhase("decide");
    setItemIndex(0);
    setValue("");
  }

  if (phase === "decide") {
    return (
      <Box flexDirection="column">
        <Text color="cyan" bold>
          Core Platform — {entry.label}
        </Text>
        <Text dimColor>
          ({layerIdx + 1} of {GOVERNED_LAYERS.length}) {getAuthoringHint(entry.id)}
        </Text>
        <Box marginTop={1}>
          <SelectInput
            key={layerIdx}
            items={DECIDE_OPTIONS}
            onSelect={(item) => {
              if (item.value === "done") {
                setSubLayerArrayIndex(currentDraft.columns?.corePlatform?.subLayers?.length ?? 0);
                setItemIndex(0);
                setPhase("items");
              } else if (item.value === "absent") {
                setPhase("absentTitle");
              } else {
                advanceLayer(currentDraft);
              }
            }}
          />
        </Box>
      </Box>
    );
  }

  if (phase === "absentTitle") {
    return (
      <Box flexDirection="column">
        <Text color="cyan" bold>
          Core Platform — {entry.label}
        </Text>
        <Text dimColor>A short title for this gap note, e.g. "No {entry.label}".</Text>
        <Box marginTop={1}>
          <Text color="green">{"? "}</Text>
          <TextInput
            value={value}
            onChange={setValue}
            onSubmit={(submitted) => {
              setAbsentTitle(submitted);
              setValue("");
              setPhase("absentDescription");
            }}
          />
        </Box>
      </Box>
    );
  }

  if (phase === "absentDescription") {
    return (
      <Box flexDirection="column">
        <Text color="cyan" bold>
          Core Platform — {entry.label}
        </Text>
        <Text dimColor>One sentence explaining why this layer doesn't apply here.</Text>
        <Box marginTop={1}>
          <Text color="green">{"? "}</Text>
          <TextInput
            value={value}
            onChange={setValue}
            onSubmit={(submitted) => {
              advanceLayer(resolveSubLayerAsAbsent(entry.id, absentTitle, submitted, currentDraft));
            }}
          />
        </Box>
      </Box>
    );
  }

  // phase === "items"
  const lens = itemLens(`corePlatform.subLayers.${subLayerArrayIndex}.${itemIndex}`, subLayerItemsAccessor(subLayerArrayIndex, entry.id), itemIndex);

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>
        {entry.label} — item {itemIndex + 1}
      </Text>
      <Box marginTop={1}>
        <ItemSubFlow
          key={itemIndex}
          draft={currentDraft}
          lens={lens}
          onEmptyTitle={() => advanceLayer(applySuggestedRowGrouping(subLayerArrayIndex, currentDraft))}
          onComplete={(updatedDraft) => {
            setCurrentDraft(updatedDraft);
            setItemIndex(itemIndex + 1);
          }}
        />
      </Box>
    </Box>
  );
}
