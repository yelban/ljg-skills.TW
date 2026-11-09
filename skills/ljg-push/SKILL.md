---
name: ljg-push
description: 把 ~/.agents/skills/ljg-* 裡所有更新過的 skills 同步到 github repo (ljg-skills)，先推 master 分支（org-mode 輸出風格），再切 md 分支（markdown 輸出風格）做基礎 markdown 化後推。Use when user says '/ljg-push', 'push skills', '推送 skills', '同步 skills', 'sync ljg', or whenever ljg-* skills get updated and need shipping. NOT FOR pushing non-ljg skills or arbitrary git repos.
user_invocable: true
---

# ljg-push: 推送 ljg-* skills

把本地 `~/.agents/skills/ljg-*` 裡改過的 skills，一鍵同步到 github repo，覆蓋 master 和 md 兩個分支。

## 倉庫路徑（硬編碼）

```
SKILLS_REPO="$HOME/code/ljg-skills"     # 本地工作 repo
SKILLS_LOCAL="$HOME/.agents/skills"      # 本地 skill 源
REPO_URL="git@github.com:lijigang/ljg-skills.git"
```

如果 `$SKILLS_REPO` 不存在，指令碼會自動 clone。如果它存在但不是 ljg-skills 的 git repo，指令碼會報錯退出（不破壞現有目錄）。

## 兩條分支的差異

| 分支 | 輸出格式 | 檔案擴充套件 | 加粗 | 檔案頭 |
|------|---------|---------|------|--------|
| `master`（預設） | org-mode | `.org` | `*bold*` | `#+title:` 等 |
| `md` | markdown | `.md` | `**bold**` | YAML frontmatter |

`~/.agents/skills/` 裡的 skill 是 *master 風格*（源版本）。md 分支的差異由指令碼自動轉換 + 必要時手工補。

指令碼推完 `md` 後會自動切回 `master`。本地 `$HOME/code/ljg-skills` 應該始終停在源分支，方便下次檢視和安裝。

## 工作流

按 `Workflows/Push.md` 步驟執行 → 呼叫 `Tools/Push.sh`。

## README 一致性（硬 gate）

每次 push 前，指令碼強制做一件事：*把 README 跟 local skills 對一遍*。

- 列出 `~/.agents/skills/ljg-*` 全部 skill 名
- grep `$SKILLS_REPO/README.md` 裡出現的 `ljg-xxx`
- 找出 local 有但 README 沒有的——*幾乎肯定意味著 README 漏更新*
- 命中 → push 中止，報告差異

每次 push 都是檢視 README 的機會。問自己：

1. *新增 skill 了嗎*？README 的 skill 清單 / 安裝命令需要加一行
2. *刪了 skill 嗎*？README 對應行要刪
3. *某個 skill 的描述大改了嗎*？README 的簡介可能要同步

確認 README 已審、確實不需要更新時，繞過 gate：

```bash
/ljg-push --skip-readme-check
```

## 自動轉換的範圍

md 分支同步時自動轉換（2026-06-12 起含 org 檔案本體）：

Org 檔案中的 `#+begin_example` / `#+end_example` 圖塊轉為 `text` 圍欄，保留塊內文字，不將其中的星號或井號誤當標題和註釋。標記相容大小寫。

- *org 檔案本體*：skill 內每個 `.org` 檔案（assets/ 除外）轉成同名 `.md` 並刪除原件——org 頭塊→YAML frontmatter（含 `---` 圍欄，`filetags`→`tags`）、`*` 標題→`#` 標題（層級保留）、`#+ATTR_*` 行刪除、`[[file:x]]`→`![](x)`、`#+begin_src`→``` 圍欄。Markdown 與執行時文本檔案（如 `.ts` / `.js` / `.json` / `.sh`）裡對實際被改名檔案的引用同步改寫
- *Markdown 內嵌的完整 Org 示例*：` ```org ` 模板，以及首行就是 `#+key:` 的無語言圍欄模板，都會轉為 ` ```markdown `；連續頭塊變為帶 `---` 的 YAML frontmatter，標題、連結、強調、等寬文本與分隔線隨模板一起轉換；原檔案使用純 CRLF 時保留其換行風格
- 檔案擴充套件引用：`__qa.org` → `__qa.md`、`__paper.org` → `__paper.md` 等（denote 命名約定）
- 關鍵詞：`org-mode` → `markdown`、`Org-mode` → `Markdown`
- org 式格式指令：`加粗用 *bold*（單星號）…` → `加粗用 **bold**（雙星號）`、`標題層級從 * 開始` → `從 # 開始`、`Org 檔案頭` → `Markdown 檔案頭`、行首 `#+title:` 等 8 個示例鍵 → YAML 鍵行
- 結構化強調標籤：行首 `- *標籤*：` → `- **標籤**：`；緊鄰這類標籤的 `org` 圍欄同步改為 `markdown`
- 輸出契約與執行時預設值：`evals/*.json` 中明確要求儲存 Org 的提示與期望改為 Markdown；`stdin__*.org` 預設值改為 `.md`，同時保留顯式 Org 輸入與測試夾具
- `ljg-is` 的生成合同：輸出標題、預設檔案擴充套件、路徑稱謂、元資料名、tags 與雙格式驗收句統一切到 Markdown/YAML + Denote，並刪除 Org 專用 lint 阻斷表述；提交前殘留審計拒絕任何未轉換的 Org 輸出指令

檢測與同步共用同一檔案邊界：按校驗和比較內容，可靠識別檔案新增、刪除、內容和可執行位變化；純時間戳、目錄元資料、空目錄不會單獨觸發釋出，任意層級的 `.git/`、`node_modules/`、`.DS_Store` 不進入同步。忽略清單隻含這三類明確雜物，`.bak`、`.backup` 等真實備份仍會觸發同步和釋出審查。

*仍不自動轉換*（按需手工）：

- 正文裡的 `*bold*` 標記：markdown 裡 `*x*` 是斜體，盲替會破壞文件自身格式；只有「行首 bullet + 全形冒號」標籤會安全轉換

## Voice Notification

```bash
curl -s -X POST http://localhost:31337/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running Push in ljg-push"}' \
  > /dev/null 2>&1 &
```

輸出文本：`Running **Push** in **ljg-push**...`

## Examples

*Example 1: 一鍵推送*

```
User: /ljg-push
→ 檢測 ~/.agents/skills/ljg-* 中跟 repo 有差異的 skills
→ master: rsync + bump version + commit + push
→ md: rsync + mdize + bump version + commit + push
→ 切回 master
→ 報告：哪些 skills 推了，新版本號，剩餘手工差異
```

*Example 2: 看會推什麼但不真推*

```
User: /ljg-push --dry-run
→ 列出會被同步的 skills
→ 列出會做的 markdown 化轉換
→ 不執行 rsync / commit / push
```

## Gotchas

- *README 漂移是最容易被忽略的*——加完新 skill 直接推，README 還停在老清單。指令碼現在有硬 gate 攔這一刀；攔下來時不要無腦加 `--skip-readme-check`，先去看一下 README
- *指令碼前提是 git credentials 已配好*（ssh key 或 PAT）—— ljg-push 不處理認證，認證失敗時直接報錯
- *master 必須先推*——md 分支的 markdown 化基於 master 的 org 版本做轉換。反過來推會破壞順序
- *untracked 雜物（如 `assets/measure.js`）會被 rsync 同步到 repo*——如果不想推，先在本地刪掉，或加進 `.gitignore`
- *同步忽略項必須窄而一致*——`.git/`、`node_modules/`、`.DS_Store` 不進入同步；純時間戳、目錄元資料和空目錄不會單獨觸發釋出，也不會進入 Git 結果。普通備份檔案不在忽略清單裡，仍會被檢測出來，避免把可能公開的真實內容藏掉
- *org 檔案本體已自動轉換（2026-06-12 起）*——template.org 等會被轉成 .md 並刪除原件，每次推送重新生成（rsync --delete 沖掉也無妨，冪等）。遺留手工項只剩正文裡的 `*bold*` 標記。新增帶複雜構件的 org reference 檔案後，先 `--dry-run` 或沙盒跑一遍 mdize 看轉換效果
- *重新命名引用可能藏在執行時程式碼裡*——例如測試用 `new URL("../Template.org", import.meta.url)` 讀取模板；只改 Markdown 文件會讓 md 分支缺檔案。轉換器會按本次實際轉出的 basename 精確改寫 `.ts` / `.js` / `.json` / `.sh` 等文本消費者，同時保留沒有對應實體檔案的 Org 測試夾具字串
- *結構化標籤不能靠列舉示例詞*——`x`、`f(x)` 之外還會出現「主體/邊界」「代入」等真實標籤；轉換器按 `- *標籤*：` 的結構識別，釋出後仍要掃描 md 檔案是否殘留單星標籤
- *Markdown 轉換不能只匹配小寫 `org`*——技能正文常寫 `Org`、內聯 `#+description`，Org 模板的 `# 註釋` 在 Markdown 裡還會變成標題；轉換器統一處理這些形式，並在 md commit 前掃描輸出指令、Org 標記和殘留 `.org` 檔案
- *整份文件模板不能只改圍欄標籤*——` ```org ` 或無語言圍欄裡的 `#+title`、星號標題與 Org 連結必須作為一個語義單元轉換；轉換器會生成帶 `---` 的 YAML、Markdown 標題與連結，同時保留原檔案的純 CRLF/LF 換行風格，避免無意義的全檔案 diff
- *輸出格式殘留不能只掃動詞短語*——「寫 Org 檔案時」轉掉後，同段的「所有生成的 Org 檔案」仍可能留下，令 md 分支繼續要求生成 Org。轉換器和提交前審計都要覆蓋這種儲存路徑句式；否則一次成功 push 會把舊格式契約重新帶回遠端
- *輸出契約不只在 Markdown 文件裡*——`evals/*.json` 的 prompt / expected_output 會直接要求技能生成某種格式，執行時程式碼裡的 `stdin__*.org` 還會選擇預設解析器。mdize 與提交前審計必須覆蓋這兩類消費者，同時保留顯式 Org 輸入相容測試
- *互斥格式句不能只替換格式名*——一句同時宣告「必須使用源格式」和「禁止目標格式」時，逐詞替換會讓肯定項與禁止項重合。mdize 必須整句交換目標與排除項，殘留審計也必須拒絕兩端相同的句子
- *格式名變了不等於語法規則也變了*——`org-mode` 被替換為 `markdown` 後，單星號加粗、`~code~` 與「不用反引號」仍會命令模型輸出 Org。轉換器必須把這組互斥規則整體改成 Markdown 規則，審計也要把舊規則視為阻斷
- *指令碼會自動 bump patch version 在 plugin.json + marketplace.json*——如果你想 bump minor / major，先手動改完再跑指令碼，指令碼只追加 patch
- *如果 md 分支的遠端比本地新（繼剛另一臺機器推過）*，指令碼會 `pull --rebase` 失敗時嘗試一次 `reset --hard origin/md` 重新應用——這會丟棄本地未推的 md 分支 commit。指令碼前會提示
- *當前路徑*：skill 源固定在 `~/.agents/skills/`，工作 repo 固定在 `~/code/ljg-skills/`；不要從歷史備份目錄讀取或推送
