#!/usr/bin/env bun

import { basename } from "node:path";
import { readFileSync } from "node:fs";
import { normalizeLegacyMap } from "./paper_map_compat";

export interface Result {
  ok: boolean;
  errors: string[];
  warnings: string[];
  stats: Record<string, string | number | boolean>;
}

const requiredHeaders = [
  "title", "subtitle", "description", "date", "filetags",
  "identifier", "source", "authors", "venue",
];

const genericHeadings = new Set([
  "摘要", "背景", "問題", "研究問題", "方法", "實驗", "實驗結果",
  "結果", "發現", "核心發現", "侷限", "侷限性", "結論", "啟示",
  "人生啟示", "金句", "我能帶走什麼", "它到底在解決什麼", "它真正看見了什麼",
]);

const genericAnchors = new Set([
  "問題", "方法", "模型", "系統", "實驗", "結果", "發現", "關係", "變化", "結論", "邊界",
]);

const identityFields = [
  "貢獻型別", "研究物件", "已有方法的不足", "主要貢獻", "輸入、處理與輸出",
  "不可省略的研究問題或主線", "主線為什麼屬於同一篇論文", "各主線的證據支援程度",
  "論文未作出的主張", "正文中的論文具體表述", "前兩節的問題與貢獻表述", "論文簡述", "與其他論文的區別",
];

const understandingFields = [
  "從哪個具體問題開始", "原先會怎樣理解或處理", "什麼證據需要補充或修正原有理解",
  "作者補充了什麼關係、做法或判斷依據", "回到原問題，判斷髮生了什麼變化", "還需要回答什麼問題",
  "貫穿全文的問題或關係", "案例如何選擇與銜接", "結尾回到哪裡", "陌生讀者三句複述",
  "示例的原文依據與簡化限制",
];

const generatorFields = [
  "統一機制", "輸入、起點或當前狀態", "關鍵作用關係", "結果方向或終點",
  "如何解釋兩個不同發現", "改變相關條件後的預測及依據", "失效邊界", "正文中的機制表述",
  "是否需要在前兩節解釋機制", "是否需要圖示", "圖後用什麼例子解釋",
];

const experimentFields = [
  "實驗在問什麼", "固定了什麼", "改變了什麼", "與誰比較", "主要結果及例外",
  "結果的實際意義", "這個結果改變什麼判斷", "這個結果不能推出什麼", "正文中的核心證據表述",
];

const evidenceFields = [
  "名稱", "角色", "位置", "論文直接結果", "支援判斷", "正文對應表述", "決定", "取捨理由",
];

const frontstageFields = [
  "名稱", "主要作用", "設定或起點", "結果或後果", "幫助理解什麼", "與後文的聯絡",
];

const continuityFields = [
  "開頭要回答的問題", "全文解釋順序", "案例之間的聯絡",
  "章節換序檢查", "略去數字後的解釋", "只保留結論會遺漏什麼",
];

const finalFields = [
  "論文最終補充或修正了什麼認識", "結尾依據前文哪些發現",
  "正文結尾的對應表述", "結尾與本論文的聯絡", "結尾是否新增證據、術語或建議",
];

const readerFields = [
  "不依賴分數的全文複述", "讀者首先記住的解釋", "讀者對章節聯絡的解釋",
  "研究問題", "作者的主要貢獻", "輸入→元件／關係→輸出",
  "中心實驗問題／固定項／比較者／結果／意義", "證據的適用範圍與限制",
  "三句認識變化複述", "結果解釋",
];

function substantive(value: string): boolean {
  const cleaned = value.trim();
  return cleaned.length >= 1 && !/^\{.*\}$/.test(cleaned) && !/^[:：|｜\s-]+$/.test(cleaned);
}

function yesNoDecision(value: string): boolean {
  return /^(?:是|否)(?:\b|[—：:，,。\s]|$)/.test(value.trim());
}

function lineField(content: string, field: string): string {
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return content.match(new RegExp(`^- ${escaped}[：:][ \\t]*(.*)$`, "m"))?.[1]?.trim() ?? "";
}

function segmentField(line: string, field: string): string {
  const normalized = line.replace(/^- \[[^\]]+\]\s*/, "");
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return normalized.match(new RegExp(`(?:^|[｜|])\\s*${escaped}[：:]\\s*([^｜|]*)`))?.[1]?.trim() ?? "";
}

function parseAnchors(value: string): string[] {
  return value.split(/[｜|]/).map((item) => item.trim()).filter(substantive);
}

function displayWidth(line: string): number {
  return [...line].reduce((sum, char) => sum + (/[^\u0000-\u00ff]/.test(char) ? 2 : 1), 0);
}

function paragraphList(body: string): string[] {
  return body
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph && !/^(?:#\+|\*)/.test(paragraph));
}

export function validate(content: string, file: string, paperMap?: string): Result {
  if (paperMap) paperMap = normalizeLegacyMap(paperMap);
  const currentFormat = paperMap ? lineField(paperMap, "格式版本") === "3" : false;
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const header of requiredHeaders) {
    if (!new RegExp(`^#\\+${header}:\\s+\\S`, "im").test(content)) {
      errors.push(`缺少或為空的 #+${header}`);
    }
  }

  const filenameIdentifier = basename(file).match(/^(\d{8}T\d{6})--paper-/)?.[1] ?? "";
  const identifier = content.match(/^#\+identifier:\s*(\d{8}T\d{6})\s*$/im)?.[1] ?? "";
  if (!filenameIdentifier) errors.push("檔名不是 Denote paper 時間戳格式");
  if (!identifier || identifier !== filenameIdentifier) {
    errors.push(`IDENTIFIER ${identifier || "為空"} 與檔名 ${filenameIdentifier || basename(file)} 不一致`);
  }

  const sourceLines = content.match(/^#\+source:.*$/gim) ?? [];
  if (sourceLines.length !== 1) errors.push(`#+source 必須且只能出現一次，當前為 ${sourceLines.length}`);
  if (sourceLines.length === 1 && !/^#\+source:\s+(?:https?:\/\/\S+|\/[^\r\n]+?)\s*$/i.test(sourceLines[0])) {
    errors.push("#+source 只放一個裸原始 URL 或絕對本地原文路徑，不加描述或參考資料列表");
  }

  const headingMatches = [...content.matchAll(/^\* ([^*\n].*)$/gm)];
  const headings = headingMatches.map((match) => match[1].trim());
  if (headings.length < 2) errors.push(`至少需要 2 個由事件、變化或條件命名的一級標題，當前為 ${headings.length}`);
  const genericHits = headings.filter((heading) => genericHeadings.has(heading.replace(/\s+/g, "")));
  if (genericHits.length) errors.push(`一級標題不能使用通用欄目或空泛標籤：${[...new Set(genericHits)].join("、")}`);

  const bodyStart = headingMatches[0]?.index ?? content.length;
  const body = content.slice(bodyStart);
  const thirdHeadingStart = headingMatches[2]?.index ?? content.length;
  const earlyBody = content.slice(bodyStart, thirdHeadingStart);
  const lastHeadingStart = headingMatches.at(-1)?.index ?? bodyStart;
  const finalBody = content.slice(lastHeadingStart);

  if (/(?:零號模型|FX\s*迴流|x\s*\/\s*R\s*\/\s*f\s*\/\s*E|\{\{[^}]+\}\}|\b(?:TODO|TBD|PLACEHOLDER)\b)/i.test(body)) {
    errors.push("正文含內部分析標籤、模板佔位或未完成標記");
  }

  const backstagePattern = /(?:paper-map|證據臺賬|本輪核驗|未參與寫作|講解者構造|舊稿依據|核驗狀態|決定：進入正文|決定：僅供備查)/g;
  const backstageHits = [...body.matchAll(backstagePattern)].map((match) => match[0]);
  if (backstageHits.length) {
    errors.push(`正文洩漏研究記錄或核驗語言：${[...new Set(backstageHits)].join("、")}`);
  }

  const paragraphs = paragraphList(body);
  const denseParagraphs = paragraphs.filter((paragraph) => [...paragraph.replace(/\s/g, "")].length > 240).length;
  if (denseParagraphs) warnings.push(`正文有 ${denseParagraphs} 段超過 240 字；檢查是否一次塞入多個重要關係`);
  const numericCounts = paragraphs.map((paragraph) => (paragraph.match(/\d+(?:\.\d+)?%?/g) ?? []).length);
  const numericTokenCount = numericCounts.reduce((sum, count) => sum + count, 0);
  const numericParagraphCount = numericCounts.filter((count) => count > 0).length;
  const severeNumericPileParagraphs = numericCounts.filter((count) => count >= 7).length;
  const numericPileParagraphs = numericCounts.filter((count) => count >= 5 && count < 7).length;
  if (severeNumericPileParagraphs) {
    const message = `正文有 ${severeNumericPileParagraphs} 段包含至少 7 個數字；檢查每項比較是否有明確作用和解釋`;
    (currentFormat ? warnings : errors).push(message);
  }
  if (numericPileParagraphs) warnings.push(`正文有 ${numericPileParagraphs} 段包含 5–6 個數字；檢查各項比較是否必要，保留影響結論的區間與不確定性`);

  const exampleBlocks = [...content.matchAll(/#\+begin_example\s*\n([\s\S]*?)#\+end_example/gim)];
  if (!currentFormat && exampleBlocks.length > 1) errors.push("最多保留一個 Markdown 圍欄圖塊");
  const maxDiagramWidth = exampleBlocks.reduce((max, block) => {
    const width = block[1].split(/\r?\n/).reduce((lineMax, line) => Math.max(lineMax, displayWidth(line)), 0);
    return Math.max(max, width);
  }, 0);
  if (maxDiagramWidth > 80) errors.push(`ASCII 圖寬度 ${maxDiagramWidth}，超過 80 顯示列`);

  let identityAnchorCount = 0;
  let orientationAnchorCount = 0;
  let evidenceCount = 0;
  let centralEvidenceCount = 0;
  let necessaryEvidenceCount = 0;
  let backgroundEvidenceCount = 0;
  let frontstageCount = 0;
  let generatorExists = "";
  let quantitativeException = false;
  let paperMapVersion = "";

  if (!paperMap) {
    errors.push("所有論文筆記都必須提供 --map paper-map 研究記錄");
  } else {
    const version = lineField(paperMap, "格式版本");
    paperMapVersion = version;
    if (!/^(?:1|2|3)$/.test(version)) errors.push(`paper-map 格式版本必須是 1、2 或 3，當前為 ${version || "為空"}`);
    if (version === "1" || version === "2") warnings.push(`paper-map 格式版本 ${version} 使用相容模式及原有檢查規則；新筆記請使用版本 3`);

    for (const field of ["原文位置", "論文資訊", "原文雜湊", "材料能支援到", "外部指令掃描"]) {
      if (!substantive(lineField(paperMap, field))) errors.push(`paper-map 缺少材料欄位：${field}`);
    }
    if (currentFormat) {
      const noteSource = content.match(/^#\+source:[ \t]*(.*)$/im)?.[1]?.trim() ?? "";
      if (noteSource !== lineField(paperMap, "原文位置")) errors.push("筆記 #+source 與研究記錄的原文位置不一致");
    }
    const injectionScan = lineField(paperMap, "外部指令掃描");
    if (substantive(injectionScan) && !/^(?:未發現|已停止)/.test(injectionScan)) {
      errors.push("“外部指令掃描”必須以“未發現”或“已停止”開頭");
    }

    if (currentFormat && /^已停止/.test(injectionScan)) errors.push("材料處理已停止，不能標記為可交付");

    for (const field of identityFields) {
      if (!substantive(lineField(paperMap, field))) errors.push(`研究問題與貢獻未填：${field}`);
    }
    const contributionType = lineField(paperMap, "貢獻型別");
    if (substantive(contributionType) && !/^(?:方法|干預|解釋|理論|測量|評測|資源|系統)/.test(contributionType)) {
      errors.push("貢獻型別必須從方法／干預、解釋／理論、測量／評測、資源／系統中選擇主型別");
    }

    const uniqueResultShape = lineField(paperMap, "正文主要結果表述");
    const extraQuantitativeForeground = lineField(paperMap, "是否補充定量比較");
    if (version === "2" || currentFormat) {
      if (!substantive(uniqueResultShape)) errors.push("中心實驗或論證未填：正文主要結果表述");
      else if (!body.includes(uniqueResultShape)) errors.push(`正文主要結果表述“${uniqueResultShape}”沒有出現在正文`);
      if (!yesNoDecision(extraQuantitativeForeground)) errors.push("“是否補充定量比較”必須明確寫是或否並說明理由");
    }
    quantitativeException = /^是/.test(extraQuantitativeForeground);
    if (!currentFormat && quantitativeException && !/^(?:測量|評測)/.test(contributionType)) {
      errors.push("舊版本的是否補充定量比較例外只適用於測量／評測論文；新版按比較的實際作用取捨");
    }
    const numericTokenLimit = quantitativeException ? 8 : 4;
    const numericParagraphLimit = quantitativeException ? 2 : 1;
    if (currentFormat && !substantive(lineField(paperMap, "補充比較的作用"))) {
      errors.push("中心實驗或論證未填：補充比較的作用");
    }
    if (numericTokenCount > numericTokenLimit || numericParagraphCount > numericParagraphLimit) {
      if (currentFormat) warnings.push(`正文有 ${numericTokenCount} 個數字，分佈在 ${numericParagraphCount} 段；請結合證據記錄與獨立閱讀檢查確認這些比較各有作用`);
      else errors.push(
        `舊版本數字數量限制：正文共有 ${numericTokenCount} 個數字、分散在 ${numericParagraphCount} 段；` +
        `${quantitativeException ? "評測例外" : "舊版本預設規則"}最多允許 ${numericTokenLimit} 個數字、${numericParagraphLimit} 個定量段落。` +
        "段落拆分不能把證據清單變成敘事，其餘精確量移回 paper-map",
      );
    }

    const identityAnchors = parseAnchors(lineField(paperMap, "正文中的論文具體表述"));
    identityAnchorCount = identityAnchors.length;
    if (identityAnchors.length < 2) errors.push(`正文中的論文具體表述至少 2 個，當前為 ${identityAnchors.length}`);
    const genericIdentityAnchors = identityAnchors.filter((anchor) => genericAnchors.has(anchor));
    if (genericIdentityAnchors.length) errors.push(`論文具體表述過於通用：${genericIdentityAnchors.join("、")}`);
    const missingIdentityAnchors = identityAnchors.filter((anchor) => !body.includes(anchor));
    if (missingIdentityAnchors.length) errors.push(`這些論文具體表述沒有出現在正文：${missingIdentityAnchors.join("、")}`);

    const orientationAnchors = parseAnchors(lineField(paperMap, "前兩節的問題與貢獻表述"));
    orientationAnchorCount = orientationAnchors.length;
    if (orientationAnchors.length < 2) errors.push(`前兩節的問題與貢獻表述至少 2 個，當前為 ${orientationAnchors.length}`);
    const lateOrientationAnchors = orientationAnchors.filter((anchor) => !earlyBody.includes(anchor));
    if (lateOrientationAnchors.length) errors.push(`這些研究問題與貢獻表述沒有在前兩個一級標題內出現：${lateOrientationAnchors.join("、")}`);

    for (const field of understandingFields) {
      if (!substantive(lineField(paperMap, field))) errors.push(`讀者的認識變化未填：${field}`);
    }

    generatorExists = lineField(paperMap, "是否存在統一機制");
    if (!yesNoDecision(generatorExists)) {
      errors.push("“是否存在統一機制”必須明確寫是或否並說明理由");
    } else if (/^是/.test(generatorExists)) {
      for (const field of generatorFields) {
        if (!substantive(lineField(paperMap, field))) errors.push(`機制與結果解釋未填：${field}`);
      }
      const generatorAnchors = parseAnchors(lineField(paperMap, "正文中的機制表述"));
      if (!generatorAnchors.length) errors.push("宣告存在機制時至少需要 1 個正文中的機制表述");
      const missingGeneratorAnchors = generatorAnchors.filter((anchor) => !body.includes(anchor));
      if (missingGeneratorAnchors.length) errors.push(`這些機制表述沒有出現在正文：${missingGeneratorAnchors.join("、")}`);
      const earlyDecision = lineField(paperMap, "是否需要在前兩節解釋機制");
      if (!yesNoDecision(earlyDecision)) errors.push("“是否需要在前兩節解釋機制”必須明確寫是或否並說明理由");
      if (/^是/.test(earlyDecision)) {
        const lateGeneratorAnchors = generatorAnchors.filter((anchor) => !earlyBody.includes(anchor));
        if (lateGeneratorAnchors.length) errors.push(`機制要求前置，但這些表述出現過晚：${lateGeneratorAnchors.join("、")}`);
      }
    } else if (/^否/.test(generatorExists)) {
      const generator = lineField(paperMap, "統一機制");
      if (!/未找到|不存在/.test(generator)) errors.push("宣告沒有統一機制時，“統一機制”應明確寫未找到或不存在");
    }

    const visualDecision = lineField(paperMap, "是否需要圖示");
    if (!yesNoDecision(visualDecision)) errors.push("“是否需要圖示”必須明確寫是或否並說明理由");
    if (/^是/.test(visualDecision)) {
      if (!exampleBlocks.length || (!currentFormat && exampleBlocks.length !== 1)) {
        errors.push(currentFormat ? "宣告需要圖示，但正文沒有 example 圖塊" : "舊版本宣告需要圖示時，正文必須恰好有 1 個 example 圖塊");
      }
      const carriers = parseAnchors(lineField(paperMap, "圖後用什麼例子解釋"));
      if (currentFormat && carriers.length !== exampleBlocks.length) errors.push("每張圖都需要按順序記錄圖後解釋所用的例子");
      for (let index = 0; index < exampleBlocks.length; index++) {
        const block = exampleBlocks[index];
        const carrier = carriers[index];
        const afterDiagram = content.slice((block.index ?? 0) + block[0].length, exampleBlocks[index + 1]?.index);
        if (!carrier || !afterDiagram.includes(carrier)) errors.push(`圖後未找到對應例子：${carrier || "未填寫"}`);
      }
    } else if (/^否/.test(visualDecision) && exampleBlocks.length) {
      warnings.push("記錄宣告不需要圖示，但正文含 example 圖塊；請核對圖示決定");
    }

    for (const field of experimentFields) {
      if (!substantive(lineField(paperMap, field))) errors.push(`中心實驗或論證未填：${field}`);
    }
    const centralAnchor = lineField(paperMap, "正文中的核心證據表述");
    if (substantive(centralAnchor) && !body.includes(centralAnchor)) errors.push(`正文中的核心證據表述“${centralAnchor}”沒有出現在正文`);

    const evidenceLines = [...paperMap.matchAll(/^- \[evidence\]\s+.+$/gm)].map((match) => match[0]);
    evidenceCount = evidenceLines.length;
    for (const line of evidenceLines) {
      const missing = evidenceFields.filter((field) => {
        if (currentFormat && field === "正文對應表述" && segmentField(line, "角色") === "備查") return false;
        return !substantive(segmentField(line, field));
      });
      if (missing.length) errors.push(`證據條目缺少欄位：${missing.join("、")}；條目=${line}`);
      const role = segmentField(line, "角色");
      const decision = segmentField(line, "決定");
      if (!/^(?:核心|補充|備查)$/.test(role)) errors.push(`證據角色只能是核心／補充／備查：${role || "為空"}`);
      if (!/^(?:進入正文|合併|僅供備查)$/.test(decision)) errors.push(`證據決定只能是進入正文／合併／僅供備查：${decision || "為空"}`);
      if (role === "核心") centralEvidenceCount++;
      if (role === "補充") necessaryEvidenceCount++;
      if (role === "備查") backgroundEvidenceCount++;
      if (role === "備查" && decision !== "僅供備查") errors.push("備查證據必須決定為“僅供備查”");
      if (decision !== "僅供備查") {
        const anchor = segmentField(line, "正文對應表述");
        if (/^(?:無|未找到)$/.test(anchor) || !body.includes(anchor)) errors.push(`進入正文或合併的證據對應表述沒有出現在正文：${anchor || "為空"}`);
      }
    }
    if (!centralEvidenceCount) errors.push("證據分級至少需要 1 條核心證據");
    if (!currentFormat && !necessaryEvidenceCount) errors.push("證據分級至少需要 1 條補充證據");
    if (!currentFormat && !backgroundEvidenceCount) errors.push("證據分級至少需要 1 條備查證據，這是版本 1、2 保留的類別要求");

    const frontstageLines = [...paperMap.matchAll(/^- \[frontstage\]\s+.+$/gm)].map((match) => match[0]);
    frontstageCount = frontstageLines.length;
    if (!frontstageCount) errors.push("paper-map 至少需要 1 個正文案例");
    const responsibilities: string[] = [];
    for (const line of frontstageLines) {
      const missing = frontstageFields.filter((field) => !substantive(segmentField(line, field)));
      if (missing.length) errors.push(`正文案例缺少欄位：${missing.join("、")}；條目=${line}`);
      const name = segmentField(line, "名稱");
      const responsibility = segmentField(line, "主要作用");
      if (substantive(name) && !body.includes(name)) errors.push(`正文案例“${name}”沒有出現在正文`);
      if (substantive(responsibility)) responsibilities.push(responsibility);
    }
    const duplicateResponsibilities = [...new Set(responsibilities.filter((item, index, all) => all.indexOf(item) !== index))];
    if (duplicateResponsibilities.length) {
      const message = `案例的主要作用重複：${duplicateResponsibilities.join("、")}；檢查是否提供了不同資訊`;
      (currentFormat ? warnings : errors).push(message);
    }

    for (const field of continuityFields) {
      if (!substantive(lineField(paperMap, field))) errors.push(`章節組織與聯絡未填：${field}`);
    }

    for (const field of finalFields) {
      if (!substantive(lineField(paperMap, field))) errors.push(`結尾檢查未填：${field}`);
    }
    const finalAnchor = lineField(paperMap, "正文結尾的對應表述");
    if (substantive(finalAnchor) && !finalBody.includes(finalAnchor)) errors.push(`結尾對應表述“${finalAnchor}”沒有出現在最後一個內容標題下`);
    const newMaterialDecision = lineField(paperMap, "結尾是否新增證據、術語或建議");
    if (substantive(newMaterialDecision) && !/^否/.test(newMaterialDecision)) errors.push("結尾不能新增新證據、術語或建議；該欄位必須以“否”開頭");

    for (const field of readerFields) {
      if (version === "2" || currentFormat || !["不依賴分數的全文複述", "讀者首先記住的解釋", "讀者對章節聯絡的解釋"].includes(field)) {
        if (!substantive(lineField(paperMap, field))) errors.push(`陌生讀者驗收未填：${field}`);
      }
    }
    if (version === "2" || currentFormat) {
      const noNumberRetell = lineField(paperMap, "不依賴分數的全文複述");
      if (!currentFormat && /\d+(?:\.\d+)?%?/.test(noNumberRetell)) errors.push("不依賴分數的全文複述仍含阿拉伯數字；先說明過程，再回答實驗數值");
      if (lineField(paperMap, "全文理解判定") !== "NARRATIVE_PASS") errors.push("全文理解檢查必須記錄 NARRATIVE_PASS");
    }
    if (lineField(paperMap, "問題與貢獻判定") !== "PAPER_IDENTITY_PASS") errors.push("陌生讀者五問必須得到 PAPER_IDENTITY_PASS");
    if (lineField(paperMap, "認識變化判定") !== "UNDERSTANDING_PASS") errors.push("三句認識更新必須得到 UNDERSTANDING_PASS");
    if (lineField(paperMap, "結果解釋判定") !== "RECONSTRUCTION_PASS") errors.push("結果解釋必須得到 RECONSTRUCTION_PASS");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      top_headings: headings.length,
      body_chars: [...body.replace(/\s/g, "")].length,
      identity_anchor_count: identityAnchorCount,
      orientation_anchor_count: orientationAnchorCount,
      evidence_count: evidenceCount,
      central_evidence_count: centralEvidenceCount,
      necessary_evidence_count: necessaryEvidenceCount,
      background_evidence_count: backgroundEvidenceCount,
      frontstage_count: frontstageCount,
      generator_exists: generatorExists,
      example_blocks: exampleBlocks.length,
      max_diagram_width: maxDiagramWidth,
      dense_paragraphs: denseParagraphs,
      numeric_pile_paragraphs: numericPileParagraphs,
      severe_numeric_pile_paragraphs: severeNumericPileParagraphs,
      numeric_tokens: numericTokenCount,
      numeric_paragraphs: numericParagraphCount,
      quantitative_exception: quantitativeException,
      paper_map_version: paperMapVersion,
      map_supplied: Boolean(paperMap),
    },
  };
}

function main(): never {
  const args = Bun.argv.slice(2);
  const mapFlag = args.indexOf("--map");
  const mapPath = mapFlag >= 0 ? args[mapFlag + 1] : undefined;
  const stdinMode = args.includes("--stdin");
  const positional = args.filter((arg, index) => arg !== "--stdin" && arg !== "--map" && index !== mapFlag + 1);
  const file = positional[0];

  if (!file || (mapFlag >= 0 && !mapPath)) {
    console.error("用法：bun scripts/validate_note.ts <note.org> --map <paper-map.md>");
    console.error("或：  bun scripts/validate_note.ts --stdin <denote-filename> --map <paper-map.md>");
    process.exit(2);
  }

  const content = stdinMode ? readFileSync(0, "utf8") : readFileSync(file, "utf8");
  const paperMap = mapPath ? readFileSync(mapPath, "utf8") : undefined;
  const result = validate(content, file, paperMap);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(result.ok ? 0 : 1);
}

if (import.meta.main) main();
