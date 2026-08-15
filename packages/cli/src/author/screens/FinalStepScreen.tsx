import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import SelectInput from "ink-select-input";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { render, validate } from "@archsmith/renderer";
import type { DraftIR } from "../draftIr.js";
import { assemble } from "../assemble.js";
import { governedCoreSubLayers } from "../derived.js";
import { subLayerStatus } from "../gapResolution.js";
import { renderAuthoringNotesMarkdown } from "../authoringNotes.js";

type Phase = "nameInput" | "overwriteConfirm" | "done";

export interface FinalStepScreenProps {
  draft: DraftIR;
  onExit: (draft: DraftIR) => void;
  /** Directory files are saved into — defaults to the real process cwd,
   * overridable so tests can point saves at a throwaway temp directory
   * instead of mocking node:fs. */
  cwd?: string;
}

function slugify(text: string): string {
  const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "diagram";
}

interface SavedPaths {
  irPath: string;
  svgPath: string;
  notesPath: string;
}

function DoneScreen({ savedPaths, draft, onExit }: { savedPaths: SavedPaths; draft: DraftIR; onExit: (draft: DraftIR) => void }): React.JSX.Element {
  useEffect(() => {
    onExit(draft);
  }, [draft, onExit]);

  const pending = governedCoreSubLayers().filter((entry) => subLayerStatus(entry.id, draft) === "pending");

  return (
    <Box flexDirection="column">
      <Text color="green" bold>
        Saved.
      </Text>
      <Text>  IR:  {savedPaths.irPath}</Text>
      <Text>  SVG: {savedPaths.svgPath}</Text>
      <Text>  Notes: {savedPaths.notesPath}</Text>
      {pending.length > 0 && (
        <Text color="yellow">  ⚠ still pending, left out of this diagram: {pending.map((entry) => entry.label).join(", ")}</Text>
      )}
      <Text dimColor>Open the SVG to inspect the render. Editing an existing diagram isn't supported yet — hand-edit the saved JSON and re-run `archsmith render` if it needs a fix.</Text>
    </Box>
  );
}

/**
 * Validate, render, save — the last step, in-process against
 * @archsmith/renderer, no round trip through a separate command. An
 * assemble()/validate() failure here can currently only come from a
 * repeatable-list section left empty (Inbound Actors, a Core Platform
 * sub-layer, Systems of Record, External Systems) or a scalar left blank
 * — none of which this screen can fix directly (no jump-to-correct for
 * repeatable lists yet, see ReviewScreen), so it's shown plainly and left
 * to the same global Ctrl+C escape hatch every other screen already has,
 * rather than inventing a new recovery path for what's already an
 * explicit v1 boundary.
 *
 * Also writes the sidecar diagram.authoring-notes.md (draft.authoringNotes
 * — see authoringNotes.ts and issue #89), always, even with zero notes
 * recorded — a session with nothing to say still gets a real, honest file
 * rather than a silently-missing one.
 */
export function FinalStepScreen({ draft, onExit, cwd = process.cwd() }: FinalStepScreenProps): React.JSX.Element {
  const [phase, setPhase] = useState<Phase>("nameInput");
  const [basename, setBasename] = useState(() => slugify(draft.title ?? ""));
  const [conflict, setConflict] = useState<SavedPaths | null>(null);
  const [savedPaths, setSavedPaths] = useState<SavedPaths | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);

  let assembleError: string | null = null;
  let assembled: ReturnType<typeof assemble> | null = null;
  try {
    assembled = assemble(draft);
  } catch (err) {
    assembleError = (err as Error).message;
  }
  const validation = assembled ? validate(assembled) : null;

  if (assembleError || (validation && !validation.valid)) {
    return (
      <Box flexDirection="column">
        <Text color="red" bold>
          Can't finish yet
        </Text>
        {assembleError && <Text>{assembleError}</Text>}
        {validation?.errors.map((e, i) => (
          <Text key={i}>  - {e}</Text>
        ))}
        <Text dimColor>Nothing has been saved. Ctrl+C to exit, then re-run `archsmith author` to start again.</Text>
      </Box>
    );
  }

  function writeFiles(irPath: string, svgPath: string, notesPath: string): void {
    try {
      const svg = render(assembled!, { skipValidate: true });
      writeFileSync(irPath, JSON.stringify(assembled, null, 2), "utf-8");
      writeFileSync(svgPath, svg, "utf-8");
      writeFileSync(notesPath, renderAuthoringNotesMarkdown(draft.title || "Untitled Diagram", draft.authoringNotes ?? {}), "utf-8");
      setSavedPaths({ irPath, svgPath, notesPath });
      setPhase("done");
    } catch (err) {
      setWriteError((err as Error).message);
    }
  }

  if (writeError) {
    return (
      <Box flexDirection="column">
        <Text color="red" bold>
          Couldn't save
        </Text>
        <Text>{writeError}</Text>
        <Text dimColor>Nothing has been saved. Ctrl+C to exit, then re-run `archsmith author` to start again.</Text>
      </Box>
    );
  }

  if (phase === "done" && savedPaths) {
    return <DoneScreen savedPaths={savedPaths} draft={draft} onExit={onExit} />;
  }

  if (phase === "overwriteConfirm" && conflict) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">A file already exists at {conflict.irPath}, {conflict.svgPath}, or {conflict.notesPath}.</Text>
        <Box marginTop={1}>
          <SelectInput
            items={[
              { label: "Overwrite", value: "overwrite" },
              { label: "Choose a different name", value: "rename" },
            ]}
            onSelect={(item) => {
              if (item.value === "overwrite") {
                writeFiles(conflict.irPath, conflict.svgPath, conflict.notesPath);
              } else {
                setConflict(null);
                setPhase("nameInput");
              }
            }}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>
        Save
      </Text>
      <Text dimColor>Base file name (Enter to accept) — saves as &lt;name&gt;.archsmith.json, &lt;name&gt;.svg, and &lt;name&gt;.authoring-notes.md</Text>
      <Box marginTop={1}>
        <Text color="green">{"? "}</Text>
        <TextInput
          value={basename}
          onChange={setBasename}
          onSubmit={(submitted) => {
            const name = slugify(submitted);
            setBasename(name);
            const irPath = path.join(cwd, `${name}.archsmith.json`);
            const svgPath = path.join(cwd, `${name}.svg`);
            const notesPath = path.join(cwd, `${name}.authoring-notes.md`);
            if (existsSync(irPath) || existsSync(svgPath) || existsSync(notesPath)) {
              setConflict({ irPath, svgPath, notesPath });
              setPhase("overwriteConfirm");
            } else {
              writeFiles(irPath, svgPath, notesPath);
            }
          }}
        />
      </Box>
    </Box>
  );
}
