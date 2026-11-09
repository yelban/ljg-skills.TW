# Render.ts

無外部依賴，使用 Bun 將 JSON 生成為離線 HTML。文本全部按文本處理，自動轉義；不執行輸入中的 HTML。HTML 包含畫布和瀏覽器驗收函式，不連線外部服務。

```sh
bun Tools/Render.ts --input model.json --output model.html [--width 1600]
bun Tools/Render.ts --help
```

`--input`、`--output` 必填。`--width` 是 1200–2400 的整數，預設 1600。輸出路徑已存在會報錯，以免覆蓋舊版本。成功 stdout 輸出 JSON；失敗 stderr 輸出原因並以非零狀態退出。

## 輸入

頂層欄位：

- `title`：業務／專案名，最多 32 字元。
- `scope`：物件範圍和階段，最多 60 字元。
- `date`：`YYYY-MM-DD`，使用任務當地日期。
- `version`：版本文字，最多 24 字元。
- `summary`：一句話說明商業模式，最多 100 字元；不支援的邏輯寫「待明確」。
- `sources`：`[{"id":"S1","label":"使用者提供的專案介紹"}]`；可選 `detail` 保留相關原文摘要或定位資訊，不會渲染到頁尾。編號不重複。
- `segments`：可選 `[{"id":"C1","label":"社群居民"}]`，最多 4 個；用於跨模組關聯客戶，保持固定色彩與文字編號。
- `blocks`：必須包含 CanvasGuide.md 的九個鍵，值均為條目陣列。空陣列顯示「待補充」；不接受其他模組鍵。

條目結構：

```json
{
  "text": "C1 居民按月付費，每月獲得 20 杯咖啡",
  "status": "given",
  "source_refs": ["S1"],
  "segment": "C1"
}
```

- 每格最多 5 條；每條 `text` 最多 90 字元。超限會報錯，不會截斷。
- `status` 為 `given` / `inferred` / `unknown`。卡片文字分別顯示「材料提供」「推測」「待補充」。
- `given` 需要至少一個有效 `source_refs`。
- `inferred` 需要 `reason`（推測依據，最多 240 字元）；可選 `source_refs`。依據保留在 JSON 和 HTML 懸停提示中。
- `unknown` 不需要引用。可具體寫「獲客成本待補充」，比空泛問號更好。
- `segment` 可選，必須對應 `segments` 中的編號。

完整輸入示例見 [Example.json](../Example.json)，示例明確為虛構，不應用於真實企業。

## 瀏覽器與圖片

開啟 HTML 後等待 `document.fonts.ready`，呼叫 `window.businessModelAudit()`：返回 `ok`、`blocks`、`items`、`inferred`、`unknown`、`overflow`、`bounds`。這是幾何檢查，不驗證商業事實，也不替代看圖。

使用真實瀏覽器截圖功能捕獲整個 `#canvas`，以 PNG 儲存，推薦 2 倍畫素。若瀏覽器工具不支援 file URL，用只繫結 127.0.0.1 的臨時服務提供這一個檔案，完成後關閉服務。截圖前確保沒有水平裁切；不要用視口大小截掉畫布右側。
