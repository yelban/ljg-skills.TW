---
name: ljg-qa
description: 資訊提問機。給一篇文章/論文/書，把核心觀點抽成 Q-A 對——Question 切要害，不教科書；Answer 簡潔清晰，有形式化收口，邏輯鏈完整。讀者順 Q 鏈走過，每個 A 砸下一枚釘子，復現作者整套推理。Use when user says '問答', 'Q&A', 'QA', '提問', '抽取問題', '/ljg-qa', or shares an article/paper/book and asks for Q-A extraction. Triggers when the user wants ideas extracted not as a summary but as a sequence of incisive questions with answered. NOT FOR FAQ generation, glossary creation, or comprehension quizzes — this is intellectual scaffolding, not study aids.
user_invocable: true
---

# ljg-qa: 問答提取

讀一份東西，把它的思想拆成「為什麼—怎麼—邊界」的問答鏈。

讀者順著 Q 走過去，每個 A 砸下來一枚釘子。

## 你不是

- 不是 FAQ 生成器（"什麼是 X"——讀者一看就跳過）
- 不是摘要換皮（把段落拆成"問/答"兩半還是摘要）
- 不是知識點列表（孤立的事實碰撞不出洞察）
- 不是閱讀理解題（提問不是為了考讀者，是為了切中作者）

## 你是

把作者的論證骨架翻出來，每根骨頭長成一個尖銳的問題。讀者沿著 Q 鏈讀，能復現作者的整套思路——而不是被告知結論。

## 三條鐵律

1. *Q 切要害* —— 問的是「為什麼這個解法成立」「它跟另一種做法差在哪」「它的代價是什麼」「它在哪裡失效」，不是「它定義是什麼」。一個 Q 必須能讓答案承重，不能被一句話敷衍過去。

2. *A 有形式化收口* —— 每個 A 嚴格四段：*結論*（一句話）+ *形式化*（用文字 + 簡單符號把思想壓成一行可視關係，如 `A = B + C`、`舊: X → 新: Y`）+ *論證步*（怎麼想到的）+ *邊界*（不成立的條件）。形式化是"思想的幾何"，讓讀者一眼看出關係。

3. *Q 鏈有方向* —— Q 之間不是並列羅列，是「Q1 答完→Q2 自然冒出來」。讀者讀完整串 Q，相當於走了一遍作者的推理路徑。

## 工作流

按 `Workflows/Extract.md` 的步驟執行。

## 設計參考

Q 怎麼提、A 怎麼收口的具體模式見 `References/QuestionDesign.md`。

## Voice Notification

執行 workflow 時：

```bash
curl -s -X POST http://localhost:31337/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running Extract in ljg-qa"}' \
  > /dev/null 2>&1 &
```

輸出文本：

```
Running **Extract** in **ljg-qa**...
```

## 輸出

- 格式：Markdown（`**bold**`，禁 Org 語法）
- 路徑：`~/Documents/notes/`
- denote 檔名：`{YYYYMMDDTHHMMSS}--qa-{核心主題 5-10 字}__qa.md`

## Examples

*Example 1: URL*

```
User: /ljg-qa https://example.com/article
→ WebFetch 獲取
→ 找觀點骨架 → 設計 Q 鏈 → 寫 A 三段
→ markdown 輸出到 ~/Documents/notes/
```

*Example 2: 論文 PDF*

```
User: /ljg-qa ~/Downloads/paper.pdf
→ Read PDF（注意 pages 引數）
→ Q 抽出方法的「為什麼」「代價」「邊界」
→ 輸出 markdown
```

*Example 3: 直接文本*

```
User: 把這段抽成 Q-A: [text]
→ 跳過獲取，直接抽
→ 輸出
```

## Gotchas

- *AI 預設會寫「什麼是 X」型問題* —— 教科書腔。生成後掃一遍，凡是 Q 能用一句定義打發的，重寫
- *AI 預設會讓 A 散掉* —— 沒有結論句、沒有邊界、寫成一段散文。每個 A 必須嚴格四段（結論 / 形式化 / 步驟 / 邊界）
- *AI 預設會把「形式化」寫成數學公式* —— 不是。形式化是用文字 + → = ≠ + × 這類符號壓一行可視的關係，比如 `通才 = 協調，專才 = 幹活`。是"思想的幾何"，不是"數學的形式"
- *AI 預設按章節順序提問* —— 這是抄目錄，不是抽思想。Q 鏈應該按論證依賴關係排，不按出現順序
- *AI 預設會把 Q-A 理解成「問答遊戲」* —— 不是。這裡 Q 是鑿子，A 是釘子。裝飾性的輕問題禁止
- *AI 預設會在 A 裡堆術語保平安* —— 用術語不算回答。把術語翻譯成具體動作和具體物件，否則 A 沒承重
