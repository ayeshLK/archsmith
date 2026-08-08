#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
temporary_dir="$(mktemp -d)"
trap 'rm -rf "$temporary_dir"' EXIT

inputs=("$repo_root"/examples/*/diagram.archsmith.json)
if [[ ! -e "${inputs[0]}" ]]; then
  echo "No examples/*/diagram.archsmith.json fixtures found" >&2
  exit 1
fi

status=0
for input in "${inputs[@]}"; do
  example_directory="$(dirname "$input")"
  example_slug="$(basename "$example_directory")"
  expected="$example_directory/diagram.svg"
  generated="$temporary_dir/$example_slug.svg"

  if [[ ! -f "$expected" ]]; then
    echo "Missing generated diagram: ${expected#"$repo_root"/}" >&2
    status=1
    continue
  fi

  node "$repo_root/packages/cli/dist/index.js" render "$input" -o "$generated"
  if ! diff -u "$expected" "$generated"; then
    echo "Stale generated diagram: ${expected#"$repo_root"/}" >&2
    status=1
  fi
done

exit "$status"
