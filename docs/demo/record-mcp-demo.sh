#!/bin/bash
# Drives the recorded terminal session for the README MCP demo GIF.
# Run only via: asciinema rec -c "bash docs/demo/record-mcp-demo.sh" <out>.cast
# See docs/demo/README.md for the full regenerate steps and why this
# replays a captured transcript instead of a live agent run.

GREEN=$'\033[1;32m'
DIM=$'\033[2m'
RESET=$'\033[0m'
PROMPT="${GREEN}\$${RESET} "

type_cmd() {
  printf "%b" "$PROMPT"
  local cmd="$1"
  local i
  for ((i = 0; i < ${#cmd}; i++)); do
    printf "%s" "${cmd:$i:1}"
    sleep 0.02
  done
  printf "\n"
  sleep 0.5
}

print_step() {
  printf "\n%b\n" "⏺ $1"
  sleep 0.5
  printf "%b\n" "  ${DIM}⎿  $2${RESET}"
  sleep 1.0
}

type_cmd 'claude "Render the ticket-booking diagram via the archsmith MCP server."'
sleep 0.6

print_step 'mcp__archsmith__validate(diagram.archsmith.json)' '{"valid": true, "errors": []}'
print_step 'mcp__archsmith__render(embedFonts: false)' '<svg xmlns="http://www.w3.org/2000/svg" width="1986" height="904" ...>'

sleep 0.3
printf "\n"
printf "%s\n" "Both calls succeeded: validate returned valid: true with no errors,"
sleep 0.15
printf "%s\n" "and render produced a complete 1986×904 SVG document."
sleep 2.2
