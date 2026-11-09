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
    # 替換 repo 路徑；略過下方插入的「上游：」說明行，否則重跑時上游連結會被換成 fork 網址
    sed -i '' '/^> 上游：/!s|lijigang/ljg-skills|yelban/ljg-skills.TW|g' "$README_FILE"

    # 替換標題
    sed -i '' 's|^# ljg-skills$|# ljg-skills-tw|g' "$README_FILE"

    # 替換目錄路徑
    sed -i '' 's|\.ljg-skills/|.ljg-skills-tw/|g' "$README_FILE"

    # 替換安裝路徑（plugins/ljg-skills → plugins/ljg-skills-tw）
    # 先把已替換過的還原再替換，重跑才不會變成 -tw-tw（BSD sed 沒有 lookahead）
    sed -i '' -e 's|plugins/ljg-skills-tw|plugins/ljg-skills|g' \
        -e 's|plugins/ljg-skills|plugins/ljg-skills-tw|g' "$README_FILE"

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

echo "自訂修改套用完成"
