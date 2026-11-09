#!/bin/bash
# 套用繁體中文 fork 的自訂修改
# 這些修改會在每次同步上游後自動套用

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "套用自訂修改..."

# 修改 marketplace.json
MARKETPLACE_FILE=".claude-plugin/marketplace.json"

if [ -f "$MARKETPLACE_FILE" ]; then
    npx -y bun -e "
const fs = require('fs');
const file = '$MARKETPLACE_FILE';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// 修改 name 避免與原版衝突
data.name = 'ljg-skills-tw';

// 更新 displayName
data.displayName = 'LJG Skills Collection (繁體中文版)';

// 更新 description
data.description = 'Personal Claude Code skills collection (繁體中文版)';

// 更新 repository
data.repository = 'https://github.com/yelban/ljg-skills.TW';

// 添加 maintainer
data.maintainer = {
  name: 'yelban',
  note: 'Traditional Chinese (Taiwan) fork'
};

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
console.log('  已更新: $MARKETPLACE_FILE');
"
fi

# 修改 plugin.json
PLUGIN_FILE=".claude-plugin/plugin.json"

if [ -f "$PLUGIN_FILE" ]; then
    npx -y bun -e "
const fs = require('fs');
const file = '$PLUGIN_FILE';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

data.name = 'ljg-skills-tw';
data.description = \"LJG's personal Claude Code skills collection (繁體中文版)\";
data.repository = 'https://github.com/yelban/ljg-skills.TW';

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
console.log('  已更新: $PLUGIN_FILE');
"
fi

# 修改 README.md
README_FILE="README.md"
if [ -f "$README_FILE" ]; then
    # 替換 repo 路徑
    sed -i '' 's|lijigang/ljg-skills|yelban/ljg-skills.TW|g' "$README_FILE"

    # 替換標題
    sed -i '' 's|^# ljg-skills$|# ljg-skills-tw|g' "$README_FILE"

    # 替換目錄路徑
    sed -i '' 's|\.ljg-skills/|.ljg-skills-tw/|g' "$README_FILE"

    # 替換安裝路徑（plugins/ljg-skills → plugins/ljg-skills-tw）
    sed -i '' 's|plugins/ljg-skills|plugins/ljg-skills-tw|g' "$README_FILE"

    echo "  已更新: $README_FILE (repo 名稱替換)"

    # 在標題後加入繁體中文版說明
    if ! grep -q "繁體中文（台灣）在地化同步版本" "$README_FILE"; then
        awk 'NR==1 {
            print
            print ""
            print "> **這是繁體中文（台灣）在地化同步版本**"
            print ">"
            print "> 上游：[lijigang/ljg-skills](https://github.com/lijigang/ljg-skills) | 維護者：[@yelban](https://github.com/yelban)"
            print ">"
            print "> 所有內容已使用 OpenCC s2twp 轉換為繁體中文（台灣正體）。"
            print ""
            next
        }
        {print}' "$README_FILE" > "$README_FILE.tmp" && mv "$README_FILE.tmp" "$README_FILE"
        echo "  已更新: $README_FILE (加入繁體中文版說明)"
    fi
fi

# 修改 CLAUDE.md — 加入 fork 說明 + Fork Maintenance 區段
CLAUDE_FILE="CLAUDE.md"
if [ -f "$CLAUDE_FILE" ]; then
    if ! grep -q "Traditional Chinese (Taiwan) fork" "$CLAUDE_FILE"; then
        # 在第一行標題後插入 fork 說明
        awk 'NR==1 {
            print
            print ""
            print "> **This is a Traditional Chinese (Taiwan) fork** of [ljg-skills](https://github.com/lijigang/ljg-skills)."
            print ""
            next
        }
        {print}' "$CLAUDE_FILE" > "$CLAUDE_FILE.tmp" && mv "$CLAUDE_FILE.tmp" "$CLAUDE_FILE"
        echo "  已更新: $CLAUDE_FILE (加入 fork 說明)"
    fi

    if ! grep -q "Fork Maintenance" "$CLAUDE_FILE"; then
        cat >> "$CLAUDE_FILE" << 'FORK_SECTION'

## Fork Maintenance (ljg-skills.TW)

Sync strategy: **Reset + Re-apply** (not merge/rebase). Full guide: [docs/traditional-chinese-fork.md](docs/traditional-chinese-fork.md)

Quick steps:
1. `./scripts/sync-upstream.sh` (interactive: fetch, reset, convert, customize, commit)
2. `git push --force-with-lease`

Uses custom opencc config (`scripts/s2twp-custom.json`) with false-positive fix dictionary (`scripts/opencc-custom-phrases.txt`).
FORK_SECTION
        echo "  已更新: $CLAUDE_FILE (加入 Fork Maintenance 區段)"
    fi
fi

echo "自訂修改套用完成"
