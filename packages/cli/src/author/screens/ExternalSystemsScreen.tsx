import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import type { DraftIR } from "../draftIr.js";
import { itemLens, clusterItemsAccessor } from "../itemLens.js";
import { clusterNameDescriptor } from "../scalarDescriptors.js";
import { ItemSubFlow } from "./ItemSubFlow.js";

type Phase = "clusterName" | "items";

export interface ExternalSystemsScreenProps {
  draft: DraftIR;
  onComplete: (draft: DraftIR) => void;
}

/**
 * Things outside this platform's ownership — a repeatable list of
 * clusters, each itself a repeatable list of items (the shared
 * ItemSubFlow). Submitting an empty cluster name ends the whole section,
 * the same "empty submission ends the list" convention InboundActorsScreen
 * and ItemSubFlow already use one level down — never a separate "add
 * another cluster?" gate.
 */
export function ExternalSystemsScreen({ draft, onComplete }: ExternalSystemsScreenProps): React.JSX.Element {
  const [clusterIndex, setClusterIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("clusterName");
  const [currentDraft, setCurrentDraft] = useState(draft);
  const [itemIndex, setItemIndex] = useState(0);
  const [value, setValue] = useState("");

  if (phase === "clusterName") {
    const nameDescriptor = clusterNameDescriptor(clusterIndex);
    return (
      <Box flexDirection="column">
        <Text color="cyan" bold>
          External Systems — Cluster {clusterIndex + 1}
        </Text>
        <Text dimColor>{nameDescriptor.hint} (Enter on empty to finish External Systems)</Text>
        <Box marginTop={1}>
          <Text color="green">{"> "}</Text>
          <TextInput
            value={value}
            onChange={setValue}
            onSubmit={(submitted) => {
              if (submitted === "") {
                onComplete(currentDraft);
                return;
              }
              setCurrentDraft(nameDescriptor.write(currentDraft, submitted));
              setValue("");
              setItemIndex(0);
              setPhase("items");
            }}
          />
        </Box>
      </Box>
    );
  }

  // phase === "items"
  const lens = itemLens(
    `externalSystems.clusters.${clusterIndex}.${itemIndex}`,
    clusterItemsAccessor(clusterIndex),
    itemIndex
  );

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>
        Cluster {clusterIndex + 1} — item {itemIndex + 1}
      </Text>
      <Box marginTop={1}>
        <ItemSubFlow
          key={itemIndex}
          draft={currentDraft}
          lens={lens}
          onEmptyTitle={() => {
            setClusterIndex(clusterIndex + 1);
            setPhase("clusterName");
            setValue("");
          }}
          onComplete={(updatedDraft) => {
            setCurrentDraft(updatedDraft);
            setItemIndex(itemIndex + 1);
          }}
        />
      </Box>
    </Box>
  );
}
