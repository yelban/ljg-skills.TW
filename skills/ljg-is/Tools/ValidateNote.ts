#!/usr/bin/env bun

import { basename } from "node:path";

export type NoteSchema = "legacy" | "ljg-is-v2" | "ljg-is-v3" | "ljg-is-v4" | "ljg-is-v5";

export type ValidationResult = {
  ok: boolean;
  errors: string[];
  identifier?: string;
  schema?: NoteSchema;
  definition?: string;
  operation?: string;
  recognition?: string;
  guidance?: string;
  action?: string;
  core?: string;
};

type NoteFormat = "org" | "md";
type EmphasizedBullet = { label: string; value: string };

const V2_SCHEMA = "ljg-is-v2";
const V3_SCHEMA = "ljg-is-v3";
const V4_SCHEMA = "ljg-is-v4";
const V5_SCHEMA = "ljg-is-v5";
const LEGACY_HEADINGS = ["問題", "完整表達", "剝離", "本質", "示例", "驗證"];
const V2_HEADINGS = ["問題", "完整表達", "剝離", "本質", "示例", "結構遷移", "驗證"];
const V3_HEADINGS = [
  "動詞判斷",
  "一個不",
  "理由",
  "做成的秩序",
  "捲入與反制",
  "歷史與未來",
  "未決問題",
  "根據與邊界",
];

const V3_SECTION_LABELS: Record<string, string[]> = {
  動詞判斷: ["原問", "改問", "作"],
  一個不: ["給定", "不", "未選"],
  理由: ["已有", "尚缺"],
  做成的秩序: ["規則", "關係", "分配"],
  捲入與反制: ["捲入", "回應", "反制"],
  歷史與未來: ["本源", "開啟", "關閉", "修正"],
  未決問題: ["憑什麼", "接下來"],
  根據與邊界: ["根據", "推斷", "邊界", "反駁"],
};

const EXPOSED_FRAMEWORK_LABEL = /^(?:定義|是什麼|運作|怎樣運作|機制|認知改變|認知修正|行動指導|怎麼做|建議|原問|改問|作|給定|不|未選|已有|尚缺|規則|關係|分配|捲入|回應|反制|本源|開啟|關閉|修正|憑什麼|接下來|根據|推斷|邊界|反駁)[：:]/mu;
const OLD_CONTRACT = /(?:^|\n)(?:核心|完整|容易誤認|真正問題|結構式|變數|遷移)：|The One|最小狀態變化|->/mu;

function metadataValue(content: string, key: string, format: NoteFormat): string | undefined {
  const prefix = format === "org" ? "#\\+" : "";
  return content.match(new RegExp(`^${prefix}${key}:\\s*(.+?)\\s*$`, "mi"))?.[1]?.trim();
}

function nonEmptyLines(body: string): string[] {
  return body.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
}

function sectionBody(content: string, heading: string, format: NoteFormat): string | undefined {
  const lines = content.split(/\r?\n/u);
  const headingLine = `${format === "org" ? "*" : "#"} ${heading}`;
  const start = lines.findIndex((line) => line.trimEnd() === headingLine);
  if (start < 0) return undefined;
  const nextHeading = format === "org" ? /^\* /u : /^# /u;
  const offset = lines.slice(start + 1).findIndex((line) => nextHeading.test(line));
  const end = offset < 0 ? lines.length : start + 1 + offset;
  return lines.slice(start + 1, end).join("\n").trim();
}

function paragraphs(body: string): string[] {
  return body.split(/\r?\n\s*\r?\n/u).map((part) => part.replace(/\s*\r?\n\s*/gu, " ").trim()).filter(Boolean);
}

function parseEmphasizedBullets(body: string, format: NoteFormat): EmphasizedBullet[] {
  const pattern = format === "org"
    ? /^- \*([^*\n]+)\*：\s*(.+)$/u
    : /^- \*\*([^*\n]+)\*\*：\s*(.+)$/u;
  return nonEmptyLines(body).flatMap((line) => {
    const match = line.match(pattern);
    const label = match?.[1]?.trim();
    const value = match?.[2]?.trim();
    return label && value ? [{ label, value }] : [];
  });
}

function hasExactLabels(entries: EmphasizedBullet[], expected: string[]): boolean {
  return JSON.stringify(entries.map(({ label }) => label)) === JSON.stringify(expected);
}

function parseCompleteCore(line: string): string | undefined {
  const value = line.replace(/^完整：/u, "").trim();
  if (!value) return undefined;
  if (!value.startsWith("（")) return value;
  const closing = value.indexOf("）");
  return closing > 0 ? value.slice(closing + 1).trim() || undefined : undefined;
}

function validateSyntax(content: string, format: NoteFormat, errors: string[]): void {
  if (/\b(?:TODO|TBD)\b|待補|佔位|\{[^}\n]+\}/iu.test(content)) {
    errors.push("檔案中不能殘留 TODO、TBD 或模板佔位符");
  }
  if (format === "org") {
    if (/^#{1,6}\s+/mu.test(content) || /```/u.test(content)) {
      errors.push("Org 檔案中不能出現 Markdown 標題或程式碼圍欄");
    }
    if (/\[[^\]\n]+\]\([^\)\n]+\)/u.test(content)) {
      errors.push("Org 檔案中不能出現 Markdown 連結語法");
    }
  } else if (/^#\+/mu.test(content) || /^\*\s+/mu.test(content)) {
    errors.push("Markdown 檔案中不能出現 Org 元資料或 Org 標題");
  }
}

function validateV3ActionContract(action: string, errors: string[], location: string): void {
  const hasActor = /^.{2,28}(?:通過|以|用|經由|藉助|選擇|制定|實施|建立|部署)/u.test(action);
  const hasCreation = /(?:做成|建立|創制|制定|實行|實施|部署|組織成|賦予|重構|改造|使.+成為|讓.+成為|把.+(?:做成|變成|組織成))/u.test(action);
  const hasOrder = /(?:秩序|規則|關係|制度|規範|分配|權力|責任|身份|角色|治理|安排|機制|實踐|網路)/u.test(action);
  if ([...action].length < 18 || !hasActor || !hasCreation || !hasOrder) {
    errors.push(`${location}必須寫清行動者、具體創制行動及其建立的共同安排；長度足夠的抽象句也不合格`);
  }
}

function validateV4ActionContract(action: string, errors: string[]): void {
  const hasAction = /(?:安排|決定|組織|建立|制定|部署|改造|引入|規定|連線|集中|開放|關閉|評分|派單|讓|使|把|變成|成為)/u.test(action);
  const hasSharedChange = /(?:秩序|規則|關係|制度|安排|網路|入口|評價|服務|做法|機制|選擇|權力|責任|工作|生活|城市|組織|共同)/u.test(action);
  if ([...action].length < 24 || [...action].length > 140 || !hasAction || !hasSharedChange) {
    errors.push("v4 action 要用一到兩句普通話說清關鍵動作及其造成的共同變化，不能只寫願望、影響或抽象口號");
  }
}

type V5Fields = {
  definition?: string;
  operation?: string;
  recognition?: string;
  guidance?: string;
};

function validateV5(
  fileName: string,
  content: string,
  format: NoteFormat,
  identifier: string | undefined,
  title: string | undefined,
  tags: string[],
  headings: string[],
  errors: string[],
): V5Fields {
  const fileMatch = fileName.match(/^(\d{8}T\d{6})--理解-(.+)__is\.(org|md)$/u);
  if (!fileMatch || !fileMatch[2]?.trim()) {
    errors.push("v5 檔名必須符合 YYYYMMDDTHHMMSS--理解-<目標>__is.org 或 __is.md");
  } else if (identifier && identifier !== fileMatch[1]) {
    errors.push("identifier 必須與檔名時間戳一致");
  }
  if (!title?.startsWith("理解：") || title === "理解：") {
    errors.push("title 必須是非空的「理解：<目標>」");
  }
  if (!tags.includes("is") || !tags.includes("act")) {
    errors.push("v5 標籤必須同時包含 is 與 act");
  }

  if (headings.length < 2 || headings.length > 4) {
    errors.push("v5 正文使用兩到四個隨內容生出的一級標題");
  }
  const fixedHeading = /^(?:是什麼|定義|如何運作|怎樣運作|機制|認知改變|認知修正|行動指導|怎麼做|建議|開場|展開|結尾|引入|分析|結論|說明|正文|第一部分|第二部分|第三部分)$/u;
  const headingsAreDistinct = new Set(headings).size === headings.length;
  if (!headingsAreDistinct || headings.some((heading) => [...heading].length < 4 || [...heading].length > 28 || fixedHeading.test(heading))) {
    errors.push("v5 標題必須具體、互不重複並由內容生出，不能把理解步驟直接用作欄目名");
  }

  const bodies = headings.map((heading) => sectionBody(content, heading, format) ?? "");
  if (bodies.some((body) => /^\s*(?:[-+] |\d+[.)]\s+)/mu.test(body))) {
    errors.push("v5 正文不能使用專案符號或編號清單；理解步驟要寫成連續講解");
  }
  if (bodies.some((body) => EXPOSED_FRAMEWORK_LABEL.test(body))) {
    errors.push("v5 正文不能暴露「定義 / 運作 / 認知改變 / 行動指導」等欄位標籤");
  }

  const paragraphsBySection = bodies.map(paragraphs);
  const paragraphCount = paragraphsBySection.reduce((sum, items) => sum + items.length, 0);
  if (paragraphsBySection.some((items) => items.length < 1) || paragraphCount < 4 || paragraphCount > 10) {
    errors.push("v5 每節至少一個自然段，全文保持四到十段，讓理解充分但不為結構填充篇幅");
  }

  const visibleBody = bodies.join("\n\n");
  const visibleChars = [...visibleBody.replace(/\s/gu, "")].length;
  if (visibleChars < 380) {
    errors.push("v5 正文過短，尚不足以講清定義、運作、認知修正與行動判斷");
  }

  const definition = metadataValue(content, "definition", format);
  if (!definition) {
    errors.push("v5 必須用 definition 元資料記錄 X 是什麼以及關鍵邊界");
  } else if ([...definition].length < 18 || [...definition].length > 160 || /^(?:一種東西|某種事物|顧名思義|簡單來說就是)/u.test(definition)) {
    errors.push("v5 definition 要用普通話給出上位類別與關鍵差別，不能只寫空泛同義反復");
  }

  const operation = metadataValue(content, "operation", format);
  const operationVerb = /(?:輸入|輸出|對映|比較|選擇|計算|組織|連線|限制|決定|調整|保留|排除|生成|改變|作用|把|將|讓|使|通過|根據|按照)/u;
  if (!operation) {
    errors.push("v5 必須用 operation 元資料記錄 X 怎樣起作用");
  } else if ([...operation].length < 18 || [...operation].length > 200 || !operationVerb.test(operation)) {
    errors.push("v5 operation 要說清關鍵動作以及什麼因此改變，不能只重複用途或影響");
  }

  const recognition = metadataValue(content, "recognition", format);
  const recognitionShift = /(?:不是|不再|原來|以為|意味著|這使|改變|不能只|不能再|應當從|關鍵不在|關鍵在|真正)/u;
  if (!recognition) {
    errors.push("v5 必須用 recognition 元資料記錄這番理解修正了哪種舊判斷");
  } else if ([...recognition].length < 18 || [...recognition].length > 200 || !recognitionShift.test(recognition)) {
    errors.push("v5 recognition 要寫出理解前後的判斷差別，不能另起一句抽象感想");
  }

  const guidance = metadataValue(content, "guidance", format);
  const guidanceAction = /(?:先|檢查|比較|區分|確認|判斷|測試|驗證|追問|識別|選擇|記錄|調整|修改|不要|避免|看|問)/u;
  const genericGuidance = /^(?:今後|以後)?(?:對此)?(?:保持關注|保持重視|提高認識|綜合考慮|謹慎對待|具體情況具體分析)/u;
  if (!guidance) {
    errors.push("v5 必須用 guidance 元資料記錄面對 X 時怎樣觀察、判斷或行動");
  } else if ([...guidance].length < 18 || [...guidance].length > 220 || !guidanceAction.test(guidance) || genericGuidance.test(guidance)) {
    errors.push("v5 guidance 要給出使用了前述機制的具體判斷抓手，不能寫萬能建議");
  }

  const basis = metadataValue(content, "basis", format);
  if (!basis) {
    errors.push("v5 必須用 basis 元資料記錄事實基礎");
  } else if (/(?:據說|聽說|傳聞|有人說|大概|也許|可能是|我覺得|我感覺)/u.test(basis)) {
    errors.push("v5 basis 不能用傳聞、感覺或未標明的可能性冒充事實根據");
  }

  const falsifier = metadataValue(content, "falsifier", format);
  if (!falsifier) {
    errors.push("v5 必須用 falsifier 元資料記錄什麼事實會推翻當前解釋");
  } else if (!/(?:如果|若).*(?:站不住|不成立|重寫|推翻|需要改)/su.test(falsifier)) {
    errors.push("v5 falsifier 必須明確寫出在什麼事實下當前解釋會不成立或需要重寫");
  }

  const semicolons = visibleBody.match(/；/gu)?.length ?? 0;
  const listCommas = visibleBody.match(/、/gu)?.length ?? 0;
  if (semicolons > 4 || listCommas > 12) {
    errors.push("v5 正文仍有明顯的要素羅列：減少分號和連續頓號，讓一句話只推進一個主要變化");
  }
  const longSentence = visibleBody.split(/[。！？\n]/u).map((part) => part.trim()).find((part) => [...part].length > 100);
  if (longSentence) {
    errors.push("v5 存在超過 100 字的長句；拆開抽象名詞鏈，讓理解分步發生");
  }

  if (OLD_CONTRACT.test(content)) {
    errors.push("v5 不得殘留本質核心、The One、結構遷移或 A -> B 舊合同");
  }
  return { definition, operation, recognition, guidance };
}

function validateV4(
  fileName: string,
  content: string,
  format: NoteFormat,
  identifier: string | undefined,
  title: string | undefined,
  tags: string[],
  headings: string[],
  errors: string[],
): string | undefined {
  const fileMatch = fileName.match(/^(\d{8}T\d{6})--動詞-(.+)__is\.(org|md)$/u);
  if (!fileMatch || !fileMatch[2]?.trim()) {
    errors.push("v4 檔名必須符合 YYYYMMDDTHHMMSS--動詞-<目標>__is.org 或 __is.md");
  } else if (identifier && identifier !== fileMatch[1]) {
    errors.push("identifier 必須與檔名時間戳一致");
  }
  if (!title?.startsWith("動詞：") || title === "動詞：") {
    errors.push("title 必須是非空的「動詞：<目標>」");
  }
  if (!tags.includes("is") || !tags.includes("act")) {
    errors.push("v4 標籤必須同時包含 is 與 act");
  }

  if (headings.length < 2 || headings.length > 4) {
    errors.push("v4 正文使用兩到四個隨內容生出的一級標題，篇幅隨題目自然伸縮");
  }
  const genericHeading = /^(?:開場|展開|結尾|引入|分析|結論|說明|正文|第一部分|第二部分|第三部分)$/u;
  const headingsAreDistinct = new Set(headings).size === headings.length;
  if (!headingsAreDistinct || headings.some((heading) => [...heading].length < 4 || [...heading].length > 28 || V3_HEADINGS.includes(heading) || genericHeading.test(heading))) {
    errors.push("v4 標題必須具體、互不重複並由主題內容生出，不能沿用框架欄目或「開場 / 分析 / 結論」佔位名");
  }

  const bodies = headings.map((heading) => sectionBody(content, heading, format) ?? "");
  if (bodies.some((body) => /^\s*(?:[-+] |\d+[.)]\s+)/mu.test(body))) {
    errors.push("v4 正文不能使用專案符號或編號清單；後臺要素必須寫進連續敘事");
  }
  if (bodies.some((body) => EXPOSED_FRAMEWORK_LABEL.test(body))) {
    errors.push("v4 正文不能暴露「規則 / 分配 / 反制 / 邊界」等欄位標籤");
  }

  const paragraphsBySection = bodies.map(paragraphs);
  const paragraphCount = paragraphsBySection.reduce((sum, items) => sum + items.length, 0);
  if (paragraphsBySection.some((items) => items.length < 2) || paragraphCount < 5 || paragraphCount > 12) {
    errors.push("v4 每節至少兩個自然段，全文保持五到十二段，讓解釋有展開也有收束");
  }

  const visibleBody = bodies.join("\n\n");
  const visibleChars = [...visibleBody.replace(/\s/gu, "")].length;
  if (visibleChars < 450) {
    errors.push("v4 正文過短，尚不足以讓場景、選擇、反制與未決問題自然展開");
  }
  const firstParagraph = paragraphsBySection[0]?.[0] ?? "";
  if (!/(?:你|我們|人們|一位|一個|一家|一輛|一場|一天|當.+時|早上|晚上|路邊|辦公室|手機|螢幕|會議|門口|車裡|走進|開啟|拿起|站在)/u.test(firstParagraph)) {
    errors.push("v4 第一段必須讓讀者先看見具體的人、場景或動作，再進入抽象判斷");
  }

  const action = metadataValue(content, "action", format);
  if (!action) {
    errors.push("v4 必須用 action 元資料儲存全文唯一的中心動作");
  } else {
    validateV4ActionContract(action, errors);
  }

  const basis = metadataValue(content, "basis", format);
  if (!basis) {
    errors.push("v4 必須用 basis 元資料記錄事實基礎");
  } else if (/(?:據說|聽說|傳聞|有人說|大概|也許|可能是|我覺得|我感覺)/u.test(basis)) {
    errors.push("v4 basis 不能用傳聞、感覺或未標明的可能性冒充事實根據");
  }

  const falsifier = metadataValue(content, "falsifier", format);
  if (!falsifier) {
    errors.push("v4 必須用 falsifier 元資料記錄什麼事實會推翻當前解釋");
  } else if (!/(?:如果|若).*(?:站不住|不成立|重寫|推翻|需要改)/su.test(falsifier)) {
    errors.push("v4 falsifier 必須明確寫出在什麼事實下當前解釋會不成立或需要重寫");
  }

  const semicolons = visibleBody.match(/；/gu)?.length ?? 0;
  const listCommas = visibleBody.match(/、/gu)?.length ?? 0;
  if (semicolons > 4 || listCommas > 14) {
    errors.push("v4 正文仍有明顯的要素羅列：減少分號和連續頓號，讓一句話只推進一個主要變化");
  }
  const longSentence = visibleBody.split(/[。！？\n]/u).map((part) => part.trim()).find((part) => [...part].length > 100);
  if (longSentence) {
    errors.push("v4 存在超過 100 字的長句；拆開抽象名詞鏈，讓因果分步發生");
  }

  const finalBody = bodies.at(-1) ?? "";
  if (!finalBody.trim().endsWith("？")) {
    errors.push("v4 必須以一個由全文逼出的真問題結束");
  }

  if (OLD_CONTRACT.test(content)) {
    errors.push("v4 不得殘留本質核心、The One、結構遷移或 A -> B 舊合同");
  }
  return action;
}

function validateV3(
  fileName: string,
  content: string,
  format: NoteFormat,
  identifier: string | undefined,
  title: string | undefined,
  tags: string[],
  headings: string[],
  errors: string[],
): string | undefined {
  const fileMatch = fileName.match(/^(\d{8}T\d{6})--動詞-(.+)__is\.(org|md)$/u);
  if (!fileMatch || !fileMatch[2]?.trim()) {
    errors.push("v3 檔名必須符合 YYYYMMDDTHHMMSS--動詞-<目標>__is.org 或 __is.md");
  } else if (identifier && identifier !== fileMatch[1]) {
    errors.push("identifier 必須與檔名時間戳一致");
  }
  if (!title?.startsWith("動詞：") || title === "動詞：") errors.push("title 必須是非空的「動詞：<目標>」");
  if (!tags.includes("is") || !tags.includes("act")) errors.push("v3 標籤必須同時包含 is 與 act");
  if (JSON.stringify(headings) !== JSON.stringify(V3_HEADINGS)) {
    errors.push(`v3 一級標題必須嚴格依次為：${V3_HEADINGS.join(" / ")}`);
  }

  const valuesBySection = new Map<string, Map<string, string>>();
  for (const [heading, labels] of Object.entries(V3_SECTION_LABELS)) {
    const body = sectionBody(content, heading, format) ?? "";
    const lines = nonEmptyLines(body);
    const entries = parseEmphasizedBullets(body, format);
    if (lines.length !== entries.length || !hasExactLabels(entries, labels)) {
      errors.push(`「${heading}」必須且只能依次使用：${labels.join(" / ")}`);
    }
    valuesBySection.set(heading, new Map(entries.map(({ label, value }) => [label, value])));
  }

  const judgment = valuesBySection.get("動詞判斷") ?? new Map<string, string>();
  const reframed = judgment.get("改問") ?? "";
  if (reframed && (!reframed.includes("憑什麼") || !reframed.includes("而不是"))) {
    errors.push("「改問」必須同時保留「憑什麼」與「而不是」");
  }
  const action = judgment.get("作");
  if (action) validateV3ActionContract(action, errors, "「作」");

  const possibility = valuesBySection.get("一個不") ?? new Map<string, string>();
  const given = possibility.get("給定") ?? "";
  const unchosen = possibility.get("未選") ?? "";
  if (unchosen && (/^(?:無|沒有|其他可能|未知)$/u.test(unchosen) || unchosen === given)) {
    errors.push("「未選」必須是一種不同於給定現實的真實可理解安排");
  }

  const openQuestions = valuesBySection.get("未決問題") ?? new Map<string, string>();
  for (const label of ["憑什麼", "接下來"]) {
    const value = openQuestions.get(label);
    if (value && !value.endsWith("？")) errors.push(`「未決問題」的「${label}」必須以全形問號結束`);
  }

  const reaction = valuesBySection.get("捲入與反制")?.get("反制") ?? "";
  const reactionHasAdoption = /(?:依賴|執行|採用|內化|固化|嵌入|成為.+(?:依據|標準|入口)|制度化)/u.test(reaction);
  const reactionHasBackPressure = /(?:反過來|也(?:會|將|必須)|迫使|要求|限制|規定|塑造|約束|支配|誘導|難以|不得|只能)/u.test(reaction);
  if (reaction && (!reactionHasAdoption || !reactionHasBackPressure)) {
    errors.push("「反制」必須說明創造物因被依賴、執行或內化，怎樣反過來規定創造者；純粹壞後果不合格");
  }

  const origin = valuesBySection.get("歷史與未來")?.get("本源") ?? "";
  const originHasBacktrace = /(?:逆溯|回溯|追到|定位)/u.test(origin);
  const originHasCreationEvent = /(?:建立|創制|建立|制定|開始|事件|時刻|選擇)/u.test(origin);
  const originHasPersistentProblem = /(?:持續|反覆|不斷|重來|不能刪除|不可刪除|未解決|尚未解決|問題)/u.test(origin);
  if (origin && (!originHasBacktrace || !originHasCreationEvent || !originHasPersistentProblem)) {
    errors.push("「本源」必須從當前困境逆溯到建立秩序事件，並指出由它持續生成、不能輕易刪除的問題；不是尋找時間上最早的原點");
  }

  const basis = valuesBySection.get("根據與邊界")?.get("根據") ?? "";
  if (basis && /(?:據說|聽說|傳聞|有人說|大概|也許|可能是|我覺得|我感覺)/u.test(basis)) {
    errors.push("「根據」不能用傳聞、感覺或未標明的可能性冒充證據；不確定內容應放入「推斷」或「尚缺」");
  }
  const falsifier = valuesBySection.get("根據與邊界")?.get("反駁") ?? "";
  if (falsifier && !/(?:如果|若|一旦)/u.test(falsifier)) {
    errors.push("「反駁」必須用「如果 / 若 / 一旦」寫出會推翻當前判斷的新事實");
  }
  if (OLD_CONTRACT.test(content)) errors.push("v3 不得殘留本質核心、The One、結構遷移或 A -> B 舊合同");
  return action;
}

function validateLegacy(
  fileName: string,
  content: string,
  format: NoteFormat,
  schema: NoteSchema,
  identifier: string | undefined,
  title: string | undefined,
  tags: string[],
  headings: string[],
  errors: string[],
): string | undefined {
  const fileMatch = fileName.match(/^(\d{8}T\d{6})--本質-(.+)__is\.(org|md)$/u);
  if (!fileMatch || !fileMatch[2]?.trim()) {
    errors.push("歷史檔名必須符合 YYYYMMDDTHHMMSS--本質-<目標>__is.org 或 __is.md");
  } else if (identifier && identifier !== fileMatch[1]) {
    errors.push("identifier 必須與檔名時間戳一致");
  }
  if (!title?.startsWith("本質：") || title === "本質：") errors.push("歷史 title 必須是非空的「本質：<目標>」");
  if (!tags.includes("is")) errors.push("歷史標籤必須包含 is");
  const required = schema === V2_SCHEMA ? V2_HEADINGS : LEGACY_HEADINGS;
  if (JSON.stringify(headings) !== JSON.stringify(required)) {
    errors.push(`歷史一級標題必須嚴格依次為：${required.join(" / ")}`);
  }

  const essence = sectionBody(content, "本質", format) ?? "";
  const coreLines = nonEmptyLines(essence).filter((line) => line.startsWith("核心："));
  const core = coreLines.length === 1 ? coreLines[0]?.replace(/^核心：/u, "").trim() : undefined;
  if (!core) errors.push("歷史筆記必須在「本質」中保留唯一非空核心");

  const complete = sectionBody(content, "完整表達", format) ?? "";
  const completeLines = nonEmptyLines(complete).filter((line) => line.startsWith("完整："));
  if (completeLines.length !== 1) {
    errors.push("歷史筆記必須保留唯一「完整：...」");
  } else if (core && parseCompleteCore(completeLines[0] ?? "") !== core) {
    errors.push("歷史完整表達的落腳核心必須與「核心：」一致");
  }

  if (schema === V2_SCHEMA) {
    const transfer = parseEmphasizedBullets(sectionBody(content, "結構遷移", format) ?? "", format);
    if (!hasExactLabels(transfer, ["結構式", "變數", "遷移", "邊界"])) {
      errors.push("v2「結構遷移」必須依次保留：結構式 / 變數 / 遷移 / 邊界");
    }
  }
  return core;
}

export function validateNoteText(filePath: string, content: string): ValidationResult {
  const errors: string[] = [];
  const fileName = basename(filePath);
  const extension = fileName.match(/\.(org|md)$/u)?.[1] as NoteFormat | undefined;
  const format = extension ?? "org";
  if (!extension) errors.push("副檔名必須是 .org 或 .md");

  const declaredSchema = metadataValue(content, "schema", format);
  const schema: NoteSchema | undefined = declaredSchema === V5_SCHEMA
    ? V5_SCHEMA
    : declaredSchema === V4_SCHEMA
    ? V4_SCHEMA
    : declaredSchema === V3_SCHEMA
    ? V3_SCHEMA
    : declaredSchema === V2_SCHEMA
    ? V2_SCHEMA
    : declaredSchema
    ? undefined
    : "legacy";
  if (!schema) errors.push(`schema 只支援 ${V5_SCHEMA}、${V4_SCHEMA}、${V3_SCHEMA}、${V2_SCHEMA} 或無 schema 的 legacy`);

  const title = metadataValue(content, "title", format);
  const date = metadataValue(content, "date", format);
  const identifier = metadataValue(content, "identifier", format);
  const rawTags = metadataValue(content, format === "org" ? "filetags" : "tags", format);
  const tags = rawTags?.replace(/[\[\],:]/gu, " ").split(/\s+/u).filter(Boolean) ?? [];
  const headingPattern = format === "org" ? /^\* ([^\n]+?)\s*$/gmu : /^# ([^\n]+?)\s*$/gmu;
  const headings = [...content.matchAll(headingPattern)].map((match) => match[1] ?? "");

  if (!date || (format === "org" && !/^\[[^\]]+\]$/u.test(date))) errors.push("date 缺失或格式不正確");
  if (!identifier || !/^\d{8}T\d{6}$/u.test(identifier)) errors.push("identifier 必須是 YYYYMMDDTHHMMSS");
  validateSyntax(content, format, errors);

  let definition: string | undefined;
  let operation: string | undefined;
  let recognition: string | undefined;
  let guidance: string | undefined;
  let action: string | undefined;
  let core: string | undefined;
  if (schema === V5_SCHEMA) {
    ({ definition, operation, recognition, guidance } = validateV5(fileName, content, format, identifier, title, tags, headings, errors));
  } else if (schema === V4_SCHEMA) {
    action = validateV4(fileName, content, format, identifier, title, tags, headings, errors);
  } else if (schema === V3_SCHEMA) {
    action = validateV3(fileName, content, format, identifier, title, tags, headings, errors);
  } else if (schema) {
    core = validateLegacy(fileName, content, format, schema, identifier, title, tags, headings, errors);
  }
  return { ok: errors.length === 0, errors, identifier, schema, definition, operation, recognition, guidance, action, core };
}

export async function validateNoteFile(filePath: string): Promise<ValidationResult> {
  const file = Bun.file(filePath);
  if (!(await file.exists())) return { ok: false, errors: [`檔案不存在：${filePath}`] };
  return validateNoteText(filePath, await file.text());
}

if (import.meta.main) {
  const filePath = Bun.argv[2];
  if (filePath === "--help" || filePath === "-h") {
    console.log("用法：bun ValidateNote.ts <note-file>");
    console.log("校驗 ljg-is-v5 可使用理解筆記，併兼容讀取 ljg-is-v4、ljg-is-v3、ljg-is-v2 與 legacy 筆記。");
    process.exit(0);
  }
  if (!filePath) {
    console.error(JSON.stringify({ status: "error", errors: ["用法：bun ValidateNote.ts <note-file>"] }));
    process.exit(2);
  }
  const result = await validateNoteFile(filePath);
  if (!result.ok) {
    console.error(JSON.stringify({ status: "error", ...result }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ status: "ok", path: filePath, ...result }, null, 2));
}
