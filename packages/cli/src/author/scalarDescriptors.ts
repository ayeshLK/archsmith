import { getAuthoringHint } from "@archsmith/schema";
import type { GatewayIR } from "@archsmith/renderer";
import type { DraftIR } from "./draftIr.js";
import type { FieldDescriptor } from "./fieldDescriptor.js";

export const titleDescriptor: FieldDescriptor<string> = {
  id: "title",
  kind: "text",
  hint: "The diagram's title, shown at the top.",
  read: (draft) => draft.title,
  write: (draft, value) => ({ ...draft, title: value }),
};

export const subtitleDescriptor: FieldDescriptor<string> = {
  id: "subtitle",
  kind: "text",
  hint: "A short subtitle shown beneath the title.",
  read: (draft) => draft.subtitle,
  write: (draft, value) => ({ ...draft, subtitle: value }),
};

export const deployedOnDescriptor: FieldDescriptor<string> = {
  id: "corePlatform.deployedOn",
  kind: "text",
  hint: 'The platform or infrastructure this runs on, e.g. "AWS EKS".',
  read: (draft) => draft.columns?.corePlatform?.deployedOn,
  write: (draft, value) => ({
    ...draft,
    columns: { ...draft.columns, corePlatform: { ...draft.columns?.corePlatform, deployedOn: value } },
  }),
};

export interface GatewayFieldDescriptors {
  label: FieldDescriptor<string>;
  sublabel: FieldDescriptor<string | null>;
}

/**
 * One factory for both Ingress and Egress — same shape (GatewayIR:
 * label + optional sublabel), same reasoning as the item-lens factory:
 * write once, instantiate at both anchor points, rather than duplicating
 * the read/write logic for each.
 */
function gatewayLens(
  idPrefix: string,
  hint: string,
  get: (draft: DraftIR) => GatewayIR | undefined,
  set: (draft: DraftIR, gateway: GatewayIR) => DraftIR
): GatewayFieldDescriptors {
  return {
    label: {
      id: `${idPrefix}.gateway.label`,
      kind: "text",
      hint,
      read: (draft) => get(draft)?.label,
      write: (draft, value) => set(draft, { ...(get(draft) ?? { label: "" }), label: value }),
    },
    sublabel: {
      id: `${idPrefix}.gateway.sublabel`,
      kind: "optionalText",
      hint: "An optional short sublabel beneath the gateway name.",
      read: (draft) => get(draft)?.sublabel ?? undefined,
      write: (draft, value) => set(draft, { ...(get(draft) ?? { label: "" }), sublabel: value }),
    },
  };
}

export const ingressGatewayDescriptors: GatewayFieldDescriptors = gatewayLens(
  "ingress",
  getAuthoringHint("ingress"),
  (draft) => draft.columns?.ingress?.gateway,
  (draft, gateway) => ({ ...draft, columns: { ...draft.columns, ingress: { gateway } } })
);

export const egressGatewayDescriptors: GatewayFieldDescriptors = gatewayLens(
  "egress",
  getAuthoringHint("egress"),
  (draft) => draft.columns?.egress?.gateway,
  (draft, gateway) => ({ ...draft, columns: { ...draft.columns, egress: { gateway } } })
);

/** A cluster's own name (e.g. "Shared Internal Services") — distinct from
 * any of its items' own title/eyebrow/description/color, which come from
 * the item-lens factory once a cluster's index is known. */
export function clusterNameDescriptor(clusterIndex: number): FieldDescriptor<string> {
  return {
    id: `externalSystems.clusters.${clusterIndex}.name`,
    kind: "text",
    hint: "A short name for this group of external systems.",
    read: (draft) => draft.columns?.externalSystems?.clusters?.[clusterIndex]?.name,
    write: (draft, value) => {
      const clusters = draft.columns?.externalSystems?.clusters ?? [];
      const existing = clusters[clusterIndex] ?? { items: [] };
      const updated = [...clusters];
      updated[clusterIndex] = { ...existing, name: value };
      return { ...draft, columns: { ...draft.columns, externalSystems: { ...draft.columns?.externalSystems, clusters: updated } } };
    },
  };
}
