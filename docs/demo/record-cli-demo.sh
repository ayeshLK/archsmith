#!/bin/bash
# Drives the recorded terminal session for the README CLI demo GIF.
# Run only via: asciinema rec -c "bash docs/demo/record-cli-demo.sh" <out>.cast
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

cd /tmp/archsmith-demo || exit 1

# Mirrors the Quick Start section in README.md exactly, so the GIF, the
# rendered diagram shown next to it, and the copy-pasteable commands all
# point at the same fixture instead of three different examples.
type_cmd "archsmith validate ticket-booking/diagram.archsmith.json"
archsmith validate ticket-booking/diagram.archsmith.json
sleep 1.4

type_cmd "archsmith render ticket-booking/diagram.archsmith.json -o ticket-booking/diagram.svg"
archsmith render ticket-booking/diagram.archsmith.json -o ticket-booking/diagram.svg
sleep 2.2
