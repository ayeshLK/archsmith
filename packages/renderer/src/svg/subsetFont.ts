import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { toSfnt, toWoff } from "woff2sfnt-sfnt2woff";

/**
 * Subsets the bundled Arimo WOFF files down to only the glyphs a given
 * diagram's actual text needs, instead of embedding the whole font — the
 * embedded font was previously a fixed ~40KB regardless of diagram content
 * (see ArchSmith issue #55), because embedFontsInSvg always spliced in the
 * complete font. Subsetting brings that down to a few KB for a typical
 * diagram, proportional to its actual text.
 *
 * Deliberately synchronous, via harfbuzz's raw hb-subset WASM exports
 * called directly — not the `subset-font` npm package, whose Promise-based
 * API would force render() itself to become async. The only conventionally
 * "async" step in that package is `WebAssembly.instantiate(bytes)`, which
 * is just a Promise-wrapped convenience over the synchronous
 * `new WebAssembly.Module()` + `new WebAssembly.Instance()` pair used below
 * — Node has no restriction against synchronous WASM instantiation from an
 * already-in-memory buffer (that push toward async is a browser
 * streaming/main-thread concern, not a Node one). WOFF<->SFNT conversion is
 * likewise genuinely synchronous for plain WOFF (not WOFF2) via
 * woff2sfnt-sfnt2woff, which is what `subset-font`'s own `fontverter`
 * dependency uses under the hood for the WOFF branch.
 *
 * Pinned to harfbuzzjs@0.10.3 deliberately, not the current major (1.6.0,
 * published days after this was written): 1.x restructured the package
 * (renamed/relocated the wasm file, added a restrictive package.json
 * `exports` map) in ways that would need separately re-verifying that the
 * raw hb_subset_* exports this module calls are still shaped the same way.
 * 0.10.3 is the version `subset-font` itself depends on and this module was
 * built and tested against.
 */

interface HbSubsetExports {
  memory: WebAssembly.Memory;
  malloc(size: number): number;
  free(ptr: number): void;
  hb_blob_create(data: number, length: number, memoryMode: number, userData: number, destroy: number): number;
  hb_blob_destroy(blob: number): void;
  hb_blob_get_data(blob: number, length: number): number;
  hb_blob_get_length(blob: number): number;
  hb_face_create(blob: number, index: number): number;
  hb_face_destroy(face: number): void;
  hb_face_reference_blob(face: number): number;
  hb_subset_input_create_or_fail(): number;
  hb_subset_input_destroy(input: number): void;
  hb_subset_input_unicode_set(input: number): number;
  hb_subset_or_fail(face: number, input: number): number;
  hb_set_add(set: number, codepoint: number): void;
}

const HB_MEMORY_MODE_WRITABLE = 2;

let cachedModule: WebAssembly.Module | undefined;

function loadHbSubsetModule(): WebAssembly.Module {
  if (cachedModule) return cachedModule;
  const wasmPath = fileURLToPath(import.meta.resolve("harfbuzzjs/hb-subset.wasm"));
  cachedModule = new WebAssembly.Module(readFileSync(wasmPath));
  return cachedModule;
}

/** Subsets a single WOFF font buffer down to the glyphs needed for `text`.
 * Throws if harfbuzz reports failure at any stage (e.g. a corrupt font) —
 * callers should treat that as an unexpected error, not a normal outcome. */
export function subsetWoff(woffBytes: Buffer, text: string): Buffer {
  const instance = new WebAssembly.Instance(loadHbSubsetModule());
  const exports = instance.exports as unknown as HbSubsetExports;
  const heap = () => new Uint8Array(exports.memory.buffer);

  const sfntBytes = toSfnt(woffBytes);
  const fontBuffer = exports.malloc(sfntBytes.byteLength);
  heap().set(sfntBytes, fontBuffer);

  const blob = exports.hb_blob_create(fontBuffer, sfntBytes.byteLength, HB_MEMORY_MODE_WRITABLE, 0, 0);
  const face = exports.hb_face_create(blob, 0);
  exports.hb_blob_destroy(blob);

  const input = exports.hb_subset_input_create_or_fail();
  if (input === 0) {
    exports.hb_face_destroy(face);
    exports.free(fontBuffer);
    throw new Error("subsetWoff: hb_subset_input_create_or_fail failed");
  }
  const unicodeSet = exports.hb_subset_input_unicode_set(input);
  for (const ch of text) {
    exports.hb_set_add(unicodeSet, ch.codePointAt(0)!);
  }

  const subsetFace = exports.hb_subset_or_fail(face, input);
  exports.hb_subset_input_destroy(input);
  if (subsetFace === 0) {
    exports.hb_face_destroy(face);
    exports.free(fontBuffer);
    throw new Error("subsetWoff: hb_subset_or_fail failed");
  }

  const resultBlob = exports.hb_face_reference_blob(subsetFace);
  const offset = exports.hb_blob_get_data(resultBlob, 0);
  const length = exports.hb_blob_get_length(resultBlob);

  let subsetWoffBytes: Buffer;
  try {
    if (length === 0) throw new Error("subsetWoff: subsetting produced an empty font");
    const subsetSfnt = Buffer.from(heap().subarray(offset, offset + length));
    subsetWoffBytes = toWoff(subsetSfnt);
  } finally {
    exports.hb_blob_destroy(resultBlob);
    exports.hb_face_destroy(subsetFace);
    exports.hb_face_destroy(face);
    exports.free(fontBuffer);
  }
  return subsetWoffBytes;
}
