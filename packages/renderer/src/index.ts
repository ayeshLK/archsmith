export { validate, validateStructure, validateRegistryReferences } from "./validate.js";
export type { ValidationResult } from "./validate.js";
export { measureText } from "./text/measure.js";
export { wrapText } from "./text/wrap.js";

// render() is added in Phase 3 once the layout/box-drawing modules exist —
// intentionally not stubbed here to avoid a fake placeholder implementation.
