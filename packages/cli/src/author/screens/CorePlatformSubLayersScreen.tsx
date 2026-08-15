import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import SelectInput from "ink-select-input";
import { getAuthoringHint } from "@archsmith/schema";
import type { DraftIR } from "../draftIr.js";
import type { SectionStatus } from "../fieldDescriptor.js";
import { itemLens, subLayerItemsAccessor, applySuggestedRowGrouping } from "../itemLens.js";
import { markSubLayerAbsent } from "../gapResolution.js";
import { appendAuthoringNote } from "../authoringNotes.js";
import { governedCoreSubLayers } from "../derived.js";
import { ItemSubFlow } from "./ItemSubFlow.js";

type Phase = "decide" | "items" | "absentReason";

export interface CorePlatformSubLayersScreenProps {
  draft: DraftIR;
  onComplete: (draft: DraftIR) => void;
}

const GOVERNED_LAYERS = governedCoreSubLayers();

// execution-and-capability is present in every one of ArchSmith's own real
// examples (9/9) — the only governed sub-layer that's actually mandatory
// in practice, unlike discovery-and-governance and entity-layer (each
// absent from roughly half of them). See issue #89.
const MANDATORY_LAYER_ID = "execution-and-capability";

function isMandatory(registryId: string): boolean {
  return registryId === MANDATORY_LAYER_ID;
}

function startingSubLayerArrayIndex(draft: DraftIR): number {
  return draft.columns?.corePlatform?.subLayers?.length ?? 0;
}

const DECIDE_OPTIONS: Array<{ label: string; value: SectionStatus }> = [
  { label: "Yes — I'll add its items", value: "done" },
  { label: "No — doesn't apply to this diagram", value: "absent" },
  { label: "Not sure yet — skip for now", value: "pending" },
];

/**
 * Walks through the 3 governed Core Platform sub-layers in registry order
 * (Discovery and Governance, Execution and Capability, Entity Layer) —
 * Systems of Record is a distinct, always-required section handled by
 * its own screen, not part of this walk (see governedCoreSubLayers).
 *
 * execution-and-capability is mandatory (see isMandatory) — it skips the
 * decide step entirely and goes straight to adding items, the same
 * treatment SystemsOfRecordScreen already gives its own always-required
 * section. discovery-and-governance and entity-layer stay three-state.
 *
 * "Not sure yet" and a real instance with zero items both leave a layer
 * exactly as pending — the same underlying state gapResolution.ts already
 * derives from draft shape, not a status this screen tracks separately.
 * Selecting "doesn't apply" marks the layer confirmed-absent via a
 * draft-only marker (markSubLayerAbsent) rather than a rendered gap note
 * (issue #89) — the interview process itself already guards against
 * accidental omission, so an explanation doesn't need to be forced into
 * the diagram to be trustworthy the way a hand-authored gap note's does.
 * The reason is optional, consistent with every other secondary field in
 * this wizard; if given, it's recorded via authoringNotes.ts into the
 * sidecar diagram.authoring-notes.md file, never into the rendered SVG.
 *
 * Revisiting a layer already marked pending before finishing this screen
 * (the nested "resume cursor") is intentionally not built yet — deferred
 * for the same reason it was deferred out of Phase 2 and navigation.ts:
 * it needs a real multi-layer screen to validate its shape against, and
 * this is the first one. A pending layer simply stays pending; assemble()
 * already handles that honestly (no subLayers entry, no gap note).
 */
export function CorePlatformSubLayersScreen({ draft, onComplete }: CorePlatformSubLayersScreenProps): React.JSX.Element {
  const [layerIdx, setLayerIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>(() => (isMandatory(GOVERNED_LAYERS[0]!.id) ? "items" : "decide"));
  const [currentDraft, setCurrentDraft] = useState(draft);
  const [itemIndex, setItemIndex] = useState(0);
  const [subLayerArrayIndex, setSubLayerArrayIndex] = useState(() =>
    isMandatory(GOVERNED_LAYERS[0]!.id) ? startingSubLayerArrayIndex(draft) : 0
  );
  const [value, setValue] = useState("");

  const entry = GOVERNED_LAYERS[layerIdx]!;

  function advanceLayer(updatedDraft: DraftIR): void {
    const nextLayerIdx = layerIdx + 1;
    if (nextLayerIdx >= GOVERNED_LAYERS.length) {
      onComplete(updatedDraft);
      return;
    }
    setCurrentDraft(updatedDraft);
    setLayerIdx(nextLayerIdx);
    setItemIndex(0);
    setValue("");
    const nextEntry = GOVERNED_LAYERS[nextLayerIdx]!;
    if (isMandatory(nextEntry.id)) {
      setSubLayerArrayIndex(startingSubLayerArrayIndex(updatedDraft));
      setPhase("items");
    } else {
      setPhase("decide");
    }
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
                setSubLayerArrayIndex(startingSubLayerArrayIndex(currentDraft));
                setItemIndex(0);
                setPhase("items");
              } else if (item.value === "absent") {
                setCurrentDraft(markSubLayerAbsent(entry.id, currentDraft));
                setPhase("absentReason");
              } else {
                advanceLayer(currentDraft);
              }
            }}
          />
        </Box>
      </Box>
    );
  }

  if (phase === "absentReason") {
    return (
      <Box flexDirection="column">
        <Text color="cyan" bold>
          Core Platform — {entry.label}
        </Text>
        <Text dimColor>Optional: why doesn't this apply here? (Enter to skip — kept out of the diagram, saved to diagram.authoring-notes.md)</Text>
        <Box marginTop={1}>
          <Text color="green">{"? "}</Text>
          <TextInput
            value={value}
            onChange={setValue}
            onSubmit={(submitted) => {
              const updated =
                submitted === ""
                  ? currentDraft
                  : { ...currentDraft, authoringNotes: appendAuthoringNote(currentDraft.authoringNotes ?? {}, entry.label, submitted) };
              advanceLayer(updated);
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
      {itemIndex === 0 && <Text dimColor>{getAuthoringHint(entry.id)}</Text>}
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
