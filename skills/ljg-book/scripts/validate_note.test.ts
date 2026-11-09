import { readFileSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { validate } from "./validate_note";

const filename = "20260812T120000--拆書-示例__book.org";
const defaultHeadings = [
  "四句話擺在眼前，你會不會點頭",
  "遮住最後一句，證據突然少了一塊",
  "再看同一句話，你開始等哪種證據",
];

function note(options: {
  identifier?: string;
  opening?: string;
  firstBody?: string;
  headings?: string[];
  diagram?: string;
  description?: string;
  tail?: string;
  essenceHeading?: string;
  essenceBody?: string;
  omitEssence?: boolean;
  afterEssence?: string;
} = {}): string {
  const headings = options.headings ?? defaultHeadings;
  const bodies = headings.map((heading, index) => {
    const body = index === 0
      ? options.firstBody ?? "四句話擺在小李面前。他順著前三句的危險感點了頭。遮住最後一句，他才發現前三句只能證明問題嚴重。這就叫理由還沒有走到結論。"
      : index === headings.length - 1
        ? "回到同一句話，小李不急著贊成或反對。他現在會先問，哪一種比較結果能證明處罰真的更有效。"
        : "一份地區比較放回原來的判斷。處罰變重以後事故沒有下降，剛才那一下點頭停住了。也就是說，問題嚴重不等於這個辦法有效。";
    return `* ${heading}\n\n${body}\n`;
  }).join("\n");
  const essence = options.omitEssence ? "" : `
* ${options.essenceHeading ?? "讀完後應發生的變化"}

${options.essenceBody ?? "問題很嚴重，並不能直接推出處罰有效。這本書真正想留下的是：判斷一項主張時，先找理由與結論之間缺少的那一步，再等能補上它的比較證據。"}
`;

  return `#+TITLE: 拆書：《示例》
#+SUBTITLE: 某作者 | 同一句結論為什麼開始等待證據
${options.description === "" ? "" : `#+DESCRIPTION: ${options.description ?? "四句話讓人順勢點頭；遮住最後一句，理由與結論之間的缺口顯出來。"}\n`}#+DATE: [2026-08-12 Wed 12:00]
#+FILETAGS: :book:test:
#+IDENTIFIER: ${options.identifier ?? "20260812T120000"}

${options.opening ?? ""}${bodies}
${options.diagram ?? ""}${options.tail ?? ""}${essence}${options.afterEssence ?? ""}`;
}

function coverage(
  grade: "完整拆書" | "初拆" | "假設版" = "完整拆書",
  support = "是——原書足以還原判斷怎樣被證據改變",
  contract: "legacy" | "2" = "legacy",
): string {
  const contractVersion = contract === "2" ? "- 覆蓋合同版本：2\n" : "";
  const generatorContract = contract === "2" ? `
## 解釋生成器門
- 是否存在全書生成器：是——理由與結論之間的缺口生成了全書後續追問
- 全書生成器：自然點頭 → 遮住結論 → 暴露理由缺口 → 等待效果證據 → 排除替代原因
- 輸入、起點或當前狀態：讀者看到四句話後順勢贊成加重處罰
- 結果方向或終點：讀者能夠指出結論還缺哪一種證據
- 生成器怎樣貫穿至少兩個遠距轉折：開頭遮住結論發現缺口，結尾回到原句等待比較結果
- 生成器在哪些條件、範圍或層級失效：材料已經直接提供效果比較時，不再需要從理由缺口起步
- 正文生成器錨點：理由還沒有走到結論
- 生成器是否需要在前兩個一級標題內執行：是——分析書應先交付讀懂後續案例所需的判斷關係
- 是否需要視覺表示：否——理由鏈用同一句話重跑即可看清，不依賴空間位置
- 視覺表示後用哪個載體執行：不需要——正文直接重跑四句話

## 前臺載體門
- [frontstage] 名稱：四句話｜唯一職責：讓自然點頭真實失效｜設定或起點：前三句說問題嚴重，第四句主張加重處罰｜結果或後果：遮住第四句後，處罰結論失去支援｜改變的關係：問題存在與辦法有效被分開｜下一問：什麼證據能證明處罰有效
- [frontstage] 名稱：比較結果｜唯一職責：把效果證據放回原判斷｜設定或起點：相近地區提高處罰後事故沒有下降｜結果或後果：讀者停止順勢贊成處罰｜改變的關係：理由缺口獲得可檢驗的證據型別｜下一問：還有哪些替代原因
` : "";
  const boundary = `# ljg-book 後臺覆蓋記錄

## 材料邊界
${contractVersion}- 材料等級：${grade}
- 主要材料：原書全文與作者訪談
- 能支援到：支援核心機制與邊界，不延伸到作者未討論的領域
- 材料能否支撐認識更新路徑：${support}

## 整書身份門
- 這是什麼型別或形態的書：一本讓普通讀者親手檢查論證的分析書
- 字面上跟著誰、什麼物件或什麼問題展開：跟著群裡的四句話檢驗政策主張
- 起點、主要變化與終點：從順勢點頭，到遮住結論發現缺口，再等待比較結果
- 不可省略的主線：四句話的理由鏈與處罰效果證據
- 主線為什麼屬於同一本書：前者提出結論，後者決定結論能否成立
- 正文必須出現的整書錨點：四句話｜處罰｜比較結果
- 三十秒整書複述：一組政策主張怎樣從直覺點頭走到等待效果證據
- 可遷移性反測：若替換四句話、處罰與比較結果，複述就不再指向這本書

## 認識更新門
- 讀者進入什麼具體處境：群裡轉來四句話，最後一句主張加重處罰
- 最初最自然會怎樣理解：問題嚴重，所以處罰應該更重
- 哪個事實、事件或結果讓它不夠：遮住結論後，前三句只能證明問題存在
- 作者增加了什麼關係或條件：理由與政策結論之間還需要效果證據
- 回看原處境，什麼已經改變：重新看到結論時會先等比較結果
- 新結果自然帶出什麼問題：還要排除哪些替代原因
- 貫穿全文的扶手：同一句政策主張是否已經得到足夠支援
- 結尾回到哪裡：回到群裡的四句話重新判斷
- 陌生讀者能怎樣複述：問題嚴重不等於某個辦法已經有效
- 原書依據與簡化邊界：案例來自原書，只壓縮措辭，不增加結果
${generatorContract}

## 精神核心門
- 作者最後只想留下什麼：問題嚴重不等於處罰有效，理由與結論之間缺的那一步必須由比較證據補上
- 正文中哪兩個相隔較遠的轉折共同托住它：開頭四句話讓人自然點頭；結尾回到同一句話等待比較結果
- 是否需要回答書名：否——《示例》只是測試佔位標題，不承載核心關係
- 精神核心可替換性反測：保留四句話、處罰與比較結果之間的具體缺口，刪掉它們就會退化成一般的批判性思考口號
`;
  if (grade !== "完整拆書") return boundary;

  return `${boundary}
## 作者的發現路徑
- 作者一直在追問什麼：為什麼選擇會翻轉
- 作者用什麼材料或經歷逼近：對照兩種說法與選擇結果
- 最終改變了什麼判斷：判斷結論時要檢查中間缺失的關係

## 全書證據
- [starting-point] 位置：loc-01｜最初的處境、困惑或自然理解怎樣建立：選擇翻轉｜證據：案例
- [pressure] 位置：loc-20｜什麼使原來的理解不再夠用：相同事實得到不同選擇｜證據：對照
- [revision] 位置：loc-50｜作者增加了什麼關係、條件或觀看方式：參照點｜證據：實驗
- [boundary] 位置：loc-90｜最後形成什麼、停在哪裡：條件限制｜證據：反例

## 候選部件
- [candidate] 名稱：A｜位置：1｜解決的問題：a｜與其他部件的關係：a｜決定：保留｜刪除測試：不能刪
- [candidate] 名稱：B｜位置：2｜解決的問題：b｜與其他部件的關係：b｜決定：保留｜刪除測試：不能刪
- [candidate] 名稱：C｜位置：3｜解決的問題：c｜與其他部件的關係：c｜決定：保留｜刪除測試：不能刪
- [candidate] 名稱：D｜位置：4｜解決的問題：d｜與其他部件的關係：d｜決定：保留｜刪除測試：不能刪
- [candidate] 名稱：E｜位置：5｜解決的問題：e｜與其他部件的關係：e｜決定：保留｜刪除測試：不能刪

## 全書取捨
- 貫穿全書的困惑或張力：什麼時候一句結論才值得相信
- 正文保留哪些必要轉折：理由與結論、比較證據、替代解釋
- 為什麼這些轉折足以讓讀者理解全書主幹：它們讓同一判斷從直覺走到帶條件行動
- 哪些重要內容留在後臺而不進入正文：證據型別清單與全部謬誤名稱
- 每次轉折怎樣由前一結果帶出下一問題：理由缺口要求效果證據，效果證據再要求排除替代原因

## 敘事連續性門
- 開篇留下的真實問題：問題嚴重是否足以推出加重處罰
- 轉折鏈：直覺點頭 → 遮住結論發現缺口 → 等待效果證據 → 排除替代原因
- 每次換場為什麼不可提前：沒有先發現理由缺口，比較結果就只是額外資料
- 換序測試：先給比較結果會讓讀者不知道它在補哪一個缺口
- 摘句拼接反測：只留下四句話、處罰和比較結果，會失去從直覺到證據要求的認識變化

## 反證檢查
- 當前理解：表述改變參照點
- 反證：熟練者可能不變
- 處理：限定適用條件
`;
}

function legacyRunnableCoverage(): string {
  return `# 上一版覆蓋
- 材料等級：初拆
- 主要材料：舊筆記
- 能支援到：支援區域性理解
- 材料能否支撐具體執行：是——舊記錄完整
- 讀者先問什麼：為什麼會點頭
- 穩定物件或最小模型：四句話
- 讀者第一次會猜什麼：應該加重處罰
- 最小動作或變化：遮住結論
- 立刻出現的結果：理由只證明問題嚴重
- 結果緊接著叫什麼：理由與結論缺口
- 同一物件怎樣再執行：加入效果證據
- 陌生讀者能怎樣複述：嚴重不等於辦法有效
- 原書依據與簡化邊界：只壓縮原例
`;
}

function legacyCoverage(): string {
  return `# 舊覆蓋
- 材料等級：初拆
- 主要材料：舊筆記
- 能支援到：支援區域性理解
- 鏡頭站在哪裡：方案擺在眼前
- 讀者或人物先看見什麼：兩組數字
- 解釋出現前會怎樣判斷或行動：先選確定方案
- 這個判斷先產生什麼可見結果：換說法後改選
- 哪條證據、事件或物件反饋打斷它：機率沒有變化
- 命名以後回到哪一幕重跑：回到原方案
- 原書依據與簡化邊界：只壓縮原案例
`;
}

function legacyFullCoverage(): string {
  return `${legacyCoverage()}
## 作者自述
- 問題：為什麼選擇會翻轉
- 物件：風險判斷
- 方法：對照兩種說法

## 全書證據
- [question] 位置：loc-01｜作者為什麼非處理這個問題不可：選擇翻轉｜證據：案例
- [setup] 位置：loc-20｜物件和基本區分怎樣建立：參照點｜證據：定義
- [mechanism] 位置：loc-50｜核心機制或做法怎樣執行：損失厭惡｜證據：實驗
- [boundary] 位置：loc-90｜最後形成什麼、停在哪裡：條件限制｜證據：反例

## 候選部件
- [candidate] 名稱：A｜位置：1｜解決的問題：a｜與其他部件的關係：a｜決定：保留｜刪除測試：不能刪
- [candidate] 名稱：B｜位置：2｜解決的問題：b｜與其他部件的關係：b｜決定：保留｜刪除測試：不能刪
- [candidate] 名稱：C｜位置：3｜解決的問題：c｜與其他部件的關係：c｜決定：保留｜刪除測試：不能刪
- [candidate] 名稱：D｜位置：4｜解決的問題：d｜與其他部件的關係：d｜決定：保留｜刪除測試：不能刪
- [candidate] 名稱：E｜位置：5｜解決的問題：e｜與其他部件的關係：e｜決定：保留｜刪除測試：不能刪

## 例子迴流
- 處境：兩個方案
- 貫穿張力：同一結果為什麼帶出不同選擇
- 最自然的理解或反應：選確定方案
- 得到的結果：換種說法後選擇翻轉
- 證據或事件暴露的缺口：機率沒變卻無法解釋翻轉
- 被改寫的是 x / R / f / E 中哪一項：R，判斷參照改變
- 改寫後的結果：得失重新呈現
- 下一場景：誰決定參照點
- 最後回到哪裡：重新表述最初方案

## 具象化門
- 核心動作或變化：參照點改變，選擇方向隨之翻轉
- 原狀態：救援方案用存活人數表達
- 只改變的關鍵條件或動作：把存活人數改成死亡人數
- 可見結果：多數人的選擇從確定方案轉向冒險方案
- 角色、動作、方向與結果怎樣對應：數字不變，只改表達方向，選擇隨之翻轉
- 失敗或反例怎樣劃出邊界：熟悉框架效應的人可能不翻轉
- 刪掉解釋後，場景本身還能看見什麼：同一組數字換個方向，選擇就變了

## 反證檢查
- 當前理解：表述改變參照點
- 反證：熟練者可能不變
- 處理：限定適用條件
`;
}

function markdownNote(): string {
  return `title: 拆書：《示例》
subtitle: 某作者 | 一次判斷變化
description: 同一組結果換一種說法，選擇為什麼會翻轉。
date: 2026-08-12
tags: book,test
identifier: 20260812T120000

# 為什麼換一種說法，選擇就翻了

小李先選確定方案，換一種表述後卻改選冒險方案。這就是參照點在移動。

# 同一決定怎樣重新問一遍

他現在會先檢查參照條件，再決定怎樣行動。

# 讀完後應發生的變化

數字沒變，判斷卻可能因為起點變了而翻轉。這本書最後想留下的，是先看自己正從哪裡比較，再決定眼前的選擇是否真的不同。
`;
}

describe("validate ljg-book note", () => {
  test("accepts the dual whole-book identity and understanding-path contract", () => {
    const result = validate(note(), filename, coverage("完整拆書", "是——原書足以還原判斷怎樣被證據改變", "2"));
    expect(result.ok).toBe(true);
    expect(result.checks.material_grade).toBe("完整拆書");
    expect(result.checks.coverage_zones).toBe(4);
    expect(result.checks.coverage_whole_book_identity_fields).toBe(8);
    expect(result.checks.required_whole_book_anchor_count).toBe(3);
    expect(result.checks.required_whole_book_anchor_hits).toBe(3);
    expect(result.checks.missing_whole_book_anchors).toBe("");
    expect(result.checks.coverage_understanding_fields).toBe(10);
    expect(result.checks.coverage_runnable_fields).toBe(10);
    expect(result.checks.coverage_book_selection_fields).toBe(5);
    expect(result.checks.coverage_narrative_continuity_fields).toBe(5);
    expect(result.checks.coverage_candidate_count).toBe(5);
    expect(result.checks.coverage_generator_gate_present).toBe(true);
    expect(result.checks.generator_exists).toContain("是");
    expect(result.checks.coverage_generator_fields).toBe(8);
    expect(result.checks.generator_anchor_count).toBe(1);
    expect(result.checks.generator_anchor_hits).toBe(1);
    expect(result.checks.generator_early_anchor_hits).toBe(1);
    expect(result.checks.representation_required).toContain("否");
    expect(result.checks.frontstage_count).toBe(2);
    expect(result.checks.frontstage_complete_count).toBe(2);
    expect(result.checks.frontstage_missing_in_body).toBe("");
    expect(result.checks.frontstage_duplicate_responsibilities).toBe("");
    expect(result.checks.essence_heading_count).toBe(1);
    expect(result.checks.essence_is_last_heading).toBe(true);
    expect(result.checks.essence_paragraph_count).toBe(1);
    expect(result.checks.essence_sentence_count).toBe(2);
    expect(result.checks.essence_format_line_hits).toBe(0);
    expect(result.checks.coverage_essence_fields).toBe(4);
    expect(result.checks.coverage_title_answer).toContain("否");
    expect(result.checks.understanding_path_support).toContain("是");
    expect(result.checks.coverage_loop_fields).toBe(0);
    expect(result.checks.coverage_concretization_fields).toBe(0);
  });

  test("keeps Markdown notes on the same contract", () => {
    const result = validate(markdownNote(), filename.replace(/\.org$/, ".md"), coverage("初拆"));
    expect(result.ok).toBe(true);
    expect(result.checks.format).toBe("markdown");
    expect(result.checks.top_headings).toBe(2);
  });

  for (const count of [2, 4] as const) {
    test(`accepts ${count} content-led headings`, () => {
      const headings = [
        "四句話擺在眼前，你會不會點頭",
        "遮住最後一句，證據突然少了一塊",
        "一份比較結果怎樣改變選擇",
        "再看同一句話，你開始等哪種證據",
      ].slice(0, count);
      const result = validate(note({ headings }), filename, coverage());
      expect(result.ok).toBe(true);
      expect(result.checks.top_headings).toBe(count);
    });
  }

  test("accepts one body heading without imposing a chapter count", () => {
    const result = validate(note({ headings: ["四句話擺在眼前，你會不會點頭"], tail: "比較結果還需要進一步檢查。" }), filename, coverage());
    expect(result.ok).toBe(true);
    expect(result.checks.top_headings).toBe(1);
  });

  test("accepts ordinary headings without semantic forbidden words", () => {
    const result = validate(note({ headings: ["走進這個問題", "問題"] }), filename, coverage());
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("requires a substantive final essence section", () => {
    const missing = validate(note({ omitEssence: true }), filename, coverage());
    const empty = validate(note({ essenceBody: "" }), filename, coverage());
    expect(missing.ok).toBe(false);
    expect(missing.errors.join("\n")).toContain("最後必須有一級標題");
    expect(empty.ok).toBe(false);
    expect(empty.errors.join("\n")).toContain("不能為空");
  });

  test("requires the essence section to be last and rejects category lists", () => {
    const misplaced = validate(note({ afterEssence: "\n* 又補一個結論\n\n這段不該出現在精華之後。\n" }), filename, coverage());
    const oldLabels = validate(note({ essenceBody: "- *結構*：四句話先讓人點頭。\n- *洞見*：問題嚴重不等於辦法有效。\n- *模型*：再等待比較結果。" }), filename, coverage());
    expect(misplaced.ok).toBe(false);
    expect(misplaced.errors.join("\n")).toContain("最後一個一級標題");
    expect(oldLabels.ok).toBe(false);
    expect(oldLabels.errors.join("\n")).toContain("不能寫成分類清單");
  });

  test("allows the core to answer a load-bearing book title without listing anchors", () => {
    const result = validate(note({
      essenceBody: "所謂《表象與本質》，並不是越過表面去找一個永遠不變的標籤。真正的本質，是當前處境讓我們從許多可能關係裡抓住了哪一條。",
    }), filename, coverage().replace("- 是否需要回答書名：否——《示例》只是測試佔位標題，不承載核心關係", "- 是否需要回答書名：是——書名把固定標籤與當前關係的衝突放在一起"));
    expect(result.ok).toBe(true);
    expect(result.checks.essence_paragraph_count).toBe(1);
    expect(result.checks.coverage_title_answer).toContain("是");
  });

  test("rejects multiple essence paragraphs even when each is substantive", () => {
    const result = validate(note({
      essenceBody: "問題嚴重並不能直接推出處罰有效，理由與結論之間仍然缺少效果證據。\n\n真正的判斷要等比較結果進入以後，才能知道這項辦法是否值得采用。",
    }), filename, coverage());
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("只寫一個自然段");
  });

  test("records essence length without assessing concision", () => {
    const longEssence = `四句話和處罰之間的關係需要反覆檢查，${"比較結果必須真正補上理由與結論之間缺失的聯絡，".repeat(6)}否則問題再嚴重也不能證明辦法有效。`;
    const result = validate(note({ essenceBody: longEssence }), filename, coverage());
    expect(result.ok).toBe(true);
    expect(result.checks.essence_chars).toBeGreaterThan(160);
    expect(result.checks.essence_chars).toBeLessThanOrEqual(220);
    expect(result.warnings.join("\n")).not.toContain("可能還不夠精練");
  });

  test("does not infer a second summary from essence length", () => {
    const bloated = `四句話和處罰之間的關係需要反覆檢查，${"比較結果必須真正補上理由與結論之間缺失的聯絡，".repeat(12)}否則問題再嚴重也不能證明辦法有效。`;
    const result = validate(note({ essenceBody: bloated }), filename, coverage());
    expect(result.ok).toBe(true);
    expect(result.checks.essence_chars).toBeGreaterThan(220);
    expect(result.errors.join("\n")).not.toContain("變成另一份摘要");
  });

  test("requires the spiritual-core coverage and an explicit title decision", () => {
    const missing = validate(note(), filename, coverage().replace("- 正文中哪兩個相隔較遠的轉折共同托住它：開頭四句話讓人自然點頭；結尾回到同一句話等待比較結果", "- 正文中哪兩個相隔較遠的轉折共同托住它："));
    const undecided = validate(note(), filename, coverage().replace("- 是否需要回答書名：否——《示例》只是測試佔位標題，不承載核心關係", "- 是否需要回答書名：看情況"));
    expect(missing.ok).toBe(false);
    expect(missing.errors.join("\n")).toContain("兩個相隔轉折");
    expect(undecided.ok).toBe(false);
    expect(undecided.errors.join("\n")).toContain("必須明確寫是或否");
  });

  test("requires at least one source-specific anchor for partial notes", () => {
    const partialCoverage = coverage("初拆")
      .replace("- 正文必須出現的整書錨點：四句話｜處罰｜比較結果", "- 正文必須出現的整書錨點：");
    const result = validate(note(), filename, partialCoverage);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("初拆或假設版也必須宣告至少 1 個");
  });

  test("rejects visible backstage fields and missing description", () => {
    const calibration = validate(note({ tail: "\n* 資料校準\n\n- 某來源\n" }), filename, coverage());
    const grade = validate(note({ tail: "\n- 材料等級：完整拆書\n" }), filename, coverage());
    const description = validate(note({ description: "" }), filename, coverage());
    expect(calibration.ok).toBe(false);
    expect(grade.ok).toBe(false);
    expect(description.ok).toBe(false);
  });

  test("rejects exposed x/R/f/E labels", () => {
    const result = validate(note({ opening: "- *x*：處境\n- *R*：理解\n- *f*：行動\n- *E*：證據\n\n" }), filename, coverage());
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("x/R/f/E");
  });

  for (const label of ["第一章說明這段歷史如何開始。", "前言先交代了問題。", "作者在第3章給出例子。", "這些章節依次展開。"] as const) {
    test(`allows source-structure prose: ${label}`, () => {
      const result = validate(note({ firstBody: label }), filename, coverage());
      expect(result.ok).toBe(true);
      expect(result.errors.join("\n")).not.toContain("來源結構標籤");
    });
  }

  for (const sentence of ["居民走進城市中部。", "河流穿過大陸中部以後轉向東南。"] as const) {
    test(`allows ordinary spatial use of source-structure words: ${sentence}`, () => {
      const result = validate(note({ firstBody: sentence }), filename, coverage());
      expect(result.ok).toBe(true);
      expect(result.checks.source_structure_hits).toBe("not_assessed");
    });
  }

  test("rejects identifier mismatch and missing coverage", () => {
    const mismatch = validate(note({ identifier: "20260812T120001" }), filename, coverage());
    const missing = validate(note(), filename);
    expect(mismatch.ok).toBe(false);
    expect(missing.ok).toBe(false);
  });

  test("requires source boundary and valid material grade", () => {
    const boundary = validate(note(), filename, coverage("初拆").replace("- 能支援到：支援核心機制與邊界，不延伸到作者未討論的領域", "- 能支援到："));
    const grade = validate(note(), filename, coverage("初拆").replace("材料等級：初拆", "材料等級：大概讀過"));
    expect(boundary.ok).toBe(false);
    expect(grade.ok).toBe(false);
  });

  test("requires yes or no for understanding-path material support", () => {
    const result = validate(note(), filename, coverage("初拆", "也許可以"));
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("必須明確寫是或否");
  });

  test("rejects complete-book coverage when understanding-path support starts with no", () => {
    const result = validate(note(), filename, coverage("完整拆書", "否——只有目錄，無法看見認識怎樣改變"));
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("完整拆書");
    expect(result.errors.join("\n")).toContain("材料不足以支撐認識更新路徑");
  });

  test("requires all understanding-path fields when material says yes", () => {
    const incomplete = coverage("初拆").replace("- 新結果自然帶出什麼問題：還要排除哪些替代原因", "- 新結果自然帶出什麼問題：");
    const result = validate(note(), filename, incomplete);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("沒有填完具體處境、自然理解");
  });

  test("allows an honest no while warning against fabricated scenes", () => {
    const thin = coverage("初拆", "否——只有目錄，無法看見認識怎樣改變")
      .replace("- 讀者進入什麼具體處境：群裡轉來四句話，最後一句主張加重處罰", "- 讀者進入什麼具體處境：")
      .replace("- 哪個事實、事件或結果讓它不夠：遮住結論後，前三句只能證明問題存在", "- 哪個事實、事件或結果讓它不夠：");
    const result = validate(note(), filename, thin);
    expect(result.ok).toBe(true);
    expect(result.warnings.join("\n")).toContain("材料不足以支撐認識更新路徑");
  });

  test("keeps the previous runnable coverage readable with a migration warning", () => {
    const result = validate(note(), filename, legacyRunnableCoverage());
    expect(result.ok).toBe(true);
    expect(result.checks.runnable_support).toContain("是");
    expect(result.checks.coverage_runnable_fields).toBe(9);
    expect(result.warnings.join("\n")).toContain("舊版讀者執行門");
  });

  test("keeps legacy coverage readable with a migration warning", () => {
    const result = validate(note(), filename, legacyCoverage());
    expect(result.ok).toBe(true);
    expect(result.checks.runnable_support).toBe("legacy");
    expect(result.checks.coverage_embodiment_fields).toBe(7);
    expect(result.warnings.join("\n")).toContain("舊版現場化門");
  });

  test("rejects legacy complete coverage that has no whole-book identity gate", () => {
    const result = validate(note(), filename, legacyFullCoverage().replace("材料等級：初拆", "材料等級：完整拆書"));
    expect(result.ok).toBe(false);
    expect(result.checks.coverage_loop_fields).toBe(9);
    expect(result.checks.coverage_concretization_fields).toBe(7);
    expect(result.checks.coverage_legacy_narrative_selection_fields).toBe(0);
    expect(result.errors.join("\n")).toContain("整書身份");
  });

  test("rejects an incomplete whole-book identity gate", () => {
    const incomplete = coverage().replace("- 起點、主要變化與終點：從順勢點頭，到遮住結論發現缺口，再等待比較結果", "- 起點、主要變化與終點：");
    const result = validate(note(), filename, incomplete);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("整書身份");
  });

  test("rejects generic or absent whole-book anchors", () => {
    const generic = validate(note(), filename, coverage().replace("四句話｜處罰｜比較結果", "問題｜關係｜結論"));
    const absent = validate(note(), filename, coverage().replace("四句話｜處罰｜比較結果", "四句話｜處罰｜馬尾藻海"));
    expect(generic.ok).toBe(false);
    expect(generic.errors.join("\n")).toContain("過於通用");
    expect(absent.ok).toBe(false);
    expect(absent.errors.join("\n")).toContain("沒有出現在正文");
  });

  test("anti: a polished theme essay cannot pass as a complete book without identity", () => {
    const themeOnly = coverage().replace(/\n## 整書身份門[\s\S]*?(?=\n## 認識更新門)/, "\n");
    const result = validate(note(), filename, themeOnly);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("整書身份");
  });

  test("rejects incomplete full-book evidence, candidates, selection, and challenge", () => {
    const zone = validate(note(), filename, coverage().replace("[boundary]", "[missing]"));
    const candidate = validate(note(), filename, coverage().replace("名稱：E｜位置：5", "名稱：｜位置：5"));
    const selection = validate(note(), filename, coverage().replace("- 每次轉折怎樣由前一結果帶出下一問題：理由缺口要求效果證據，效果證據再要求排除替代原因", "- 每次轉折怎樣由前一結果帶出下一問題："));
    const challenge = validate(note(), filename, coverage().replace("- 處理：限定適用條件", "- 處理："));
    expect(zone.ok).toBe(false);
    expect(candidate.ok).toBe(false);
    expect(selection.ok).toBe(false);
    expect(challenge.ok).toBe(false);
  });

  test("rejects a complete-book map without narrative continuity", () => {
    const incomplete = coverage().replace("- 換序測試：先給比較結果會讓讀者不知道它在補哪一個缺口", "- 換序測試：");
    const result = validate(note(), filename, incomplete);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("敘事連續性門");
  });

  test("requires complete generator fields when a generator exists", () => {
    const incomplete = coverage("完整拆書", "是——原書足以還原判斷怎樣被證據改變", "2")
      .replace("- 結果方向或終點：讀者能夠指出結論還缺哪一種證據", "- 結果方向或終點：");
    const result = validate(note(), filename, incomplete);
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("解釋生成器門沒有填完");
  });

  test("accepts an explicit no-generator path without forcing a formula", () => {
    const noGenerator = coverage("初拆", "是——原書足以還原判斷怎樣被證據改變", "2")
      .replace("- 是否存在全書生成器：是——理由與結論之間的缺口生成了全書後續追問", "- 是否存在全書生成器：否——這篇敘事只逐漸照亮一個沒有被解決的關係")
      .replace("- 全書生成器：自然點頭 → 遮住結論 → 暴露理由缺口 → 等待效果證據 → 排除替代原因", "- 全書生成器：")
      .replace("- 輸入、起點或當前狀態：讀者看到四句話後順勢贊成加重處罰", "- 輸入、起點或當前狀態：")
      .replace("- 結果方向或終點：讀者能夠指出結論還缺哪一種證據", "- 結果方向或終點：")
      .replace("- 生成器怎樣貫穿至少兩個遠距轉折：開頭遮住結論發現缺口，結尾回到原句等待比較結果", "- 生成器怎樣貫穿至少兩個遠距轉折：")
      .replace("- 生成器在哪些條件、範圍或層級失效：材料已經直接提供效果比較時，不再需要從理由缺口起步", "- 生成器在哪些條件、範圍或層級失效：")
      .replace("- 正文生成器錨點：理由還沒有走到結論", "- 正文生成器錨點：")
      .replace("- 生成器是否需要在前兩個一級標題內執行：是——分析書應先交付讀懂後續案例所需的判斷關係", "- 生成器是否需要在前兩個一級標題內執行：否——敘事需要讓關係隨人物後果逐漸顯形");
    const result = validate(note(), filename, noGenerator);
    expect(result.ok).toBe(true);
    expect(result.checks.generator_exists).toContain("否");
  });

  test("rejects a declared generator anchor that appears too late", () => {
    const lateNote = note({
      firstBody: "四句話擺在小李面前。他先順勢點了頭。",
      tail: "\n理由還沒有走到結論。\n",
    });
    const result = validate(lateNote, filename, coverage("完整拆書", "是——原書足以還原判斷怎樣被證據改變", "2"));
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("前兩個一級標題");
  });

  test("requires an elected visual without treating carrier presence as semantic proof", () => {
    const visualCoverage = coverage("完整拆書", "是——原書足以還原判斷怎樣被證據改變", "2")
      .replace("- 是否需要視覺表示：否——理由鏈用同一句話重跑即可看清，不依賴空間位置", "- 是否需要視覺表示：是——兩條曲線的中心與兩端需要空間定位")
      .replace("- 視覺表示後用哪個載體執行：不需要——正文直接重跑四句話", "- 視覺表示後用哪個載體執行：比較結果");
    const missing = validate(note(), filename, visualCoverage);
    const diagram = "#+begin_example\ncenter -- result -- edge\n#+end_example";
    const withDiagram = note().replace("一份地區比較放回原來的判斷。", `${diagram}\n\n一份地區比較放回原來的判斷。`);
    const present = validate(withDiagram, filename, visualCoverage);
    const missingCarrier = validate(withDiagram, filename, visualCoverage.replace("視覺表示後用哪個載體執行：比較結果", "視覺表示後用哪個載體執行：馬尾藻海"));
    expect(missing.ok).toBe(false);
    expect(missing.errors.join("\n")).toContain("需要視覺表示");
    expect(present.ok).toBe(true);
    expect(present.semantic_assessment).toBe("not_performed");
    expect(missingCarrier.ok).toBe(true);
    expect(missingCarrier.semantic_assessment).toBe("not_performed");
  });

  test("requires complete frontstage carriers with unique responsibilities", () => {
    const contract = coverage("完整拆書", "是——原書足以還原判斷怎樣被證據改變", "2");
    const incomplete = contract.replace("｜結果或後果：遮住第四句後，處罰結論失去支援", "｜結果或後果：");
    const duplicate = contract.replace("唯一職責：把效果證據放回原判斷", "唯一職責：讓自然點頭真實失效");
    const missingBody = contract.replace("名稱：比較結果", "名稱：馬尾藻海");
    const a = validate(note(), filename, incomplete);
    const b = validate(note(), filename, duplicate);
    const c = validate(note(), filename, missingBody);
    expect(a.ok).toBe(false);
    expect(a.errors.join("\n")).toContain("前臺載體必須填完");
    expect(b.ok).toBe(false);
    expect(b.errors.join("\n")).toContain("唯一職責不能重複");
    expect(c.ok).toBe(false);
    expect(c.errors.join("\n")).toContain("沒有出現在正文");
  });

  test("allows long explanations without a length warning", () => {
    const longBody = "小李繼續沿著同一個問題檢查證據。新的事實不是補充材料，而是回答上一段留下的未知。".repeat(120);
    const result = validate(note({ tail: `\n${longBody}\n` }), filename, coverage());
    expect(result.ok).toBe(true);
    expect(result.checks.body_chars).toBeGreaterThan(3000);
    expect(result.warnings.join("\n")).not.toContain("1000–3000");
  });

  test("allows anchors and candidates to grow with the book", () => {
    const extraAnchors = ["遮住結論", "理由缺口", "效果證據", "替代原因", "重新判斷"];
    const expandedCoverage = coverage()
      .replace("四句話｜處罰｜比較結果", `四句話｜處罰｜比較結果｜${extraAnchors.join("｜")}`)
      .replace("\n## 全書取捨", `${Array.from({ length: 8 }, (_, index) => `\n- [candidate] 名稱：擴充套件${index + 1}｜位置：${index + 6}｜解決的問題：擴充套件問題${index + 1}｜與其他部件的關係：承接上一轉折｜決定：保留｜刪除測試：刪除會使轉折斷裂`).join("")}\n\n## 全書取捨`);
    const result = validate(note({ tail: `\n${extraAnchors.join("，")}。\n` }), filename, expandedCoverage);
    expect(result.ok).toBe(true);
    expect(result.checks.required_whole_book_anchor_count).toBe(8);
    expect(result.checks.coverage_candidate_count).toBe(13);
  });

  for (const opening of ["書中給出一段手機論證。", "敘述者帶著兒子騎摩托車遠行。"] as const) {
    test(`does not infer opening quality from attribution: ${opening}`, () => {
      const result = validate(note({ firstBody: opening }), filename, coverage());
      expect(result.ok).toBe(true);
      expect(result.warnings).toEqual([]);
    });
  }

  test("does not infer prose quality from stage phrasing or controlled comparisons", () => {
    const stage = validate(note({ firstBody: "小李讀完四句話。這一步彙集了全書對證據的盤問。" }), filename, coverage());
    const comparison = validate(note({ firstBody: "小李先點頭。保留同一組數字，只改變表達方式，選擇隨即翻轉。" }), filename, coverage());
    expect(stage.warnings).toEqual([]);
    expect(comparison.warnings).toEqual([]);
  });

  test("rejects backstage evidence accounting inside the explanation", () => {
    const result = validate(note({
      firstBody: "這組紙條、杯子和薄書是講解者依據舊稿區域性關係構造的最小模型。它不是書中案例，也不是本輪真實材料測試，不能替鋼材強度或工程結論作證。",
    }), filename, coverage());
    expect(result.ok).toBe(false);
    expect(result.checks.backstage_accounting_hits).toBeGreaterThan(0);
    expect(result.errors.join("\n")).toContain("後臺核驗語言");
  });

  test("rejects explicit current-run accounting only", () => {
    const result = validate(note({
      firstBody: "繼續運行同一講解模型。按模型規則，紙條被重新折起。舊稿儲存的邊界沒有變，本輪不替它補引數。模型設定到這裡結束。",
    }), filename, coverage());
    expect(result.ok).toBe(false);
    expect(result.checks.backstage_accounting_hits).toBe(1);
  });

  test("allows ordinary historical use of 本輪", () => {
    const result = validate(note({
      firstBody: "本輪通脹裡，企業第一次沒有擴產。原來只看價格的判斷，現在還得加入庫存和利率。",
    }), filename, coverage());
    expect(result.ok).toBe(true);
    expect(result.checks.backstage_accounting_hits).toBe(0);
  });

  for (const sentence of [
    "本輪材料價格上漲以後，企業第一次沒有擴產。",
    "他的舊稿儲存了戰爭前的城市地圖。",
    "根據舊稿修復城牆，反而暴露了地基裂縫。",
  ] as const) {
    test(`allows book content that shares words with backstage accounting: ${sentence}`, () => {
      const result = validate(note({ firstBody: sentence }), filename, coverage());
      expect(result.ok).toBe(true);
      expect(result.checks.backstage_accounting_hits).toBe(0);
    });
  }

  test("accepts an in-scene boundary stated through the object's limits", () => {
    const result = validate(note({
      firstBody: "桌上有十二根同樣長、同樣寬的紙條。把它們折成三角格，再首尾接起來。薄書還沒放上去，先猜一猜：材料一樣、數量一樣，它們托得住的重量會一樣嗎？紙條不會告訴你鋼梁能承受多少噸，卻已經把問題撥正：決定結果的不只有材料，還有材料怎樣連成一個整體。",
    }), filename, coverage());
    expect(result.ok).toBe(true);
    expect(result.checks.backstage_accounting_hits).toBe(0);
  });

  test("recognizes an immersive opening without requiring a naming formula", () => {
    const result = validate(note(), filename, coverage());
    expect(result.checks.outside_camera_opening_hits).toBe("not_assessed");
    expect(result.checks.meta_narration_hits).toBe("not_assessed");
  });

  test("accepts delayed naming when the understanding path remains concrete", () => {
    const result = validate(note({
      firstBody: "四句話擺在小李面前。他順著危險感點了頭。遮住最後一句以後，前三句話仍然成立，處罰卻不再是唯一答案。",
      headings: ["四句話擺在眼前", "處罰為什麼不再是唯一答案"],
    }), filename, coverage());
    expect(result.ok).toBe(true);
    expect(result.warnings.join("\n")).not.toContain("立即命名");
  });

  test("accepts a historical path whose question stays stable while scenes change", () => {
    const result = validate(note({
      firstBody: "港口剛開放時，商人只盯著更便宜的貨。幾年以後，稅收、造船和城市人口一起變了，原來那筆買賣已經裝不下它帶來的後果。",
      headings: ["一船便宜貨靠岸", "買賣怎樣改了整座城", "同一個問題來到下一座港口"],
    }), filename, coverage("初拆"));
    expect(result.ok).toBe(true);
  });

  test("accepts a literary path that clarifies a tension without solving it", () => {
    const result = validate(note({
      firstBody: "他在葬禮上沒有哭。周圍人先把這當成冷漠，後來審判談得最多的仍不是那場死亡，而是他的眼淚。一個人的情感方式開始替他的行為受審。",
      headings: ["葬禮上沒有出現的眼淚", "審判為什麼一直回到那一天", "看清矛盾，不替它收尾"],
    }), filename, coverage("初拆"));
    expect(result.ok).toBe(true);
  });

  test("records paragraph and sentence lengths without inferring overload", () => {
    const dense = "小李看著同一組數字，" + "一個關係又帶出另一個關係，".repeat(24) + "這就是概念擁擠。";
    const result = validate(note({ firstBody: dense }), filename, coverage());
    expect(result.ok).toBe(true);
    expect(result.checks.dense_paragraph_hits).toBeGreaterThan(0);
    expect(result.checks.long_sentence_hits).toBeGreaterThan(0);
    expect(result.warnings).toEqual([]);
  });

  test("rejects an over-wide ASCII diagram", () => {
    const diagram = `#+begin_example\n${"中".repeat(41)}\n#+end_example\n`;
    const result = validate(note({ diagram }), filename, coverage());
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("超過 80");
  });
});

// Independent v3 fixtures deliberately contain none of the legacy scene fields.
function v3Coverage(options: { partial?: boolean; unsupported?: boolean; generator?: boolean; visual?: boolean } = {}): string {
  const partial = options.partial ?? false;
  const unsupported = options.unsupported ?? false;
  const base = `# 覆蓋記錄
- 覆蓋合同版本：3
- 材料等級：${partial ? "初拆" : "完整拆書"}
- 主要材料：fixtures/source-book.txt 的已讀範圍
- 能支援到：${unsupported ? "僅目錄與開頭；全書理解未確定" : "全書關係與已標位置"}
- 材料能否支撐認識更新路徑：${unsupported ? "否——只有開頭" : "是——已讀全書"}
- 這是什麼型別或形態的書：${unsupported ? "未確定" : "以論證為主的書"}
- 核心理解：${unsupported ? "未確定" : "理由還沒有走到結論"}
- 正文必須出現的整書錨點：${partial ? "四句話" : "四句話｜處罰｜比較結果"}
`;
  if (unsupported) return base;
  return `${base}
- 起點、主要變化與終點：從四句話的自然點頭，到理由缺口遞迴到效果證據的前提
- 各部分怎樣相連：下一問回查上一判斷所依賴的前提
- 作者最想糾正或保留什麼：主張的力度必須與證據相稱
- [thread] 名稱：四句話｜起點：順勢相信處罰有效｜關鍵推進：逐次查問前提自身還依賴什麼｜前後變化：從點頭到等待比較結果｜換場理由：前提成為下一次待證主張｜依據與邊界：fixtures/source-book.txt:1-90，只壓縮原文
- 是否存在全書生成器：${options.generator ? "是——遞迴檢查前提" : "否——無需共同公式"}
${options.generator ? `- 全書生成器：把前提變成下一輪待證主張
- 生成器怎樣貫穿至少兩個遠距轉折：開頭檢查處罰，結尾檢查比較本身
- 生成器在哪些條件、範圍或層級失效：基礎證據仍有暫時接受的邊界
` : ""}- 是否需要視覺表示：${options.visual ? "是——需要排列比較關係" : "否——文字已經夠用"}
${options.visual ? "- 使用圖表的位置與目的：第二部分顯示兩次檢查的關係\n" : ""}
- [starting-point] 位置：source:1
- [pressure] 位置：source:20
- [revision] 位置：source:50
- [boundary] 位置：source:90
- 反證與取捨：保留反例，限制主張範圍
- 整書複述與關係重建：從結論倒查理由，理由的前提又成待證判斷
- 閱讀斷點與修訂：原來跳過效果比較，現補上為什麼需要比較
- 遮住末節後能否理解作者關切：是——正文兩次回查已可看出
- 正文中哪兩個相隔較遠的轉折共同托住它：四句話的缺口與比較結果的反查
${partial ? "" : Array.from({length: 5}, (_, index) => `- [candidate] 名稱：部件${index + 1}｜位置：source:${index + 1}｜解決的問題：當前前提是什麼｜與其他部件的關係：前後遞迴｜決定：保留｜刪除測試：會跳過前提`).join("\n")}
`;
}

function replaceField(record: string, field: string, value: string): string {
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return record.replace(new RegExp(`^- ${escaped}[：:][^\\n]*$`, "m"), `- ${field}：${value}`);
}

function orgToMarkdown(content: string): string {
  const names: Record<string, string> = { TITLE: "title", SUBTITLE: "subtitle", DESCRIPTION: "description", DATE: "date", FILETAGS: "tags", IDENTIFIER: "identifier" };
  return content.replace(/^#\+(TITLE|SUBTITLE|DESCRIPTION|DATE|FILETAGS|IDENTIFIER):/gm, (_, name: string) => `${names[name]}:`)
    .replace(/^\* /gm, "# ").replace(/^#\+begin_example$/gmi, "```text").replace(/^#\+end_example$/gmi, "```");
}

describe("coverage v3 structure and record integrity", () => {
  test("accepts premise recursion as one thread performing multiple functions", () => {
    const record = v3Coverage({generator: true});
    const result = validate(note(), filename, record);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.checks.coverage_contract_version).toBe("3");
    expect(result.checks.thread_count).toBe(1);
    expect(result.checks.coverage_generator_fields).toBe(3);
    expect(result.checks.coverage_understanding_fields).toBe(0);
    expect(result.semantic_assessment).toBe("not_performed");
    expect(result.assessment_scope).toBe("結構與記錄完整性；不證明來源準確、閱讀連續或理解效果");
  });

  test("accepts multiple literary threads with overlapping functions and no shared generator", () => {
    let record = v3Coverage();
    record = replaceField(record, "這是什麼型別或形態的書", "交錯敘述的文學作品");
    record += "\n- [thread] 名稱：處罰｜起點：人物被判定｜關鍵推進：審判改變自我認識｜前後變化：從他人評價回到自問｜換場理由：另一人物承受同樣評判｜依據與邊界：source:20-60，未解決衝突\n";
    const result = validate(note(), filename, record);
    expect(result.ok).toBe(true);
    expect(result.checks.thread_count).toBe(2);
    expect(result.checks.generator_exists).toContain("否");
  });

  for (const field of ["主要材料", "能支援到", "材料能否支撐認識更新路徑", "這是什麼型別或形態的書", "起點、主要變化與終點", "核心理解", "各部分怎樣相連", "作者最想糾正或保留什麼", "正文必須出現的整書錨點", "反證與取捨", "整書複述與關係重建", "閱讀斷點與修訂", "遮住末節後能否理解作者關切", "正文中哪兩個相隔較遠的轉折共同托住它"]) {
    test(`rejects missing new-contract field ${field} directly`, () => {
      expect(validate(note(), filename, replaceField(v3Coverage(), field, "")).ok).toBe(false);
    });
  }

  test("reads the combined start/change/end field as one exact template key", () => {
    const record = replaceField(v3Coverage(), "起點、主要變化與終點", "") + "\n- 起點：有起點\n- 主要變化與終點：有變化終點\n";
    expect(validate(note(), filename, record).errors.join("\n")).toContain("起點、主要變化與終點");
  });

  test("requires declared generator boundaries as one exact field", () => {
    const record = replaceField(v3Coverage({generator: true}), "生成器在哪些條件、範圍或層級失效", "");
    expect(validate(note(), filename, record).errors.join("\n")).toContain("生成器在哪些條件、範圍或層級失效");
  });

  test("requires complete thread fields and names in the narrative", () => {
    const absent = v3Coverage().replace(/^- \[thread\].*$/m, "");
    const incomplete = v3Coverage().replace("｜關鍵推進：逐次查問前提自身還依賴什麼", "｜關鍵推進：");
    const missingName = v3Coverage().replace("[thread] 名稱：四句話", "[thread] 名稱：失蹤人物");
    for (const record of [absent, incomplete, missingName]) expect(validate(note(), filename, record).ok).toBe(false);
  });

  test("requires source positions, candidate completeness and five complete-book candidates", () => {
    for (const record of [
      v3Coverage().replace("[pressure] 位置：source:20", "[pressure] 位置："),
      v3Coverage().replace(/^- \[candidate\].*$/m, ""),
      v3Coverage().replace("名稱：部件1", "名稱："),
      v3Coverage().replace("決定：保留", "決定：猜測"),
    ]) expect(validate(note(), filename, record).ok).toBe(false);
  });

  test("rejects absent anchors in both full and partial records", () => {
    for (const partial of [true, false]) {
      const record = replaceField(v3Coverage({partial}), "正文必須出現的整書錨點", "四句話｜處罰｜未出現的物件");
      expect(validate(note(), filename, record).errors.join("\n")).toContain("沒有出現在正文");
    }
    expect(validate(note(), filename, replaceField(v3Coverage(), "正文必須出現的整書錨點", "四句話")).ok).toBe(false);
  });

  test("allows unsupported partial understanding to remain undetermined without fabricated scenes", () => {
    const record = v3Coverage({partial: true, unsupported: true});
    const result = validate(note(), filename, record);
    expect(result.ok).toBe(true);
    expect(result.checks.thread_count).toBe(0);
    expect(result.checks.coverage_zones).toBe(0);
    expect(result.semantic_assessment).toBe("not_performed");
    expect(validate(note(), filename, replaceField(record, "核心理解", "")).ok).toBe(false);
    expect(validate(note(), filename, replaceField(record, "材料等級", "完整拆書")).ok).toBe(false);
  });

  test("accepts normal structure statements and author attribution without style warnings", () => {
    const result = validate(note({firstBody: "第一章提出四句話。作者指出，處罰的理由需要比較結果才能成立。"}), filename, v3Coverage());
    expect(result.ok).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  for (const format of ["org", "markdown"]) {
    test(`accepts multiple diagrams and a real ${format} table`, () => {
      const diagram = "#+begin_example\nA --> B\n#+end_example\n\n#+begin_example\nB --> C\n#+end_example\n\n";
      const table = format === "org" ? "| 物件 | 結果 |\n|------+------|\n| A | B |\n" : "| 物件 | 結果 |\n| --- | --- |\n| A | B |\n";
      let content = note({diagram: diagram + table});
      if (format === "markdown") content = orgToMarkdown(content);
      const result = validate(content, filename.replace(/org$/, format === "org" ? "org" : "md"), v3Coverage({visual: true}));
      expect(result.errors).toEqual([]);
      expect(result.checks.example_blocks).toBe(2);
      expect(result.checks.table_blocks).toBe(1);
      expect(result.semantic_assessment).toBe("not_performed");
    });
    test(`accepts a ${format} table as the only visual`, () => {
      const table = format === "org" ? "| 物件 | 結果 |\n| A | B |\n" : "| 物件 | 結果 |\n| --- | --- |\n| A | B |\n";
      let content = note({diagram: table});
      if (format === "markdown") content = orgToMarkdown(content);
      const result = validate(content, filename.replace(/org$/, format === "org" ? "org" : "md"), v3Coverage({visual: true}));
      expect(result.ok).toBe(true);
      expect(result.checks.example_blocks).toBe(0);
      expect(result.checks.table_blocks).toBe(1);
    });
  }

  test("requires an actual visual and its recorded purpose, not just a carrier keyword", () => {
    expect(validate(note(), filename, v3Coverage({visual: true})).errors.join("\n")).toContain("實際 example 圖塊或表格");
    const diagramNote = note({diagram: "#+begin_example\nA --> B\n#+end_example\n"});
    expect(validate(diagramNote, filename, replaceField(v3Coverage({visual: true}), "使用圖表的位置與目的", "")).ok).toBe(false);
    const result = validate(diagramNote, filename, v3Coverage({visual: true}));
    expect(result.ok).toBe(true);
    expect(result.semantic_assessment).toBe("not_performed");
  });

  test("rejects over-wide non-first diagrams and wide tables", () => {
    const diagram = `#+begin_example\nA --> B\n#+end_example\n\n#+begin_example\n${"中".repeat(41)}\n#+end_example\n`;
    expect(validate(note({diagram}), filename, v3Coverage()).errors.join("\n")).toContain("第 2 個 ASCII 圖寬度 82，超過 80");
    const table = `| ${"中".repeat(41)} |\n| A |\n`;
    expect(validate(note({diagram: table}), filename, v3Coverage()).errors.join("\n")).toContain("表格寬度");
  });

  test("still checks identifiers and required note metadata on v3", () => {
    expect(validate(note({identifier: "20260812T120001"}), filename, v3Coverage()).ok).toBe(false);
    expect(validate(note({description: ""}), filename, v3Coverage()).ok).toBe(false);
  });
});

describe("visual record edge cases", () => {
  test("does not count an empty example as an actual diagram", () => {
    const result = validate(note({diagram: "#+begin_example\n\n#+end_example\n"}), filename, v3Coverage({visual: true}));
    expect(result.ok).toBe(false);
    expect(result.checks.example_blocks).toBe(0);
  });
  test("does not count a table quoted inside unrelated Markdown code as a rendered table", () => {
    const content = orgToMarkdown(note({diagram: "```javascript\n| A | B |\n| --- | --- |\n| C | D |\n```\n"}));
    const result = validate(content, filename.replace(/org$/, "md"), v3Coverage({visual: true}));
    expect(result.ok).toBe(false);
    expect(result.checks.table_blocks).toBe(0);
  });
  test("handles more than one diagram and flags a wide later diagram in Markdown", () => {
    const diagram = `#+begin_example\nA --> B\n#+end_example\n\n#+begin_example\n${"x".repeat(81)}\n#+end_example\n`;
    const result = validate(orgToMarkdown(note({diagram})), filename.replace(/org$/, "md"), v3Coverage());
    expect(result.errors.join("\n")).toContain("第 2 個 ASCII 圖寬度 81，超過 80");
  });
});

describe("coverage version dispatch", () => {
  test("accepts legacy both explicitly and without a version", () => {
    for (const prefix of ["", "- 覆蓋合同版本：legacy\n"]) {
      expect(validate(note(), filename, prefix + legacyCoverage()).ok).toBe(true);
    }
  });
  test("rejects an unknown contract instead of silently treating it as legacy", () => {
    const result = validate(note(), filename, "- 覆蓋合同版本：99\n" + legacyCoverage());
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("不受支援");
  });
});

describe("live coverage template contract", () => {
  test("validates a filled copy of the actual v3 template without legacy field synthesis", () => {
    const template = readFileSync(new URL("../references/coverage-map.md", import.meta.url), "utf8");
    const values: Record<string, string> = {
      "覆蓋合同版本": "3", "材料等級": "完整拆書", "材料能否支撐認識更新路徑": "是——全書已讀",
      "是否存在全書生成器": "是——遞迴檢查證據前提", "是否需要視覺表示": "否——文字足夠",
      "正文必須出現的整書錨點": "四句話｜處罰｜比較結果",
    };
    const filled = template.split("\n").map((line) => {
      if (line.startsWith("- [thread]")) return "- [thread] 名稱：四句話｜起點：點頭｜關鍵推進：查前提｜前後變化：等待證據｜換場理由：前提仍待證｜依據與邊界：source:1-90";
      if (line.startsWith("- [candidate]")) return "- [candidate] 名稱：候選｜位置：source:1｜解決的問題：理由缺什麼｜與其他部件的關係：遞迴｜決定：保留｜刪除測試：關係斷開";
      if (/^- \[(?:starting-point|pressure|revision|boundary)\]/.test(line)) return line.replace("位置：", "位置：source:1").replace("證據：", "證據：原文內容");
      return line.replace(/^- ([^：]+)：.*$/, (_, key: string) => `- ${key}：${values[key] ?? "按全書已讀內容記錄"}`);
    }).join("\n");
    const result = validate(note(), filename, filled);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.checks.coverage_whole_book_identity_fields).toBe(6);
    expect(result.checks.thread_complete_count).toBe(1);
    expect(result.semantic_assessment).toBe("not_performed");
  });
  test("supported partial records need not invent four full-book evidence zones", () => {
    const record = v3Coverage({partial: true}).replace(/^- \[(?:pressure|revision|boundary)\].*$/gm, "");
    const result = validate(note(), filename, record);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.checks.coverage_zones).toBe(1);
  });
});

test("declared partial evidence still needs its recorded location", () => {
  const record = v3Coverage({partial: true}).replace("[pressure] 位置：source:20", "[pressure] 位置：");
  expect(validate(note(), filename, record).errors.join("\n")).toContain("已宣告的來源證據必須寫明位置");
});

describe("body existence without stylistic heading gates", () => {
  test("allows a simple partial note with one normally named section", () => {
    const result = validate(note({headings: ["問題"], firstBody: "四句話提出的問題，目前只能從開頭確認。"}), filename, v3Coverage({partial: true, unsupported: true}));
    expect(result.ok).toBe(true);
  });
  test("rejects a note with only the final section", () => {
    const result = validate(note({headings: []}), filename, v3Coverage({partial: true, unsupported: true}));
    expect(result.errors.join("\n")).toContain("至少需要 1 個正文一級標題");
    expect(result.errors.join("\n")).toContain("必須有非空正文");
  });
  test("rejects an empty body before the final section", () => {
    const result = validate(note({headings: ["問題"], firstBody: ""}), filename, v3Coverage({partial: true, unsupported: true}));
    expect(result.errors.join("\n")).toContain("必須有非空正文");
  });
  test("rejects generic words passed as v3 source anchors", () => {
    const record = replaceField(v3Coverage(), "正文必須出現的整書錨點", "關係｜問題｜方法");
    const result = validate(note({tail: "關係、問題、方法。"}), filename, record);
    expect(result.errors.join("\n")).toContain("整書錨點過於通用");
  });
});

test("reports removed style checks as not assessed even when chapter and author language is present", () => {
  const result = validate(note({firstBody: "第一章給出四句話。作者指出，處罰的理由還需要比較結果支援。"}), filename, v3Coverage());
  expect(result.ok).toBe(true);
  for (const key of ["generic_heading_hits", "source_structure_hits", "outside_camera_opening_hits", "meta_narration_hits"]) {
    expect(result.checks[key]).toBe("not_assessed");
  }
  expect(typeof result.checks.max_paragraph_chars).toBe("number");
  expect(typeof result.checks.max_sentence_chars).toBe("number");
  expect(result.semantic_assessment).toBe("not_performed");
});
