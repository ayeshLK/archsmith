/** No published types for this package — it's a tiny, single-purpose sync
 * WOFF<->SFNT converter (see subsetFont.ts for why sync matters here). */
declare module "woff2sfnt-sfnt2woff" {
  export function toSfnt(buffer: Buffer): Buffer;
  export function toWoff(buffer: Buffer): Buffer;
}
