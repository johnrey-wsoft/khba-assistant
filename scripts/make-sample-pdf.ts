import { mkdirSync, createWriteStream } from "node:fs";
import { resolve, join } from "node:path";

import PDFDocument from "pdfkit";

// Generate sample Korean legal/administrative PDFs for testing LlamaCloud
// agentic-OCR ingestion (`pnpm ingest`). Embeds Malgun Gothic so Hangul
// renders, and includes tables so the agentic parser has real layout to
// reconstruct into markdown pipe tables.

const FONT_REGULAR = join(process.env.WINDIR ?? "C:/Windows", "Fonts", "malgun.ttf");
const FONT_BOLD = join(process.env.WINDIR ?? "C:/Windows", "Fonts", "malgunbd.ttf");
const OUT_DIR = resolve(process.cwd(), "data/documents");

type Block =
  | { type: "section"; heading: string; body: string }
  | { type: "table"; headers: string[]; rows: string[][]; weights?: number[] };

type DocSpec = { file: string; title: string; meta: string; blocks: Block[] };

const DOCS: DocSpec[] = [
  {
    file: "suwon-parking-ordinance.pdf",
    title: "수원시 주차장 설치 및 관리 조례",
    meta: "문서번호 ORD-41390-000045 · 시행일 2026-03-15 · 공개",
    blocks: [
      {
        type: "section",
        heading: "제3조(부설주차장의 설치기준)",
        body: "공동주택의 부설주차장은 세대별 전용면적을 기준으로 설치한다. 산정 결과 소수점 이하의 수가 발생하는 경우에는 이를 올림하여 적용한다. 세대별 주차대수의 구체적 기준은 다음 표와 같다.",
      },
      {
        type: "table",
        weights: [0.62, 0.38],
        headers: ["전용면적", "세대당 주차대수"],
        rows: [
          ["30제곱미터 미만", "0.5대"],
          ["30제곱미터 이상 60제곱미터 이하", "0.6대"],
          ["60제곱미터 초과", "1.0대"],
        ],
      },
      {
        type: "section",
        heading: "제4조(소규모 공동주택의 완화)",
        body: "세대수가 30세대 미만인 소규모 공동주택으로서 대지 여건상 부설주차장 설치가 곤란한 경우, 시장은 심의를 거쳐 설치기준의 일부를 완화할 수 있다. 다만 완화의 구체적 요건과 한도는 규칙으로 정한다.",
      },
      {
        type: "section",
        heading: "제5조(기계식주차장치의 인정)",
        body: "부설주차장의 소요 주차대수에는 기계식주차장치를 포함할 수 있다. 기계식주차장치가 전체 주차대수에서 차지하는 비율의 상한은 별도로 정하지 아니한다.",
      },
    ],
  },
  {
    file: "parking-lot-act-decree.pdf",
    title: "주차장법 시행령",
    meta: "문서번호 LAW-2026-000210 · 시행일 2026-01-08 · 공개",
    blocks: [
      {
        type: "section",
        heading: "제6조(부설주차장의 설치대상 및 설치기준)",
        body: "부설주차장의 설치대상 시설물의 종류와 설치기준은 다음 표에 따른다. 별표에서 정하지 아니한 사항은 해당 지방자치단체의 조례로 정할 수 있다.",
      },
      {
        type: "table",
        weights: [0.5, 0.5],
        headers: ["시설물의 종류", "설치기준"],
        rows: [
          ["위락시설", "시설면적 100제곱미터당 1대"],
          ["문화 및 집회시설", "시설면적 150제곱미터당 1대"],
          ["판매시설", "시설면적 150제곱미터당 1대"],
          ["업무시설", "시설면적 150제곱미터당 1대"],
        ],
      },
      {
        type: "section",
        heading: "제7조(기계식주차장치)",
        body: "부설주차장을 설치하는 경우 기계식주차장치를 설치하여 소요 주차대수에 포함할 수 있다. 지방자치단체는 조례로 기계식주차장치가 차지하는 비율의 상한을 정할 수 있다.",
      },
      {
        type: "section",
        heading: "제8조(인근 부설주차장의 특례)",
        body: "부지의 여건상 해당 시설물의 대지 안에 부설주차장을 확보하기 곤란한 경우에는 대통령령으로 정하는 범위에서 인근의 부지에 이를 설치할 수 있다.",
      },
    ],
  },
  {
    file: "lh-purchase-rental-notice.pdf",
    title: "LH 매입임대주택 입주자 모집 공고",
    meta: "문서번호 ADMIN-2026-000512 · 공고일 2026-07-10 · 공개",
    blocks: [
      {
        type: "section",
        heading: "1. 신청자격",
        body: "신청일 현재 무주택세대구성원이어야 하며, 해당 지역에 거주하는 자를 우선한다.",
      },
      {
        type: "section",
        heading: "2. 접수기간",
        body: "신청 접수는 2026년 8월 8일까지이며, 마감 이후 접수분은 인정하지 아니한다. 접수는 온라인으로만 받는다.",
      },
      {
        type: "section",
        heading: "3. 소득 및 자산기준",
        body: "세대의 월평균 소득과 총자산은 다음 표의 기준을 적용한다. 이번 공고부터는 개정된 세대 구성 표를 적용하여 자격을 판정한다.",
      },
      {
        type: "table",
        weights: [0.4, 0.6],
        headers: ["구분", "기준"],
        rows: [
          ["월평균 소득", "전년도 도시근로자 가구당 월평균 소득의 70퍼센트 이하"],
          ["총자산", "2억 1천 5백만원 이하"],
          ["자동차", "3천 6백만원 이하"],
        ],
      },
      {
        type: "section",
        heading: "4. 유의사항",
        body: "제출 서류가 사실과 다른 경우 당첨이 취소될 수 있다.",
      },
    ],
  },
  {
    file: "association-quarterly-filing-guide.pdf",
    title: "협회 분기 신고 서식 안내",
    meta: "문서번호 GUIDE-2026-000078 · 시행일 2026-06-30 · 공개",
    blocks: [
      {
        type: "section",
        heading: "1. 제출 서식",
        body: "분기 신고는 서식 제3호에 따라 작성하여 제출하며, 부록의 세부 명세서를 함께 첨부한다. 제출 서식의 구성은 다음 표와 같다.",
      },
      {
        type: "table",
        weights: [0.22, 0.5, 0.28],
        headers: ["서식 번호", "명칭", "제출 여부"],
        rows: [
          ["제3호", "분기 실적 신고서", "필수"],
          ["부록 1", "세부 명세서", "필수"],
          ["부록 2", "증빙 목록", "해당 시"],
        ],
      },
      {
        type: "section",
        heading: "2. 제출 기한",
        body: "제출 기한은 매 분기 종료일부터 30일 이내로 한다. 표지에는 신고의 기준일을 현행 기준일로 기재한다. 전자 제출이 원칙이며, 부득이한 경우에 한하여 방문 제출을 허용한다.",
      },
    ],
  },
  {
    file: "parking-relaxation-case.pdf",
    title: "부설주차장 완화 적용 회원 상담 사례",
    meta: "문서번호 CASE-2026-000031 · 상담일 2026-05-20 · 공개",
    blocks: [
      {
        type: "section",
        heading: "상황",
        body: "수원시 소재의 30세대 미만 소규모 다세대주택에서 부설주차장 설치기준의 완화 가능 여부를 문의하였다.",
      },
      {
        type: "section",
        heading: "판단",
        body: "주차장법 시행령은 특정한 경우에 완화를 허용하고 있으나, 완화의 구체적 요건은 지방자치단체의 조례와 규칙으로 정한다.",
      },
      {
        type: "section",
        heading: "결과",
        body: "수원시 조례상 완화 요건을 규정한 조항은 현재 보유한 색인에서 확인되므로, 제4조에 따라 심의를 거쳐 완화가 가능하다고 안내하였다.",
      },
      {
        type: "section",
        heading: "유의",
        body: "실제 신청 전에는 관할 주차관리부서와 공식 조문으로 현행 요건을 반드시 확인하여야 한다.",
      },
    ],
  },
];

const renderDoc = (spec: DocSpec) => {
  const doc = new PDFDocument({ size: "A4", margin: 56 });
  doc.registerFont("KO", FONT_REGULAR);
  doc.registerFont("KO-Bold", FONT_BOLD);
  doc.pipe(createWriteStream(join(OUT_DIR, spec.file)));

  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const contentWidth = right - left;
  const bottom = doc.page.height - doc.page.margins.bottom;

  doc.font("KO-Bold").fontSize(18).text(spec.title, { align: "center" });
  doc.moveDown(0.3);
  doc.font("KO").fontSize(9).fillColor("#555").text(spec.meta, { align: "center" });
  doc.fillColor("#000").moveDown(1.2);

  const rowHeight = 26;

  for (const block of spec.blocks) {
    if (block.type === "section") {
      doc.font("KO-Bold").fontSize(12).text(block.heading);
      doc.moveDown(0.25);
      doc.font("KO").fontSize(11).text(block.body, { align: "justify", lineGap: 3 });
      doc.moveDown(0.9);
      continue;
    }

    // table
    const weights = block.weights ?? block.headers.map(() => 1 / block.headers.length);
    const widths = weights.map((w) => contentWidth * w);
    const tableHeight = (block.rows.length + 1) * rowHeight;
    if (doc.y + tableHeight > bottom) doc.addPage();

    const drawRow = (cells: string[], y: number, header: boolean) => {
      let x = left;
      cells.forEach((cell, c) => {
        doc
          .rect(x, y, widths[c], rowHeight)
          .fillOpacity(header ? 0.08 : 1)
          .fillAndStroke(header ? "#0037af" : "#ffffff", "#999")
          .fillOpacity(1);
        doc
          .font(header ? "KO-Bold" : "KO")
          .fontSize(10)
          .fillColor("#000")
          .text(cell, x + 8, y + 7, {
            width: widths[c] - 16,
            align: c === 0 ? "left" : "center",
          });
        x += widths[c];
      });
    };

    let y = doc.y;
    drawRow(block.headers, y, true);
    y += rowHeight;
    for (const row of block.rows) {
      drawRow(row, y, false);
      y += rowHeight;
    }
    doc.y = y + 18;
  }

  doc.end();
  return new Promise<void>((res) => doc.on("end", res));
};

const main = async () => {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const spec of DOCS) {
    await renderDoc(spec);
    console.log(`  wrote data/documents/${spec.file}`);
  }
  console.log(`\nGenerated ${DOCS.length} sample documents.`);
};

main();
