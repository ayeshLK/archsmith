import { test } from "node:test";
import assert from "node:assert/strict";
import { getRegistry } from "@archsmith/schema";
import { itemIconNodes } from "./itemIcon.js";

test("every governed icon renders only allow-listed color-free outline primitives", () => {
  const registry = getRegistry("icons") as { icons: Record<string, unknown> };
  const allowed = new Set(["circle", "ellipse", "line", "polyline", "rect"]);
  for (const token of Object.keys(registry.icons)) {
    const nodes = itemIconNodes(token, 10, 20, 16, "#123456");
    assert.ok(nodes.length > 0, `${token} has geometry`);
    for (const node of nodes) {
      assert.ok(allowed.has(node.tag), `${token} emitted ${node.tag}`);
      assert.equal(node.attrs.fill, "none");
      assert.equal(node.attrs.stroke, "#123456");
      assert.equal(node.attrs["stroke-width"], 2);
      assert.equal("d" in node.attrs, false);
    }
  }
});

test("unknown geometry token fails rather than generating markup", () => {
  assert.throws(() => itemIconNodes("<path>", 0, 0, 16, "#000"), /Unknown item icon token/);
});
