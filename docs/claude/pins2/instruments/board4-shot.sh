#!/bin/zsh
# shot.sh <name> <js-file> : reload the board, load the forced-hover helper, run the async fn in <js-file> (it returns {rect:[x,y,w,h], m:...}), shoot and crop
S="${SHOT_DIR:-$PWD}"
# the stale-crop fix: when the rect regex finds nothing no crop is written, so an old crop of the same name used to survive and be looked at
rm -f "$S/$1.png" "$S/$1-full.png"
FH="/Applications/Claude Code/Diors-Builds/docs/claude/pins2/instruments/board4-forced-hover.js"
chrome-devtools emulate 1 --viewport "1440x960" >/dev/null 2>&1
chrome-devtools navigate_page 1 --type reload --ignoreCache true >/dev/null 2>&1
sleep 2
chrome-devtools evaluate_script "$(tail -n +2 "$FH")" --pageId 1 >/dev/null 2>&1
OUT=$(chrome-devtools evaluate_script "$(cat "$2")" --pageId 1 --output-format=json 2>/dev/null)
echo "$OUT" | python3 -c "import sys,json; d=json.load(sys.stdin); r=d if isinstance(d,dict) else d; print(json.dumps(r)[:1800])" 2>/dev/null || echo "$OUT" | head -c 1800
chrome-devtools take_screenshot 1 --filePath "$S/$1-full.png" >/dev/null 2>&1
R=$(echo "$OUT" | python3 -c "import sys,json,re; t=sys.stdin.read(); m=re.search(r'\"rect\\\\?\"\\s*:\\s*\[([0-9.,\\s-]+)\]',t); print(m.group(1) if m else '')")
[[ -n "$R" ]] && python3 - "$S/$1-full.png" "$S/$1.png" "$R" <<'PY'
import sys,subprocess
x,y,w,h=[max(0,round(float(v))) for v in sys.argv[3].split(',')]
subprocess.run(['magick',sys.argv[1],'-crop',f'{w}x{h}+{x}+{y}','+repage',sys.argv[2]],check=True)
PY
