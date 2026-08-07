import { test } from "node:test";
import assert from "node:assert/strict";
import { clusterBox, clusterContentWidth, type ClusterItem } from "./clusterBox.js";
import { measureText } from "../text/measure.js";
import { MAX_INLINE_WIDTH } from "../constants.js";

// The exact 3-tier scenario visually validated in Chrome during the original
// Python prototype work: a short title (fits inline), a longer one (wraps to
// 2 lines, pill drops below), and an extremely long one (still doesn't fit in
// 2 lines, so it's flagged as needing a human-supplied acronym).
const TIER_ITEMS: ClusterItem[] = [
  { color: "#5B3A9E", title: "HR / People GraphQL Service", sub: "Tier 1 — fits on one line, inline pill.", pill: "via egress" },
  {
    color: "#177F6B",
    title: "Enterprise Directory and Provisioning Integration Service",
    sub: "Tier 2 — wraps to 2 lines, pill moves below.",
    pill: "via egress",
  },
  {
    color: "#4C3A9E",
    title: "Extremely Long Hypothetical Organization Wide Directory And Employee Provisioning Synchronization Service",
    sub: "Tier 3 — needs an acronym, flagged.",
    pill: "via egress",
  },
];

test("clusterContentWidth is capped at MAX_INLINE_WIDTH even when content needs more", () => {
  const w = clusterContentWidth("Synthetic Overflow Test", TIER_ITEMS);
  assert.equal(w, MAX_INLINE_WIDTH);
});

test("clusterContentWidth floors at 260 for a cluster with very short content", () => {
  const w = clusterContentWidth("X", [{ color: "#000", title: "Y", sub: "Z" }]);
  assert.equal(w, 260);
});

test("three-tier rendering: exactly one item is flagged ACRONYM NEEDED (tier 3 only)", () => {
  const w = clusterContentWidth("Synthetic Overflow Test", TIER_ITEMS);
  const { nodes } = clusterBox(0, 0, w, {
    title: "Synthetic Overflow Test",
    items: TIER_ITEMS,
    pillFg: "#1E8A73",
    pillBg: "#D9F2EC",
  });
  const acronymPillLabels = nodes.filter((n) => n.tag === "text" && n.text === "ACRONYM NEEDED");
  assert.equal(acronymPillLabels.length, 1);
});

test("no rendered title line exceeds the box's available content width, across all three tiers", () => {
  const w = clusterContentWidth("Synthetic Overflow Test", TIER_ITEMS);
  const { nodes } = clusterBox(0, 0, w, {
    title: "Synthetic Overflow Test",
    items: TIER_ITEMS,
    pillFg: "#1E8A73",
    pillBg: "#D9F2EC",
  });
  const availW = w - 16 - 16 - 16; // pad + pad + the 16px left inset used inside clusterBox
  const titleLineNodes = nodes.filter((n) => n.tag === "text" && n.attrs["font-size"] === 12.3);
  for (const n of titleLineNodes) {
    const measured = measureText(String(n.text), 12.3, 700);
    assert.ok(measured <= availW + 0.5, `"${n.text}" measures ${measured.toFixed(1)}, exceeds available width ${availW}`);
  }
});

test("a single tier-1 item renders with an inline pill (no ACRONYM NEEDED, no wrap)", () => {
  const items: ClusterItem[] = [{ color: "#5B3A9E", title: "Email Service", sub: "Notifications", pill: "via egress" }];
  const w = clusterContentWidth("Cluster", items);
  const { height, nodes } = clusterBox(0, 0, w, { title: "Cluster", items, pillFg: "#1E8A73", pillBg: "#D9F2EC" });
  assert.equal(height, 44 + 52 + 20); // headerH + tier-1 item height + bottomPad
  assert.equal(nodes.filter((n) => n.text === "ACRONYM NEEDED").length, 0);
});
