import { mkdirSync, createWriteStream } from "node:fs";
import { resolve, join } from "node:path";

import PDFDocument from "pdfkit";

// Generate a sample Korean legal PDF for testing LlamaCloud agentic-OCR
// ingestion (`pnpm ingest`). Embeds Malgun Gothic so Hangul renders, and
// includes a table so the agentic parser has real layout to reconstruct.

const FONT_REGULAR = join(
  process.env.WINDIR ?? "C:/Windows",
  "Fonts",
  "malgun.ttf",
);
const FONT_BOLD = join(
  process.env.WINDIR ?? "C:/Windows",
  "Fonts",
  "malgunbd.ttf",
);

const OUT_DIR = resolve(process.cwd(), "data/documents");
const OUT_PATH = join(OUT_DIR, "suwon-parking-ordinance.pdf");

const main = () => {
  mkdirSync(OUT_DIR, { recursive: true });

  const doc = new PDFDocument({ size: "A4", margin: 56 });
  doc.registerFont("KO", FONT_REGULAR);
  doc.registerFont("KO-Bold", FONT_BOLD);
  doc.pipe(createWriteStream(OUT_PATH));

  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const contentWidth = right - left;

  // Title
  doc
    .font("KO-Bold")
    .fontSize(18)
    .text("수원시 주차장 설치 및 관리 조례", { align: "center" });
  doc.moveDown(0.3);
  doc
    .font("KO")
    .fontSize(9)
    .fillColor("#555")
    .text("문서번호 ORD-41390-000045 · 시행일 2026-03-15 · 공개", {
      align: "center",
    });
  doc.fillColor("#000");
  doc.moveDown(1.2);

  const article = (heading: string, body: string) => {
    doc.font("KO-Bold").fontSize(12).text(heading);
    doc.moveDown(0.25);
    doc.font("KO").fontSize(11).text(body, { align: "justify", lineGap: 3 });
    doc.moveDown(0.9);
  };

  article(
    "제3조(부설주차장의 설치기준)",
    "공동주택의 부설주차장은 세대별 전용면적을 기준으로 설치한다. 산정 결과 소수점 이하의 수가 발생하는 경우에는 이를 올림하여 적용한다. 세대별 주차대수의 구체적 기준은 다음 표와 같다.",
  );

  // --- Table: 전용면적 → 세대당 주차대수 ------------------------------------
  const rows: [string, string][] = [
    ["전용면적", "세대당 주차대수"],
    ["30제곱미터 미만", "0.5대"],
    ["30제곱미터 이상 60제곱미터 이하", "0.6대"],
    ["60제곱미터 초과", "1.0대"],
  ];
  const rowHeight = 26;
  const col0 = contentWidth * 0.62;
  const col1 = contentWidth - col0;
  let y = doc.y;

  rows.forEach((row, i) => {
    const isHeader = i === 0;
    doc
      .rect(left, y, col0, rowHeight)
      .rect(left + col0, y, col1, rowHeight)
      .fillOpacity(isHeader ? 0.08 : 1)
      .fillAndStroke(isHeader ? "#0037af" : "#ffffff", "#999")
      .fillOpacity(1);
    doc
      .font(isHeader ? "KO-Bold" : "KO")
      .fontSize(10.5)
      .fillColor("#000")
      .text(row[0], left + 10, y + 7, { width: col0 - 20 })
      .text(row[1], left + col0 + 10, y + 7, {
        width: col1 - 20,
        align: "center",
      });
    y += rowHeight;
  });
  doc.y = y + 18;

  article(
    "제4조(소규모 공동주택의 완화)",
    "세대수가 30세대 미만인 소규모 공동주택으로서 대지 여건상 부설주차장 설치가 곤란한 경우, 시장은 심의를 거쳐 설치기준의 일부를 완화할 수 있다. 다만 완화의 구체적 요건과 한도는 규칙으로 정한다.",
  );
  article(
    "제5조(기계식주차장치의 인정)",
    "부설주차장의 소요 주차대수에는 기계식주차장치를 포함할 수 있다. 기계식주차장치가 전체 주차대수에서 차지하는 비율의 상한은 별도로 정하지 아니한다.",
  );

  doc.end();

  doc.on("end", () =>
    console.log(`Wrote ${OUT_PATH.replace(process.cwd(), ".")}`),
  );
};

main();
