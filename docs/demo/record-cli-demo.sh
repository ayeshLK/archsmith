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

type_cmd "archsmith validate web-app.archsmith.json"
archsmith validate web-app.archsmith.json
sleep 1.4

type_cmd "archsmith render web-app.archsmith.json -o web-app.svg"
archsmith render web-app.archsmith.json -o web-app.svg
sleep 2.2
