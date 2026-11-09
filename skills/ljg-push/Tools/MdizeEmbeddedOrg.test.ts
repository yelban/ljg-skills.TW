import { describe, expect, test } from "bun:test";
import { convertEmbeddedOrgTemplates } from "./MdizeEmbeddedOrg";

describe("convertEmbeddedOrgTemplates", () => {
  test("converts a full Org document template into fenced Markdown with YAML", () => {
    const source = [
      "```org",
      "#+title: 盲區掃描",
      "#+date: [2026-08-17]",
      "#+filetags: :blind:weread:",
      "",
      "* 昨天你在想什麼",
      "- 連結：[[https://example.com][閱讀]]",
      "```",
      "",
    ].join("\n");

    const converted = convertEmbeddedOrgTemplates(source);
    expect(converted).toContain("```markdown\n---\ntitle: 盲區掃描");
    expect(converted).toContain("tags: blind weread\n---\n# 昨天你在想什麼");
    expect(converted).toContain("- 連結：[閱讀](https://example.com)");
    expect(converted).not.toContain("#+");
  });

  test("preserves indentation for a nested full-document example", () => {
    const source = [
      "3. 檔案結構：",
      "",
      "   ```org",
      "   #+title: 圓桌",
      "   #+filetags: :roundtable:",
      "   * 議題與參會者",
      "   ** 第 N 輪",
      "   ```",
    ].join("\n");

    const converted = convertEmbeddedOrgTemplates(source);
    expect(converted).toContain("   ```markdown\n   ---\n   title: 圓桌");
    expect(converted).toContain("   tags: roundtable\n   ---\n   # 議題與參會者");
    expect(converted).toContain("   ## 第 N 輪");
  });

  test("converts Org fragments without inventing frontmatter", () => {
    const source = [
      "```org",
      "- *主體/邊界*：限定",
      "- *狀態式*：A -> B",
      "```",
    ].join("\n");

    const converted = convertEmbeddedOrgTemplates(source);
    expect(converted).toBe([
      "```markdown",
      "- **主體/邊界**：限定",
      "- **狀態式**：A -> B",
      "```",
    ].join("\n"));
    expect(converted).not.toContain("---");
  });

  test("leaves non-Org fences untouched", () => {
    const source = "```text\n* literal\n```\n";
    expect(convertEmbeddedOrgTemplates(source)).toBe(source);
  });

  test("preserves CRLF line endings while converting an Org template", () => {
    const source = "```org\r\n#+title: 圓桌\r\n* 第一輪\r\n```\r\n";
    const converted = convertEmbeddedOrgTemplates(source);
    expect(converted).toBe("```markdown\r\n---\r\ntitle: 圓桌\r\n---\r\n# 第一輪\r\n```\r\n");
    expect(converted.replace(/\r\n/g, "")).not.toContain("\n");
  });

  test("recognizes an unlabeled fence whose first line is an Org header", () => {
    const source = [
      "檔案頭：",
      "```",
      "#+title: plain-example",
      "#+filetags: :plain:atom:",
      "```",
    ].join("\n");
    expect(convertEmbeddedOrgTemplates(source)).toContain(
      "```markdown\n---\ntitle: plain-example\ntags: plain atom\n---\n```",
    );
  });
});
