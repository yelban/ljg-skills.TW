---
name: ljg-word
description: Deep-dive English word mastery tool. Deconstructs a single English word into core semantics and epiphany. Use when user asks to explain/master a specific English word.
version: "1.0.1"
user_invocable: true
---

## Usage

<example>
User: Deeply explain the word "Serendipity".
Assistant: [Calls ljg-explain-words with "Serendipity"]
</example>

## Instructions

目標不是翻譯，而是讓使用者掌握這個詞的深層含義和用法。

針對輸入的 `word`（轉換為小寫，首字母大寫），進行以下分析，直接在對話中用 Markdown 輸出：

### 輸出結構

#### 1. 標題行

```
## {Word}  /{音標}/  {中文翻譯}
```

#### 2. 核心語義

- **原始畫面**: 用一句話描述該詞源頭最物理的畫面（例如 Incubate: 母雞趴在蛋上）。
- **核心意象**: 提煉公式（例如：溫暖 + 時間 + 保護 = 孕育）。
- **解釋**: 用充滿洞見的語言闡述其深層含義與現代用法。分段清晰，**加粗**關鍵詞。要有穿透力，展現詞源、多領域含義之間的內在聯絡。

#### 3. 一語道破

一句中英雙語的金句，必須具有哲學高度，總結該詞的靈魂。用引用格式：

```
> "English sentence. 中文金句。"
```
