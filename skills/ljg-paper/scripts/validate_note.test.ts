import { describe, expect, test } from "bun:test";
import { validate } from "./validate_note";

const filename = "20260820T091641--paper-技能留下動作關係__paper.org";

const validNote = `#+title: 技能留下動作關係
#+subtitle: Demystifying Skills
#+description: 舊評測只看總分；作者比較同一經驗的不同表示，發現技能主要穩定動作關係，並受完整生命週期約束。
#+date: [2026-08-20 Thu 09:16]
#+filetags: :paper:
#+identifier: 20260820T091641
#+source: https://arxiv.org/abs/2608.14036
#+authors: A. Author, B. Author
#+venue: arXiv, 2026

* 結賬請求為什麼仍然失敗

一個結賬請求必須訪問外部服務。沒有舊經驗時，代理繞過外部服務；拿到工作記錄後，它補齊呼叫卻排錯順序。最終標籤都是失敗，舊評測看不見原因差異。

* 同一段經驗走出不同結果

作者固定任務與舊軌跡，只改變經驗怎樣交給代理。標準化技能把記錄壓成程式錨點；壓縮—檢索—適配—驗證成為同一條作用鏈。中心比較顯示，每一百次多完成六次，這支援表示方式改變了經驗的可用性。

* 技能庫擴大以後

技能庫讓檢索進入鏈條。精確命中與完成任務不再是同一把尺子；卡片還要適配當前條件並接受真實執行。

技能儲存動作關係，卻不儲存這些動作永遠正確的權利。
`;

const validMap = `# ljg-paper paper-map 研究記錄

## 原文與材料邊界
- 格式版本：2
- 原文位置：https://arxiv.org/abs/2608.14036
- 論文資訊：2608.14036｜Demystifying Skills｜A. Author｜v1
- 原文雜湊：sha256:abcdef0123456789
- 材料能支援到：支援終端代理的技能機制，不能推廣到所有代理
- 外部指令掃描：未發現可疑指令

## 研究問題與貢獻
- 貢獻型別：測量／評測——機制評測
- 研究物件：代理技能怎樣改變執行行為
- 已有方法的不足：總成功率看不見失敗與成功的行為路徑
- 主要貢獻：同源三路對照與軌跡分類框架
- 輸入、處理與輸出：同一舊軌跡→三種表示→配對執行→行為分叉
- 不可省略的研究問題或主線：經驗表示｜結果標籤｜跨工具遷移｜技能庫檢索
- 主線為什麼屬於同一篇論文：四條主線共同定位技能從舊經驗到任務結果的斷點
- 各主線的證據支援程度：經驗表示：閉合——配對實驗｜結果標籤：部分閉合——結果混合｜跨工具遷移：部分閉合——只有圖｜技能庫檢索：閉合——獨立實驗
- 論文未作出的主張：沒有發明更強技能，也沒有證明普遍能力提升
- 正文中的論文具體表述：結賬請求｜程式錨點
- 前兩節的問題與貢獻表述：結賬請求｜程式錨點
- 論文簡述：總分看不見機制，作者用同源對照找到技能穩定動作關係的證據與邊界
- 與其他論文的區別：換成普通記憶論文會缺少同源三路比較與軌跡分類

## 讀者的認識變化
- 從哪個具體問題開始：結賬請求需要真實呼叫並按時完成
- 原先會怎樣理解或處理：只要最終通過就說明技能有用
- 什麼證據需要補充或修正原有理解：相同失敗標籤來自繞過呼叫和順序錯誤
- 作者補充了什麼關係、做法或判斷依據：比較執行分叉而非只看終點
- 回到原問題，判斷髮生了什麼變化：開始尋找哪段行為被穩定
- 還需要回答什麼問題：技能怎樣從經驗走到結果
- 貫穿全文的問題或關係：技能使用生命週期
- 案例如何選擇與銜接：結賬解釋表示，技能庫解釋檢索，因此由前一結果逼出換場
- 結尾回到哪裡：回到如何判斷技能是否有用
- 陌生讀者三句複述：舊評測只看結果；作者比較行為路徑；技能穩定動作但有生命週期邊界
- 示例的原文依據與簡化限制：結賬來自附錄軌跡；技能庫來自獨立檢索實驗，正文不把兩者寫成同一因果實驗

## 機制與結果解釋
- 是否存在統一機制：是——技能價值由完整生命週期共同生成
- 統一機制：壓縮—檢索—適配—驗證
- 輸入、起點或當前狀態：帶有成功與失敗的舊執行軌跡
- 關鍵作用關係：壓縮保留動作關係，當前情境決定是否適用
- 結果方向或終點：任務完成且真實驗證通過
- 如何解釋兩個不同發現：推出技能優於工作記錄，也推出正確技能仍可能被誤用
- 改變相關條件後的預測及依據：相似技能增多時精確檢索先下降
- 失效邊界：演算法錯誤或條件不相容時程式錨點不能補救
- 正文中的機制表述：壓縮—檢索—適配—驗證
- 是否需要在前兩節解釋機制：是——後續實驗都由這條鏈組織
- 是否需要圖示：否——一句元件鏈足以保持關係
- 圖後用什麼例子解釋：正文直接用結賬請求與技能庫執行

## 中心實驗或論證
- 實驗在問什麼：同一經驗換表示是否改變執行
- 固定了什麼：任務、代理、預算與舊軌跡
- 改變了什麼：無經驗、工作記錄、標準化技能
- 與誰比較：技能與工作記錄，並保留無經驗基線
- 主要結果及例外：技能相對工作記錄穩定提高，相對無經驗提升較弱
- 結果的實際意義：每一百次比工作記錄多完成約六次
- 這個結果改變什麼判斷：經驗表示而非經驗存在本身影響可用性
- 這個結果不能推出什麼：不能證明技能普遍強於無經驗
- 正文中的核心證據表述：每一百次多完成六次
- 正文主要結果表述：每一百次多完成六次
- 是否補充定量比較：否——中心比較已經足以改變判斷，其餘精確量僅供備查

## 證據分級
- [evidence] 名稱：配對成功差｜角色：中心｜位置：表10｜論文直接結果：技能相對工作記錄提高｜支援判斷：經驗壓縮影響可用性｜正文對應表述：每一百次多完成六次｜決定：進入正文｜取捨理由：刪掉就無法區分技能與工作記錄
- [evidence] 名稱：結賬三路軌跡｜角色：必要｜位置：附錄A3｜論文直接結果：三條路徑從不同動作處分叉｜支援判斷：總標籤隱藏機制｜正文對應表述：繞過外部服務｜決定：進入正文｜取捨理由：刪掉就沒有舊盲區的可見壓力
- [evidence] 名稱：完整檢索矩陣｜角色：研究記錄｜位置：表15｜論文直接結果：不同池大小與干擾項的完整指標｜支援判斷：檢索是獨立瓶頸｜正文對應表述：無｜決定：僅供備查｜取捨理由：不影響主線但影響核驗完整性

## 正文中的案例與實驗
- [frontstage] 名稱：結賬請求｜主要作用：暴露總分隱藏行為路徑｜設定或起點：真實呼叫與時限｜結果或後果：三路執行得到不同原因｜幫助理解什麼：從看終點改成看分叉｜與後文的聯絡：表示方式改變了什麼
- [frontstage] 名稱：技能庫｜主要作用：暴露檢索與適配邊界｜設定或起點：候選技能增多｜結果或後果：命中與完成不再同步｜幫助理解什麼：檔案存在不等於作用成功｜與後文的聯絡：生命週期在哪裡斷裂

## 章節組織與聯絡
- 開頭要回答的問題：相同失敗標籤為什麼來自不同原因
- 全文解釋順序：總分隱藏路徑→同源三路對照→動作關係被穩定→檢索與適配成為新邊界
- 案例之間的聯絡：先證明表示改變行為，才有理由進入技能庫檢索
- 章節換序檢查：技能庫若提前，讀者還不知道為什麼表示方式值得追蹤
- 略去數字後的解釋：刪掉數字後，中心比較仍回答經驗表示是否改變可用性
- 只保留結論會遺漏什麼：只保留結賬案例會丟失生命週期，只保留結論會丟失對照歸因

## 結尾檢查
- 論文最終補充或修正了什麼認識：技能檔案存在或總分上升不等於技能機制可靠
- 結尾依據前文哪些發現：結賬三路分叉與技能庫檢索邊界
- 正文結尾的對應表述：技能儲存動作關係
- 結尾與本論文的聯絡：普通提示論文沒有同源經驗表示與技能庫生命週期
- 結尾是否新增證據、術語或建議：否——只壓縮正文已經執行的關係

## 陌生讀者驗收記錄
- 不依賴分數的全文複述：舊評測只看終點，同源對照讓行為分叉可見，技能穩定動作卻仍受檢索適配與驗證約束
- 讀者首先記住的解釋：最先留下的是經驗怎樣經過壓縮檢索適配與驗證變成行動
- 讀者對章節聯絡的解釋：技能庫不能提前，因為讀者還不知道表示為什麼會改變行動
- 全文理解判定：NARRATIVE_PASS
- 研究問題：總成功率看不見技能何時怎樣起作用
- 作者的主要貢獻：同源配對實驗與軌跡分類框架
- 輸入→元件／關係→輸出：舊軌跡→表示→檢索→適配→驗證→結果
- 中心實驗問題／固定項／比較者／結果／意義：固定任務與軌跡，比較工作記錄和技能，技能更易使用
- 證據的適用範圍與限制：終端任務、有限模型與樣本，不能證明普遍能力提升
- 問題與貢獻判定：PAPER_IDENTITY_PASS
- 三句認識變化複述：舊評測只看終點；作者讓路徑可見；技能主要穩定動作且受生命週期約束
- 認識變化判定：UNDERSTANDING_PASS
- 結果解釋：生命週期推出表示優勢與誤用失敗，並預測相似技能增多先傷檢索
- 結果解釋判定：RECONSTRUCTION_PASS
`;

describe("validate ljg-paper note", () => {
  test("accepts the three-contract note with flexible carriers", () => {
    const result = validate(validNote, filename, validMap);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.stats.frontstage_count).toBe(2);
    expect(result.stats.background_evidence_count).toBe(1);
    expect(result.stats.numeric_tokens).toBe(0);
    expect(result.stats.numeric_paragraphs).toBe(0);
  });

  test("requires a backstage paper-map", () => {
    const result = validate(validNote, filename);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("--map");
  });

  test("rejects a polished case that lost whole-paper identity", () => {
    const broken = validMap
      .replace("- 主要貢獻：同源三路對照與軌跡分類框架", "- 主要貢獻：")
      .replace("- 論文簡述：總分看不見機制，作者用同源對照找到技能穩定動作關係的證據與邊界", "- 論文簡述：成長與變化");
    const result = validate(validNote, filename, broken);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("主要貢獻");
  });

  test("requires indispensable research strands and their evidence status", () => {
    const broken = validMap.replace("- 各主線的證據支援程度：經驗表示：閉合——配對實驗｜結果標籤：部分閉合——結果混合｜跨工具遷移：部分閉合——只有圖｜技能庫檢索：閉合——獨立實驗", "- 各主線的證據支援程度：");
    const result = validate(validNote, filename, broken);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("各主線的證據支援程度");
  });

  test("requires paper orientation by the end of the second heading", () => {
    const lateNote = validNote.replace("程式錨點；", "操作規則；").replace("程式錨點", "程式錨點");
    const result = validate(lateNote, filename, validMap);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("前兩個一級標題");
  });

  test("accepts an explicit no-generator path without forcing a formula", () => {
    const noGenerator = validMap
      .replace("- 是否存在統一機制：是——技能價值由完整生命週期共同生成", "- 是否存在統一機制：否——論文只提供兩條不可合併的測量關係")
      .replace("- 統一機制：壓縮—檢索—適配—驗證", "- 統一機制：未找到")
      .replace("- 正文中的機制表述：壓縮—檢索—適配—驗證", "- 正文中的機制表述：無")
      .replace("- 是否需要在前兩節解釋機制：是——後續實驗都由這條鏈組織", "- 是否需要在前兩節解釋機制：否——沒有單一機制");
    const result = validate(validNote, filename, noGenerator);
    expect(result.errors).toEqual([]);
  });

  test("rejects a declared generator that appears too late", () => {
    const lateNote = validNote
      .replace("壓縮—檢索—適配—驗證成為同一條作用鏈。", "經驗處理成為同一條作用鏈。")
      .replace("技能庫讓檢索進入鏈條。", "技能庫讓壓縮—檢索—適配—驗證進入鏈條。");
    const result = validate(lateNote, filename, validMap);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("出現過晚");
  });

  test("requires center, necessary, and backstage evidence roles", () => {
    const noBackground = validMap.replace(/^- \[evidence\] 名稱：完整檢索矩陣.*\n/m, "");
    const result = validate(validNote, filename, noBackground);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("備查證據");
  });

  test("rejects backstage language and generic headings in the visible note", () => {
    const broken = validNote.replace("* 技能庫擴大以後", "* 實驗結果").replace("技能儲存動作關係", "證據臺賬決定進入正文");
    const result = validate(broken, filename, validMap);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("一級標題");
    expect(result.errors.join("\n")).toContain("研究記錄");
  });

  test("warns when a paragraph becomes a metric pile", () => {
    const metricPile = validNote.replace(
      "中心比較顯示，每一百次多完成六次",
      "中心比較顯示 61.9%、55.9%、59.1%、65.7%、4.5% 與 23.5%",
    );
    const result = validate(metricPile, filename, validMap.replaceAll("每一百次多完成六次", "中心比較顯示"));
    expect(result.warnings.join("\n")).toContain("5–6 個數字");
  });

  test("rejects a severe metric pile even when numbers are accurate", () => {
    const metricPile = validNote.replace(
      "中心比較顯示，每一百次多完成六次",
      "中心比較顯示 61.9%、55.9%、59.1%、65.7%、4.5%、23.5% 與 10.0%",
    );
    const result = validate(metricPile, filename, validMap.replaceAll("每一百次多完成六次", "中心比較顯示"));
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("至少 7 個數字");
  });

  test("rejects numeric dominance distributed across locally light paragraphs", () => {
    const distributed = validNote.replace(
      "中心比較顯示，每一百次多完成六次，這支援表示方式改變了經驗的可用性。",
      `第一組比較顯示 61.9% 對 55.9%，差值 6.0，區間下界 0.7。

第二組比較顯示 59.1%、65.7%、4.5% 與 23.5%。

第三組比較顯示 10.0%、10.6%、74.6% 與 40.0%。

第四組比較顯示 29.6%、3.3%、5 與 100。`,
    );
    const map = validMap.replaceAll("每一百次多完成六次", "第一組比較");
    const result = validate(distributed, filename, map);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("舊版本數字數量限制");
    expect(result.stats.numeric_pile_paragraphs).toBe(0);
  });

  test("requires one foreground result shape declared in paper-map", () => {
    const broken = validMap.replace("- 正文主要結果表述：每一百次多完成六次\n", "");
    const result = validate(validNote, filename, broken);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("正文主要結果表述");
  });

  test("requires a narrative-first reader pass before paper identity", () => {
    const failed = validMap.replace("- 全文理解判定：NARRATIVE_PASS", "- 全文理解判定：FAIL");
    const result = validate(validNote, filename, failed);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("NARRATIVE_PASS");
  });

  test("rejects numeric recall in the narrative-first retell", () => {
    const failed = validMap.replace(
      "舊評測只看終點，同源對照讓行為分叉可見，技能穩定動作卻仍受檢索適配與驗證約束",
      "舊評測只看終點，61.9% 對 55.9% 證明技能更好",
    );
    const result = validate(validNote, filename, failed);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("不依賴分數的全文複述");
  });

  test("rejects an extra quantitative foreground exception for a method paper", () => {
    const methodMap = validMap
      .replace("- 貢獻型別：測量／評測——機制評測", "- 貢獻型別：方法／干預——訓練方法")
      .replace("- 是否補充定量比較：否——中心比較已經足以改變判斷，其餘精確量僅供備查", "- 是否補充定量比較：是——需要更多對比");
    const result = validate(validNote, filename, methodMap);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("是否補充定量比較");
  });

  test("allows a bounded second quantitative paragraph for an evaluation paper", () => {
    const evaluated = validNote.replace(
      "技能儲存動作關係，卻不儲存這些動作永遠正確的權利。",
      `補充測量顯示 61.9%、55.9%、6.0 與 0.7。

另一層尺子顯示 29.6%、3.3%、5 與 100。

技能儲存動作關係，卻不儲存這些動作永遠正確的權利。`,
    );
    const map = validMap.replace(
      "- 是否補充定量比較：否——中心比較已經足以改變判斷，其餘精確量僅供備查",
      "- 是否補充定量比較：是——主產物是機制評測，第二層定量對照用於讓新尺子本身可見",
    );
    const result = validate(evaluated, filename, map);
    expect(result.errors).toEqual([]);
    expect(result.stats.numeric_tokens).toBe(8);
    expect(result.stats.numeric_paragraphs).toBe(2);
    expect(result.stats.quantitative_exception).toBe(true);
  });

  test("keeps contract version one readable in compatibility mode", () => {
    const legacy = validMap
      .replace("- 格式版本：2", "- 格式版本：1")
      .replace(/^- 正文主要結果表述：.*\n/m, "")
      .replace(/^- 是否補充定量比較：.*\n/m, "")
      .replace(/^- 不依賴分數的全文複述：.*\n/m, "")
      .replace(/^- 讀者首先記住的解釋：.*\n/m, "")
      .replace(/^- 讀者對章節聯絡的解釋：.*\n/m, "")
      .replace(/^- 全文理解判定：.*\n/m, "");
    const result = validate(validNote, filename, legacy);
    expect(result.ok).toBe(true);
    expect(result.warnings.join("\n")).toContain("相容模式");
  });

  test("requires independent reader passes", () => {
    const failed = validMap.replace("PAPER_IDENTITY_PASS", "FAIL");
    const result = validate(validNote, filename, failed);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("PAPER_IDENTITY_PASS");
  });

  test("requires a visual only when the map elects it", () => {
    const needsVisual = validMap
      .replace("- 是否需要圖示：否——一句元件鏈足以保持關係", "- 是否需要圖示：是——順序需要圖")
      .replace("- 圖後用什麼例子解釋：正文直接用結賬請求與技能庫執行", "- 圖後用什麼例子解釋：技能庫");
    const result = validate(validNote, filename, needsVisual);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("恰好有 1 個");
  });

  test("rejects source and identifier drift", () => {
    const broken = validNote.replace("#+identifier: 20260820T091641", "#+identifier: 20260820T000000").replace("#+source: https://", "#+source: 原文 https://");
    const result = validate(broken, filename, validMap);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("IDENTIFIER");
    expect(result.errors.join("\n")).toContain("裸原始 URL");
  });

  test("accepts one bare absolute local source path", () => {
    const local = validNote.replace("#+source: https://arxiv.org/abs/2608.14036", "#+source: /tmp/papers/source paper.pdf");
    const result = validate(local, filename, validMap);
    expect(result.errors).toEqual([]);
  });
});

// Version 1/2 checks above preserve their original policies. These cases cover version 3.
import { normalizeLegacyMap } from "./paper_map_compat";
import { readFileSync } from "node:fs";
const currentMap = normalizeLegacyMap(validMap)
  .replace("- 格式版本：2", "- 格式版本：3")
  .replace("## 證據分級", "- 補充比較的作用：沒有補充定量比較；案例說明執行差異\n\n## 證據分級")
  .concat("\n- 缺失前提與處理：本夾具僅驗證記錄可填寫，不聲稱經過真實閱讀檢查\n");

describe("version 3 evidence-based writing rules", () => {
  test("accepts a complete current record", () => {
    expect(validate(validNote, filename, currentMap).errors).toEqual([]);
  });
  test("does not force supplementary or reference-only evidence", () => {
    const map = currentMap.replace(/^- \[evidence\].*角色：(補充|備查).*\n/gm, "");
    expect(validate(validNote, filename, map).errors).toEqual([]);
    const noCore = map.replace(/^- \[evidence\].*\n/gm, "");
    expect(validate(validNote, filename, noCore).ok).toBe(false);
  });
  test("allows complementary quantitative results in a method paper", () => {
    const note = validNote.replace("技能庫讓檢索進入鏈條。", "技能庫讓檢索進入鏈條。\n\n固定任務時成功率從 50% 提高到 60%；固定預算時從 40% 提高到 48%。\n\n檢索池從 10 擴大到 100 後，命中率從 80% 降到 65%。");
    const map = currentMap.replace("測量／評測——機制評測", "方法／干預——經驗處理")
      .replace(/^- 是否補充定量比較：.*$/m, "- 是否補充定量比較：是——比較效果與檢索規模限制")
      .replace(/^- 補充比較的作用：.*$/m, "- 補充比較的作用：任務比較說明效果，檢索池比較說明規模限制");
    const result = validate(note, filename, map);
    expect(result.errors).toEqual([]);
    expect(result.stats.numeric_tokens).toBe(8);
  });
  test("requires reasons for retaining additional comparisons", () => {
    expect(validate(validNote, filename, currentMap.replace(/^- 補充比較的作用：.*\n/m, "")).ok).toBe(false);
  });
  test("flags dense numbers for review without pretending to judge meaning", () => {
    const note = validNote.replace("技能庫讓檢索進入鏈條。", "技能庫讓檢索進入鏈條。\n\n比較 10、20、30、40、50、60、70 個候選時發現限制。");
    const result = validate(note, filename, currentMap);
    expect(result.errors).toEqual([]);
    expect(result.warnings.join("\n")).toContain("至少 7 個數字");
  });
  test("accepts parallel sections and method names containing digits", () => {
    const map = currentMap
      .replace(/^- 讀者對章節聯絡的解釋：.*$/m, "- 讀者對章節聯絡的解釋：兩項獨立實驗可換序，分別檢驗表示與檢索")
      .replace(/^- 不依賴分數的全文複述：.*$/m, "- 不依賴分數的全文複述：Agent 2 使用舊經驗組織動作，檢索與適配決定能否完成任務");
    expect(validate(validNote, filename, map).errors).toEqual([]);
  });
  test("reader failure still blocks delivery regardless of numeric counts", () => {
    for (const pass of ["NARRATIVE_PASS", "PAPER_IDENTITY_PASS", "UNDERSTANDING_PASS", "RECONSTRUCTION_PASS"]) {
      expect(validate(validNote, filename, currentMap.replace(pass, "FAIL")).ok).toBe(false);
    }
  });
  test("allows distinct examples with a shared main purpose", () => {
    const result = validate(validNote, filename, currentMap.replace("暴露檢索與適配邊界", "暴露總分隱藏行為路徑"));
    expect(result.errors).toEqual([]);
    expect(result.warnings.join("\n")).toContain("主要作用重複");
  });
  test("checks every diagram against its own following explanation", () => {
    const note = validNote.replace("技能庫讓檢索進入鏈條。", "#+begin_example\n記錄 -> 動作\n#+end_example\n\n結賬請求說明第一張圖。\n\n#+begin_example\n檢索 -> 適配\n#+end_example\n\n技能庫讓檢索進入鏈條。");
    const map = currentMap.replace(/^- 是否需要圖示：.*$/m, "- 是否需要圖示：是——兩條不同關係")
      .replace(/^- 圖後用什麼例子解釋：.*$/m, "- 圖後用什麼例子解釋：結賬請求｜技能庫");
    expect(validate(note, filename, map).errors).toEqual([]);
    expect(validate(note, filename, map.replace("結賬請求｜技能庫", "技能庫｜結賬請求")).ok).toBe(false);
  });
  test("supports papers without a unified mechanism", () => {
    const map = currentMap.replace(/^- 是否存在統一機制：.*$/m, "- 是否存在統一機制：否——兩項獨立觀察")
      .replace(/^- 統一機制：.*$/m, "- 統一機制：未找到；兩項觀察分別說明表示與檢索");
    expect(validate(validNote, filename, map).errors).toEqual([]);
  });
  test("an interrupted source inspection cannot become a deliverable", () => {
    expect(validate(validNote, filename, currentMap.replace("未發現可疑指令", "已停止——發現嵌入指令")).ok).toBe(false);
  });
  test("accepts actual legacy field names and evidence roles", () => {
    const legacy = validMap.replace("格式版本", "合同版本").replace("原文位置", "規範原文")
      .replace("論文資訊", "論文身份").replaceAll("正文對應表述", "正文錨點")
      .replaceAll("主要作用", "唯一職責").replaceAll("研究記錄｜", "後臺｜").replaceAll("僅供備查", "留在後臺");
    expect(validate(validNote, filename, legacy).errors).toEqual([]);
  });
  test("unfilled shipped templates do not pass", () => {
    const map = readFileSync(new URL("../references/paper-map.md", import.meta.url), "utf8");
    const note = readFileSync(new URL("../references/template.md", import.meta.url), "utf8");
    expect(validate(note, filename, map).ok).toBe(false);
    expect(validate(validNote, filename, map).ok).toBe(false);
  });
});

describe("version 3 review regressions", () => {
  test("permits reference evidence without a body quote but requires quotes for included evidence", () => {
    const map = currentMap.replace("正文對應表述：無", "正文對應表述：");
    expect(validate(validNote, filename, map).errors).toEqual([]);
    expect(validate(validNote, filename, map.replace("正文對應表述：繞過外部服務", "正文對應表述：")).ok).toBe(false);
  });
  test("rejects mismatched source records", () => {
    const map = currentMap.replace("- 原文位置：https://arxiv.org/abs/2608.14036", "- 原文位置：https://example.org/unrelated-paper");
    expect(validate(validNote, filename, map).errors.join("\n")).toContain("原文位置不一致");
    const localNote = validNote.replace("https://arxiv.org/abs/2608.14036", "/tmp/source paper.pdf");
    const localMap = currentMap.replace("- 原文位置：https://arxiv.org/abs/2608.14036", "- 原文位置：/tmp/source paper.pdf");
    expect(validate(localNote, filename, localMap).errors).toEqual([]);
  });
  test("the shipped map fields form a complete usable record", () => {
    const template = readFileSync(new URL("../references/paper-map.md", import.meta.url), "utf8");
    const populated = template.replace(/^- ([^：\n]+)：.*$/gm, (line, key) => {
      if (key.startsWith("[")) return line;
      const source = currentMap.split("\n").find(row => row.startsWith(`- ${key}：`));
      if (!source) throw new Error(`Template field missing from fixture: ${key}`);
      return source;
    }).replace(/^- \[evidence\].*$/m, currentMap.match(/^- \[evidence\].*$/gm)!.join("\n"))
      .replace(/^- \[frontstage\].*$/m, currentMap.match(/^- \[frontstage\].*$/gm)!.join("\n"));
    expect(validate(validNote, filename, populated).errors).toEqual([]);
  });
});
