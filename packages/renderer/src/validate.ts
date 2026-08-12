import { Ajv2020 } from "ajv/dist/2020.js";
import type { ErrorObject, ValidateFunction } from "ajv";
import { getDiagramSchema, getRegistry } from "@archsmith/schema";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

let compiledValidator: ValidateFunction | undefined;

function getValidator(): ValidateFunction {
  if (!compiledValidator) {
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    compiledValidator = ajv.compile(getDiagramSchema() as object);
  }
  return compiledValidator;
}

/**
 * Structural validation against diagram-schema.json (JSON Schema draft 2020-12).
 * Reports every violation via allErrors, not just the first — the schema's pervasive
 * additionalProperties:false makes single-error output confusing otherwise.
 */
export function validateStructure(ir: unknown): ValidationResult {
  const validator = getValidator();
  const valid = validator(ir);
  const errors = (validator.errors ?? []).map(
    (e) => `${e.instancePath || "(root)"} ${e.message ?? ""}`.trim()
  );
  return { valid, errors };
}

/**
 * Semantic checks the JSON Schema itself can't express: do referenced registry ids
 * (colorToken, registryId, icon) actually exist in the governed registries? These are
 * NOT structural — a syntactically valid IR can still reference a color/sub-layer that
 * was never approved. See registries/*.json's governance note: adding an entry is a
 * change-request event, not something validate() should silently accept a typo for.
 */
export function validateRegistryReferences(ir: unknown): ValidationResult {
  const errors: string[] = [];
  const colors = getRegistry("colors") as {
    families: Record<string, { layerTokens: Record<string, unknown> }>;
  };
  const subLayers = getRegistry("sub-layers") as {
    entries: Array<{ id: string }>;
  };
  const knownSubLayerIds = new Set(subLayers.entries.map((e) => e.id));

  const doc = ir as {
    colorTheme?: { family?: string };
    columns?: {
      corePlatform?: {
        subLayers?: Array<{ registryId?: string }>;
        systemsOfRecord?: { registryId?: string };
      };
    };
  };

  const family = doc.colorTheme?.family ?? "standard";
  const familyTokens = colors.families[family];
  if (!familyTokens) {
    errors.push(`colorTheme.family "${family}" is not a known color family in registries/colors.json`);
  }

  for (const [i, subLayer] of (doc.columns?.corePlatform?.subLayers ?? []).entries()) {
    if (subLayer.registryId && !knownSubLayerIds.has(subLayer.registryId)) {
      errors.push(
        `columns.corePlatform.subLayers[${i}].registryId "${subLayer.registryId}" is not in registries/sub-layers.json — adding a new sub-layer type is a change-request event, not a per-diagram choice`
      );
    }
  }

  // Unlike subLayers[].registryId, which may legitimately be any of several
  // governed entries, systemsOfRecord.registryId (see issue #57) has exactly
  // one correct value: the corePlatform.systemsOfRecord field always renders
  // via the sub-layers registry's single "systems-of-record" entry (see
  // corePlatform.ts), so anything else is a mismatch, not just an unknown id.
  const sorRegistryId = doc.columns?.corePlatform?.systemsOfRecord?.registryId;
  if (sorRegistryId && sorRegistryId !== "systems-of-record") {
    errors.push(
      `columns.corePlatform.systemsOfRecord.registryId "${sorRegistryId}" must be "systems-of-record" — that section always renders via registries/sub-layers.json's single "systems-of-record" entry, unlike subLayers[].registryId which may reference any governed sub-layer`
    );
  }

  return { valid: errors.length === 0, errors };
}

/** Runs both structural and semantic validation. Structural failures short-circuit
 * semantic checks, since a document that doesn't even match the shape can't be
 * meaningfully checked for registry references. */
export function validate(ir: unknown): ValidationResult {
  const structural = validateStructure(ir);
  if (!structural.valid) return structural;
  const semantic = validateRegistryReferences(ir);
  return { valid: semantic.valid, errors: [...structural.errors, ...semantic.errors] };
}
