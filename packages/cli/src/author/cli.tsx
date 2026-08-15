import React from "react";
import { render as renderInk } from "ink";
import { App } from "./App.js";
import type { DraftIR } from "./draftIr.js";

/**
 * Entry point for `archsmith author`, lazily imported from index.ts's
 * action handler so Ink/React only load into the process when this
 * specific subcommand runs — `archsmith render`/`validate` never pay for
 * them. A non-interactive invocation (piped stdin, CI) fails clearly
 * rather than hanging or half-completing; a scriptable mode is a
 * deliberately separate, later question (see issue #67).
 */
export async function runAuthorCommand(): Promise<void> {
  if (!process.stdin.isTTY) {
    console.error("archsmith author needs an interactive terminal — it isn't a scriptable command yet.");
    process.exitCode = 1;
    return;
  }

  // Either outcome has already printed everything the user needs before
  // exiting — "nothing was saved" on Ctrl+C, or FinalStepScreen's own
  // "Saved." summary with both file paths on a real completion. Nothing
  // left for this entrypoint to add.
  await new Promise<DraftIR | null>((resolve) => {
    const { unmount } = renderInk(
      <App
        onExit={(draft) => {
          resolve(draft);
          unmount();
        }}
      />
    );
  });

  process.exitCode = 0;
}
