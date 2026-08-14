import { test } from "node:test";
import assert from "node:assert/strict";
import { initialNavigation, advance, jumpTo } from "./navigation.js";

test("starts at intro, nothing completed", () => {
  const nav = initialNavigation();
  assert.equal(nav.current, "intro");
  assert.equal(nav.completed.size, 0);
});

test("advance moves to the next section in the default order and marks the previous one done", () => {
  let nav = initialNavigation();
  nav = advance(nav);
  assert.equal(nav.current, "inboundActors");
  assert.ok(nav.completed.has("intro"));
});

test("advance from the last section stays put rather than running off the end", () => {
  let nav = initialNavigation();
  for (let i = 0; i < 20; i++) nav = advance(nav);
  assert.equal(nav.current, "review");
});

test("jumpTo moves to any section directly without marking anything complete", () => {
  let nav = initialNavigation();
  nav = advance(nav); // now at inboundActors, intro completed
  nav = jumpTo(nav, "corePlatform");
  assert.equal(nav.current, "corePlatform");
  assert.equal(nav.completed.size, 1); // still just "intro" -- jumping isn't completing
});
