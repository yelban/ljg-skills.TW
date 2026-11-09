# RenderClassic

把 classic JSON 渲染為完整 HTML、單張 PNG、manifest，並可生成重疊視覺驗收切片。

```bash
bun Tools/RenderClassic.ts \
  --input <classic.json> \
  --output <classic.png> \
  --html <classic.html> \
  --width 1080 \
  --slices-dir <qa-slices>
```

`--input` 與 `--output` 必填。`--width` 接受 720–1600；預設 1080。省略 `--html` 時寫到 PNG 同目錄同名 HTML。執行 `bun Tools/RenderClassic.ts --help` 檢視當前引數。

輸入 JSON 可選填成對的 `heroImage` 與 `heroAlt`。`heroImage` 只接受相對 JSON 或絕對路徑的本地 PNG/JPEG/WebP；渲染器會把它編碼進 HTML，不保留檔案熱鏈。

渲染前會校驗原文逐字回讀、非標點註解覆蓋、tone 列舉、頂部配圖和章節解讀禁詞；渲染後會檢查頁面溢位、裁切、空文本、配圖可見性、必需標題與真實 PNG 尺寸。
