---
name: ljg-blind
description: 盲區掃描——讀昨天你與 AI 的全部對話，照出暴露的思維盲區（不是不懂的知識，是讓某類真相一直看不見的思維習慣），再從微信讀書挑一本書的一章精準補上，落成一篇完整分析筆記。Use when user says '掃盲區', '盲區', '照盲區', '看看我的思維盲區', '我昨天想漏了什麼', 'blind spot', 'ljg-blind', '/ljg-blind', or wants yesterday's AI conversations analyzed for cognitive blind spots plus a targeted weread chapter to fill them. 可選引數：傳一個日期(YYYY-MM-DD)掃那天而非昨天。NOT FOR 縱向深鑽一個觀點（用 ljg-think）、一個領域降秩（用 ljg-rank）、陪讀一篇文本（用 ljg-read）、找一個領域的約束（用 ljg-constraint）。
user_invocable: true
---

# 盲區掃描

讀你昨天跟 AI 的全部對話，照出那個你自己看不見的思維盲區，從微信讀書點亮補它的一章。

## 盲區是什麼

盲區不是知識缺口。不是"沒讀過某本書""不知道某個事實"——那種缺口，查一下就補上了。

盲區是一種結構性的思維習慣，它讓某一類真相對你**系統性地不可見**。你不是想不到，是這個習慣讓你壓根沒往那個方向看。它藏在你怎麼想事情的方式裡，不藏在你想的內容裡。

所以證據不在"他說錯了什麼"。在——他沒往哪看，他在哪繞了，他默認了什麼卻從沒檢。

## 五種盲區訊號

從昨天的對話裡找這五種。每一種都要落到具體的話上，不能憑感覺。

1. **繞開點**——一個難題他打開了，又飛快合上。證據：問題丟擲，轉頭換話題，或一句"這個先不管"滑過去。
2. **空轉框架**——反覆換視角切同一個問題，沒有一個落地。證據：一個問題被套上三四副框架，每副都淺嘗輒止，最後沒結論。
3. **單一取景框**——一整天只調用一兩副 f（逢事就"約束""進化""博弈"），沒試過別的鏡子。這是他最隱蔽的盲區：越趁手的 f，越擋住別的 f 能照見的東西。（繼剛看世界 = f(x)，四軸是他預設的四副 f；正因為預設，才最該查他今天是不是又只用了其中一副。）
4. **未檢前提**——一個預設假設貫穿全程，他當硬約束在用，從沒問過它是不是假牆。證據：某個"本來就該這樣"的說法，反覆出現卻從未被他自己質疑。
5. **相鄰空缺**——從他問的東西反推，本該問、卻沒問的那個角落。不是憑空猜，是他自己的線索指向那兒。

## 選哪一個

從訊號裡挑 **1 個**作為今天的盲區。寧可一個說透，不要五個都點一遍——盲區的密度低於精度。判據三條：

- **槓桿**——補上它，下一步開啟的可能性最多。
- **真盲**——是他自己看不見的，不是知道了在拖的。
- **對位 mission**——貼 M0（找新取景框）/ M1（求本質）。盲區若正好擋在他的主線上，優先。讀 `${LIFEOS_DIR:-$HOME/.codex/LIFEOS}/USER/TELOS/PRINCIPAL_TELOS.md` 確認主線。

---

## 操作步驟

### 第一步 · 定日期

```bash
# 預設昨天；使用者傳了 YYYY-MM-DD 就用那天（macOS BSD date）
target=${1:-$(date -v-1d +%Y-%m-%d)}
```

### 第二步 · 撈當天的對話

會話檔案在 `$HOME/.codex/sessions/YYYY/MM/DD/*.jsonl`。目錄日期按本機時間記錄 session 的開始日，行內 `timestamp` 是 UTC；因此同時掃目標日與前一日目錄，再按本機日期過濾訊息。只讀取頂層 task 的 `response_item / message / user / input_text`，排除 `session_meta.payload.source.subagent` 存在的子 agent 會話，以及 harness 包裝和本次呼叫自身：

```bash
target=<上一步的日期>
out=/tmp/ljg-blind-${target}.txt
: > "$out"
previous_dir=$(date -j -v-1d -f '%Y-%m-%d' "$target" '+%Y/%m/%d')
target_dir=$(date -j -f '%Y-%m-%d' "$target" '+%Y/%m/%d')

for day_dir in "$previous_dir" "$target_dir"; do
  session_dir="$HOME/.codex/sessions/$day_dir"
  [ -d "$session_dir" ] || continue
  find "$session_dir" -type f -name '*.jsonl' -print0
done | while IFS= read -r -d '' session_file; do
  # Codex 將子 agent 與頂層 task 放在同一日期目錄；從 session_meta 排除它們。
  if jq -e 'select(.type=="session_meta") |
      (.payload.source | type == "object" and has("subagent"))' \
      "$session_file" >/dev/null 2>&1; then
    continue
  fi

  jq -r --arg target "$target" '
    def local_epoch:
      sub("\\.[0-9]+Z$"; "Z") | fromdateiso8601;
    select(.type=="response_item"
      and .payload.type=="message"
      and .payload.role=="user")
    | (.timestamp | local_epoch) as $epoch
    | select(($epoch | strflocaltime("%Y-%m-%d")) == $target)
    | ([.payload.content[]?
        | select(.type=="input_text")
        | .text] | join("\n")) as $text
    | select($text | length > 0)
    | select(($text | test("^(<recommended_plugins>|<environment_context>|<task-notification>)")) | not)
    | select(($text | test("(?i)(ljg-blind|掃盲區)")) | not)
    | "[" + ($epoch | strflocaltime("%H:%M")) + "] " + $text
  ' "$session_file" 2>/dev/null >> "$out"
done

wc -m "$out"
```

材料若 >50KB，按對話分段讀，先識別每段在討論什麼主題，再往下看。可輔助看幾條相鄰的 assistant 回覆定上下文。

**資料稀薄兜底**：當天真人輸入 <200 字或沒有對話——直接在輸出裡寫明「當天對話稀薄 / 無」，**不強造盲區**。寧可交白卷，不許編。

### 第三步 · 讀出盲區

按上面「五種盲區訊號」過一遍，每命中一處都記下證據（哪幾句話、什麼轉折讓你看出來的）。然後按「選哪一個」的三條判據，選出 1 個最要緊的盲區。

### 第四步 · 微信讀書選章

調 weread skill（`WEREAD_API_KEY` 在環境變數裡，格式 `wrk-xxxx`；若沒有，提示 `export WEREAD_API_KEY=<key>`）。三步：

1. **搜書**——從盲區裡抽 1-2 個核心詞當 keyword：

```bash
curl -s -X POST https://i.weread.qq.com/api/agent/gateway \
  -H "Authorization: Bearer $WEREAD_API_KEY" -H "Content-Type: application/json" \
  -d '{"api_name":"/store/search","keyword":"<核心詞>","count":8,"skill_version":"1.0.3"}' \
  | jq -r '.results[].books[]?.bookInfo | "\(.bookId)\t\(.title)\t\(.author)\t評分\(.newRating)"'
```

從返回裡挑評分儘量 ≥750（新版評分是 ×100，即 7.5）、且最貼盲區的 1 本，記 bookId。評分不是唯一標準——對症 > 高分，一本 7.4 但正打在盲區上，勝過一本 8.5 但擦邊的。

2. **看目錄**——挑最對症那 **1 章**，不是整本、不是序章泛泛：

```bash
curl -s -X POST https://i.weread.qq.com/api/agent/gateway \
  -H "Authorization: Bearer $WEREAD_API_KEY" -H "Content-Type: application/json" \
  -d '{"api_name":"/book/chapterinfo","bookId":"<bookId>","skill_version":"1.0.3"}' \
  | jq -r '.chapters[] | select(.level<=2) | "\(.chapterUid)\t[\(.level)] \(.title)\t\(.wordCount)字"'
```

記 chapterUid、章節標題、wordCount。

3. **估時長**——`wordCount / 280`（中文閱讀速度）向上圓到 5 的倍數。無 wordCount 就按目錄感覺在 15-45 分鐘之間估一個；標題帶「上篇/下篇」「卷一」這類宏觀詞，時長再 ×1.5。

4. **構造網頁版連結**——微信讀書網頁閱讀器不接受裸 `bookId` / `chapterUid`，必須先編碼。用技能自帶工具生成：

```bash
bun "${HOME}/.agents/skills/ljg-blind/Tools/WeReadWebUrl.ts" "<bookId>" "<chapterUid>"
```

工具輸出形如：

```text
https://weread.qq.com/web/reader/{encodedBookId}k{encodedChapterUid}
```

把輸出的完整 URL 寫進筆記。不要手拼編碼值，也不要把裸 ID 直接塞進 `/web/reader/`。

**兜底**：搜尋全空 / 沒對症章節 → 選整本相關書，只傳 bookId 生成網頁版書籍入口：

```bash
bun "${HOME}/.agents/skills/ljg-blind/Tools/WeReadWebUrl.ts" "<bookId>"
```

文裡說明為什麼沒能精準到章。

### 第五步 · 寫筆記

獲取時間戳：`date +%Y%m%dT%H%M%S` 和 `date "+%Y-%m-%d %a %H:%M"`（時間用當前，不是 target）。

寫入 `~/Context/{時間戳}--盲區-{主題}__blind.md`。Markdown 格式，禁止 Org 語法。

正文模板：

```markdown
---
title: 盲區掃描 · {一句話點出這個盲區}
date: [YYYY-MM-DD Weekday HH:MM]
tags: blind weread topology
---
# 昨天你在想什麼
<1-2 段。當天對話的思維地形——哪幾件事、繞著哪個核心在轉。給證據：哪幾句話看出來的。不流水賬，抓主線。>

# 照出來的盲區
<挑出的那 1 個盲區。先一句話點破它是哪種（繞開點 / 空轉框架 / 單一取景框 / 未檢前提 / 相鄰空缺）。再 2-3 段說清：它具體長什麼樣、昨天哪幾處暴露了它、為什麼你自己看不見。要點到槓桿——補上之後會開啟什麼。>

# 這一章給你
- 書：《書名》 — 作者
- 章節：<章節標題>
- 時長：約 N 分鐘
- 連結：[在微信讀書網頁版閱讀本章](https://weread.qq.com/web/reader/ENCODED_BOOKkENCODED_CHAPTER)
- 為什麼是它：<3-4 句。把盲區和這一章對上——這章具體講什麼、怎麼補這個盲區。不要泛泛說"開闊視野"，要說清這一章的哪個東西正對這個盲區的哪個缺口。>
```

報告檔案路徑給使用者。

---

## 語氣規則（寫筆記時守住）

這篇筆記是寫給一個跟你長期一起思考的人的，不是報告，不是陌生讀者。

- **中文寫作，禁翻譯腔**。少用「然而 / 此外 / 值得注意的是」；少用名詞化（「對…的理解」→「懂…」，「做出…的決定」→「決定」）；主語能省則省；短句優先。寫完默唸一遍，問：一個沒讀過翻譯小說的中國人會這麼說嗎？汪曾祺會這麼寫嗎？卡的地方整段重寫，不是換個詞。
- **禁切痕風金屬比喻**。不寫「這一刀」「再狠一層」「鋒利的話」「砸實」「釘死」「硬話」這一整套自誇元修辭。盲區照得準不準，讀者看得出，不用作者吆喝力度。
- **有溫度、有毛刺、有判斷**。可以有立場，別裝中立到虛偽；但標清楚這是判斷，不是客觀事實。

## Markdown 嚴格語法（禁混 Org）

- 標題用 `#` / `##` / `###`，不要用星號充當標題
- 加粗 `**字**`，斜體 `*字*`，等寬 `code`
- 列表用 `-`；標題使用 `#`
- 連結使用 `[text](url)`
- 分隔線使用 `---`；引用使用 `>`

## 自檢（寫完前過一遍）

- 盲區有具體證據嗎？每一處都能指到昨天哪幾句話？沒有就退回第三步。
- 只選了 1 個盲區、說透了嗎？還是貪多點了三四個？
- 章節連結以 `https://weread.qq.com/web/reader/` 開頭，並由工具用非空 bookId、chapterUid 生成？
- 全文沒有殘留只能喚起移動 App 的專用協議連結？
- 翻譯腔查了嗎？名詞化、「是…的」句、可省的連詞，掃一遍。
- 切痕風金屬比喻查了嗎？「這一刀」「釘死」「砸實」一個不留。
- 三段都有內容、不空段？

## Gotchas

- **網頁版 reader 路徑使用編碼 ID。** `https://weread.qq.com/web/reader/573976?chapterUid=13` 會返回 404；必須用 `Tools/WeReadWebUrl.ts` 分別編碼 bookId 與 chapterUid，再用 `k` 連線。
- **章節定位不放在 query 引數。** 正確形態是 `/web/reader/{encodedBookId}k{encodedChapterUid}`；省掉章節編碼只會開啟整本書入口。

## 和「早信」的分工

Pulse 每天早上有個自動早信（`陳平安思維拓撲.org`），是陳平安的口氣、每天一封、挑一個洞。ljg-blind 是**隨手調**的分析版——同一套「讀昨天 → 看盲區 → weread 選章」的底子，但更系統、專照盲區、分析寫得更足，而且能掃任意一天（傳日期引數）。想要一封信，等早信；想主動查某天的盲區、要一篇能存檔的分析，用 ljg-blind。
