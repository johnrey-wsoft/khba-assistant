import { mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

import ExcelJS from "exceljs";

// Generate sample Korean legal/administrative spreadsheets (.xlsx) for testing
// LlamaCloud agentic-OCR ingestion of non-PDF formats (`pnpm ingest`). Each
// workbook has multiple sheets of tabular data so the parser has real grids to
// reconstruct into markdown pipe tables.

const OUT_DIR = resolve(process.cwd(), "data/documents");

type SheetSpec = { name: string; headers: string[]; rows: (string | number)[][] };
type BookSpec = { file: string; title: string; sheets: SheetSpec[] };

const BOOKS: BookSpec[] = [
  {
    file: "public-parking-fee-schedule.xlsx",
    title: "공영주차장 요금 및 감면 기준표",
    sheets: [
      {
        name: "요금표",
        headers: ["구역", "구분", "기본 요금", "10분당 추가", "일 최대"],
        rows: [
          ["1급지", "5분 이내", "무료", "-", "-"],
          ["1급지", "일반", "1,200원", "600원", "30,000원"],
          ["2급지", "일반", "800원", "400원", "20,000원"],
          ["3급지", "일반", "500원", "300원", "12,000원"],
        ],
      },
      {
        name: "감면대상",
        headers: ["대상", "감면율", "증빙 서류"],
        rows: [
          ["경형 자동차", "50%", "자동차등록증"],
          ["저공해 1종", "50%", "저공해차 스티커"],
          ["장애인 차량", "80%", "장애인등록증"],
          ["국가유공자", "80%", "국가유공자증"],
        ],
      },
    ],
  },
  {
    file: "housing-benefit-income-standard.xlsx",
    title: "주거급여 소득기준 및 지급 상한표",
    sheets: [
      {
        name: "소득기준",
        headers: ["가구원 수", "기준 중위소득 47%", "월 소득 상한"],
        rows: [
          ["1인 가구", "1,073,000원", "1,073,000원"],
          ["2인 가구", "1,767,000원", "1,767,000원"],
          ["3인 가구", "2,264,000원", "2,264,000원"],
          ["4인 가구", "2,750,000원", "2,750,000원"],
        ],
      },
      {
        name: "지급상한",
        headers: ["지역 급지", "1인", "2인", "3인", "4인"],
        rows: [
          ["1급지(서울)", "352,000원", "395,000원", "470,000원", "545,000원"],
          ["2급지(경기·인천)", "281,000원", "314,000원", "375,000원", "433,000원"],
          ["3급지(광역시)", "228,000원", "254,000원", "302,000원", "351,000원"],
          ["4급지(그 외)", "191,000원", "215,000원", "256,000원", "297,000원"],
        ],
      },
    ],
  },
  {
    file: "property-tax-bracket-table.xlsx",
    title: "재산세 과세표준 및 세율표",
    sheets: [
      {
        name: "과세표준",
        headers: ["구분", "과세표준 구간", "적용 세율"],
        rows: [
          ["주택", "6천만원 이하", "0.10%"],
          ["주택", "1억5천만원 이하", "0.15%"],
          ["주택", "3억원 이하", "0.25%"],
          ["주택", "3억원 초과", "0.40%"],
        ],
      },
      {
        name: "세율",
        headers: ["재산 종류", "표준세율", "비고"],
        rows: [
          ["건축물", "0.25%", "일반 건축물"],
          ["선박", "0.30%", "고급선박 5%"],
          ["항공기", "0.30%", "-"],
        ],
      },
    ],
  },
  {
    file: "waterworks-fee-table.xlsx",
    title: "상수도 요금표",
    sheets: [
      {
        name: "가정용",
        headers: ["사용 구간(㎥)", "㎥당 단가", "적용"],
        rows: [
          ["0-20", "430원", "기본"],
          ["21-30", "660원", "누진 1"],
          ["31 이상", "790원", "누진 2"],
        ],
      },
      {
        name: "영업용",
        headers: ["사용 구간(㎥)", "㎥당 단가", "적용"],
        rows: [
          ["0-50", "1,270원", "기본"],
          ["51-100", "1,450원", "누진 1"],
          ["101 이상", "1,690원", "누진 2"],
        ],
      },
    ],
  },
  {
    file: "apartment-management-fee-items.xlsx",
    title: "공동주택 관리비 항목표",
    sheets: [
      {
        name: "공용관리비",
        headers: ["항목", "부과 기준", "비고"],
        rows: [
          ["일반관리비", "세대 면적 비례", "인건비 포함"],
          ["청소비", "세대 균등", "-"],
          ["경비비", "세대 균등", "위탁 계약"],
          ["승강기유지비", "세대 균등", "해당 동"],
        ],
      },
      {
        name: "개별사용료",
        headers: ["항목", "부과 기준", "비고"],
        rows: [
          ["전기료", "계량기 사용량", "공용 별도"],
          ["수도료", "계량기 사용량", "-"],
          ["난방비", "계량기 사용량", "중앙난방"],
        ],
      },
    ],
  },
];

const buildBook = (spec: BookSpec): ExcelJS.Workbook => {
  const wb = new ExcelJS.Workbook();
  wb.creator = "KHBA sample generator";

  for (const sheet of spec.sheets) {
    const ws = wb.addWorksheet(sheet.name);

    // Title row spanning the columns, for a bit of realistic layout.
    ws.mergeCells(1, 1, 1, sheet.headers.length);
    const titleCell = ws.getCell(1, 1);
    titleCell.value = `${spec.title} — ${sheet.name}`;
    titleCell.font = { bold: true, size: 13 };

    const headerRow = ws.addRow(sheet.headers);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F0EC" } };
      cell.border = { bottom: { style: "thin" } };
    });

    for (const row of sheet.rows) ws.addRow(row);

    sheet.headers.forEach((_, i) => {
      ws.getColumn(i + 1).width = 20;
    });
  }

  return wb;
};

const main = async () => {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const spec of BOOKS) {
    const wb = buildBook(spec);
    await wb.xlsx.writeFile(join(OUT_DIR, spec.file));
    console.log(`  wrote data/documents/${spec.file}`);
  }
  console.log(`\nGenerated ${BOOKS.length} sample .xlsx documents.`);
};

main();
