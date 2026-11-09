import { mkdir, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = join(import.meta.dir, "..");
const output = resolve(process.env.LJG_CARD_FIXTURE_DIR ?? "/tmp/ljg-card-v7-fixtures");
const logoPath = join(import.meta.dir, "logo.png");
const logo = pathToFileURL(logoPath).href;
const fixtureImagePath = process.env.LJG_CARD_FIXTURE_IMAGE;
const fixtureImage = pathToFileURL(resolve(fixtureImagePath ?? logoPath)).href;
const fixtureImageAlt = fixtureImagePath
  ? "人物面對一組工作任務，單線場景用於驗證長圖敘事錨點"
  : "黑色圓形品牌影像，僅用於驗證本地點陣圖槽成功載入";

await mkdir(output, { recursive: true });

function fill(template: string, values: Record<string, string>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(values)) {
    rendered = rendered.replaceAll(`{{${key}}}`, value);
  }
  const leftovers = rendered.match(/\{\{[A-Z_]+\}\}/g) ?? [];
  if (leftovers.length > 0) throw new Error(`Unreplaced placeholders: ${leftovers.join(", ")}`);
  return rendered;
}

function sha256(bytes: Uint8Array): string {
  return new Bun.CryptoHasher("sha256").update(bytes).digest("hex");
}

async function run(command: string[]): Promise<void> {
  const process = Bun.spawn(command, {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
    process.exited,
  ]);
  if (stdout.trim()) console.log(stdout.trim());
  if (exitCode !== 0) {
    throw new Error(`${command.join(" ")} failed (${exitCode}): ${stderr.trim()}`);
  }
}

async function runExpectFailure(command: string[], expectedText: string): Promise<void> {
  const process = Bun.spawn(command, {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
    process.exited,
  ]);
  const combined = `${stdout}\n${stderr}`;
  if (exitCode === 0) throw new Error(`${command.join(" ")} unexpectedly passed`);
  if (!combined.includes(expectedText)) {
    throw new Error(`${command.join(" ")} failed without expected text ${JSON.stringify(expectedText)}: ${combined.trim()}`);
  }
  console.log(`expected-failure: ${expectedText}`);
}

async function readPngWidth(path: string): Promise<number> {
  const bytes = new Uint8Array(await Bun.file(path).arrayBuffer());
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 24 || signature.some((byte, index) => bytes[index] !== byte)) {
    throw new Error(`Invalid PNG: ${path}`);
  }
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(16);
}

function contrastRatio(foreground: string, background: string): number {
  const channels = (value: string): number[] => {
    const matches = value.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [];
    if (matches.length !== 3) throw new Error(`Unsupported color for contrast check: ${value}`);
    return matches;
  };
  const luminance = (value: string): number => {
    const linear = channels(value).map(channel => {
      const normalized = channel / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

async function inspectBodyFonts(path: string): Promise<{
  computed_stack: string;
  title_computed_stack: string;
  headline_computed_stack: string;
  platform_fonts: Array<{ familyName: string; postScriptName: string; glyphCount: number }>;
  title_platform_fonts: Array<{ familyName: string; postScriptName: string; glyphCount: number }>;
  headline_platform_fonts: Array<{ familyName: string; postScriptName: string; glyphCount: number }>;
  remote_resources: string[];
  visual_metrics: {
    canvas_background: string;
    card_background: string;
    text_color: string;
    font_size_px: number;
    line_height_px: number;
    line_height_ratio: number;
    document_width_px: number;
    contrast_ratio: number;
  };
}> {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(path).href, { waitUntil: "load" });
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready;
    });
    const selector = ".full-document > p:not(.opening):not(.full-key)";
    const computed = await page.$eval(selector, element => {
      const style = getComputedStyle(element);
      const fontSize = Number.parseFloat(style.fontSize);
      const lineHeight = Number.parseFloat(style.lineHeight);
      const card = document.querySelector<HTMLElement>(".full-card");
      const documentRoot = document.querySelector<HTMLElement>(".full-document");
      return {
        stack: style.fontFamily,
        canvasBackground: getComputedStyle(document.documentElement).backgroundColor,
        cardBackground: card ? getComputedStyle(card).backgroundColor : "",
        textColor: style.color,
        fontSize,
        lineHeight,
        lineHeightRatio: lineHeight / fontSize,
        documentWidth: documentRoot?.getBoundingClientRect().width ?? 0,
      };
    });
    const remoteResources = await page.evaluate(() =>
      performance.getEntriesByType("resource")
        .map(entry => entry.name)
        .filter(name => /^https?:/i.test(name)),
    );
    const titleComputedStack = await page.$eval(".full-document h1", element => getComputedStyle(element).fontFamily);
    const headlineComputedStack = await page.$eval(".full-document h2", element => getComputedStyle(element).fontFamily);
    const session = await page.context().newCDPSession(page);
    await session.send("DOM.enable");
    await session.send("CSS.enable");
    const documentNode = await session.send("DOM.getDocument") as { root: { nodeId: number } };
    const platformFonts = async (surfaceSelector: string) => {
      const node = await session.send("DOM.querySelector", {
        nodeId: documentNode.root.nodeId,
        selector: surfaceSelector,
      }) as { nodeId: number };
      const result = await session.send("CSS.getPlatformFontsForNode", {
        nodeId: node.nodeId,
      }) as { fonts: Array<{ familyName: string; postScriptName: string; glyphCount: number }> };
      return result.fonts;
    };
    return {
      computed_stack: computed.stack,
      title_computed_stack: titleComputedStack,
      headline_computed_stack: headlineComputedStack,
      platform_fonts: await platformFonts(selector),
      title_platform_fonts: await platformFonts(".full-document h1"),
      headline_platform_fonts: await platformFonts(".full-document h2"),
      remote_resources: remoteResources,
      visual_metrics: {
        canvas_background: computed.canvasBackground,
        card_background: computed.cardBackground,
        text_color: computed.textColor,
        font_size_px: computed.fontSize,
        line_height_px: computed.lineHeight,
        line_height_ratio: computed.lineHeightRatio,
        document_width_px: computed.documentWidth,
        contrast_ratio: contrastRatio(computed.textColor, computed.cardBackground),
      },
    };
  } finally {
    await browser.close();
  }
}

async function inspectWhiteboardFonts(path: string): Promise<{
  title: Array<{ familyName: string; postScriptName: string; glyphCount: number }>;
  relation: Array<{ familyName: string; postScriptName: string; glyphCount: number }>;
  body: Array<{ familyName: string; postScriptName: string; glyphCount: number }>;
  remote_resources: string[];
}> {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(path).href, { waitUntil: "load" });
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready;
    });
    const session = await page.context().newCDPSession(page);
    await session.send("DOM.enable");
    await session.send("CSS.enable");
    const documentNode = await session.send("DOM.getDocument") as { root: { nodeId: number } };
    const platformFonts = async (selector: string) => {
      const node = await session.send("DOM.querySelector", {
        nodeId: documentNode.root.nodeId,
        selector,
      }) as { nodeId: number };
      const result = await session.send("CSS.getPlatformFontsForNode", {
        nodeId: node.nodeId,
      }) as { fonts: Array<{ familyName: string; postScriptName: string; glyphCount: number }> };
      return result.fonts;
    };
    return {
      title: await platformFonts(".whiteboard-title"),
      relation: await platformFonts(".transition-sentence"),
      body: await platformFonts(".step-support"),
      remote_resources: await page.evaluate(() =>
        performance.getEntriesByType("resource")
          .map(entry => entry.name)
          .filter(name => /^https?:/i.test(name)),
      ),
    };
  } finally {
    await browser.close();
  }
}

const common = {
  IMAGE_STATE: "ready",
  IMAGE_SRC: logo,
  IMAGE_ALT: "黑色圓形品牌影像，僅用於驗證本地點陣圖槽成功載入",
  IMAGE_CLAIM: "claim-anchor",
  LOGO: logo,
  SOURCE_LINE: '<span class="info-source">結構驗收樣例</span>',
};

const fullBlocks = [
  { id: "b001", text: "當內容不動，設計才真正開始" },
  { id: "b002", text: "原文中的“一個字”與 A & B 都不能被改寫。" },
  { id: "b003", text: "排版負責什麼" },
  { id: "b004", text: "強調可以改變看見的順序，不能改變原稿的順序。" },
  { id: "b005", text: "標題建立層級。" },
  { id: "b006", text: "正文保持呼吸。" },
  { id: "b007", text: "作者的句子只出現一次。" },
  { id: "b008", text: "結構樣例" },
  { id: "b009", text: "行內程式碼 const answer 仍屬於原文。" },
  { id: "b010", text: "const answer = 42;" },
  { id: "b011", text: "表一　設計與邊界" },
  { id: "b012", text: "動作" },
  { id: "b013", text: "邊界" },
  { id: "b014", text: "排版" },
  { id: "b015", text: "只改呈現" },
  { id: "b016", text: "原稿圖片保真進入，不承擔新解釋。" },
  { id: "b017", text: "注：腳註降級顯示，但仍完整可讀。" },
];

const fullDocumentHtml = [
  '<h1 data-source-block="b001">當內容不動，設計才真正開始</h1>',
  '<p class="opening" data-source-block="b002">原文中的“<strong>一個字</strong>”與 A &amp; B 都不能被改寫。</p>',
  '<h2 data-source-block="b003">排版負責什麼</h2>',
  '<p class="full-key" data-source-block="b004">強調可以改變看見的順序，不能改變原稿的順序。</p>',
  '<ul><li data-source-block="b005">標題建立層級。</li><li data-source-block="b006">正文保持呼吸。</li></ul>',
  '<blockquote><p data-source-block="b007">作者的句子只出現一次。</p></blockquote>',
  '<h3 data-source-block="b008">結構樣例</h3>',
  '<p data-source-block="b009">行內程式碼 <code>const answer</code> 仍屬於原文。</p>',
  '<pre data-source-block="b010"><code>const answer = 42;</code></pre>',
  '<table><caption data-source-block="b011">表一　設計與邊界</caption><thead><tr><th data-source-block="b012">動作</th><th data-source-block="b013">邊界</th></tr></thead><tbody><tr><td data-source-block="b014">排版</td><td data-source-block="b015">只改呈現</td></tr></tbody></table>',
  `<figure class="source-figure"><img src="${fixtureImage}" alt="來源圖片，用於驗證全文模式的本地 source 資產"><figcaption data-source-block="b016">原稿圖片保真進入，不承擔新解釋。</figcaption></figure>`,
  '<hr class="section-break" aria-hidden="true">',
  '<section class="footnotes"><p class="footnote" data-source-block="b017">注：腳註降級顯示，但仍完整可讀。</p></section>',
].join("");

const sourceSnapshot = `${fullBlocks.map(block => block.text).join("\n\n")}\n`;
const sourcePath = join(output, "full-source.txt");
const ledgerPath = join(output, "full-source-ledger.json");
await Bun.write(sourcePath, sourceSnapshot);
await Bun.write(
  ledgerPath,
  `${JSON.stringify({
    version: 1,
    source_sha256: sha256(new TextEncoder().encode(sourceSnapshot)),
    blocks: fullBlocks,
  }, null, 2)}\n`,
);

type FixtureRole = "question" | "premise" | "evidence" | "tension" | "inference" | "turn" | "synthesis" | "conclusion" | "boundary";
type FixturePresentation = "text" | "typography" | "image" | "chain" | "branch" | "timeline" | "matrix" | "radial";

interface FixtureStep {
  id: string;
  role: FixtureRole;
  source_refs: string[];
  claim: string;
  support: string;
  residue: string;
  must_render: true;
  presentation: FixturePresentation;
}

interface FixtureRelation {
  id: string;
  from: string;
  to: string;
  kind: "continue" | "deepen" | "contrast" | "question" | "branch" | "return" | "boundary";
  visibility: "implicit" | "visible";
  bridge: string;
}

const roleLabels: Record<FixtureRole, string> = {
  question: "問題",
  premise: "前提",
  evidence: "證據",
  tension: "矛盾",
  inference: "推論",
  turn: "轉折",
  synthesis: "匯合",
  conclusion: "結論",
  boundary: "邊界",
};

const whiteboardParagraphs = [
  "經驗留下了大量軌跡，但模型能力沒有隨任務結束而改變。",
  "上下文只能暫存經驗，不能保證下一次任務繼續呼叫。",
  "不同記憶層的寫入深度、更新頻率與呼叫成本彼此牽制。",
  "單一路線無法同時最佳化穩定保留與快速更新，論證因此分叉。",
  "世界模型路線從完整軌跡中學習環境怎樣變化。",
  "LoRA 與策略路線選擇高價值軌跡並寫入隔離能力。",
  "兩條路線最終回到同一組寫入深度與呼叫成本權衡。",
  "持續學習依賴經驗進入下一輪仍可呼叫的載體。",
  "遺忘、線上更新與新舊能力干擾仍是開放問題。",
];
const whiteboardSource = `${whiteboardParagraphs.join("\n\n")}\n`;
const whiteboardSourceHash = sha256(new TextEncoder().encode(whiteboardSource));
const whiteboardSourcePath = join(output, "whiteboard-source.txt");
const whiteboardSourceInventoryPath = join(output, "whiteboard-source-inventory.json");
await Bun.write(whiteboardSourcePath, whiteboardSource);
await run([
  "bun",
  join(root, "assets", "prepare-whiteboard-source.ts"),
  whiteboardSourcePath,
  whiteboardSourceInventoryPath,
]);

const logicStep = (step: FixtureStep, depth: string): string => [
  `<article class="logic-step" data-step-id="${step.id}" data-role="${step.role}" data-source-refs="${step.source_refs.join(" ")}">`,
  `<div class="step-marker" aria-hidden="true"><span class="step-depth">${depth}</span><span class="step-dot"></span></div>`,
  '<div class="step-panel">',
  `<span class="step-role">${roleLabels[step.role]}</span>`,
  `<h2 class="step-claim">${step.claim}</h2>`,
  `<p class="step-support">${step.support}</p>`,
  `<p class="step-residue">${step.residue}</p>`,
  "</div></article>",
].join("");

const logicRelation = (relation: FixtureRelation): string => relation.visibility === "implicit"
  ? `<div class="logic-relation" data-relation-id="${relation.id}" data-from="${relation.from}" data-to="${relation.to}" data-kind="${relation.kind}" data-visibility="implicit" aria-hidden="true"></div>`
  : [
    `<div class="logic-relation" data-relation-id="${relation.id}" data-from="${relation.from}" data-to="${relation.to}" data-kind="${relation.kind}" data-visibility="visible" aria-label="${relation.bridge}">`,
    '<span class="relation-rail" aria-hidden="true"><span class="relation-stem"></span><span class="relation-arrowhead"></span></span>',
    `<div class="transition-copy"><p class="transition-sentence">${relation.bridge}</p></div>`,
    "</div>",
  ].join("");

const sourceSectionsFor = (steps: FixtureStep[]) => whiteboardParagraphs.map((_, index) => {
  const id = `src-${String(index + 1).padStart(2, "0")}`;
  const stepIds = steps.filter(step => step.source_refs.includes(id)).map(step => step.id);
  return stepIds.length > 0
    ? { id, disposition: "rendered" as const, step_ids: stepIds }
    : { id, disposition: "omitted" as const, omission_reason: "區域性結構 fixture 只驗證所列步驟，不展開其餘分支路線。" };
});

const logicLedger = (steps: FixtureStep[], relations: FixtureRelation[]): string => JSON.stringify({
  version: 2,
  source_sha256: whiteboardSourceHash,
  source_sections: sourceSectionsFor(steps),
  steps,
  relations,
}).replaceAll("<", "\\u003c");

const whiteboardShell = (title: string, question: string, orientation: string, spine: string): string => [
  '<main class="whiteboard-content">',
  '<header class="whiteboard-header"><span class="whiteboard-kicker">LOGIC DIVE</span>',
  `<h1 class="whiteboard-title">${title}</h1>`,
  `<p class="whiteboard-question">${question}</p>`,
  `<p class="whiteboard-orientation">${orientation}</p></header>`,
  '<section class="reasoning-spine"><span class="spine-rail" aria-hidden="true"><span class="spine-line"></span></span>',
  spine,
  "</section></main>",
].join("");

const matrixShape = '<section class="local-shape local-matrix" data-logic-shape="matrix"><h3 class="local-shape-title">把兩條路線放回同一座標</h3><div class="matrix-frame"><div class="matrix-axis-x"><span>呼叫成本：低 → 高</span><span class="axis-line"></span><span class="axis-arrowhead" aria-hidden="true"></span></div><div class="matrix-axis-y"><span>寫入深度：淺 → 深</span><span class="axis-line"></span><span class="axis-arrowhead" aria-hidden="true"></span></div><div class="matrix-grid"><article class="quadrant"><h3>上下文</h3><p>寫入淺，呼叫輕。</p></article><article class="quadrant"><h3>狀態</h3><p>區域性保留，可再檢索。</p></article><article class="quadrant"><h3>介面卡</h3><p>能力隔離，按需載入。</p></article><article class="quadrant"><h3>引數</h3><p>寫入深，更新昂貴。</p></article></div></div></section>';

const compositeSteps: FixtureStep[] = [
  { id: "step-01", role: "question", source_refs: ["src-01"], claim: "經驗為什麼沒有變成能力？", support: "Agent 完成了任務，也留下了大量軌跡。", residue: "任務結束時，模型本身仍然沒有改變。", must_render: true, presentation: "typography" },
  { id: "step-02", role: "premise", source_refs: ["src-02"], claim: "短期記住，不等於長期學會", support: "上下文能暫存經驗，卻不能保證跨任務繼續呼叫。", residue: "", must_render: true, presentation: "text" },
  { id: "step-03", role: "tension", source_refs: ["src-03"], claim: "寫得越深，能力越穩；代價也越高", support: "上下文、狀態、介面卡與引數，是不同深度的記憶層。", residue: "", must_render: true, presentation: "text" },
  { id: "step-04", role: "turn", source_refs: ["src-04"], claim: "問題因此分成兩條技術路線", support: "一條先學習環境怎樣變化；另一條先選擇哪些經驗值得寫入。", residue: "", must_render: true, presentation: "branch" },
  { id: "step-05", role: "inference", source_refs: ["src-05"], claim: "世界模型路線", support: "從成功、失敗與無標籤軌跡中學習狀態轉移。", residue: "可學習的經驗更多了，模型與訓練成本也隨之上升。", must_render: true, presentation: "branch" },
  { id: "step-06", role: "inference", source_refs: ["src-06"], claim: "LoRA / 策略路線", support: "強編碼 Agent 選擇軌跡，把變化寫入隔離的介面卡。", residue: "改寫範圍縮小了，路由與協作負擔卻留了下來。", must_render: true, presentation: "branch" },
  { id: "step-07", role: "synthesis", source_refs: ["src-07"], claim: "兩條路線落到同一個權衡", support: "真正共同的座標，是更新頻率、寫入深度與呼叫成本。", residue: "", must_render: true, presentation: "matrix" },
  { id: "step-08", role: "conclusion", source_refs: ["src-08"], claim: "能力來自可持續寫入，而不是更多對話", support: "經驗必須進入下一輪仍可檢索、路由或訓練的載體。", residue: "", must_render: true, presentation: "typography" },
  { id: "step-09", role: "boundary", source_refs: ["src-09"], claim: "人類水平的持續學習仍未完成", support: "遺忘、非獨立同分布的線上更新與新舊能力干擾仍是開放問題。", residue: "", must_render: true, presentation: "text" },
];

const compositeRelations: FixtureRelation[] = [
  { id: "rel-01", from: "step-01", to: "step-02", kind: "deepen", visibility: "implicit", bridge: "" },
  { id: "rel-02", from: "step-02", to: "step-03", kind: "question", visibility: "visible", bridge: "如果經驗要跨任務保留，就必須先看清它能寫到多深、多久更新一次。" },
  { id: "rel-03", from: "step-03", to: "step-04", kind: "branch", visibility: "visible", bridge: "單一記憶層無法同時滿足快速更新與穩定保留，問題由此分成兩條路線。" },
  { id: "rel-04a", from: "step-04", to: "step-05", kind: "branch", visibility: "implicit", bridge: "" },
  { id: "rel-05a", from: "step-05", to: "step-07", kind: "return", visibility: "implicit", bridge: "" },
  { id: "rel-04b", from: "step-04", to: "step-06", kind: "branch", visibility: "implicit", bridge: "" },
  { id: "rel-05b", from: "step-06", to: "step-07", kind: "return", visibility: "implicit", bridge: "" },
  { id: "rel-06", from: "step-07", to: "step-08", kind: "deepen", visibility: "implicit", bridge: "" },
  { id: "rel-07", from: "step-08", to: "step-09", kind: "boundary", visibility: "visible", bridge: "即使經驗已經能夠寫入，遺忘與線上更新仍然限制著它能否穩定積累。" },
];

const compositeSpine = [
  logicStep(compositeSteps[0], "00"), logicRelation(compositeRelations[0]),
  logicStep(compositeSteps[1], "20"), logicRelation(compositeRelations[1]),
  logicStep(compositeSteps[2], "40"), logicRelation(compositeRelations[2]),
  logicStep(compositeSteps[3], "60"),
  '<section class="local-shape local-branch" data-logic-shape="branch" data-branch-state="converged" data-entry-step="step-04" data-return-step="step-07"><h3 class="local-shape-title">同一缺口，分出兩種寫入路線</h3><div class="branch-grid">',
  `<div class="branch-path" data-branch-id="world-model">${logicRelation(compositeRelations[3])}${logicStep(compositeSteps[4], "A")}${logicRelation(compositeRelations[4])}</div>`,
  `<div class="branch-path" data-branch-id="policy-lora">${logicRelation(compositeRelations[5])}${logicStep(compositeSteps[5], "B")}${logicRelation(compositeRelations[6])}</div>`,
  '</div><p class="branch-return">兩條路線在下一層重新匯合：比較的不再是哪條更先進，而是誰把經驗寫到多深、多久更新一次、呼叫時付出多少成本。</p></section>',
  logicStep(compositeSteps[6], "80"), matrixShape, logicRelation(compositeRelations[7]),
  logicStep(compositeSteps[7], "100"), logicRelation(compositeRelations[8]),
  logicStep(compositeSteps[8], "120"),
].join("");

const whiteboardComposite = whiteboardShell(
  "經驗，怎樣變成能力？",
  "一段任務經驗，怎樣進入下一次任務仍然可呼叫的能力？",
  "沿著寫入位置不斷下潛，直到兩條技術路線在同一組成本約束下重新匯合。",
  compositeSpine,
);

const buildLinearWhiteboard = (shape: "chain" | "timeline" | "matrix" | "radial", shapeHtml: string) => {
  const steps: FixtureStep[] = [
    { id: "step-01", role: "question", source_refs: ["src-01"], claim: "這個變化從哪裡開始？", support: "先找到原文試圖解釋的具體局面。", residue: "現狀與目標之間還隔著一個沒有解釋的缺口。", must_render: true, presentation: "typography" },
    { id: "step-02", role: "premise", source_refs: ["src-02"], claim: "舊辦法只解決了表面", support: "區域性結果出現了，承重機制仍未改變。", residue: "", must_render: true, presentation: "text" },
    { id: "step-03", role: "inference", source_refs: ["src-03"], claim: "關鍵機制開始可見", support: "區域性結構只解釋這一層，不替代整條主幹。", residue: "", must_render: true, presentation: shape },
    { id: "step-04", role: "conclusion", source_refs: ["src-08", "src-09"], claim: "經驗要能在下一次任務中被呼叫", support: "寫入載體之後，還要處理遺忘和新舊能力干擾。", residue: "", must_render: true, presentation: "typography" },
  ];
  const relations: FixtureRelation[] = [
    { id: "rel-01", from: "step-01", to: "step-02", kind: "deepen", visibility: "implicit", bridge: "" },
    { id: "rel-02", from: "step-02", to: "step-03", kind: "question", visibility: "visible", bridge: "表面結果已經出現，真正決定它能否持續的內部機制卻還沒有被看見。" },
    { id: "rel-03", from: "step-03", to: "step-04", kind: "continue", visibility: "implicit", bridge: "" },
  ];
  const spine = [
    logicStep(steps[0], "00"), logicRelation(relations[0]),
    logicStep(steps[1], "25"), logicRelation(relations[1]),
    logicStep(steps[2], "50"), shapeHtml, logicRelation(relations[2]),
    logicStep(steps[3], "100"),
  ].join("");
  return {
    html: whiteboardShell("邏輯沿主幹不斷下潛", "區域性結構怎樣服務整篇文章的推導？", "主幹保持閱讀方向，區域性工具只在論證改變形狀時出現。", spine),
    ledger: logicLedger(steps, relations),
  };
};

const chainShape = '<section class="local-shape local-chain" data-logic-shape="chain"><h3 class="local-shape-title">節點內部的短遞進</h3><p class="local-chain-item">先辨認條件</p><p class="local-chain-item">再看機制變化</p><p class="local-chain-item">最後觀察結果</p></section>';
const timelineShape = '<section class="local-shape local-timeline" data-logic-shape="timeline"><h3 class="local-shape-title">同一物件的狀態遷移</h3><div class="timeline-track"><article class="timeline-event"><time class="timeline-time">T0</time><div><h3>手工執行</h3><p>注意力被重複動作佔滿。</p></div></article><article class="timeline-event"><time class="timeline-time">T1</time><div><h3>判斷前移</h3><p>工具接走步驟，人開始管理例外。</p></div></article></div></section>';
const radialShape = '<section class="local-shape local-radial" data-logic-shape="radial"><h3 class="local-shape-title">多個機制共同作用</h3><div class="radial-grid"><article class="radial-center"><h3>反饋改變下一輪選擇</h3><p>結果必須進入下一次分配。</p></article><article class="radial-spoke"><h3>改變資訊</h3><p>偏差變得可見。</p></article><article class="radial-spoke"><h3>改變激勵</h3><p>有效路徑獲得資源。</p></article></div></section>';

const linearWhiteboards = {
  "whiteboard-chain": buildLinearWhiteboard("chain", chainShape),
  "whiteboard-timeline": buildLinearWhiteboard("timeline", timelineShape),
  "whiteboard-matrix": buildLinearWhiteboard("matrix", matrixShape),
  "whiteboard-radial": buildLinearWhiteboard("radial", radialShape),
};

// Authored teaching input shared by both molds. These are layout/content samples,
// not evidence of reader learning and not production long cards with generated art.
const learningParagraphs = [
  "豎直旗杆頂端連著一條繃直的 13 米拉繩。地面水平，繩腳距杆腳 5 米。旗杆有多高？",
  "旗杆與地面垂直，構成直角；繃直拉繩對應斜邊 c=13，水平距離對應直角邊 b=5。直角三角形滿足 a²+b²=c²。",
  "旗杆高度 a=√(13²−5²)=12 米。先認出直角與各條邊，公式才有明確的輸入。",
  "換成一把靠在豎直牆面、置於水平地面的 10 米直梯，梯腳距牆 6 米。哪條是斜邊，頂端離地多高？地面傾斜時還能直接套同一計算嗎？",
  "直梯對應斜邊；牆與水平地面垂直，所以高度為 √(10²−6²)=8 米。地面傾斜時，牆與地面的夾角需要重新判斷，不能直接沿用直角條件。",
];
const learningSourcePath = join(output, "learning-source.txt");
const learningInventoryPath = join(output, "learning-source-inventory.json");
const learningSource = `${learningParagraphs.join("\n\n")}\n`;
await Bun.write(learningSourcePath, learningSource);
await run(["bun", join(root, "assets", "prepare-whiteboard-source.ts"), learningSourcePath, learningInventoryPath]);

const learningPanel = (body: string, label: string, className = "learning-material") =>
  `<section class="${className}"><span class="learning-label">${label}</span><p>${body}</p></section>`;
const transferHtml = learningPanel(learningParagraphs[3], "換個情形 · 先判斷再下滑", "transfer-check") +
  learningPanel(learningParagraphs[4], "核對依據", "transfer-feedback");
const learningSteps: FixtureStep[] = [
  { id: "step-01", role: "question", source_refs: ["src-01"], claim: "旗杆高度怎樣算？", support: learningParagraphs[0], residue: "", must_render: true, presentation: "text" },
  { id: "step-02", role: "premise", source_refs: ["src-02"], claim: "先認出直角和斜邊", support: learningParagraphs[1], residue: "", must_render: true, presentation: "text" },
  { id: "step-03", role: "conclusion", source_refs: ["src-03"], claim: "對應清楚後再計算", support: learningParagraphs[2], residue: "", must_render: true, presentation: "text" },
  { id: "step-04", role: "conclusion", source_refs: ["src-04", "src-05"], claim: "換物件，重查條件", support: `換個情形 · 先判斷再下滑 ${learningParagraphs[3]} 核對依據 ${learningParagraphs[4]}`, residue: "", must_render: true, presentation: "text" },
];
const learningRelations: FixtureRelation[] = learningSteps.slice(0, -1).map((step, index) => ({
  id: `rel-0${index + 1}`, from: step.id, to: learningSteps[index + 1].id,
  kind: "continue", visibility: "implicit", bridge: "",
}));
const learningSpine = learningSteps.map((step, index) => {
  let html = logicStep(step, String(index + 1).padStart(2, "0"));
  if (index === 1) {
    html = html.replace(`<p class="step-support">${step.support}</p>`,
      `<section class="learning-material"><span class="learning-label">憑什麼歸類</span><p class="step-support">${step.support}</p></section>`);
  }
  if (index === 3) {
    // Keep one complete support surface for the existing ledger/DOM contract.
    html = html.replace(`<p class="step-support">${step.support}</p>`,
      `<div class="step-support">${transferHtml}</div>`);
  }
  return html + (learningRelations[index] ? logicRelation(learningRelations[index]) : "");
}).join("");
const learningLedger = JSON.stringify({
  version: 2,
  source_sha256: sha256(new TextEncoder().encode(learningSource)),
  source_sections: learningParagraphs.map((_, index) => {
    const id = `src-${String(index + 1).padStart(2, "0")}`;
    return { id, disposition: "rendered", step_ids: learningSteps.filter(step => step.source_refs.includes(id)).map(step => step.id) };
  }),
  steps: learningSteps,
  relations: learningRelations,
}).replaceAll("<", "\\u003c");

const fixtures: Record<string, Record<string, string>> = {
  "long-learning": {
    LOGO: logo, SOURCE_LINE: '<span class="info-source">自擬教學材料 · 排版檢查</span>',
    IMAGE_STATE: "empty", IMAGE_SRC: "", IMAGE_ALT: "",
    BG_COLOR: "#FAF6EC", ACCENT_COLOR: "#B6533F",
    TITLE_BLOCK: '<div class="title-area"><div class="eyebrow">知識講解 · 判別與應用</div><h1>會背公式，還要認對物件</h1><p class="deck">同一條關係，怎樣從旗杆走到梯子？</p></div>',
    BODY_HTML: `<p>${learningParagraphs[0]}</p>${learningPanel(learningParagraphs[1], "憑什麼歸類")}<p>${learningParagraphs[2]}</p>${transferHtml}`,
  },
  "whiteboard-learning": {
    LOGO: logo, SOURCE_LINE: '<span class="info-source">自擬教學材料 · 來源與排版檢查</span>',
    CUSTOM_CSS: "", LOGIC_LEDGER_JSON: learningLedger,
    CONTENT_HTML: whiteboardShell("從場景，走進公式", "哪些具體條件讓這道題可以使用勾股定理？", "從旗杆到梯子，先認出直角、斜邊，再計算高度。", learningSpine),
  },
  long: {
    ...common,
    IMAGE_SRC: fixtureImage,
    IMAGE_ALT: fixtureImageAlt,
    BG_COLOR: "#FAF6EC",
    ACCENT_COLOR: "#B6533F",
    TITLE_BLOCK: '<div class="title-area"><div class="eyebrow">論文解讀 · 決策邊界</div><h1>AI 不只是在省時間</h1><p class="deck">真正的生產率問題，是控制權如何在工作流裡移動。</p></div>',
    BODY_HTML: '<p class="dropcap">當一個人面對同一組任務：先全部手做，再讓工具接管重複步驟。場景只畫動作變化，結論仍由文字說準。</p><p class="highlight">關鍵變化不是“更快”，而是人的注意力從執行移向判斷。</p><section class="narrative-beat"><span class="beat-index">01</span><div><h2>壓力出現</h2><p>任務數量沒有減少，重複操作先擠佔了用於判斷的時間。</p></div></section><section class="narrative-beat"><span class="beat-index">02</span><div><h2>控制權移動</h2><p>工具接走可描述的步驟，人保留目標、例外與驗收。</p></div></section><div class="metric-row"><div class="metric"><strong>1 個</strong><span>穩定人物貫穿前後變化</span></div><div class="metric"><strong>2 拍</strong><span>足夠表達一條因果鏈</span></div></div><p>效率數字可以說明區域性任務表現，不能自動推出組織總產出或長期福利。</p><div class="prompt"><strong>閱讀問題：</strong>工具替你做了什麼，又把哪一種判斷還給了你？</div><div class="closing-judgment">把 AI 放進工作流時，先畫清控制權，再討論速度。</div>',
  },
  full: {
    ...common,
    CUSTOM_CSS: "",
    DOCUMENT_HTML: fullDocumentHtml,
  },
  comic: {
    ...common,
    CUSTOM_CSS: '.fixture { margin: 24px 60px 42px; padding: 32px; border: 4px solid var(--ink); } .fixture h1 { font: 900 68px/1 var(--serif); } .fixture p { margin-top: 18px; font: 400 28px/1.5 var(--sans); }',
    CONTENT_HTML: '<main class="fixture"><h1>動作進入分格</h1><p>對白、旁白和格線仍由排版層承擔。</p></main>',
  },
  whiteboard: {
    LOGO: logo,
    SOURCE_LINE: '<span class="info-source">縱向論證驗收樣例</span>',
    CUSTOM_CSS: "",
    LOGIC_LEDGER_JSON: logicLedger(compositeSteps, compositeRelations),
    CONTENT_HTML: whiteboardComposite,
  },
  ...Object.fromEntries(Object.entries(linearWhiteboards).map(([name, fixture]) => [name, {
    LOGO: logo,
    SOURCE_LINE: '<span class="info-source">區域性結構驗收樣例</span>',
    CUSTOM_CSS: "",
    LOGIC_LEDGER_JSON: fixture.ledger,
    CONTENT_HTML: fixture.html,
  }])),
};

for (const [name, values] of Object.entries(fixtures)) {
  const templateName = name.startsWith("whiteboard") ? "whiteboard" : name.startsWith("long") ? "long" : name;
  const template = await Bun.file(join(root, "assets", `${templateName}_template.html`)).text();
  const path = join(output, `${name}.html`);
  await Bun.write(path, fill(template, values));
  console.log(path);
}

const whiteboardTemplate = await Bun.file(join(root, "assets", "whiteboard_template.html")).text();
const validWhiteboardHtml = fill(whiteboardTemplate, fixtures.whiteboard);
const implicitCopyRelations = structuredClone(compositeRelations);
implicitCopyRelations[0].bridge = "繼續追問。";
const implicitCopyHtml = fill(whiteboardTemplate, {
  ...fixtures.whiteboard,
  LOGIC_LEDGER_JSON: logicLedger(compositeSteps, implicitCopyRelations),
});
const duplicateTransitionSteps = structuredClone(compositeSteps);
duplicateTransitionSteps[1].residue = "經驗若要跨任務保留，就必須找到一種可持續寫入的機制。";
const duplicateTransitionHtml = fill(whiteboardTemplate, {
  ...fixtures.whiteboard,
  LOGIC_LEDGER_JSON: logicLedger(duplicateTransitionSteps, compositeRelations),
  CONTENT_HTML: whiteboardComposite.replace(
    '<p class="step-residue"></p>',
    '<p class="step-residue">經驗若要跨任務保留，就必須找到一種可持續寫入的機制。</p>',
  ),
});
const invalidWhiteboards = [
  {
    name: "whiteboard-invalid-placeholder",
    expected: "Unreplaced placeholders",
    html: validWhiteboardHtml.replace('data-step-id="step-01"', 'data-step-id="{{UNRESOLVED_STEP}}"'),
  },
  {
    name: "whiteboard-invalid-summary-collapse",
    expected: "Ledger/DOM step mismatch",
    html: validWhiteboardHtml.replace(
      '<article class="logic-step" data-step-id="step-02"',
      '<article class="logic-step omitted-step" data-removed-step-id="step-02"',
    ),
  },
  {
    name: "whiteboard-invalid-source-anchor",
    expected: "missing source refs",
    html: validWhiteboardHtml.replace('data-source-refs="src-03"', 'data-source-refs=""'),
  },
  {
    name: "whiteboard-invalid-relation-endpoint",
    expected: "Relation endpoint not found",
    html: validWhiteboardHtml
      .replace('"to":"step-03"', '"to":"missing-step"')
      .replace('data-to="step-03"', 'data-to="missing-step"'),
  },
  {
    name: "whiteboard-invalid-branch-return",
    expected: "must return",
    html: validWhiteboardHtml.replace('class="branch-return"', 'class="branch-return-missing"'),
  },
  {
    name: "whiteboard-invalid-implicit-copy",
    expected: "must keep bridge empty",
    html: implicitCopyHtml,
  },
  {
    name: "whiteboard-invalid-duplicate-transition",
    expected: "duplicates the visible transition",
    html: duplicateTransitionHtml,
  },
  {
    name: "whiteboard-invalid-overflow",
    expected: "Horizontal overflow",
    html: validWhiteboardHtml.replace("</style>", ".whiteboard-content { width: 1320px; }</style>"),
  },
  {
    name: "whiteboard-invalid-height",
    expected: "Full-page height",
    html: validWhiteboardHtml.replace("</style>", ".whiteboard-content { min-height: 31050px; }</style>"),
  },
] as const;

for (const fixture of invalidWhiteboards) {
  const path = join(output, `${fixture.name}.html`);
  await Bun.write(path, fixture.html);
  console.log(path);
}

const fullTemplate = await Bun.file(join(root, "assets", "full_template.html")).text();
const missingPreferredTemplate = fullTemplate.replaceAll(
  "'KingHwa_OldSong'",
  "'DefinitelyMissingKingHwaOldSong'",
);
if (missingPreferredTemplate === fullTemplate) {
  throw new Error("Full template does not expose the KingHwa_OldSong preferred-font slot");
}
const fallbackHtmlPath = join(output, "full-fallback.html");
await Bun.write(fallbackHtmlPath, fill(missingPreferredTemplate, fixtures.full));
console.log(fallbackHtmlPath);

const longTemplate = await Bun.file(join(root, "assets", "long_template.html")).text();
const longBase = fixtures.long;

for (const [name, imageValues] of Object.entries({
  "long-empty": { IMAGE_STATE: "empty", IMAGE_SRC: "", IMAGE_ALT: "" },
  "long-broken": {
    IMAGE_STATE: "ready",
    IMAGE_SRC: pathToFileURL(join(output, "does-not-exist.png")).href,
    IMAGE_ALT: "用於驗證損壞圖片會被截圖門禁拒絕",
  },
})) {
  const path = join(output, `${name}.html`);
  await Bun.write(path, fill(longTemplate, { ...longBase, ...imageValues }));
  console.log(path);
}

await run([
  "bun",
  join(root, "assets", "verify-full-text.ts"),
  ledgerPath,
  join(output, "full.html"),
  sourcePath,
]);

const preferredFontReport = await inspectBodyFonts(join(output, "full.html"));
const fallbackFontReport = await inspectBodyFonts(fallbackHtmlPath);
if (preferredFontReport.platform_fonts.length === 0) {
  throw new Error("Preferred full-text body resolved to no platform font");
}
if (preferredFontReport.title_platform_fonts.length === 0 || preferredFontReport.headline_platform_fonts.length === 0) {
  throw new Error("Preferred full-text title or headline resolved to no platform font");
}
if (fallbackFontReport.platform_fonts.length === 0) {
  throw new Error("Missing-preferred-font simulation resolved to no fallback platform font");
}
if (fallbackFontReport.title_platform_fonts.length === 0 || fallbackFontReport.headline_platform_fonts.length === 0) {
  throw new Error("Missing-preferred-font simulation resolved title or headline to no fallback font");
}
if (preferredFontReport.remote_resources.length > 0 || fallbackFontReport.remote_resources.length > 0) {
  throw new Error("Full-text font path loaded a remote resource");
}
const preferredSurfaces = [
  preferredFontReport.platform_fonts,
  preferredFontReport.title_platform_fonts,
  preferredFontReport.headline_platform_fonts,
];
if (preferredSurfaces.some(fonts => !fonts.some(font => font.familyName === "KingHwa_OldSong"))) {
  throw new Error("Installed KingHwa_OldSong did not unify body, title, and headline");
}
const fallbackSurfaces = [
  fallbackFontReport.platform_fonts,
  fallbackFontReport.title_platform_fonts,
  fallbackFontReport.headline_platform_fonts,
];
if (fallbackSurfaces.some(fonts => fonts.some(font => font.familyName === "KingHwa_OldSong"))) {
  throw new Error("Missing-preferred-font simulation did not fall through the local stack");
}
if (!fallbackFontReport.platform_fonts.some(font => font.familyName === "Songti SC")) {
  throw new Error("Missing-preferred-font body did not resolve to Songti SC on this machine");
}
if (!fallbackFontReport.title_platform_fonts.some(font => font.familyName === "PingFang SC") ||
    !fallbackFontReport.headline_platform_fonts.some(font => font.familyName === "PingFang SC")) {
  throw new Error("Missing-preferred-font title or headline did not resolve to PingFang SC on this machine");
}
for (const report of [preferredFontReport, fallbackFontReport]) {
  const metrics = report.visual_metrics;
  if (metrics.canvas_background !== "rgb(255, 255, 255)" || metrics.card_background !== "rgb(255, 255, 255)") {
    throw new Error("Full-text reading surface is not pure white");
  }
  if (metrics.text_color !== "rgb(23, 23, 23)") {
    throw new Error("Full-text body is not deep neutral black");
  }
  if (metrics.font_size_px < 40 || metrics.line_height_ratio < 1.9) {
    throw new Error("Full-text body size or line-height fell below the reading threshold");
  }
  if (metrics.document_width_px < 890 || metrics.document_width_px > 900) {
    throw new Error("Full-text measure escaped the 890–900px reading range");
  }
  if (metrics.contrast_ratio < 15) {
    throw new Error("Full-text body contrast fell below 15:1");
  }
}
console.log(JSON.stringify({
  "font-readback": "pass",
  "readability-readback": "pass",
  preferred: preferredFontReport,
  missing_preferred_fallback: fallbackFontReport,
}, null, 2));

const whiteboardFontReport = await inspectWhiteboardFonts(join(output, "whiteboard.html"));
if (whiteboardFontReport.remote_resources.length > 0) {
  throw new Error("Whiteboard font path loaded a remote resource");
}
if (!whiteboardFontReport.title.some(font => font.familyName === "Kaiti SC") ||
    !whiteboardFontReport.relation.some(font => font.familyName === "Kaiti SC")) {
  throw new Error("Whiteboard title or visible transition did not resolve to local Kaiti SC");
}
if (!whiteboardFontReport.body.some(font => font.familyName === "PingFang SC")) {
  throw new Error("Whiteboard body did not resolve to local PingFang SC");
}
console.log(JSON.stringify({
  "whiteboard-font-readback": "pass",
  ...whiteboardFontReport,
}, null, 2));

for (const name of Object.keys(fixtures)) {
  const pngPath = join(output, `${name}.png`);
  const captureCommand = [
    "bun",
    join(root, "assets", "capture.ts"),
    join(output, `${name}.html`),
    pngPath,
    "1080",
    "1600",
    "fullpage",
  ];
  if (name.startsWith("whiteboard")) {
    captureCommand.push(...(name === "whiteboard-learning"
      ? [learningInventoryPath, learningSourcePath]
      : [whiteboardSourceInventoryPath, whiteboardSourcePath]));
  }
  await run(captureCommand);
  const width = await readPngWidth(pngPath);
  if (width !== 1080) throw new Error(`Fixture width mismatch for ${name}: ${width}`);
  console.log(`fixture-readback: ${name} width=${width}`);
}

for (const fixture of invalidWhiteboards) {
  const invalidPng = join(output, `${fixture.name}.png`);
  await unlink(invalidPng).catch(error => {
    if ((error as { code?: string }).code !== "ENOENT") throw error;
  });
  await runExpectFailure([
    "bun",
    join(root, "assets", "capture.ts"),
    join(output, `${fixture.name}.html`),
    invalidPng,
    "1080",
    "1600",
    "fullpage",
    whiteboardSourceInventoryPath,
    whiteboardSourcePath,
  ], fixture.expected);
}
