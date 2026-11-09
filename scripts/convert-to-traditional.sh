#!/bin/bash
# 將專案中所有簡體中文轉換為繁體中文（台灣正體 + 詞彙轉換）
# 使用自訂 opencc config（s2twp + false positive 修正詞典）
#
# === 核心約束 ===
# - 只修改字串內容，不改變字串的位置或結構
# - 保持字串模板佔位符完整（{name}, %s, ${var}, {{var}}）
# - 保持轉義字元不變（\n, \t, \\）
# - 引號類型保持一致（單引號/雙引號/反引號）
# - 縮排與格式保持不變
#
# === 處理順序 ===
# 1. 先處理 .md 文檔（風險最低）
# 2. 再處理 .org 文檔
# 3. 最後處理 skills/ 下的程式與資料檔（.ts .js .json .html .yaml .sh）
#    驗證器會比對 SKILL.md 與模板裡的中文標題，兩邊必須一起轉，否則繁體筆記會被判不合格。
#
# === False Positive 處理 ===
# 透過自訂詞典 (scripts/opencc-custom-phrases.txt) 在 conversion chain
# 最後一步修正，無需 sed 後處理。
# 詞典格式：「錯誤轉換<TAB>正確結果」每行一條。

set -e

if ! command -v opencc &> /dev/null; then
    echo "錯誤: 請先安裝 opencc"
    echo "  brew install opencc"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# 準備自訂 opencc config（將詞典路徑注入模板）
OPENCC_CONFIG=$(mktemp)
sed "s|CUSTOM_PHRASES_PATH|$SCRIPT_DIR/opencc-custom-phrases.txt|" \
    "$SCRIPT_DIR/s2twp-custom.json" > "$OPENCC_CONFIG"

echo "開始轉換簡體中文為繁體中文..."
echo "專案路徑: $PROJECT_ROOT"
echo "使用自訂 opencc config（含 false positive 修正）"
echo ""

convert_files() {
    local ext=$1
    local root=${2:-.}
    local count=0

    while IFS= read -r -d '' file; do
        tmp=$(mktemp)
        if opencc -i "$file" -o "$tmp" -c "$OPENCC_CONFIG" 2>/dev/null; then
            if ! cmp -s "$file" "$tmp"; then
                # 用 cat 寫回而非 mv，保留原檔權限（mktemp 是 600，.sh 會丟掉執行權限）
                cat "$tmp" > "$file"
                rm -f "$tmp"
                echo "  轉換: $file"
                ((count++))
            else
                rm -f "$tmp"
            fi
        else
            rm -f "$tmp"
            echo "  失敗: $file"
        fi
    done < <(find "$root" -name "*.$ext" -not -path "./.git/*" -not -path "./node_modules/*" -not -path "*/node_modules/*" -print0)

    echo "  $ext 檔案轉換完成: $count 個檔案有變更"
}

echo "轉換 Markdown 檔案..."
convert_files "md"
echo ""

echo "轉換 Org-mode 檔案..."
convert_files "org"
echo ""

echo "轉換 skills/ 下的程式與資料檔..."
for ext in ts js json html yaml sh; do
    convert_files "$ext" "./skills"
done
echo ""

rm -f "$OPENCC_CONFIG"

echo "轉換完成！"
echo ""
echo "請檢查變更："
echo "  git diff --stat"
