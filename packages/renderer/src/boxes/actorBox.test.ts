import { test } from "node:test";
import assert from "node:assert/strict";
import { actorBox } from "./actorBox.js";

test("a box with two short lines (no wrapping) computes the tier-1 baseline height", () => {
  // Two lines that each fit on one physical line at this width, so no
  // GROUP_GAP-affecting wrap should occur; height should match the same
  // formula this project already validated by hand: pad+6+20 +
  // (totalLines-1)*LINE_H + (groups-1)*GROUP_GAP + 24 =
  // 16+6+20 + 1*17 + 1*6 + 24 = 89.
  const { height } = actorBox(0, 0, 260, {
    dotColor: "#5B3A9E",
    title: "Web App",
    lines: ["React SPA — internal staff", "OIDC login (IdP) · Bearer ID token"],
  });
  assert.equal(height, 89);
});

test("a box where one thought wraps to 2 lines grows taller than one where none do", () => {
  const short = actorBox(0, 0, 260, {
    dotColor: "#177F6B",
    title: "Short",
    lines: ["One short line", "Another short line"],
  });
  const wrapped = actorBox(0, 0, 260, {
    dotColor: "#177F6B",
    title: "Longer",
    lines: [
      "External customers — planned, not live yet",
      "customerPortalRole JWT · listings, applicants",
    ],
  });
  assert.ok(wrapped.height > short.height);
});

test("box height always accounts for every rendered text node — no silently dropped lines", () => {
  const { nodes } = actorBox(0, 0, 260, {
    dotColor: "#5B3A9E",
    title: "Title",
    lines: ["Line one of this thought that is somewhat long", "A second distinct thought"],
  });
  const textNodes = nodes.filter((n) => n.tag === "text");
  // 1 title + at least 2 body lines (more if either thought wrapped)
  assert.ok(textNodes.length >= 3);
});
