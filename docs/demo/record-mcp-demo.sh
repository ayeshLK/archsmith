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
    sleep 0.018
  done
  printf "\n"
  sleep 0.5
}

print_line() {
  printf "%s\n" "$1"
  sleep "${2:-0.35}"
}

print_step() {
  printf "\n%b\n" "⏺ $1"
  sleep 0.5
  printf "%b\n" "  ${DIM}⎿  $2${RESET}"
  sleep 1.0
}

type_cmd 'claude "Diagram a food ordering platform: mobile app, backend, order confirmations."'
sleep 0.8

print_line ""
print_line "Before I draft this, a few things the schema needs that your"
print_line "description doesn't cover:"
print_line "  • What does the order backend persist to (e.g. Postgres)?"
print_line "  • How do confirmations go out, and via which provider?"
print_line "  • Generic \"API Gateway\" label, or a specific product?" 1.2

sleep 0.4
type_cmd 'claude -c "Postgres for orders, confirmations via SendGrid email, generic API Gateway."'
sleep 0.6

print_step 'mcp__archsmith__validate(ir)' '{"valid": true, "errors": []}'
print_step 'mcp__archsmith__render(embedFonts: false)' '<svg xmlns="http://www.w3.org/2000/svg" width="1916" height="715" ...>'

sleep 0.3
print_line ""
print_line "Validated and rendered: Mobile App → API Gateway → Order Service"
print_line "(Postgres Orders DB) → Egress Gateway → SendGrid." 2.2
