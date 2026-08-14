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

// Same three-tier scenario as clusterBox.test.ts/itemBox.test.ts (#68:
// actorBox previously never wrapped its title at all — a long one just
// overflowed the box invisibly, with no cap and no acronym fallback).
test("a title that wraps to only 2 lines renders in full, no ACRONYM NEEDED flag", () => {
  const { nodes } = actorBox(0, 0, 260, {
    dotColor: "#5B3A9E",
    title: "Enterprise Directory and Provisioning Integration Service",
    lines: [],
  });
  assert.equal(nodes.filter((n) => n.text === "ACRONYM NEEDED").length, 0);
  const titleLines = nodes.filter((n) => n.tag === "text" && n.attrs["font-size"] === 13.5);
  assert.equal(titleLines.length, 2);
});

test("a title that still doesn't fit after wrapping to 2 lines is flagged ACRONYM NEEDED, capped at 2 lines", () => {
  const { nodes } = actorBox(0, 0, 260, {
    dotColor: "#5B3A9E",
    title: "Extremely Long Hypothetical Organization Wide Directory And Employee Provisioning Synchronization Service",
    lines: [],
  });
  assert.equal(nodes.filter((n) => n.text === "ACRONYM NEEDED").length, 1);
  const titleLines = nodes.filter((n) => n.tag === "text" && n.attrs["font-size"] === 13.5);
  assert.equal(titleLines.length, 2);
});

test("a supplied acronym is used instead of wrapping, and suppresses the ACRONYM NEEDED flag", () => {
  const longTitle = "Extremely Long Hypothetical Organization Wide Directory And Employee Provisioning Synchronization Service";
  const { nodes, height } = actorBox(0, 0, 260, { dotColor: "#5B3A9E", title: longTitle, acronym: "EWDPS", lines: [] });
  assert.equal(nodes.filter((n) => n.text === "ACRONYM NEEDED").length, 0);
  const titleLines = nodes.filter((n) => n.tag === "text" && n.attrs["font-size"] === 13.5);
  assert.equal(titleLines.length, 1);
  assert.equal(titleLines[0]!.text, "EWDPS");

  // A single-line (acronym-substituted) title should cost the same height
  // as any other single-line title — the original tier-1 baseline (89 for
  // this fixture's two-short-lines case has no description lines here, so
  // compare against a short single-line title directly instead).
  const shortTitle = actorBox(0, 0, 260, { dotColor: "#5B3A9E", title: "Short", lines: [] });
  assert.equal(height, shortTitle.height);
});
