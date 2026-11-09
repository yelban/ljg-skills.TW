# ValidateClassic

複核 classic JSON、PNG 與 manifest 是否仍保持同一份輸入、尺寸、雜湊和 DOM 審計結果。

```bash
bun Tools/ValidateClassic.ts \
  --input <classic.json> \
  --png <classic.png> \
  --manifest <classic.manifest.json>
```

三個引數均必填。成功時 stdout 返回 JSON `status: "valid"`；任一底本、token、覆蓋率、尺寸、雜湊、頂部配圖 presence/visibility 或必需區塊可見性不一致時非零退出。執行 `bun Tools/ValidateClassic.ts --help` 檢視當前引數。
