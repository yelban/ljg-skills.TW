# Push Workflow

一鍵同步 ljg-* skills 到 github repo（master + md 雙分支）。

## Voice Notification

```bash
curl -s -X POST http://localhost:31337/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running Push in ljg-push"}' \
  > /dev/null 2>&1 &
```

輸出文本：`Running **Push** in **ljg-push**...`

## Step 0: Pre-push README check（硬 gate）

每次 push 都要先問自己一句：

> README 還跟實際的 skill 集合對得上嗎？

具體三件事：

1. *新增 skill 了嗎*？ → README 的 skill 清單 / 安裝命令需要加一行
2. *刪了 skill 嗎*？ → README 對應行要刪
3. *某個 skill 的描述大改了嗎*？ → README 的簡介可能要同步

指令碼會自動 grep README 裡所有 `ljg-xxx` 名字，跟 `~/.agents/skills/ljg-*` 對比。如果有 skill 在 local 但不在 README，*push 直接中止*。

繞過辦法（僅當你確認 README 已經審過、不需要更新）：

```bash
bash Push.sh --skip-readme-check
```

## Step 1: 解析引數

| 使用者說 | 標誌 | 效果 |
|--------|------|------|
| 預設 | （無標誌）| README check + 檢測變更 + 雙分支推送 |
| "dry-run", "看一下" | `--dry-run` | 只列出會做什麼，不真推（README check 跳過）|
| "force", "強推" | `--force` | 跳過 detect，強制 rsync 所有 ljg-* |
| "README 已審" | `--skip-readme-check` | 跳過 README 一致性 gate（其他 check 仍跑）|

## Step 2: 執行指令碼

```bash
bash ~/.agents/skills/ljg-push/Tools/Push.sh [--dry-run|--force]
```

指令碼邏輯：

1. *Setup*：檢查 `$HOME/code/ljg-skills` 是否存在，不存在則 clone
2. *Detect*：以與同步完全相同的檔案邊界對比 `~/.agents/skills/ljg-*` vs `repo/skills/ljg-*`——按校驗和識別新增、刪除、內容和可執行位變化；純時間戳、目錄元資料和空目錄不會單獨觸發釋出，`.git/`、`node_modules/`、`.DS_Store` 被忽略，但普通備份檔案不會被忽略
3. *Master 推送*：
   - `git checkout master` + `git pull --rebase`
   - 對每個有差異的 skill：按上述共同邊界 rsync（刪除目標端多出的真實檔案、保留許可權，不傳播時間戳/所有者/群組；目錄本身不進入 Git 結果）
   - bump patch version (plugin.json + marketplace.json)
   - `git add` + `git commit` + `git push origin master`
4. *Md 推送*：
   - `git checkout md` + `git pull --rebase`
   - 對每個有差異的 skill：rsync + 應用 markdown 化（`mdize_skill` 函式——含 org 檔案本體轉換：`orgfile_to_md` 轉 YAML 頭/`#` 標題後刪 .org，Markdown 與執行時程式碼中的實際檔案引用全域性改寫；Markdown 內嵌的完整 Org 模板，以及首行就是 Org 頭的無語言圍欄模板，由 `MdizeEmbeddedOrg.ts` 轉成帶 YAML frontmatter 的 Markdown 模板，並保留原檔案換行風格；結構化 `- *標籤*：` 轉成 `- **標籤**：`；eval 輸出契約與 stdin 預設格式同步切到 Markdown；`ljg-is` 的輸出標題、路徑稱謂、元資料名、tags 與驗收合同同步切到 Markdown/YAML + Denote）
   - commit 前執行殘留審計：拒絕未轉換的輸出指令、Org 專用 lint 呼叫、Org 頭標記、單星號加粗/Org 等寬文本等舊語法規則、非 assets `.org` 檔案、eval JSON 的 Org 輸出要求和執行時 Org 預設值
   - bump patch version
   - `git add` + `git commit` + `git push origin md`
5. *收尾*：切回 `master`，讓本地工作 repo 留在源分支
6. *Report*：列出推送結果 + 仍需手工 review 的差異清單

## Step 3: 報告

輸出格式：

```
═══ ljg-push 報告 ═══════════════
更新的 skills:
  - ljg-qa
  - ljg-card

master @ v1.17.13 → pushed
md     @ v1.0.8   → pushed

仍需手工 review（自動轉換不覆蓋的差異）:
  - ljg-xxx/SKILL.md  (正文 `*bold*` 標記——斜體歧義，指令碼不動；結構化 bullet 標籤除外)

══════════════════════════════════
```

## Step 4: 異常處理

| 異常 | 處理 |
|------|------|
| repo 路徑不存在 | 自動 clone，告知使用者 |
| 路徑存在但不是 ljg-skills repo | 報錯，不破壞現有目錄 |
| `git push` 被遠端拒（遠端有新 commit）| 嘗試 `pull --rebase`，再推；衝突時報錯讓使用者處理 |
| `git pull --rebase` 衝突 | 報錯，列出衝突檔案，提示 `rebase --abort` 或手工解決 |
| `~/.agents/skills/ljg-*` 沒有任何變更 | 輸出 "Nothing to push." 退出 |

## 驗收

- 兩個分支都有新 commit（除非檢測到無變更）
- 遠端 origin/master 和 origin/md 都更新
- 本地 `$HOME/code/ljg-skills` 最後停在 `master`
- 報告裡列出版本號和推送的 skills
- 任何 markdown 化未覆蓋的差異都列在 review checklist 裡
