import { afterEach, describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const pushPath = fileURLToPath(new URL("./Push.sh", import.meta.url));
const embeddedConverterPath = fileURLToPath(
  new URL("./MdizeEmbeddedOrg.ts", import.meta.url),
);
const temporaryRoots: string[] = [];

function writeFixture(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, "utf8");
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("ljg-push Markdown branch conversion", () => {
  test("converts standalone Org example blocks while preserving their literal diagram text and references", () => {
    const root = mkdtempSync(join(tmpdir(), "ljg-push-example-test-"));
    temporaryRoots.push(root);
    const localRoot = join(root, "local");
    const repoRoot = join(root, "repo");
    writeFixture(join(localRoot, "ljg-push", "Tools", "MdizeEmbeddedOrg.ts"), readFileSync(embeddedConverterPath, "utf8"));
    const diagram = "* literal node\n  A --> B\n# literal comment";
    writeFixture(join(localRoot, "ljg-book", "evals", "reading.org"),
      "#+title: Reading\n\n* Diagram\n#+BEGIN_EXAMPLE\n" + diagram + "\n#+END_EXAMPLE\n\n* After\nText\n");
    writeFixture(join(localRoot, "ljg-book", "evals", "pair.json"), JSON.stringify({ files: ["reading.org"], expected_output: "形成來源有界的Org及coverage；接受 Org 輸入。" }));
    const result = Bun.spawnSync(["bash", "-c", [
      'task_push_path="$1"', 'task_local_root="$2"', 'task_repo_root="$3"',
      "set --", "export LJG_PUSH_LIBRARY_ONLY=1", 'source "$task_push_path"',
      'SKILLS_LOCAL="$task_local_root"', 'SKILLS_REPO="$task_repo_root"',
      'mkdir -p "$SKILLS_REPO/skills"', 'sync_skill ljg-book 1',
      'audit_md_skill "$SKILLS_REPO/skills/ljg-book"',
    ].join("\n"), "bash", pushPath, localRoot, repoRoot], { stdout: "pipe", stderr: "pipe" });
    expect(result.exitCode, new TextDecoder().decode(result.stderr)).toBe(0);
    const generated = join(repoRoot, "skills", "ljg-book", "evals");
    expect(readFileSync(join(generated, "reading.md"), "utf8")).toBe(
      "---\ntitle: Reading\n---\n\n# Diagram\n```text\n" + diagram + "\n```\n\n# After\nText\n");
    expect(JSON.parse(readFileSync(join(generated, "pair.json"), "utf8"))).toEqual({ files: ["reading.md"], expected_output: "形成來源有界的Markdown 及 coverage；接受 Org 輸入。" });
    expect(existsSync(join(generated, "reading.org"))).toBe(false);
    expect(readFileSync(join(localRoot, "ljg-book", "evals", "reading.org"), "utf8")).toContain("#+BEGIN_EXAMPLE");
  });

  test("converts revised book and paper delivery checks without changing Org input support", () => {
    const root = mkdtempSync(join(tmpdir(), "ljg-push-delivery-test-"));
    temporaryRoots.push(root);
    const localRoot = join(root, "local");
    const repoRoot = join(root, "repo");
    writeFixture(join(localRoot, "ljg-push", "Tools", "MdizeEmbeddedOrg.ts"), readFileSync(embeddedConverterPath, "utf8"));
    const bookText = [
      "- 用真實 Emacs 讀回成品：確認 identifier、檔名、Denote 與 consult-notes，並實際執行 `org-lint`。如實報告 lint 結果；驗證器不可用時明確延期，不把未執行寫成通過。",
      "儲存以後，用真實 Emacs 讀回，並實際執行 `org-lint`。現有 Emacs 服務不可用時，可以使用能載入本機 Denote、consult、consult-notes 與 Org 的批處理 Emacs；驗證器不可用時明確延期。",
      "接受 Org 輸入。",
    ].join("\n");
    writeFixture(join(localRoot, "ljg-book", "SKILL.md"), bookText);
    writeFixture(join(localRoot, "ljg-paper", "SKILL.md"), "| 只有論文標題 | 讀取原文 | Org 筆記和 paper-map |\n接受 Org 輸入。\n");
    writeFixture(join(localRoot, "ljg-paper", "references", "paper-map.md"), "本欄位指 Org example 圖，表格另在案例記錄中說明。\n");
    writeFixture(join(localRoot, "ljg-paper", "references", "template.org"), "#+title: 測試\n\n* 正文\n{交付前：用真實 Emacs 檢查 Denote 與 org-lint，再完成獨立閱讀檢查。任何未通過或無法執行的專案都如實報告。}\n");
    writeFixture(join(localRoot, "ljg-paper", "evals", "evals.json"), JSON.stringify({ expected: "不要求生成 Org 或 paper-map", input: "接受 Org 輸入" }));
    const command = [
      'task_push_path="$1"', 'task_local_root="$2"', 'task_repo_root="$3"',
      "set --", "export LJG_PUSH_LIBRARY_ONLY=1", 'source "$task_push_path"',
      'SKILLS_LOCAL="$task_local_root"', 'SKILLS_REPO="$task_repo_root"',
      'mkdir -p "$SKILLS_REPO/skills"',
      'for name in ljg-book ljg-paper; do sync_skill "$name" 1; audit_md_skill "$SKILLS_REPO/skills/$name"; done',
    ].join("\n");
    const result = Bun.spawnSync(["bash", "-c", command, "bash", pushPath, localRoot, repoRoot], { stdout: "pipe", stderr: "pipe" });
    expect(result.exitCode, new TextDecoder().decode(result.stderr)).toBe(0);
    const generated = (skill: string, path: string) => readFileSync(join(repoRoot, "skills", skill, path), "utf8");
    const book = generated("ljg-book", "SKILL.md");
    expect(book).not.toContain("org-lint");
    expect(book).not.toContain("lint 結果");
    expect(book).not.toContain("與 Org 的批處理");
    expect(book).toContain("Denote 與 consult-notes");
    expect(book).toContain("如實報告檢查結果");
    expect(book).toContain("驗證器不可用時明確延期");
    expect(book).toContain("接受 Org 輸入");
    expect(generated("ljg-paper", "SKILL.md")).toContain("Markdown 筆記和 paper-map");
    expect(generated("ljg-paper", "references/paper-map.md")).toContain("Markdown 圍欄圖");
    const template = generated("ljg-paper", "references/template.md");
    expect(template).not.toContain("org-lint");
    expect(template).toContain("檢查 Denote");
    expect(template).toContain("任何未通過或無法執行的專案都如實報告");
    expect(JSON.parse(generated("ljg-paper", "evals/evals.json"))).toEqual({ expected: "不要求生成 Markdown 或 paper-map", input: "接受 Org 輸入" });
    expect(readFileSync(join(localRoot, "ljg-book", "SKILL.md"), "utf8")).toBe(bookText);
    expect(existsSync(join(localRoot, "ljg-paper", "references/template.org"))).toBe(true);
  });

  test("converts ljg-is output contracts all the way to Markdown semantics", () => {
    const root = mkdtempSync(join(tmpdir(), "ljg-push-is-test-"));
    temporaryRoots.push(root);
    const localRoot = join(root, "local");
    const repoRoot = join(root, "repo");
    const isRoot = join(localRoot, "ljg-is");

    writeFixture(
      join(localRoot, "ljg-push", "Tools", "MdizeEmbeddedOrg.ts"),
      readFileSync(embeddedConverterPath, "utf8"),
    );
    writeFixture(
      join(isRoot, "SKILL.md"),
      [
        "---",
        "name: ljg-is",
        "---",
        "把它接成可辨認、可判斷、可行動的 Org 解讀。",
      ].join("\n"),
    );
    writeFixture(
      join(isRoot, "Workflows", "TraceCreation.md"),
      [
        "`#+basis` 記錄事實根據。",
        "## Org 輸出合同",
        "schema 固定為 `ljg-is-v5`，標籤包含 `:is:act:`。",
        "- `#+definition` 記錄定義。",
        "- `#+operation` 記錄運作。",
        "- `#+recognition` 記錄認知修正。",
        "- `#+guidance` 記錄行動判斷。",
        "- `#+falsifier` 記錄反證。",
        'bun ValidateNote.ts "<Org 檔案路徑>"',
        "不要把 Org 的後臺檢查重新複製成聊天列表。",
      ].join("\n"),
    );
    writeFixture(
      join(isRoot, "Template.org"),
      "#+title: 理解：測試\n#+schema: ljg-is-v5\n* 測試標題\n正文。\n",
    );

    const command = [
      'task_push_path="$1"',
      'task_local_root="$2"',
      'task_repo_root="$3"',
      "set --",
      "export LJG_PUSH_LIBRARY_ONLY=1",
      'source "$task_push_path"',
      'SKILLS_LOCAL="$task_local_root"',
      'SKILLS_REPO="$task_repo_root"',
      'mkdir -p "$SKILLS_REPO/skills"',
      'sync_skill "ljg-is" 1',
      'audit_md_skill "$SKILLS_REPO/skills/ljg-is"',
    ].join("\n");
    const result = Bun.spawnSync(
      ["bash", "-c", command, "bash", pushPath, localRoot, repoRoot],
      { stdout: "pipe", stderr: "pipe" },
    );
    const stderr = new TextDecoder().decode(result.stderr);
    expect(result.exitCode, stderr).toBe(0);

    const generatedRoot = join(repoRoot, "skills", "ljg-is");
    const skill = readFileSync(join(generatedRoot, "SKILL.md"), "utf8");
    const workflow = readFileSync(
      join(generatedRoot, "Workflows", "TraceCreation.md"),
      "utf8",
    );
    expect(skill).toContain("Markdown 解讀");
    expect(workflow).toContain("## Markdown 輸出合同");
    expect(workflow).toContain("tags 同時包含 `is` 與 `act`");
    expect(workflow).toContain('"<Markdown 檔案路徑>"');
    expect(workflow).toContain("Markdown 的後臺檢查");
    expect(workflow).not.toMatch(/`#\+(definition|operation|recognition|guidance|basis|falsifier)`/);
  });

  test("converts paper output contracts while retaining explicit Org input fixtures", () => {
    const root = mkdtempSync(join(tmpdir(), "ljg-push-test-"));
    temporaryRoots.push(root);
    const localRoot = join(root, "local");
    const repoRoot = join(root, "repo");
    const paperRoot = join(localRoot, "ljg-paper");

    writeFixture(
      join(localRoot, "ljg-push", "Tools", "MdizeEmbeddedOrg.ts"),
      readFileSync(embeddedConverterPath, "utf8"),
    );
    writeFixture(
      join(paperRoot, "SKILL.md"),
      [
        "---",
        "name: ljg-paper",
        "---",
        "| 輸入 | 輸出 |",
        "|---|---|",
        "| PDF | 儲存一份由論文內容命名的 Org 與後臺 paper-map |",
        "| title | 儲存 Org 與 paper-map |",
        "Org 預設儲存到 `~/Context/`。",
        "交付通過 Denote/consult-notes/Org lint 與確定性 validator。",
        "隨後確認目錄索引、consult-notes 與 `org-lint`。",
      ].join("\n"),
    );
    writeFixture(
      join(paperRoot, "ReadingGuide.md"),
      "確認 `denote-directory-files`、consult-notes 與 `org-lint`。\n",
    );
    writeFixture(
      join(paperRoot, "references", "template.org"),
      "#+title: Test\n* Main\n加入一個 Org example 圖塊。\n",
    );
    writeFixture(
      join(paperRoot, "evals", "evals.json"),
      JSON.stringify(
        [
          { prompt: "儲存 Org 與 paper-map。" },
          { prompt: "儲存同一 Org 與 paper-map。" },
        ],
        null,
        2,
      ),
    );
    writeFixture(
      join(paperRoot, "scripts", "validate_note.ts"),
      [
        'const message = "最多保留一個 Org example 圖塊";',
        'const usage = "<note.org> --map <paper-map.md>";',
      ].join("\n"),
    );
    writeFixture(
      join(paperRoot, "scripts", "validate_note.test.ts"),
      [
        'const fixture = "20260820T000000--paper-test__paper.org";',
        'const header = "#+title: fixture";',
      ].join("\n"),
    );

    const command = [
      'task_push_path="$1"',
      'task_local_root="$2"',
      'task_repo_root="$3"',
      "set --",
      "export LJG_PUSH_LIBRARY_ONLY=1",
      'source "$task_push_path"',
      'SKILLS_LOCAL="$task_local_root"',
      'SKILLS_REPO="$task_repo_root"',
      'mkdir -p "$SKILLS_REPO/skills"',
      'sync_skill "ljg-paper" 1',
      'audit_md_skill "$SKILLS_REPO/skills/ljg-paper"',
    ].join("\n");
    const result = Bun.spawnSync(
      ["bash", "-c", command, "bash", pushPath, localRoot, repoRoot],
      { stdout: "pipe", stderr: "pipe" },
    );
    const stderr = new TextDecoder().decode(result.stderr);
    expect(result.exitCode, stderr).toBe(0);

    const generatedRoot = join(repoRoot, "skills", "ljg-paper");
    const skill = readFileSync(join(generatedRoot, "SKILL.md"), "utf8");
    const guide = readFileSync(join(generatedRoot, "ReadingGuide.md"), "utf8");
    const template = readFileSync(
      join(generatedRoot, "references", "template.md"),
      "utf8",
    );
    const evals = readFileSync(join(generatedRoot, "evals", "evals.json"), "utf8");
    const validator = readFileSync(
      join(generatedRoot, "scripts", "validate_note.ts"),
      "utf8",
    );
    const compatibilityFixture = readFileSync(
      join(generatedRoot, "scripts", "validate_note.test.ts"),
      "utf8",
    );

    expect(existsSync(join(generatedRoot, "references", "template.org"))).toBe(false);
    expect(skill).toContain("儲存一份由論文內容命名的 Markdown 與後臺 paper-map");
    expect(skill).toContain("Markdown 預設儲存到");
    expect(skill).not.toMatch(/Org lint|org-lint/);
    expect(guide).not.toContain("org-lint");
    expect(template).toContain("Markdown 圍欄圖塊");
    expect(evals).toContain("儲存 Markdown 與 paper-map");
    expect(evals).toContain("儲存同一 Markdown 與 paper-map");
    expect(evals).not.toContain("儲存 Org 與 paper-map");
    expect(validator).toContain("最多保留一個 Markdown 圍欄圖塊");
    expect(validator).toContain("<note.md> --map <paper-map.md>");
    expect(compatibilityFixture).toContain("__paper.org");
    expect(compatibilityFixture).toContain("#+title: fixture");

    writeFixture(
      join(generatedRoot, "evals", "evals.json"),
      JSON.stringify(
        [
          { prompt: "儲存 Org 與 paper-map。" },
          { prompt: "儲存同一 Org 與 paper-map。" },
        ],
        null,
        2,
      ),
    );
    const auditOnlyCommand = [
      'task_push_path="$1"',
      'task_skill_root="$2"',
      "set --",
      "export LJG_PUSH_LIBRARY_ONLY=1",
      'source "$task_push_path"',
      'audit_md_skill "$task_skill_root"',
    ].join("\n");
    const auditOnlyResult = Bun.spawnSync(
      ["bash", "-c", auditOnlyCommand, "bash", pushPath, generatedRoot],
      { stdout: "pipe", stderr: "pipe" },
    );
    const auditOnlyStderr = new TextDecoder().decode(auditOnlyResult.stderr);
    expect(auditOnlyResult.exitCode).toBe(1);
    expect(auditOnlyStderr).toContain("儲存 Org 與 paper-map");
    expect(auditOnlyStderr).toContain("儲存同一 Org 與 paper-map");
  });

  test("does not rewrite the publisher's own runtime audit literals", () => {
    const root = mkdtempSync(join(tmpdir(), "ljg-push-meta-test-"));
    temporaryRoots.push(root);
    const localRoot = join(root, "local");
    const repoRoot = join(root, "repo");
    const publisherRoot = join(localRoot, "ljg-push");
    const publisherFixture = [
      "最多保留一個 Org example 圖塊",
      "stdin__paper.org",
      "儲存 Org 與 paper-map",
    ].join("\n");
    writeFixture(join(publisherRoot, "SKILL.md"), "---\nname: ljg-push\n---\n");
    writeFixture(join(publisherRoot, "Tools", "Push.sh"), publisherFixture);

    const command = [
      'task_push_path="$1"',
      'task_local_root="$2"',
      'task_repo_root="$3"',
      "set --",
      "export LJG_PUSH_LIBRARY_ONLY=1",
      'source "$task_push_path"',
      'SKILLS_LOCAL="$task_local_root"',
      'SKILLS_REPO="$task_repo_root"',
      'mkdir -p "$SKILLS_REPO/skills"',
      'sync_skill "ljg-push" 1',
      'audit_md_skill "$SKILLS_REPO/skills/ljg-push"',
    ].join("\n");
    const result = Bun.spawnSync(
      ["bash", "-c", command, "bash", pushPath, localRoot, repoRoot],
      { stdout: "pipe", stderr: "pipe" },
    );
    const stderr = new TextDecoder().decode(result.stderr);
    expect(result.exitCode, stderr).toBe(0);
    expect(
      readFileSync(join(repoRoot, "skills", "ljg-push", "Tools", "Push.sh"), "utf8"),
    ).toBe(publisherFixture);
  });
});
