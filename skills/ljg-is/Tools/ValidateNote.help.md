# ValidateNote

校驗 `ljg-is` 生成的 Org 或 Markdown 筆記。

當前生成合同是 `ljg-is-v5`：檔名使用 `--理解-<目標>__is`，標題使用「理解：<目標>」。成品把名詞的「是什麼」與動詞的「怎樣運作」接起來，並繼續給出認知修正和行動判斷。

驗證器檢查 `definition`、`operation`、`recognition`、`guidance`、`basis` 與 `falsifier` 後臺元資料，以及內容型標題、自然段數量和基礎可讀性。它會攔截專案符號、欄位式標題、過密頓號、過多分號和超長句；它不要求虛構主人公、創造物反制或問號結尾。

這些只是確定性代理，不能證明中文已經自然。校驗後仍須全文讀回：讀者要能區分概念、複述機制、說出舊判斷怎樣改變，並舉出一個真正會改變行動的情境。

`ljg-is-v4`、`ljg-is-v3`、`ljg-is-v2` 和無 schema 的 legacy 筆記仍可讀取驗證，但不會被新工作流生成。

```bash
bun ~/.agents/skills/ljg-is/Tools/ValidateNote.ts \
  ~/Context/20260823T010203--理解-目標函式__is.org
```

成功時向 stdout 輸出 `{"status":"ok", ...}` 並退出 0；失敗時向 stderr 輸出錯誤陣列並退出 1；缺少檔案引數時退出 2。

執行自檢：

```bash
bun test ~/.agents/skills/ljg-is/Tools/ValidateNote.test.ts
```
