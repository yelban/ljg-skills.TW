#!/usr/bin/env bun

import { readFileSync } from "node:fs";
import { basename } from "node:path";

export type Result = {
  /** ok only reports the structural checks below, never reading quality. */
  ok: boolean;
  assessment_scope: "結構與記錄完整性；不證明來源準確、閱讀連續或理解效果";
  semantic_assessment: "not_performed";
  file: string;
  errors: string[];
  warnings: string[];
  checks: Record<string, number | string | boolean>;
};

const validMaterialGrades = ["完整拆書", "初拆", "假設版"] as const;
const essenceHeading = "讀完後應發生的變化";
const legacyCoverageLoopFields = [
  "處境",
  "貫穿張力",
  "最自然的理解或反應",
  "得到的結果",
  "證據或事件暴露的缺口",
  "被改寫的是 x / R / f / E 中哪一項",
  "改寫後的結果",
  "下一場景",
  "最後回到哪裡",
];
const legacyConcretizationFields = [
  "核心動作或變化",
  "原狀態",
  "只改變的關鍵條件或動作",
  "可見結果",
  "角色、動作、方向與結果怎樣對應",
  "失敗或反例怎樣劃出邊界",
  "刪掉解釋後，場景本身還能看見什麼",
];
const legacyEmbodimentFields = [
  "鏡頭站在哪裡",
  "讀者或人物先看見什麼",
  "解釋出現前會怎樣判斷或行動",
  "這個判斷先產生什麼可見結果",
  "哪條證據、事件或物件反饋打斷它",
  "命名以後回到哪一幕重跑",
  "原書依據與簡化邊界",
];
const legacyRunnableFields = [
  "讀者先問什麼",
  "穩定物件或最小模型",
  "讀者第一次會猜什麼",
  "最小動作或變化",
  "立刻出現的結果",
  "結果緊接著叫什麼",
  "同一物件怎樣再執行",
  "陌生讀者能怎樣複述",
  "原書依據與簡化邊界",
];
const understandingPathFields = [
  "讀者進入什麼具體處境",
  "最初最自然會怎樣理解",
  "哪個事實、事件或結果讓它不夠",
  "作者增加了什麼關係或條件",
  "回看原處境，什麼已經改變",
  "新結果自然帶出什麼問題",
  "貫穿全文的扶手",
  "結尾回到哪裡",
  "陌生讀者能怎樣複述",
  "原書依據與簡化邊界",
];
const wholeBookIdentityFields = [
  "這是什麼型別或形態的書",
  "字面上跟著誰、什麼物件或什麼問題展開",
  "起點、主要變化與終點",
  "不可省略的主線",
  "主線為什麼屬於同一本書",
  "正文必須出現的整書錨點",
  "三十秒整書複述",
  "可遷移性反測",
];
const genericWholeBookAnchors = new Set([
  "問題",
  "關係",
  "變化",
  "結果",
  "理解",
  "判斷",
  "結論",
  "主題",
  "作者",
  "本書",
  "讀者",
  "證據",
  "邊界",
  "方法",
  "概念",
]);
const bookSelectionFields = [
  "貫穿全書的困惑或張力",
  "正文保留哪些必要轉折",
  "為什麼這些轉折足以讓讀者理解全書主幹",
  "哪些重要內容留在後臺而不進入正文",
  "每次轉折怎樣由前一結果帶出下一問題",
];
const narrativeContinuityFields = [
  "開篇留下的真實問題",
  "轉折鏈",
  "每次換場為什麼不可提前",
  "換序測試",
  "摘句拼接反測",
];
const generatorFields = [
  "全書生成器",
  "輸入、起點或當前狀態",
  "結果方向或終點",
  "生成器怎樣貫穿至少兩個遠距轉折",
  "生成器在哪些條件、範圍或層級失效",
  "正文生成器錨點",
  "生成器是否需要在前兩個一級標題內執行",
  "是否需要視覺表示",
];
const frontstageFields = [
  "名稱",
  "唯一職責",
  "設定或起點",
  "結果或後果",
  "改變的關係",
  "下一問",
];
const v3WholeBookFields = [
  "這是什麼型別或形態的書", "起點、主要變化與終點", "核心理解",
  "各部分怎樣相連", "作者最想糾正或保留什麼", "正文必須出現的整書錨點",
];
const v3ThreadFields = ["名稱", "起點", "關鍵推進", "前後變化", "換場理由", "依據與邊界"];
const v3ReviewFields = [
  "反證與取捨", "整書複述與關係重建", "閱讀斷點與修訂",
  "遮住末節後能否理解作者關切", "正文中哪兩個相隔較遠的轉折共同托住它",
];
const v3GeneratorFields = [
  "全書生成器", "生成器怎樣貫穿至少兩個遠距轉折", "生成器在哪些條件、範圍或層級失效",
];
const legacyBookSelectionFields = [
  "貫穿全書的普通問題",
  "正文保留哪兩到四個關係",
  "為什麼這些關係足以讓讀者理解全書主幹",
  "哪些重要內容留在後臺而不進入正文",
  "各模組如何繼續使用同一物件，或為什麼必須換物件",
];
const legacyNarrativeSelectionFields = [
  "開頭用哪件具體事情",
  "為什麼它能承載貫穿張力",
  "一個場景是否夠用",
  "若不夠，前一個結果怎樣產生下一個場景",
  "標題將用哪些事件、變化或條件命名",
  "返程後，原來的看法在哪裡改變",
];

function displayWidth(line: string): number {
  return [...line].reduce((width, char) => width + (char.codePointAt(0)! > 127 ? 2 : 1), 0);
}

function lineField(content: string, field: string): string {
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return content.match(new RegExp(`^- ${escaped}[：:][ \\t]*([^\\n]*)$`, "m"))?.[1]?.trim() ?? "";
}

function substantive(value: string): boolean {
  return Boolean(value) && value !== "未找到" && !/[{}]/.test(value);
}

function yesNoDecision(value: string): boolean {
  return /^(?:是|否)(?:\b|[—：:，,。\s]|$)/.test(value);
}

function parseWholeBookAnchors(value: string): string[] {
  return [...new Set(value.split(/[｜|]/).map((anchor) => anchor.trim()).filter(Boolean))];
}

function segmentField(line: string, field: string): string {
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return line.match(new RegExp(`${escaped}[：:]\\s*([^｜|\\n]*)`))?.[1]?.trim() ?? "";
}

function locationForZone(content: string, zone: string): string {
  const line = content.match(new RegExp(`^- \\[${zone}\\][^\\n]*$`, "m"))?.[0] ?? "";
  return line.match(/位置[：:]\s*([^｜|\n]*)/)?.[1]?.trim() ?? "";
}

export function validate(content: string, file: string, coverage?: string): Result {
  const errors: string[] = [];
  const warnings: string[] = [];
  const markdownMode = file.toLowerCase().endsWith(".md");
  const requiredHeaders = markdownMode
    ? ["title", "subtitle", "description", "date", "tags", "identifier"]
    : ["TITLE", "SUBTITLE", "DESCRIPTION", "DATE", "FILETAGS", "IDENTIFIER"];

  for (const header of requiredHeaders) {
    const pattern = markdownMode
      ? new RegExp(`^${header}:\\s*\\S`, "mi")
      : new RegExp(`^#\\+${header}:\\s*\\S`, "mi");
    if (!pattern.test(content)) {
      errors.push(`缺少或為空的 ${markdownMode ? header : `#+${header}`}`);
    }
  }

  const identifier = markdownMode
    ? content.match(/^identifier:\s*(\S+)/mi)?.[1] ?? ""
    : content.match(/^#\+IDENTIFIER:\s*(\S+)/mi)?.[1] ?? "";
  const filenameIdentifier = basename(file).match(/^(\d{8}T\d{6})--/)?.[1] ?? "";
  if (!filenameIdentifier) {
    errors.push("檔名不是 Denote 時間戳格式");
  } else if (identifier !== filenameIdentifier) {
    errors.push(`IDENTIFIER ${identifier || "為空"} 與檔名 ${filenameIdentifier} 不一致`);
  }

  const headingPattern = markdownMode ? /^# ([^#].*)$/gm : /^\* ([^*].*)$/gm;
  const headingMatches = [...content.matchAll(headingPattern)];
  const allHeadings = headingMatches.map((match) => match[1].trim());
  const essenceHeadingIndexes = allHeadings
    .map((heading, index) => heading === essenceHeading ? index : -1)
    .filter((index) => index >= 0);
  const essenceHeadingIndex = essenceHeadingIndexes[0] ?? -1;
  const essenceHeadingMatch = essenceHeadingIndex >= 0 ? headingMatches[essenceHeadingIndex] : undefined;
  const essenceSection = essenceHeadingMatch?.index !== undefined
    ? content.slice(essenceHeadingMatch.index + essenceHeadingMatch[0].length).trim()
    : "";
  const headings = allHeadings.filter((heading) => heading !== essenceHeading);
  if (headings.length < 1) {
    errors.push("末節以前至少需要 1 個正文一級標題");
  }

  if (essenceHeadingIndexes.length === 0) {
    errors.push(`成品最後必須有一級標題“${essenceHeading}”`);
  } else if (essenceHeadingIndexes.length > 1) {
    errors.push(`一級標題“${essenceHeading}”只能出現一次`);
  } else if (essenceHeadingIndex !== allHeadings.length - 1) {
    errors.push(`“${essenceHeading}”必須是成品最後一個一級標題`);
  }

  const essenceParagraphs = essenceSection
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const essenceText = essenceParagraphs.join(" ").replace(/\s+/g, " ").trim();
  const essenceChars = [...essenceText.replace(/\s/g, "")].length;
  const essenceSentenceCount = essenceText
    .split(/[。！？]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean).length;
  const essenceFormatLineHits = [...essenceSection.matchAll(/^(?:[-+] |\d+[.)] |(?:\*{2,}|#{2,}) )/gm)].length;
  if (essenceHeadingIndexes.length === 1) {
    if (essenceParagraphs.length !== 1) {
      errors.push(`“${essenceHeading}”只寫一個自然段，當前為 ${essenceParagraphs.length} 段`);
    }
    if (essenceFormatLineHits > 0) {
      errors.push(`“${essenceHeading}”不能寫成分類清單或子標題；結構、洞見、模型等只在後臺幫助尋找精神核心`);
    }
    if (essenceChars === 0) errors.push(`“${essenceHeading}”不能為空`);
  }

  const legacyTriadPattern = markdownMode
    ? /^- \*\*(?:x|R|f|E|f\(x\))\*\*[：:].+$/gmi
    : /^- \*(?:x|R|f|E|f\(x\))\*[：:].+$/gmi;
  const legacyTriadHits = [...content.matchAll(legacyTriadPattern)];
  const internalHeadingPattern = markdownMode
    ? /^# (?:x|R|f|E|f\(x\))[：:].+$/gmi
    : /^\* (?:x|R|f|E|f\(x\))[：:].+$/gmi;
  const internalHeadingHits = [...content.matchAll(internalHeadingPattern)];
  if (legacyTriadHits.length > 0 || internalHeadingHits.length > 0) {
    errors.push("成品不能暴露 x/R/f/E 或舊 x/f/f(x) 分析標籤");
  }

  const calibrationHits = [...content.matchAll(/資料校準/g)].length;
  if (calibrationHits > 0) {
    errors.push("成品不能出現獨立的研究校準章節或標籤");
  }
  const visibleMaterialGradeHits = [...content.matchAll(/材料等級[：:]/g)].length;
  if (visibleMaterialGradeHits > 0) {
    errors.push("材料等級只能寫在後臺覆蓋記錄，不能出現在成品");
  }

  const bodyStart = headingMatches[0]?.index ?? -1;
  const narrativeBody = bodyStart >= 0 ? content.slice(bodyStart) : "";
  const beforeEssence = bodyStart >= 0 ? content.slice(bodyStart, essenceHeadingMatch?.index ?? content.length) : "";
  const bodyText = beforeEssence.replace(markdownMode ? /^#{1,6} .*$/gm : /^\*+ .*$/gm, "").trim();
  if (!bodyText) errors.push("末節以前必須有非空正文");
  // Only explicit run/accounting language is checked. Ordinary author attribution,
  // source structure, model descriptions and limitations require human reading.
  const backstageAccountingPatterns = [
    /本輪[^。！？\n]{0,24}(?:核驗|核到|讀取|提取|查到|驗證|未核|未查|不替|未替|補寫|補充)[^。！？\n]*/g,
    /本輪(?:真實|現有|已有)?材料(?:測試|核驗|讀取|提取|檢查|驗證)[^。！？\n]*/g,
  ];
  const backstageAccountingHits = backstageAccountingPatterns.flatMap((pattern) =>
    [...narrativeBody.matchAll(pattern)].map((match) => match[0]),
  );
  if (backstageAccountingHits.length > 0) {
    errors.push(`正文含後臺核驗語言：${[...new Set(backstageAccountingHits)].join("、")}；請將本輪核驗記錄移回 coverage`);
  }

  const proseParagraphs = narrativeBody
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph && !/^(?:\*|#|\+|- )/.test(paragraph));
  const paragraphSizes = proseParagraphs.map((paragraph) => [...paragraph.replace(/\s/g, "")].length);
  const maxParagraphChars = paragraphSizes.length ? Math.max(...paragraphSizes) : 0;
  const denseParagraphHits = paragraphSizes.filter((size) => size > 220).length;

  const sentenceSizes = proseParagraphs.flatMap((paragraph) =>
    paragraph.split(/[。！？；]/).map((sentence) => [...sentence.replace(/\s/g, "")].length).filter(Boolean),
  );
  const maxSentenceChars = sentenceSizes.length ? Math.max(...sentenceSizes) : 0;
  const longSentenceHits = sentenceSizes.filter((size) => size > 90).length;

  let materialGrade = "";
  let understandingPathSupport = "";
  let coverageZones = 0;
  let coverageLoopFields = 0;
  let coverageConcretizationFields = 0;
  let coverageEmbodimentFields = 0;
  let coverageRunnableFields = 0;
  let coverageUnderstandingFields = 0;
  let coverageWholeBookIdentityFields = 0;
  let requiredWholeBookAnchors: string[] = [];
  let requiredWholeBookAnchorHits = 0;
  let missingWholeBookAnchors: string[] = [];
  let genericWholeBookAnchorHits: string[] = [];
  let coverageEssenceFields = 0;
  let coverageTitleAnswer = "";
  let coverageBookSelectionFields = 0;
  let coverageNarrativeContinuityFields = 0;
  let coverageLegacyNarrativeSelectionFields = 0;
  let coverageCandidateCount = 0;
  let coverageContractVersion = "legacy";
  let coverageGeneratorGatePresent = false;
  let generatorExists = "";
  let coverageGeneratorFields = 0;
  let generatorAnchorCount = 0;
  let generatorAnchorHits = 0;
  let generatorEarlyAnchorHits = 0;
  let generatorEarlyDecision = "";
  let representationRequired = "";
  let representationRunAnchor = "";
  let threadCount = 0;
  let threadCompleteCount = 0;
  let threadMissingInBody: string[] = [];
  let representationPurpose = "";
  let frontstageCount = 0;
  let frontstageCompleteCount = 0;
  let frontstageMissingInBody: string[] = [];
  let frontstageDuplicateResponsibilities: string[] = [];
  if (!coverage) {
    errors.push("所有拆書都必須提供 --coverage 後臺覆蓋記錄");
  } else {
    const declaredCoverageVersion = lineField(coverage, "覆蓋合同版本");
    coverageContractVersion = declaredCoverageVersion || "legacy";
    if (declaredCoverageVersion && !["2", "3", "legacy"].includes(declaredCoverageVersion)) {
      errors.push(`覆蓋記錄版本 ${declaredCoverageVersion} 不受支援；當前版本為 3，相容 2 與 legacy`);
    }

    materialGrade = lineField(coverage, "材料等級");
    if (!validMaterialGrades.includes(materialGrade as (typeof validMaterialGrades)[number])) {
      errors.push("覆蓋記錄的材料等級必須是：完整拆書 / 初拆 / 假設版");
    }

    const sourceBoundaryFields = ["主要材料", "能支援到"].filter((field) => substantive(lineField(coverage, field))).length;
    if (sourceBoundaryFields !== 2) {
      errors.push("覆蓋記錄必須寫明主要材料與能支援到哪裡");
    }
    if (coverageContractVersion === "3") {
      const requireFields = (fields: string[]) => {
        for (const field of fields) {
          if (!substantive(lineField(coverage, field))) errors.push(`覆蓋記錄版本 3 缺少或為空的欄位：${field}`);
        }
      };
      understandingPathSupport = lineField(coverage, "材料能否支撐認識更新路徑");
      if (!yesNoDecision(understandingPathSupport)) {
        errors.push("“材料能否支撐認識更新路徑”必須明確寫是或否，並說明依據");
      }
      const supported = /^是/.test(understandingPathSupport);
      const complete = materialGrade === "完整拆書";
      if (!supported && complete) errors.push("完整拆書不能通過：材料不足以支撐認識更新路徑");
      if (/^否/.test(understandingPathSupport) && !complete) {
        warnings.push("材料不足以支撐認識更新路徑；僅檢查材料能支援的記錄，未支援的理解可寫未確定，不能虛構經歷");
      }
      // Partial unsupported records still identify the book and state the core's uncertainty.
      requireFields(supported || complete ? v3WholeBookFields : ["這是什麼型別或形態的書", "核心理解", "正文必須出現的整書錨點"]);
      coverageWholeBookIdentityFields = v3WholeBookFields.filter((field) => substantive(lineField(coverage, field))).length;
      requiredWholeBookAnchors = parseWholeBookAnchors(lineField(coverage, "正文必須出現的整書錨點"));
      missingWholeBookAnchors = requiredWholeBookAnchors.filter((anchor) => !narrativeBody.includes(anchor));
      requiredWholeBookAnchorHits = requiredWholeBookAnchors.length - missingWholeBookAnchors.length;
      genericWholeBookAnchorHits = requiredWholeBookAnchors.filter((anchor) => genericWholeBookAnchors.has(anchor));
      if (genericWholeBookAnchorHits.length) errors.push(`整書錨點過於通用：${genericWholeBookAnchorHits.join("、")}`);
      const minimumAnchors = complete ? 3 : 1;
      if (requiredWholeBookAnchors.length < minimumAnchors) errors.push(`${materialGrade || "拆書"}必須宣告至少 ${minimumAnchors} 個正文整書錨點`);
      if (missingWholeBookAnchors.length) errors.push(`這些整書錨點沒有出現在正文：${missingWholeBookAnchors.join("、")}`);

      const threads = [...coverage.matchAll(/^- \[thread\]\s*.*$/gm)];
      threadCount = threads.length;
      threadCompleteCount = threads.filter((entry) => v3ThreadFields.every((field) => substantive(segmentField(entry[0], field)))).length;
      threadMissingInBody = threads.map((entry) => segmentField(entry[0], "名稱")).filter(substantive).filter((name) => !narrativeBody.includes(name));
      if (supported && threadCount < 1) errors.push("覆蓋記錄版本 3 必須宣告至少 1 條 [thread] 認識線索");
      if (threadCompleteCount !== threadCount) errors.push("[thread] 必須填完名稱、起點、關鍵推進、前後變化、換場理由、依據與邊界");
      if (threadMissingInBody.length) errors.push(`這些認識線索名稱沒有出現在正文：${threadMissingInBody.join("、")}`);

      generatorExists = lineField(coverage, "是否存在全書生成器");
      coverageGeneratorGatePresent = substantive(generatorExists);
      representationRequired = lineField(coverage, "是否需要視覺表示");
      representationPurpose = lineField(coverage, "使用圖表的位置與目的");
      for (const [field, value] of [["是否存在全書生成器", generatorExists], ["是否需要視覺表示", representationRequired]]) {
        if ((supported || complete || substantive(value)) && !yesNoDecision(value)) errors.push(`“${field}”必須明確寫是或否`);
      }
      if (/^是/.test(generatorExists)) requireFields(v3GeneratorFields);
      coverageGeneratorFields = v3GeneratorFields.filter((field) => substantive(lineField(coverage, field))).length;
      if (/^是/.test(representationRequired)) requireFields(["使用圖表的位置與目的"]);
      const zones = ["starting-point", "pressure", "revision", "boundary"];
      coverageZones = zones.filter((zone) => substantive(locationForZone(coverage, zone))).length;
      const evidenceRows = [...coverage.matchAll(/^- \[(?:starting-point|pressure|revision|boundary)\][^\n]*$/gm)];
      if (evidenceRows.some((entry) => !substantive(segmentField(entry[0], "位置")))) {
        errors.push("已宣告的來源證據必須寫明位置；材料不支援的證據行應刪除");
      }
      if (supported || complete) {
        requireFields(v3ReviewFields);
        if (complete && coverageZones !== zones.length) errors.push("覆蓋記錄版本 3 沒有填完起點、壓力、改寫與邊界四類證據的位置");
      }
      const candidates = [...coverage.matchAll(/^- \[candidate\]\s*.*$/gm)];
      coverageCandidateCount = candidates.length;
      const candidateFields = ["名稱", "位置", "解決的問題", "與其他部件的關係", "決定", "刪除測試"];
      if (complete && coverageCandidateCount < 5) errors.push(`完整拆書的覆蓋記錄必須有至少 5 個候選部件，當前為 ${coverageCandidateCount}`);
      for (const candidate of candidates) {
        if (!candidateFields.every((field) => substantive(segmentField(candidate[0], field))) || !["保留", "合併", "刪除"].includes(segmentField(candidate[0], "決定"))) {
          errors.push("候選部件必須填完名稱、位置、作用、關係、決定與刪除測試；決定為保留/合併/刪除");
        }
      }
    } else {
      const currentSupport = lineField(coverage, "材料能否支撐認識更新路徑");
      const legacyRunnableSupport = lineField(coverage, "材料能否支撐具體執行");
      understandingPathSupport = currentSupport || legacyRunnableSupport;
      coverageUnderstandingFields = understandingPathFields.filter((field) => substantive(lineField(coverage, field))).length;
      coverageWholeBookIdentityFields = wholeBookIdentityFields
        .filter((field) => substantive(lineField(coverage, field))).length;
      requiredWholeBookAnchors = parseWholeBookAnchors(lineField(coverage, "正文必須出現的整書錨點"));
      missingWholeBookAnchors = requiredWholeBookAnchors
        .filter((anchor) => !narrativeBody.includes(anchor));
      requiredWholeBookAnchorHits = requiredWholeBookAnchors.length - missingWholeBookAnchors.length;
      genericWholeBookAnchorHits = requiredWholeBookAnchors
        .filter((anchor) => genericWholeBookAnchors.has(anchor));
      coverageRunnableFields = legacyRunnableFields.filter((field) => substantive(lineField(coverage, field))).length;
      coverageEmbodimentFields = legacyEmbodimentFields.filter((field) => substantive(lineField(coverage, field))).length;
      if (substantive(currentSupport)) {
        const essenceCoverageFields = ["作者最後只想留下什麼", "正文中哪兩個相隔較遠的轉折共同托住它", "是否需要回答書名", "精神核心可替換性反測"];
        coverageEssenceFields = essenceCoverageFields
          .filter((field) => substantive(lineField(coverage, field))).length;
        coverageTitleAnswer = lineField(coverage, "是否需要回答書名");
        if (coverageEssenceFields !== essenceCoverageFields.length) {
          errors.push("當前版覆蓋記錄必須填完精神核心、兩個相隔轉折、書名判斷與可替換性反測");
        }
        if (substantive(coverageTitleAnswer) && !/^(?:是|否)(?:\b|[—：:，,。\s]|$)/.test(coverageTitleAnswer)) {
          errors.push("“是否需要回答書名”必須明確寫是或否，並說明書名是否承載精神核心");
        }
        if (!/^(?:是|否)(?:\b|[—：:，,。\s]|$)/.test(currentSupport)) {
          errors.push("“材料能否支撐認識更新路徑”必須明確寫是或否，並說明依據");
        } else if (/^是/.test(currentSupport) && coverageUnderstandingFields !== understandingPathFields.length) {
          errors.push("材料宣告能夠支撐認識更新路徑，但覆蓋記錄沒有填完具體處境、自然理解、壓力、新關係、回看、下一問、扶手、返程、複述與來源邊界");
        } else if (/^否/.test(currentSupport)) {
          const message = "材料不足以支撐認識更新路徑；成品應縮成區域性理解或先補材料，不能用泛化場景冒充現場";
          if (materialGrade === "完整拆書") {
            errors.push(`完整拆書不能通過：${message}`);
          } else {
            warnings.push(message);
          }
        }
      } else if (substantive(legacyRunnableSupport)) {
        if (!/^(?:是|否)(?:\b|[—：:，,。\s]|$)/.test(legacyRunnableSupport)) {
          errors.push("舊版“材料能否支撐具體執行”必須明確寫是或否，並說明依據");
        } else if (/^是/.test(legacyRunnableSupport) && coverageRunnableFields !== legacyRunnableFields.length) {
          errors.push("舊版材料宣告可執行，但讀者執行門沒有填完");
        } else if (/^否/.test(legacyRunnableSupport)) {
          warnings.push("材料不足以支撐具體執行；成品應縮成區域性理解或先補材料，不能用泛化場景冒充現場");
        }
        warnings.push("覆蓋記錄仍使用舊版讀者執行門；本次相容通過，下次重跑時請改用認識更新門");
      } else if (coverageEmbodimentFields === legacyEmbodimentFields.length) {
        understandingPathSupport = "legacy";
        warnings.push("覆蓋記錄仍使用舊版現場化門；本次相容通過，下次重跑時請改用認識更新門");
      } else {
        errors.push("覆蓋記錄必須填寫認識更新門，或提供完整的舊版讀者執行門/現場化門以便相容讀取");
      }

      if (coverageContractVersion === "2") {
        coverageGeneratorGatePresent = /^- 是否存在全書生成器[：:]/m.test(coverage);
        generatorExists = lineField(coverage, "是否存在全書生成器");
        generatorEarlyDecision = lineField(coverage, "生成器是否需要在前兩個一級標題內執行");
        representationRequired = lineField(coverage, "是否需要視覺表示");
        representationRunAnchor = lineField(coverage, "視覺表示後用哪個載體執行");

        if (!coverageGeneratorGatePresent || !yesNoDecision(generatorExists)) {
          errors.push("覆蓋記錄版本 2 必須明確“是否存在全書生成器”：是或否，並說明理由");
        }

        if (!yesNoDecision(representationRequired)) {
          errors.push("覆蓋記錄版本 2 必須明確“是否需要視覺表示”：是或否，並說明理由");
        }

        if (/^是/.test(generatorExists)) {
          coverageGeneratorFields = generatorFields
            .filter((field) => substantive(lineField(coverage, field))).length;
          if (coverageGeneratorFields !== generatorFields.length) {
            errors.push("解釋生成器門沒有填完：生成器、輸入/起點、結果方向、遠距轉折、失效邊界、正文錨點、前置判斷與視覺判斷缺一不可");
          }

          const generatorAnchors = parseWholeBookAnchors(lineField(coverage, "正文生成器錨點"));
          generatorAnchorCount = generatorAnchors.length;
          generatorAnchorHits = generatorAnchors.filter((anchor) => narrativeBody.includes(anchor)).length;
          if (generatorAnchorCount === 0) {
            errors.push("宣告存在全書生成器時，必須提供至少 1 個正文生成器錨點");
          } else if (generatorAnchorHits !== generatorAnchorCount) {
            const missing = generatorAnchors.filter((anchor) => !narrativeBody.includes(anchor));
            errors.push(`這些生成器錨點沒有出現在正文：${missing.join("、")}`);
          }

          if (!yesNoDecision(generatorEarlyDecision)) {
            errors.push("“生成器是否需要在前兩個一級標題內執行”必須明確寫是或否，並說明理由");
          } else if (/^是/.test(generatorEarlyDecision)) {
            const thirdHeadingStart = headingMatches[2]?.index ?? content.length;
            const earlyBody = bodyStart >= 0 ? content.slice(bodyStart, thirdHeadingStart) : "";
            generatorEarlyAnchorHits = generatorAnchors.filter((anchor) => earlyBody.includes(anchor)).length;
            if (generatorEarlyAnchorHits !== generatorAnchorCount) {
              errors.push("宣告生成器需要前置，但正文生成器錨點沒有全部出現在前兩個一級標題內");
            }
          }
        } else if (/^否/.test(generatorExists)) {
          coverageGeneratorFields = generatorFields
            .filter((field) => substantive(lineField(coverage, field))).length;
        }

        const frontstage = [...coverage.matchAll(/^- \[frontstage\]\s+.+$/gm)];
        frontstageCount = frontstage.length;
        const frontstageNames = frontstage.map((item) => segmentField(item[0], "名稱"));
        const frontstageResponsibilities = frontstage.map((item) => segmentField(item[0], "唯一職責"));
        frontstageCompleteCount = frontstage.filter((item) =>
          frontstageFields.every((field) => substantive(segmentField(item[0], field))),
        ).length;
        frontstageMissingInBody = frontstageNames
          .filter(substantive)
          .filter((name) => !narrativeBody.includes(name));
        frontstageDuplicateResponsibilities = [...new Set(frontstageResponsibilities.filter((responsibility, index, all) =>
          substantive(responsibility) && all.indexOf(responsibility) !== index,
        ))];

        if (/^是/.test(currentSupport) && frontstageCount === 0) {
          errors.push("覆蓋記錄版本 2 必須宣告至少 1 個 [frontstage] 前臺載體");
        } else if (frontstageCompleteCount !== frontstageCount) {
          errors.push("前臺載體必須填完名稱、唯一職責、設定或起點、結果或後果、改變的關係與下一問");
        }
        if (frontstageMissingInBody.length > 0) {
          errors.push(`這些前臺載體沒有出現在正文：${frontstageMissingInBody.join("、")}`);
        }
        if (frontstageDuplicateResponsibilities.length > 0) {
          errors.push(`前臺載體的唯一職責不能重複：${frontstageDuplicateResponsibilities.join("、")}`);
        }
      }

      if (substantive(currentSupport) && materialGrade !== "完整拆書" && requiredWholeBookAnchors.length < 1) {
        errors.push("初拆或假設版也必須宣告至少 1 個材料真正支援的整書錨點，精神核心不能只剩通用主題");
      }

      if (materialGrade === "完整拆書") {
        const authorFields = ["作者一直在追問什麼", "作者用什麼材料或經歷逼近", "最終改變了什麼判斷"]
          .filter((field) => substantive(lineField(coverage, field))).length;
        const legacyAuthorFields = ["問題", "物件", "方法"]
          .filter((field) => substantive(lineField(coverage, field))).length;
        const zones = ["starting-point", "pressure", "revision", "boundary"];
        const legacyZones = ["question", "setup", "mechanism", "boundary"];
        const currentZoneCount = zones.filter((zone) => substantive(locationForZone(coverage, zone))).length;
        const legacyZoneCount = legacyZones.filter((zone) => substantive(locationForZone(coverage, zone))).length;
        coverageZones = Math.max(currentZoneCount, legacyZoneCount);
        const candidates = [...coverage.matchAll(/^- \[candidate\]\s+.+$/gm)];
        coverageCandidateCount = candidates.length;
        const candidateFields = ["名稱", "位置", "解決的問題", "與其他部件的關係", "決定", "刪除測試"];
        const completeCandidates = candidates.filter((candidate) =>
          candidateFields.every((field) => substantive(segmentField(candidate[0], field)))
          && /決定[：:]\s*(?:保留|合併|刪除)(?:｜|\||$)/.test(candidate[0]),
        ).length;
        coverageLoopFields = legacyCoverageLoopFields.filter((field) => substantive(lineField(coverage, field))).length;
        coverageConcretizationFields = legacyConcretizationFields.filter((field) => substantive(lineField(coverage, field))).length;
        const currentBookSelectionFields = bookSelectionFields
          .filter((field) => substantive(lineField(coverage, field))).length;
        const legacySelectionFields = legacyBookSelectionFields
          .filter((field) => substantive(lineField(coverage, field))).length;
        coverageBookSelectionFields = Math.max(currentBookSelectionFields, legacySelectionFields);
        coverageNarrativeContinuityFields = narrativeContinuityFields
          .filter((field) => substantive(lineField(coverage, field))).length;
        coverageLegacyNarrativeSelectionFields = legacyNarrativeSelectionFields
          .filter((field) => substantive(lineField(coverage, field))).length;
        const challengeFields = ["當前理解", "反證", "處理"].filter((field) => substantive(lineField(coverage, field))).length;
        const legacyFullNarrativeComplete = coverageLoopFields === legacyCoverageLoopFields.length
          && coverageConcretizationFields === legacyConcretizationFields.length;

        if (coverageWholeBookIdentityFields !== wholeBookIdentityFields.length) {
          errors.push("完整拆書的覆蓋記錄沒有填完整書身份：書的形態、字面物件、起點變化終點、必要主線、共同關係、正文錨點、三十秒複述與可遷移性反測缺一不可");
        }
        if (requiredWholeBookAnchors.length < 3) {
          errors.push(`完整拆書必須宣告至少 3 個正文整書錨點，當前為 ${requiredWholeBookAnchors.length}`);
        }
        if (genericWholeBookAnchorHits.length > 0) {
          errors.push(`整書錨點過於通用，不能唯一指向這本書：${genericWholeBookAnchorHits.join("、")}`);
        }
        if (missingWholeBookAnchors.length > 0) {
          errors.push(`這些整書錨點沒有出現在正文：${missingWholeBookAnchors.join("、")}`);
        }
        if (authorFields !== 3 && legacyAuthorFields !== 3) {
          errors.push("完整拆書的覆蓋記錄沒有填完作者的追問、逼近材料與最終判斷");
        }
        if (coverageZones !== 4) errors.push("完整拆書的覆蓋記錄沒有填完起點、壓力、改寫與邊界四類證據的位置");
        if (candidates.length < 5) {
          errors.push(`完整拆書的覆蓋記錄必須有至少 5 個候選部件，當前為 ${candidates.length}`);
        } else if (completeCandidates !== candidates.length) {
          errors.push("完整拆書的候選部件必須填完名稱、位置、作用、關係、決定與刪除測試");
        }
        if (substantive(understandingPathSupport)
            && coverageBookSelectionFields !== bookSelectionFields.length
            && !legacyFullNarrativeComplete) {
          errors.push("完整拆書的覆蓋記錄沒有填完貫穿張力、必要轉折、正文取捨、後臺留存與轉折連線");
        }
        if (coverageNarrativeContinuityFields !== narrativeContinuityFields.length) {
          errors.push("完整拆書的覆蓋記錄沒有填完敘事連續性門：開篇真實問題、轉折鏈、換場必要性、換序測試與摘句拼接反測缺一不可");
        }
        if (challengeFields !== 3) errors.push("完整拆書的覆蓋記錄沒有完成當前理解、反證與處理");
      }
    }
  }

  const examplePattern = markdownMode
    ? /^```(?:text)?[ \t]*\r?\n([\s\S]*?)^```[ \t]*$/gmi
    : /^#\+begin_example[ \t]*\r?\n([\s\S]*?)^#\+end_example[ \t]*$/gmi;
  const exampleBlocks = [...narrativeBody.matchAll(examplePattern)].filter((block) => block[1].trim());
  // Quoted source/code is not a rendered table. Keep offsets irrelevant here by
  // masking complete fences before looking for actual table rows.
  const tableBody = markdownMode
    ? narrativeBody.replace(/^(`{3,}|~{3,})[^\n]*\r?\n[\s\S]*?^\1[ \t]*$/gm, "")
    : narrativeBody.replace(/^#\+begin_\S+[^\n]*\r?\n[\s\S]*?^#\+end_\S+[ \t]*$/gmi, "");
  const tableBlocks = [...tableBody.matchAll(/(?:^\|[^\n]*\|[ \t]*(?:\r?\n|$)){2,}/gm)]
    .filter((match) => markdownMode
      ? match[0].split(/\r?\n/).some((line) => /^\|(?:[ \t]*:?-{3,}:?[ \t]*\|)+[ \t]*$/.test(line))
      : true);
  const diagramWidths = exampleBlocks.map((block) => Math.max(0, ...block[1].split(/\r?\n/).map(displayWidth)));
  const tableWidths = tableBlocks.map((block) => Math.max(0, ...block[0].split(/\r?\n/).map(displayWidth)));
  const maxDiagramWidth = Math.max(0, ...diagramWidths);
  const maxTableWidth = Math.max(0, ...tableWidths);
  diagramWidths.forEach((width, index) => {
    if (width > 80) errors.push(`第 ${index + 1} 個 ASCII 圖寬度 ${width}，超過 80`);
  });
  tableWidths.forEach((width, index) => {
    if (width > 80) errors.push(`第 ${index + 1} 個表格寬度 ${width}，超過 80`);
  });
  if (["2", "3"].includes(coverageContractVersion) && /^是/.test(representationRequired)) {
    if (exampleBlocks.length + tableBlocks.length === 0) errors.push("覆蓋記錄宣告需要視覺表示，正文必須至少有 1 個實際 example 圖塊或表格");
    // Version 2's carrier is readable as a recorded field, never proof of an explanation.
    if (coverageContractVersion === "2" && !substantive(representationRunAnchor)) errors.push("覆蓋記錄宣告需要視覺表示時，必須寫明圖後執行載體");
  }

  const bodyChars = [...narrativeBody.replace(/\s/g, "")].length;

  return {
    ok: errors.length === 0,
    assessment_scope: "結構與記錄完整性；不證明來源準確、閱讀連續或理解效果",
    semantic_assessment: "not_performed",
    file,
    errors,
    warnings,
    checks: {
      identifier,
      material_grade: materialGrade,
      top_headings: headings.length,
      generic_heading_hits: "not_assessed",
      internal_framework_hits: legacyTriadHits.length + internalHeadingHits.length,
      calibration_hits: calibrationHits,
      visible_material_grade_hits: visibleMaterialGradeHits,
      source_structure_hits: "not_assessed",
      outside_camera_opening_hits: "not_assessed",
      meta_narration_hits: "not_assessed",
      backstage_accounting_hits: backstageAccountingHits.length,
      dense_paragraph_hits: denseParagraphHits,
      max_paragraph_chars: maxParagraphChars,
      long_sentence_hits: longSentenceHits,
      max_sentence_chars: maxSentenceChars,
      example_blocks: exampleBlocks.length,
      table_blocks: tableBlocks.length,
      max_table_width: maxTableWidth,
      thread_count: threadCount,
      thread_complete_count: threadCompleteCount,
      thread_missing_in_body: threadMissingInBody.join("｜"),
      representation_purpose: representationPurpose,
      max_diagram_width: maxDiagramWidth,
      body_chars: bodyChars,
      coverage_supplied: Boolean(coverage),
      coverage_zones: coverageZones,
      coverage_loop_fields: coverageLoopFields,
      coverage_concretization_fields: coverageConcretizationFields,
      coverage_embodiment_fields: coverageEmbodimentFields,
      coverage_whole_book_identity_fields: coverageWholeBookIdentityFields,
      required_whole_book_anchor_count: requiredWholeBookAnchors.length,
      required_whole_book_anchor_hits: requiredWholeBookAnchorHits,
      missing_whole_book_anchors: missingWholeBookAnchors.join("｜"),
      generic_whole_book_anchors: genericWholeBookAnchorHits.join("｜"),
      essence_heading_count: essenceHeadingIndexes.length,
      essence_is_last_heading: essenceHeadingIndex >= 0 && essenceHeadingIndex === allHeadings.length - 1,
      essence_paragraph_count: essenceParagraphs.length,
      essence_sentence_count: essenceSentenceCount,
      essence_format_line_hits: essenceFormatLineHits,
      essence_chars: essenceChars,
      coverage_essence_fields: coverageEssenceFields,
      coverage_title_answer: coverageTitleAnswer,
      coverage_understanding_fields: coverageUnderstandingFields,
      coverage_runnable_fields: coverageUnderstandingFields === understandingPathFields.length
        ? coverageUnderstandingFields
        : coverageRunnableFields,
      coverage_book_selection_fields: coverageBookSelectionFields,
      coverage_narrative_continuity_fields: coverageNarrativeContinuityFields,
      coverage_candidate_count: coverageCandidateCount,
      coverage_legacy_narrative_selection_fields: coverageLegacyNarrativeSelectionFields,
      coverage_contract_version: coverageContractVersion,
      coverage_generator_gate_present: coverageGeneratorGatePresent,
      generator_exists: generatorExists,
      coverage_generator_fields: coverageGeneratorFields,
      generator_anchor_count: generatorAnchorCount,
      generator_anchor_hits: generatorAnchorHits,
      generator_early_anchor_hits: generatorEarlyAnchorHits,
      generator_early_decision: generatorEarlyDecision,
      representation_required: representationRequired,
      representation_run_anchor: representationRunAnchor,
      representation_run_anchor_hit: "not_assessed",
      frontstage_count: frontstageCount,
      frontstage_complete_count: frontstageCompleteCount,
      frontstage_missing_in_body: frontstageMissingInBody.join("｜"),
      frontstage_duplicate_responsibilities: frontstageDuplicateResponsibilities.join("｜"),
      understanding_path_support: understandingPathSupport,
      runnable_support: understandingPathSupport,
      format: markdownMode ? "markdown" : "org",
    },
  };
}

function main(): never {
  const args = process.argv.slice(2);
  const stdinMode = args[0] === "--stdin";
  const file = stdinMode ? args[1] ?? "19700101T000000--stdin__book.org" : args[0];
  const coverageFlag = args.indexOf("--coverage");
  const coveragePath = coverageFlag >= 0 ? args[coverageFlag + 1] : undefined;

  if (!file) {
    console.error("用法：bun scripts/validate_note.ts <note.org|note.md> --coverage <coverage-map.md>");
    console.error("或：  bun scripts/validate_note.ts --stdin <denote-filename> --coverage <coverage-map.md>");
    process.exit(2);
  }

  if (coverageFlag >= 0 && !coveragePath) {
    console.error("--coverage 後必須提供覆蓋記錄路徑");
    process.exit(2);
  }

  const content = stdinMode ? readFileSync(0, "utf8") : readFileSync(file, "utf8");
  const coverage = coveragePath ? readFileSync(coveragePath, "utf8") : undefined;
  const result = validate(content, file, coverage);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

if (import.meta.main) {
  main();
}
