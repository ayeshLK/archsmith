import React, { useState } from "react";
import { Box, Text } from "ink";
import type { DraftIR } from "../draftIr.js";
import { itemLens, systemsOfRecordAccessor } from "../itemLens.js";
import { ItemSubFlow } from "./ItemSubFlow.js";

export interface SystemsOfRecordScreenProps {
  draft: DraftIR;
  onComplete: (draft: DraftIR) => void;
}

/**
 * The durable stores of truth Core Platform reads from and writes to — a
 * repeatable list of items, same shape and same shared ItemSubFlow as
 * InboundActorsScreen. Unlike the 3 governed sub-layers walked by
 * CorePlatformSubLayersScreen, this section is always required (real
 * minItems: 1 on systemsOfRecord.items) and isn't gap-resolvable — there's
 * no "doesn't apply" or "not sure yet" here. The screen enforces its first
 * item locally, with final validation retained only as a backstop.
 */
export function SystemsOfRecordScreen({ draft, onComplete }: SystemsOfRecordScreenProps): React.JSX.Element {
  const [itemIndex, setItemIndex] = useState(0);
  const [currentDraft, setCurrentDraft] = useState(draft);

  const lens = itemLens(`systemsOfRecord.${itemIndex}`, systemsOfRecordAccessor(), itemIndex);

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>
        Systems of Record {itemIndex + 1}
      </Text>
      <Box marginTop={1}>
        <ItemSubFlow
          key={itemIndex}
          draft={currentDraft}
          lens={lens}
          emptyTitleRequiredField={itemIndex === 0 ? "At least one system of record" : undefined}
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
