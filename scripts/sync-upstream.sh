#!/bin/bash
# 同步上游 fork 並重新執行繁體中文轉換
# 上游: https://github.com/lijigang/ljg-skills

set -e

UPSTREAM_URL="https://github.com/lijigang/ljg-skills.git"
UPSTREAM_BRANCH="master"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "=== 同步上游 Fork ==="
echo "上游: $UPSTREAM_URL"
echo ""

# 步驟 1: 設定 upstream remote（如果不存在）
if ! git remote get-url upstream &>/dev/null; then
    echo "新增 upstream remote..."
    git remote add upstream "$UPSTREAM_URL"
fi

# 步驟 2: 取得上游變更
echo "取得上游變更..."
git fetch upstream

# 步驟 3: 顯示差異
echo ""
echo "=== 上游變更摘要 ==="
UPSTREAM_COMMITS=$(git rev-list HEAD..upstream/$UPSTREAM_BRANCH --count)
echo "上游領先 $UPSTREAM_COMMITS 個 commit"

if [ "$UPSTREAM_COMMITS" -eq 0 ]; then
    echo "已是最新，無需同步。"
    exit 0
fi

echo ""
echo "上游新增的 commits:"
git log HEAD..upstream/$UPSTREAM_BRANCH --oneline | head -20
echo ""

# 步驟 3.5: 有未提交變更就中止。reset --hard 會丟掉已追蹤檔案的修改；
# 未追蹤檔案雖然不會被刪，但最後的 git add -A 會把它們混進同步 commit。
DIRTY=$(git status --porcelain)
if [ -n "$DIRTY" ]; then
    echo "工作目錄或暫存區有未提交的變更，已中止同步："
    echo "$DIRTY"
    echo ""
    echo "請先 commit 或 stash 這些變更，再重新執行。"
    exit 1
fi

# 步驟 4: 確認是否繼續
read -p "是否同步上游並重新執行繁體轉換? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "已取消。"
    exit 0
fi

# 步驟 5: 備份本地獨有的資料夾（scripts/ 和 docs/）
echo ""
echo "備份本地獨有檔案..."
BACKUP_DIR=$(mktemp -d)
cp -r "$SCRIPT_DIR" "$BACKUP_DIR/"
if [ -d "$PROJECT_ROOT/docs" ]; then
    cp -r "$PROJECT_ROOT/docs" "$BACKUP_DIR/"
    echo "  - scripts/ ✓"
    echo "  - docs/ ✓"
else
    echo "  - scripts/ ✓"
fi

# 步驟 6: 硬重置到上游
echo "重置到上游最新版本..."
git reset --hard upstream/$UPSTREAM_BRANCH

# 步驟 7: 還原本地獨有的資料夾
echo "還原本地獨有檔案..."
mkdir -p "$PROJECT_ROOT/scripts"
cp -r "$BACKUP_DIR/scripts/"* "$PROJECT_ROOT/scripts/"
if [ -d "$BACKUP_DIR/docs" ]; then
    mkdir -p "$PROJECT_ROOT/docs"
    cp -r "$BACKUP_DIR/docs/"* "$PROJECT_ROOT/docs/"
    echo "  - scripts/ ✓"
    echo "  - docs/ ✓"
else
    echo "  - scripts/ ✓"
fi
rm -rf "$BACKUP_DIR"

# 步驟 8: 重新執行繁體轉換
echo ""
echo "=== 重新執行繁體中文轉換 ==="
"$SCRIPT_DIR/convert-to-traditional.sh"

# 步驟 9: 套用自訂修改
echo ""
echo "=== 套用自訂修改 ==="
"$SCRIPT_DIR/apply-customizations.sh"

# 步驟 10: 提交轉換結果
echo ""
if git diff --quiet && git diff --cached --quiet; then
    echo "無需轉換（可能上游已是繁體）"
else
    echo "提交轉換結果..."
    git add -A
    git commit -m "$(cat <<'EOF'
chore: sync upstream and convert to Traditional Chinese (Taiwan)

Sync from upstream and re-apply:
- s2twp conversion (Simplified to Traditional Chinese)
- Fork customizations (maintainer info)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
fi

echo ""
echo "=== 同步完成 ==="
echo ""
echo "本地分支狀態:"
git log --oneline -3
echo ""
echo "如需推送到遠端（強制覆蓋）:"
echo "  git push --force-with-lease"
