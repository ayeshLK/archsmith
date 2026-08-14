import React, { useState } from "react";
import { Box, Text } from "ink";
import type { DraftIR } from "../draftIr.js";
import { itemLens, inboundActorsAccessor } from "../itemLens.js";
import { ItemSubFlow } from "./ItemSubFlow.js";

export interface InboundActorsScreenProps {
  draft: DraftIR;
  onComplete: (draft: DraftIR) => void;
}

/**
 * Who or what originates a request from outside the system — a
 * repeatable list of items, using the shared item sub-flow for each one.
 * Submitting an empty title on any item (including the first) ends the
 * list — an empty Inbound Actors section is schema-invalid
 * (minItems: 1, confirmed against the live schema), but that's
 * validate()'s job to catch, not this screen's; nothing here duplicates
 * that check.
 */
export function InboundActorsScreen({ draft, onComplete }: InboundActorsScreenProps): React.JSX.Element {
  const [itemIndex, setItemIndex] = useState(0);
  const [currentDraft, setCurrentDraft] = useState(draft);

  const lens = itemLens(`inboundActors.${itemIndex}`, inboundActorsAccessor(), itemIndex);

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>
        Inbound Actor {itemIndex + 1}
      </Text>
      <Box marginTop={1}>
        <ItemSubFlow
          key={itemIndex}
          draft={currentDraft}
          lens={lens}
          onEmptyTitle={() => onComplete(currentDraft)}
          onComplete={(updatedDraft) => {
            setCurrentDraft(updatedDraft);
            setItemIndex(itemIndex + 1);
          }}
        />
      </Box>
    </Box>
  );
}
