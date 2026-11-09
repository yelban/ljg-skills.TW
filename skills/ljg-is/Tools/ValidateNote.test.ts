import { describe, expect, test } from "bun:test";
import { validateNoteText } from "./ValidateNote";

const v5OrgPath = "/tmp/20260823T010203--理解-目標函式__is.org";
const v5MdPath = "/tmp/20260823T010203--理解-目標函式__is.md";
const DEFINITION = "目標函式是在一組可選方案上給出可比較結果、供最佳化過程判斷哪個方案更符合目標的函式或規則。";
const OPERATION = "它把每個候選方案對映成一個值，求解過程據此保留更優方案，直到不能繼續改進或達到停止條件。";
const RECOGNITION = "最佳化不是先有方向再做計算，目標函式本身就在規定什麼變化會被系統當成進步。";
const GUIDANCE = "設計或評估最佳化系統時，先看目標函式獎勵什麼、漏掉什麼，再檢查高分是否真的對應想要的結果。";
const orgPath = "/tmp/20260823T010203--動詞-網約車秩序__is.org";
const mdPath = "/tmp/20260823T010203--動詞-網約車秩序__is.md";
const ACTION = "平臺經營者藉助手機定位和即時派單，把原本彼此看不見的乘客與司機組織成一張由平臺居中排程的城市出行網路。";

function goodV5Org(): string {
  return `#+title: 理解：目標函式
#+date: [2026-08-23 Sun 01:02]
#+identifier: 20260823T010203
#+filetags: :is:act:
#+schema: ljg-is-v5
#+definition: ${DEFINITION}
#+operation: ${OPERATION}
#+recognition: ${RECOGNITION}
#+guidance: ${GUIDANCE}
#+basis: 在最佳化問題中，目標函式為候選方案賦值，求解過程按這些值比較和選擇方案。
#+falsifier: 如果候選方案的目標函式值與求解過程的比較和選擇完全無關，那麼當前解釋需要重寫。

* 機器並不知道什麼叫更好

看到「尋找最優解」，很容易以為機器已經知道什麼叫好，只差把答案算出來。其實在計算開始以前，人必須先給出一把尺子。沒有這把尺子，程式只能看見許多可能，不能判斷該往哪邊走。

${DEFINITION} 在路線規劃裡，方案可以是不同走法，目標函式可以比較它們各自需要的時間。它不是全部現實，只是把當前任務認定的重要差別變得可以比較。

* 一把尺子怎樣推動搜尋

${OPERATION} 目標函式告訴程式往哪裡改進，約束條件則先排除那些不能採用的方案。兩者經常一起出現，卻在做不同的事。

這也改變了我們對「客觀最佳化」的理解。最佳化不會消除人的判斷，而是把一部分判斷提前寫進計算。分數越來越好，只能證明系統更符合這把尺子，不能單獨證明現實也在變好。

* 先檢查尺子，再相信高分

所以，看到一個系統聲稱自己在最佳化時，先別急著看它用了多複雜的演算法。先問它究竟給什麼加分，哪些重要結果沒有進入計算。若高分方案在現實中反覆造成目標之外的損失，問題可能不在求解器，而在那把尺子。

${GUIDANCE} 以後再看到「最優」兩個字，可以把它自動補全成一句更準確的話：這是在當前目標函式和約束條件下得到的最優，而不是脫離條件的最好。
`;
}

function goodV5Markdown(): string {
  return goodV5Org()
    .replace(
      /^#\+title: (.+)\n#\+date: \[(.+)\]\n#\+identifier: (.+)\n#\+filetags: :is:act:\n#\+schema: (.+)\n#\+definition: (.+)\n#\+operation: (.+)\n#\+recognition: (.+)\n#\+guidance: (.+)\n#\+basis: (.+)\n#\+falsifier: (.+)/mu,
      "---\ntitle: $1\ndate: $2\nidentifier: $3\ntags: [is, act]\nschema: $4\ndefinition: $5\noperation: $6\nrecognition: $7\nguidance: $8\nbasis: $9\nfalsifier: $10\n---",
    )
    .replace(/^\* /gmu, "# ");
}

function goodV4Org(): string {
  return `#+title: 動詞：網約車
#+date: [2026-08-23 Sun 01:02]
#+identifier: 20260823T010203
#+filetags: :is:act:
#+schema: ljg-is-v4
#+action: ${ACTION}
#+basis: 網約車依靠線上請求、位置匹配和平臺派單組織乘客與司機，行程雙方都要通過平臺規則才能完成。
#+falsifier: 如果拿掉平臺對入口和派單的安排，服務仍能按原樣執行，那麼當前解釋就需要重寫。

* 你叫來的不只是一輛車

晚上十點，你站在路邊，附近沒有空車。開啟手機後，螢幕先告訴你要等多久，幾分鐘後一位陌生司機按照導航來接你。一次原本靠碰運氣發生的相遇，現在像按下開關一樣出現了。

${ACTION} 改變不只在於叫車更快。誰先遇見誰、這次相遇怎樣開始，都有了一個居中的安排者。

* 平臺開始替陌生人安排相遇

事情原本也可以走另一條路。城市可以建設公共叫車系統，司機也可以用合作社共同管理入口，讓乘客和司機一起決定關鍵規則。商業平臺之所以迅速長大，是因為它先解決了雙方互相找不到的麻煩，但方便本身還不能說明規則理應歸平臺所有。

平臺一旦成為入口，就不只是介紹雙方認識。它決定哪些司機先看到訂單，也用計價和評價影響一次服務怎樣完成。司機獲得了客源，卻要學習平臺看重什麼；乘客少等了車，也開始把位置和選擇交給系統。

當司機和乘客逐漸依賴這套安排，它便反過來改變他們。司機會圍繞派單和評分調整工作，乘客會按照平臺給出的時間與價格作決定，平臺也必須維持足夠的車輛和可信的處置能力。它承諾的方便，後來成了它自己不能隨意撤回的責任。

* 方便以後，規則歸誰

往回看，關鍵一步不是汽車開始載客，而是平臺把陌生人的臨時需要變成可以持續計算的相遇。從這一步開始，「誰來安排相遇，又由誰承擔失誤」就成了反覆出現的問題。未來可以有公共平臺、合作社或更開放的介面，但每條路都要重新回答這個問題。

這一步打開了隨時叫車的生活，也讓城市越來越依賴一個數字入口。規則若能被司機和乘客共同修改，方便或許不必以交出全部決定權為代價。若入口繼續集中，選擇看上去很多，決定規則的人卻可能很少。

這裡說的是網約車的一般執行方式，不是在斷言每個平臺都使用同樣的規則。如果拿掉平臺對入口和派單的安排，乘客與司機仍能按原樣完成這種即時服務，那麼這篇解釋就站不住。當一項方便已經成了城市日常，到底誰有權修改維持它的規則？
`;
}

function goodV4Markdown(): string {
  return goodV4Org()
    .replace(
      /^#\+title: (.+)\n#\+date: \[(.+)\]\n#\+identifier: (.+)\n#\+filetags: :is:act:\n#\+schema: (.+)\n#\+action: (.+)\n#\+basis: (.+)\n#\+falsifier: (.+)/mu,
      "---\ntitle: $1\ndate: $2\nidentifier: $3\ntags: [is, act]\nschema: $4\naction: $5\nbasis: $6\nfalsifier: $7\n---",
    )
    .replace(/^\* /gmu, "# ");
}

function goodV3Org(): string {
  return `#+title: 動詞：績效考核
#+date: [2026-08-23 Sun 01:02]
#+identifier: 20260823T010203
#+filetags: :is:act:
#+schema: ljg-is-v3

* 動詞判斷
- *原問*：績效考核是什麼？
- *改問*：組織管理者憑什麼把工作價值做成可量化獎懲的秩序，而不是保留多方敘述與協商？
- *作*：組織管理者以量化評分，把分散工作的價值判斷做成可比較、可獎懲的管理秩序。

* 一個不
- *給定*：工作貢獻主要由具體協作中的判斷和信任確認。
- *不*：貢獻不必只留在具體關係中，也可以被統一尺度組織。
- *未選*：由同事、客戶與本人共同敘述貢獻，再公開協商獎懲。

* 理由
- *已有*：統一評分降低跨團隊比較成本，並給獎懲提供記錄。
- *尚缺*：可比較不等於公正，指標不能代表全部工作。

* 做成的秩序
- *規則*：指標、權重和週期決定哪些貢獻進入正式判斷。
- *關係*：管理者成為評分者，員工成為被比較者。
- *分配*：獎金、機會和風險按評分重新分配。

* 捲入與反制
- *捲入*：員工、經理、協作者和組織共同承擔後果。
- *回應*：員工可以解釋、爭議或拒絕評價。
- *反制*：評分體系一旦成為人事依據，管理者也必須服從指標，難以承認體系沒有記錄的貢獻。

* 歷史與未來
- *本源*：從指標異化的困境逆溯，分析追到組織用統一尺度比較崗位的建立事件；它使「不同工作憑什麼可比」持續成為不能刪除的問題。
- *開啟*：組織可以跨團隊比較工作。
- *關閉*：難量化的工作更難進入判斷。
- *修正*：組織可以開放指標制定和申訴。

* 未決問題
- *憑什麼*：憑什麼讓統一評分取得決定獎懲的權力，而不是保留協商？
- *接下來*：評分會把員工和管理者共同做成怎樣的人？

* 根據與邊界
- *根據*：評分連線跨人比較、獎金和晉升，是本分析採用的制度事實。
- *推斷*：參與者會把行動轉向可記錄指標。
- *邊界*：本分析不證明所有評分必然不公。
- *反駁*：如果評分不影響任何資源或行動，當前判斷就需要重寫。
`;
}

function legacyV2(): string {
  return `#+title: 本質：Taxi
#+date: [2026-08-01 Sat 01:02]
#+identifier: 20260801T010203
#+filetags: :is:
#+schema: ljg-is-v2

* 問題
真正問題：乘客最終從哪裡到哪裡？

* 完整表達
完整：（面向乘客）把人從 A 點送到 B 點

* 剝離
- *實現*：汽車可以替換

* 本質
核心：把人從 A 點送到 B 點

* 示例
- *代入*：你從公司回家

* 結構遷移
- *結構式*：(X, S0) -> (X, S1)
- *變數*：X=物件
- *遷移*：檔案 A -> B
- *邊界*：只遷移位置；不遷移身份

* 驗證
- *替換*：換車仍成立
`;
}

function errorsFor(content: string, path = orgPath): string[] {
  return validateNoteText(path, content).errors;
}

function v5ErrorsFor(content: string, path = v5OrgPath): string[] {
  return validateNoteText(path, content).errors;
}

describe("ValidateNote v5 usable-understanding contract", () => {
  test("template combines definition, operation, recognition and guidance", async () => {
    const template = await Bun.file(new URL("../Template.org", import.meta.url)).text();
    expect(template).toMatch(/^(?:#\+schema:|schema:) ljg-is-v5$/m);
    for (const key of [
      "definition",
      "operation",
      "recognition",
      "guidance",
      "basis",
      "falsifier",
    ]) {
      expect(template).toMatch(new RegExp(`^(?:#\\+${key}:|${key}:)`, "m"));
    }
    expect(template).not.toMatch(/^(?:\*|#) (?:是什麼|如何運作|認知改變|行動指導)$/mu);
  });

  test("accepts a complete v5 Org note that ends with a usable judgment", () => {
    const result = validateNoteText(v5OrgPath, goodV5Org());
    expect(result.ok).toBe(true);
    expect(result.schema).toBe("ljg-is-v5");
    expect(result.definition).toBe(DEFINITION);
    expect(result.operation).toBe(OPERATION);
  });

  test("accepts a complete v5 Markdown note", () => {
    expect(validateNoteText(v5MdPath, goodV5Markdown()).ok).toBe(true);
  });

  test("requires definition, operation, recognition and guidance", () => {
    for (const key of ["definition", "operation", "recognition", "guidance"]) {
      const note = goodV5Org().replace(new RegExp(`^#\\+${key}: .+\\n`, "mu"), "");
      expect(v5ErrorsFor(note).some((error) => error.includes(key))).toBe(true);
    }
  });

  test("rejects vague guidance but does not require an open question", () => {
    const vague = goodV5Org().replace(`#+guidance: ${GUIDANCE}`, "#+guidance: 今後對此保持關注，具體情況具體分析。");
    expect(v5ErrorsFor(vague).some((error) => error.includes("guidance"))).toBe(true);
    expect(goodV5Org().trimEnd().endsWith("。")).toBe(true);
    expect(validateNoteText(v5OrgPath, goodV5Org()).ok).toBe(true);
  });

  test("rejects checklist headings and visible field labels", () => {
    const heading = goodV5Org().replace("* 機器並不知道什麼叫更好", "* 是什麼");
    const label = goodV5Org().replace("看到「尋找最優解」", "定義：目標函式是一把尺子。\n\n看到「尋找最優解」");
    expect(v5ErrorsFor(heading).some((error) => error.includes("標題"))).toBe(true);
    expect(v5ErrorsFor(label).some((error) => error.includes("欄位標籤"))).toBe(true);
  });

  test("does not require a protagonist, forced back-action or question ending", () => {
    const result = validateNoteText(v5OrgPath, goodV5Org());
    expect(result.ok).toBe(true);
    expect(goodV5Org()).not.toContain("反過來規定創造者");
    expect(goodV5Org().trimEnd()).not.toEndWith("？");
  });
});

describe("ValidateNote v4 narrative contract", () => {
  test("accepts a structurally valid v4 Org note", () => {
    const result = validateNoteText(orgPath, goodV4Org());
    expect(result.ok).toBe(true);
    expect(result.schema).toBe("ljg-is-v4");
    expect(result.action).toBe(ACTION);
  });

  test("accepts a structurally valid v4 Markdown note", () => {
    expect(validateNoteText(mdPath, goodV4Markdown()).ok).toBe(true);
  });

  test("keeps v3 notes readable", () => {
    const result = validateNoteText("/tmp/20260823T010203--動詞-績效考核__is.org", goodV3Org());
    expect(result.ok).toBe(true);
    expect(result.schema).toBe("ljg-is-v3");
  });

  test("keeps v2 notes readable", () => {
    const result = validateNoteText("/tmp/20260801T010203--本質-taxi__is.org", legacyV2());
    expect(result.ok).toBe(true);
    expect(result.core).toBe("把人從 A 點送到 B 點");
  });

  test("rejects an unknown schema", () => {
    expect(errorsFor(goodV4Org().replace("ljg-is-v4", "ljg-is-v99")).some((error) => error.includes("schema"))).toBe(true);
  });

  test("requires the v4 filename", () => {
    expect(errorsFor(goodV4Org(), "/tmp/網約車.org").some((error) => error.includes("v4 檔名"))).toBe(true);
  });

  test("requires action title and tags", () => {
    const badTitle = goodV4Org().replace("動詞：網約車", "本質：網約車");
    const badTags = goodV4Org().replace(":is:act:", ":is:");
    expect(errorsFor(badTitle).some((error) => error.includes("title"))).toBe(true);
    expect(errorsFor(badTags).some((error) => error.includes("act"))).toBe(true);
  });

  test("allows two to four content-led headings but rejects rigid placeholders", () => {
    const two = goodV4Org().replace("\n* 平臺開始替陌生人安排相遇\n", "\n");
    const tooMany = goodV4Org().replace("* 方便以後，規則歸誰", "* 多出的一欄\n\n這是一段額外說明。\n\n這又是一段額外說明。\n\n* 又多出一欄\n\n這是一段額外說明。\n\n這又是一段額外說明。\n\n* 方便以後，規則歸誰");
    const generic = goodV4Org().replace("* 你叫來的不只是一輛車", "* 開場");
    expect(validateNoteText(orgPath, two).ok).toBe(true);
    expect(errorsFor(tooMany).some((error) => error.includes("兩到四個"))).toBe(true);
    expect(errorsFor(generic).some((error) => error.includes("標題必須具體"))).toBe(true);
  });

  test("rejects visible lists and framework fields", () => {
    const list = goodV4Org().replace("晚上十點", "- 規則：平臺負責派單\n\n晚上十點");
    const label = goodV4Org().replace("事情原本也可以", "規則：平臺負責派單。\n\n事情原本也可以");
    expect(errorsFor(list).some((error) => error.includes("專案符號"))).toBe(true);
    expect(errorsFor(label).some((error) => error.includes("欄位標籤"))).toBe(true);
  });

  test("requires enough paragraphs for a flowing explanation", () => {
    const note = goodV4Org().replace("\n\n平臺一旦成為入口", " 平臺一旦成為入口").replace("\n\n當司機和乘客", " 當司機和乘客");
    expect(errorsFor(note).some((error) => error.includes("每節至少"))).toBe(true);
  });

  test("requires a concrete opening", () => {
    const note = goodV4Org().replace(
      "晚上十點，你站在路邊，附近沒有空車。開啟手機後，螢幕先告訴你要等多久，幾分鐘後一位陌生司機按照導航來接你。一次原本靠碰運氣發生的相遇，現在像按下開關一樣出現了。",
      "現代性塑造了一種新的流動範式。抽象關係由此進入複雜系統。主體間性也發生了結構變化。",
    );
    expect(errorsFor(note).some((error) => error.includes("具體的人"))).toBe(true);
  });

  test("allows a natural prose paraphrase while keeping action meaningful", () => {
    const paraphrased = goodV4Org().replace(
      `${ACTION} 改變不只在於叫車更快。誰先遇見誰、這次相遇怎樣開始，都有了一個居中的安排者。`,
      "平臺先看見你和司機各在哪裡，再替你們配對。叫車變快只是表面變化，更深的變化是陌生人的相遇從此要經過同一個入口。",
    );
    const abstract = goodV4Org().replace(`#+action: ${ACTION}`, "#+action: 這是一段長度足夠卻沒有關鍵動作和共同變化的抽象判斷。社會因此出現了某種新影響。");
    expect(validateNoteText(orgPath, paraphrased).ok).toBe(true);
    expect(errorsFor(abstract).some((error) => error.includes("普通話"))).toBe(true);
  });

  test("keeps the Zhao lens conditional instead of forcing a plot", async () => {
    const workflow = await Bun.file(new URL("../Workflows/TraceCreation.md", import.meta.url)).text();
    expect(workflow).toContain("趙汀陽的問題鏈只作條件性補充");
    expect(workflow).toContain("不為了哲學完整而寫進文章");
    expect(workflow).toContain("不強制虛構主人公");
    expect(workflow).toContain("若轉折沒有被前面的定義與機制逼出來，就刪除");
  });

  test("rejects list punctuation and overlong sentences", () => {
    const listed = goodV4Org().replace("它決定哪些司機先看到訂單", `平臺考慮甲、乙、丙、丁、戊、己、庚、辛、壬、癸、子、醜、寅、卯、辰。它決定哪些司機先看到訂單`);
    const long = goodV4Org().replace("改變不只在於叫車更快。", `${"這個變化不斷疊加新的抽象判斷".repeat(12)}。`);
    expect(errorsFor(listed).some((error) => error.includes("要素羅列"))).toBe(true);
    expect(errorsFor(long).some((error) => error.includes("100 字"))).toBe(true);
  });

  test("allows natural ending variants but requires backstage falsifier and an open question", () => {
    const natural = goodV4Org()
      .replace("往回看，關鍵一步", "真正的轉折發生在")
      .replace("這裡說的是網約車的一般執行方式，不是在斷言每個平臺都使用同樣的規則。", "我只討論網約車常見的執行方式。至於具體公司怎樣派單，這裡沒有核驗，也不能據此下判斷。")
      .replace("如果拿掉平臺對入口和派單的安排，乘客與司機仍能按原樣完成這種即時服務，那麼這篇解釋就站不住。", "另一種材料也可能迫使我們改變看法，例如司機和乘客實際上共同掌握全部規則。")
      .replace("#+falsifier: 如果拿掉平臺對入口和派單的安排，服務仍能按原樣執行，那麼當前解釋就需要重寫。", "#+falsifier: 若司機和乘客事實上共同掌握全部關鍵規則，那麼當前解釋就不成立。");
    const noFalsifier = goodV4Org().replace(/^#\+falsifier: .+\n/mu, "");
    const closed = goodV4Org().replace("到底誰有權修改維持它的規則？", "這些規則最終會得到妥善解決。");
    expect(validateNoteText(orgPath, natural).ok).toBe(true);
    expect(errorsFor(noFalsifier).some((error) => error.includes("falsifier"))).toBe(true);
    expect(errorsFor(closed).some((error) => error.includes("真問題"))).toBe(true);
  });

  test("rejects rumor as basis", () => {
    const note = goodV4Org().replace("網約車依靠線上請求、位置匹配和平臺派單組織乘客與司機，行程雙方都要通過平臺規則才能完成。", "聽說大家可能都認可平臺派單。");
    expect(errorsFor(note).some((error) => error.includes("basis"))).toBe(true);
  });

  test("rejects old contracts, placeholders and Markdown syntax in Org", () => {
    const old = goodV4Org().replace("改變不只在於", "The One 是 X -> Y。改變不只在於");
    const placeholder = goodV4Org().replace("網約車", "{目標}");
    const markdown = goodV4Org().replace("網約車", "[網約車](https://example.com)");
    expect(errorsFor(old).some((error) => error.includes("舊合同"))).toBe(true);
    expect(errorsFor(placeholder).some((error) => error.includes("佔位符"))).toBe(true);
    expect(errorsFor(markdown).some((error) => error.includes("Markdown 連結"))).toBe(true);
  });

  test("rejects identifier disagreement", () => {
    const note = goodV4Org().replace("20260823T010203\n#+filetags", "20260823T010204\n#+filetags");
    expect(errorsFor(note).some((error) => error.includes("檔名時間戳"))).toBe(true);
  });
});

describe("ValidateNote v3 compatibility regressions", () => {
  const v3Path = "/tmp/20260823T010203--動詞-績效考核__is.org";
  const v3Errors = (content: string) => validateNoteText(v3Path, content).errors;

  test("still requires choice and justification in the v3 reframing", () => {
    const note = goodV3Org().replace(
      "組織管理者憑什麼把工作價值做成可量化獎懲的秩序，而不是保留多方敘述與協商？",
      "績效考核最終做了什麼？",
    );
    expect(v3Errors(note).some((error) => error.includes("憑什麼") && error.includes("而不是"))).toBe(true);
  });

  test("still rejects an abstract v3 action", () => {
    const note = goodV3Org().replace(
      "組織管理者以量化評分，把分散工作的價值判斷做成可比較、可獎懲的管理秩序。",
      "這是一段長度足夠卻沒有行動者和共同安排的抽象判斷。",
    );
    expect(v3Errors(note).some((error) => error.includes("具體創制行動"))).toBe(true);
  });

  test("still requires a real v3 alternative", () => {
    const note = goodV3Org().replace("由同事、客戶與本人共同敘述貢獻，再公開協商獎懲。", "其他可能");
    expect(v3Errors(note).some((error) => error.includes("未選"))).toBe(true);
  });

  test("still distinguishes v3 back-action from a bad consequence", () => {
    const note = goodV3Org().replace(
      "評分體系一旦成為人事依據，管理者也必須服從指標，難以承認體系沒有記錄的貢獻。",
      "長期加班會讓員工疲憊，團隊士氣也會下降。",
    );
    expect(v3Errors(note).some((error) => error.includes("反制") && error.includes("壞後果"))).toBe(true);
  });

  test("still requires v3 origin to carry a persistent problem", () => {
    const note = goodV3Org().replace(
      "從指標異化的困境逆溯，分析追到組織用統一尺度比較崗位的建立事件；它使「不同工作憑什麼可比」持續成為不能刪除的問題。",
      "當前能追到的最早建立點是第一次使用評分表。",
    );
    expect(v3Errors(note).some((error) => error.includes("本源"))).toBe(true);
  });

  test("still rejects rumor as v3 evidence", () => {
    const note = goodV3Org().replace("評分連線跨人比較、獎金和晉升，是本分析採用的制度事實。", "聽說評分大概能夠提高效率。");
    expect(v3Errors(note).some((error) => error.includes("根據"))).toBe(true);
  });

  test("still requires a falsifiable v3 judgment", () => {
    const note = goodV3Org().replace("如果評分不影響任何資源或行動，當前判斷就需要重寫。", "當前判斷仍有待觀察。");
    expect(v3Errors(note).some((error) => error.includes("反駁"))).toBe(true);
  });

  test("still rejects The One and the arrow contract in v3", () => {
    const note = goodV3Org().replace("從指標異化的困境逆溯", "The One 是 X -> Y；從指標異化的困境逆溯");
    expect(v3Errors(note).some((error) => error.includes("舊合同"))).toBe(true);
  });
});
