import { test } from "node:test";
import assert from "node:assert/strict";
import { itemBox, itemBoxNaturalHeight } from "./itemBox.js";

function lastTextY(nodes: ReturnType<typeof itemBox>["nodes"]): number {
  const textNodes = nodes.filter((n) => n.tag === "text");
  return Math.max(...textNodes.map((n) => Number(n.attrs.y)));
}

test("height always leaves exactly BOTTOM_PAD (15) below the last rendered line", () => {
  const { height, nodes } = itemBox(0, 0, 260, {
    eyebrow: "API management",
    title: "API Control Plane",
    descriptionLines: ["Gateway:", "API discovery · lifecycle · policies · catalog"],
  });
  const last = lastTextY(nodes);
  assert.equal(height - last, 15);
});

test("a box with no eyebrow and no description lines is just title + padding", () => {
  const { height, nodes } = itemBox(0, 0, 260, { title: "Just a title", descriptionLines: [] });
  const textNodes = nodes.filter((n) => n.tag === "text");
  assert.equal(textNodes.length, 1);
  assert.equal(height, lastTextY(nodes) + 15);
});

test("a wrapped title (2 lines) makes the box taller than a one-line title, all else equal", () => {
  const short = itemBox(0, 0, 260, { title: "Short", descriptionLines: ["One line"] });
  const long = itemBox(0, 0, 260, {
    title: "A Considerably Longer Title That Should Wrap Onto Two Lines Here",
    descriptionLines: ["One line"],
  });
  assert.ok(long.height > short.height);
});

test("multiple description thoughts get GROUP_GAP between them, not just LINE_H", () => {
  const oneThought = itemBox(0, 0, 260, { title: "T", descriptionLines: ["Only one thought here"] });
  const twoThoughts = itemBox(0, 0, 260, { title: "T", descriptionLines: ["First thought", "Second thought"] });
  // two single-line thoughts should add LINE_H (17) + GROUP_GAP (6) = 23 over one
  assert.equal(twoThoughts.height - oneThought.height, 23);
});

test("an inline pill on the title doesn't affect computed height", () => {
  const withoutPill = itemBox(0, 0, 260, { title: "Production DB", descriptionLines: ['Shared "orders" schema'] });
  const withPill = itemBox(0, 0, 260, {
    title: "Production DB",
    descriptionLines: ['Shared "orders" schema'],
    pill: { label: "PRIMARY", fg: "#2F7D4F", bg: "#DFF3E4" },
  });
  assert.equal(withoutPill.height, withPill.height);
});

test("a pill that doesn't fit inline with the title drops below it instead of overflowing the box", () => {
  const pillOpt = { label: "NO LIVE READ", fg: "#92600E", bg: "#F7E4B0" };
  const withoutPill = itemBox(0, 0, 264, { title: "Legacy Settlement Export", descriptionLines: ["Nightly CSV batch"] });
  const withPill = itemBox(0, 0, 264, { title: "Legacy Settlement Export", descriptionLines: ["Nightly CSV batch"], pill: pillOpt });

  // Unlike the short-title case above, a pill this box's width can't fit
  // inline must make the box taller (a below-pill row), not the same
  // height — if this fails, the pill is silently overflowing again.
  assert.ok(withPill.height > withoutPill.height);

  const pillNode = withPill.nodes.find((n) => n.tag === "rect" && n.attrs.rx === 10 && n.attrs.fill === pillOpt.bg);
  assert.ok(pillNode, "expected a pill rect in the rendered nodes");
  const pillRight = Number(pillNode!.attrs.x) + Number(pillNode!.attrs.width);
  assert.ok(pillRight <= 264, `pill right edge (${pillRight}) must stay within the box width (264)`);
});

test("minHeight grows the box without moving content, and never shrinks it below natural height", () => {
  const opts = { title: "Short", descriptionLines: ["One line"] };
  const natural = itemBoxNaturalHeight(260, opts);

  const grown = itemBox(0, 0, 260, { ...opts, minHeight: natural + 50 });
  assert.equal(grown.height, natural + 50);
  assert.equal(lastTextY(grown.nodes), lastTextY(itemBox(0, 0, 260, opts).nodes));

  const shrunkAttempt = itemBox(0, 0, 260, { ...opts, minHeight: 1 });
  assert.equal(shrunkAttempt.height, natural);
});
