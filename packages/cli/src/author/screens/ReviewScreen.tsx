import React from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import type { DraftIR } from "../draftIr.js";
import type { SectionId } from "../navigation.js";
import { titleDescriptor, subtitleDescriptor, deployedOnDescriptor, ingressGatewayDescriptors, egressGatewayDescriptors } from "../scalarDescriptors.js";
import { governedCoreSubLayers } from "../derived.js";
import { subLayerStatus, subLayerGapNote } from "../gapResolution.js";

export interface ReviewScreenProps {
  draft: DraftIR;
  onConfirm: (draft: DraftIR) => void;
  onEditSection: (section: SectionId) => void;
}

type EditableSection = Extract<SectionId, "intro" | "ingress" | "egress" | "legend">;

const MENU_ITEMS: Array<{ label: string; value: "confirm" | EditableSection }> = [
  { label: "Looks good — continue", value: "confirm" },
  { label: "Edit Title / Subtitle / Deployed On", value: "intro" },
  { label: "Edit Ingress", value: "ingress" },
  { label: "Edit Egress", value: "egress" },
  { label: "Edit Legend", value: "legend" },
];

function gatewayLine(label: string | undefined, sublabel: string | null | undefined): string {
  if (!label) return "(not set)";
  return sublabel ? `${label} (${sublabel})` : label;
}

/**
 * Shows every section in human terms — never a raw JSON dump — before
 * the final validate/render/save step. Jump-to-correct is only offered
 * for intro/ingress/egress and the Legend choice: those are safe to
 * re-enter and overwrite. The 4 repeatable-list sections (Inbound Actors, Core
 * Platform's sub-layers and Systems of Record, External Systems) aren't
 * offered here — none of their screens support "append mode" yet
 * (re-entering one today would restart its list from item 1, silently
 * overwriting whatever's already there), so jumping back into one isn't
 * safe until that's built. A pending Core Platform sub-layer is flagged
 * clearly but doesn't block continuing — assemble() already treats a
 * pending layer the same as a genuinely absent one (no instance, no
 * fabricated content), so there's nothing unsafe about proceeding with
 * one left unresolved, only something the human should be able to see.
 */
export function ReviewScreen({ draft, onConfirm, onEditSection }: ReviewScreenProps): React.JSX.Element {
  const inboundActors = draft.columns?.inboundActors?.items ?? [];
  const systemsOfRecord = draft.columns?.corePlatform?.systemsOfRecord?.items ?? [];
  const clusters = draft.columns?.externalSystems?.clusters ?? [];

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>
        Review
      </Text>

      <Box flexDirection="column" marginTop={1}>
        <Text bold>Title</Text>
        <Text>  {titleDescriptor.read(draft) || "(not set)"}</Text>
        <Text bold>Subtitle</Text>
        <Text>  {subtitleDescriptor.read(draft) || "(not set)"}</Text>
        <Text bold>Deployed On</Text>
        <Text>  {deployedOnDescriptor.read(draft) || "(not set)"}</Text>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text bold>Inbound Actors ({inboundActors.length})</Text>
        {inboundActors.length === 0 && <Text dimColor>  (none yet)</Text>}
        {inboundActors.map((item, i) => (
          <Text key={i}>  · {item.title}</Text>
        ))}
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text bold>Ingress</Text>
        <Text>  {gatewayLine(ingressGatewayDescriptors.label.read(draft), ingressGatewayDescriptors.sublabel.read(draft))}</Text>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text bold>Core Platform</Text>
        {governedCoreSubLayers().map((entry) => {
          const status = subLayerStatus(entry.id, draft);
          if (status === "done") {
            const items = (draft.columns?.corePlatform?.subLayers ?? []).find((s) => s.registryId === entry.id)?.rows.flat() ?? [];
            return (
              <Text key={entry.id}>
                  {entry.label}: {items.map((i) => i.title).join(", ")}
              </Text>
            );
          }
          if (status === "absent") {
            // Two independent sources (issue #89): draft.authoringNotes,
            // the wizard's own default (never rendered into the SVG), or a
            // real gap note in unclassified (hand-authored/imported IR,
            // where it does render) — shown if present, but not required
            // either way, since the reason is optional.
            const reasonFromNotes = draft.authoringNotes?.[entry.label]?.join("; ");
            const reasonFromGapNote = subLayerGapNote(entry.id, draft)?.title;
            const reason = reasonFromNotes || reasonFromGapNote;
            return (
              <Text key={entry.id}>
                  {entry.label}: absent{reason ? ` — ${reason}` : ""}
              </Text>
            );
          }
          return (
            <Text key={entry.id} color="yellow">
                {entry.label}: ⚠ pending — not yet decided
            </Text>
          );
        })}
        <Text>  Systems of Record ({systemsOfRecord.length}): {systemsOfRecord.map((i) => i.title).join(", ") || "(none yet)"}</Text>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text bold>Egress</Text>
        <Text>  {gatewayLine(egressGatewayDescriptors.label.read(draft), egressGatewayDescriptors.sublabel.read(draft))}</Text>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text bold>External Systems ({clusters.length} cluster{clusters.length === 1 ? "" : "s"})</Text>
        {clusters.length === 0 && <Text dimColor>  (none yet)</Text>}
        {clusters.map((cluster, i) => (
          <Text key={i}>  · {cluster.name}: {cluster.items.map((item) => item.title).join(", ")}</Text>
        ))}
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text bold>Legend</Text>
        <Text>  {draft.includeLegend === false ? "omitted" : "included"}</Text>
      </Box>

      <Box marginTop={1}>
        <SelectInput
          items={MENU_ITEMS}
          onSelect={(item) => {
            if (item.value === "confirm") {
              onConfirm(draft);
            } else {
              onEditSection(item.value);
            }
          }}
        />
      </Box>
    </Box>
  );
}
