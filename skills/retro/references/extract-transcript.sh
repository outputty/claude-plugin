# Template: copy it into the shell, replace <transcript path> and <n> first; run as written it fails on the angle brackets.
jq -r 'select(.type=="user" or .type=="assistant")
  | .message.content as $c
  | if ($c|type)=="string" then "\n\n== \(.type) ==\n\($c)"
    else ([$c[]? | select(.type=="text") | .text] | join("\n")) as $t
    | if ($t|length)>0 then "\n\n== \(.type) ==\n\($t)" else empty end end' \
  "<transcript path>" > tmp/retro-<n>.txt