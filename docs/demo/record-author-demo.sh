#!/bin/bash
# Drives the recorded terminal session for the README `archsmith author`
# demo GIF. Run only via: asciinema rec -c "bash docs/demo/record-author-demo.sh" <out>.cast
# See docs/demo/README.md for the full regenerate steps.

PROMPT=$'\033[1;32m$\033[0m '

type_cmd() {
  printf "%s" "$PROMPT"
  local cmd="$1"
  local i
  for ((i = 0; i < ${#cmd}; i++)); do
    printf "%s" "${cmd:$i:1}"
    sleep 0.03
  done
  printf "\n"
  sleep 0.4
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# A dedicated, diagram-named folder (rather than a generic "author" scratch
# dir) so the wizard's own "Saved." confirmation -- which always prints the
# full save path -- reads like a real project directory on screen.
mkdir -p /tmp/archsmith-demo/ticket-booking-platform
cd /tmp/archsmith-demo/ticket-booking-platform || exit 1

# The fake "typed" invocation line, same visual opening as the CLI demo,
# before the real interactive session (driven by drive-author-demo.exp)
# takes over the screen.
type_cmd "archsmith author"

expect "$SCRIPT_DIR/drive-author-demo.exp"
sleep 1.5
