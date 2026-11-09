# EmbedAssets

將已組裝的演示變成可分享的單檔案 HTML：字型、許可和本地圖片全部內嵌，不訪問網路。

```bash
bun Tools/EmbedAssets.ts ~/Downloads/talk.html
bun Tools/EmbedAssets.ts /tmp/draft.html --output ~/Downloads/talk.html
```

- 輸入必須來自含 `BEGIN/END DECK FONTS` 標記的當前模板。
- 自動嵌入 `Fonts/` 中的 IBM Plex Mono Regular/Bold，HTML 保留 OFL 許可；不要求觀眾安裝該字型。
- `<img src="本地路徑">` 中的 PNG/JPEG/WebP 根據檔案簽名位元組轉成 data URI；相對路徑相對輸入 HTML。
- 已內嵌的 raster data URI 保留，最終由 ValidateDeck 檢查編碼與型別。拒絕遠端資源、SVG/GIF 柵格入口與 srcset。
- 原生 Chart 的 SVG/HTML 直接保留。中文字型仍遵循平臺 fallback；工具不自動搬運整個中文字型包。
- 無 `--output` 時更新輸入。可重複執行，字型和許可不會重複新增。
- 完成後再執行 `ValidateDeck.ts` 並做實際瀏覽器離線驗收；資源內嵌不等於排版通過。
