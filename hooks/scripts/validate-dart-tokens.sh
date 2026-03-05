#!/bin/bash
# PreToolUse hook: Warn when generated Dart files contain hard-coded style values
set -euo pipefail

input=$(cat)

# Extract file path from tool input
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)

# Only validate .dart files in generated directories
if [ -z "$file_path" ]; then
  exit 0
fi

case "$file_path" in
  */generated/widgets/*.dart|*/generated/screens/*.dart) ;;
  *) exit 0 ;;
esac

# Extract content
content=$(echo "$input" | jq -r '.tool_input.content // .tool_input.new_string // empty' 2>/dev/null || true)

if [ -z "$content" ]; then
  exit 0
fi

violations=""

# Hard-coded color values
if echo "$content" | grep -qE 'Color\(0x[0-9A-Fa-f]+\)'; then
  violations="${violations}
- Hard-coded Color(0x...) found. Use token class reference instead."
fi

if echo "$content" | grep -qE 'Colors\.[a-zA-Z]+' | grep -vq 'Colors.transparent'; then
  violations="${violations}
- Material Colors.xxx constant found. Use token class reference instead."
fi

# Hard-coded font sizes
if echo "$content" | grep -qE 'fontSize:\s*[0-9]+\.?[0-9]*'; then
  violations="${violations}
- Hard-coded fontSize found. Use typography token instead."
fi

# Hard-coded EdgeInsets
if echo "$content" | grep -qE 'EdgeInsets\.(all|symmetric|only|fromLTRB)\([0-9]+'; then
  violations="${violations}
- Hard-coded EdgeInsets values found. Use spacing token instead."
fi

if [ -n "$violations" ]; then
  echo "Design token violations in ${file_path}:${violations}" >&2
fi

exit 0
