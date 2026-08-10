import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";

import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  TextRun,
} from "docx";

// Generate sample Korean legal/administrative Word documents (.docx) for
// testing LlamaCloud agentic-OCR ingestion of non-PDF formats (`pnpm ingest`).
// Each doc has real Word headings, body paragraphs, and a native Word table so
// the parser has structure + tables to reconstruct into markdown pipe tables.

const OUT_DIR = resolve(process.cwd(), "data/documents");

type Block =
  | { type: "section"; heading: string; body: string }
  | { type: "table"; headers: string[]; rows: string[][] };

type DocSpec = { file: string; title: string; meta: string; blocks: Block[] };

const DOCS: DocSpec[] = [
  {
    file: "seoul-rental-housing-operation-guide.docx",
    title: "서울시 공공임대주택 운영 지침",
    meta: "문서번호 ADMIN-11000-000101 · 시행일 2026-04-01 · 공개",
    blocks: [
      {
        type: "section",
        heading: "제1조(목적)",
        body: "이 지침은 서울특별시가 공급하는 공공임대주택의 임대료 산정과 관리 기준을 정하여 입주자의 주거 안정을 도모함을 목적으로 한다.",
      },
      {
        type: "section",
        heading: "제2조(임대료 산정 기준)",
        body: "임대료는 주택의 전용면적과 입주 유형을 기준으로 산정하며, 소수점 이하의 금액은 원 단위에서 버림하여 적용한다. 유형별 월 임대료 기준은 다음 표와 같다.",
      },
      {
        type: "table",
        headers: ["입주 유형", "전용면적", "월 임대료 기준"],
        rows: [
          ["국민임대", "40제곱미터 이하", "전세시세의 60퍼센트"],
          ["행복주택", "45제곱미터 이하", "전세시세의 68퍼센트"],
          ["장기전세", "60제곱미터 이하", "전세시세의 80퍼센트"],
        ],
      },
      {
        type: "section",
        heading: "제3조(관리비 부과)",
        body: "관리비는 실제 발생한 공용 비용을 입주 세대에 균등 또는 사용량에 따라 배분하여 부과한다. 관리 주체는 매월 부과 내역을 입주자에게 고지하여야 한다.",
      },
      {
        type: "section",
        heading: "제4조(재계약)",
        body: "입주자가 재계약을 신청하는 경우 소득 및 자산 기준을 다시 심사하며, 기준을 초과하는 경우 할증된 임대료를 적용하거나 퇴거를 요구할 수 있다.",
      },
    ],
  },
  {
    file: "building-use-approval-procedure-rule.docx",
    title: "건축물 사용승인 절차에 관한 규칙",
    meta: "문서번호 ADMIN-11000-000210 · 시행일 2026-02-15 · 공개",
    blocks: [
      {
        type: "section",
        heading: "제1조(신청)",
        body: "건축주는 공사를 완료한 후 사용승인을 받으려면 사용승인 신청서에 필요한 서류를 첨부하여 허가권자에게 제출하여야 한다.",
      },
      {
        type: "section",
        heading: "제2조(제출 서류)",
        body: "사용승인 신청 시 제출하여야 하는 서류의 종류와 제출 여부는 다음 표에 따른다. 전자적 방법으로 제출하는 것을 원칙으로 한다.",
      },
      {
        type: "table",
        headers: ["서류명", "구분", "비고"],
        rows: [
          ["사용승인 신청서", "필수", "정본 1부"],
          ["감리완료보고서", "필수", "감리자 날인"],
          ["에너지효율 등급 인증서", "해당 시", "대상 건축물에 한함"],
          ["소방시설 완공검사 증명서", "필수", "소방서 발급"],
        ],
      },
      {
        type: "section",
        heading: "제3조(검사)",
        body: "허가권자는 신청을 접수한 날부터 7일 이내에 건축물이 설계도서대로 시공되었는지를 검사하여야 한다. 다만 대규모 건축물의 경우 검사 기간을 연장할 수 있다.",
      },
      {
        type: "section",
        heading: "제4조(사용승인서 교부)",
        body: "검사 결과 적합한 경우 허가권자는 지체 없이 사용승인서를 교부하여야 하며, 부적합한 경우 보완을 요구할 수 있다.",
      },
    ],
  },
  {
    file: "ev-charging-facility-ordinance.docx",
    title: "전기자동차 충전시설 설치 및 운영 조례",
    meta: "문서번호 ORD-11000-000010 · 시행일 2026-05-01 · 공개",
    blocks: [
      {
        type: "section",
        heading: "제1조(목적)",
        body: "이 조례는 전기자동차 충전시설의 설치 및 운영에 필요한 사항을 정하여 친환경 교통 환경 조성에 이바지함을 목적으로 한다.",
      },
      {
        type: "section",
        heading: "제2조(설치 대상)",
        body: "일정 규모 이상의 공동주택과 공중이용시설에는 다음 표의 기준에 따라 충전시설을 설치하여야 한다.",
      },
      {
        type: "table",
        headers: ["시설 구분", "총 주차면수", "최소 충전기 수"],
        rows: [
          ["공동주택", "100면 이상", "총 주차면수의 5퍼센트"],
          ["공중이용시설", "50면 이상", "총 주차면수의 3퍼센트"],
          ["공영주차장", "30면 이상", "총 주차면수의 5퍼센트"],
        ],
      },
      {
        type: "section",
        heading: "제3조(운영)",
        body: "충전시설 운영자는 충전 방해 행위를 금지하고, 고장 발생 시 신속히 조치하여야 한다.",
      },
    ],
  },
  {
    file: "outdoor-advertising-permit-guide.docx",
    title: "옥외광고물 표시 허가 세부 지침",
    meta: "문서번호 ADMIN-11000-000103 · 시행일 2026-03-20 · 공개",
    blocks: [
      {
        type: "section",
        heading: "1. 허가 대상",
        body: "건물의 벽면 또는 옥상에 표시하는 광고물 중 다음 표에 해당하는 것은 허가를 받아야 한다.",
      },
      {
        type: "table",
        headers: ["광고물 종류", "허가 구분", "표시 기간"],
        rows: [
          ["벽면 이용 간판", "허가", "3년"],
          ["옥상 간판", "허가", "3년"],
          ["현수막", "신고", "15일"],
        ],
      },
      {
        type: "section",
        heading: "2. 심사 기준",
        body: "광고물의 규격과 색채는 주변 경관과 조화를 이루어야 하며, 보행자의 통행을 방해하지 아니하여야 한다.",
      },
    ],
  },
  {
    file: "association-training-completion-guide.docx",
    title: "협회 회원 교육 이수 기준 안내",
    meta: "문서번호 GUIDE-2026-000102 · 시행일 2026-06-10 · 공개",
    blocks: [
      {
        type: "section",
        heading: "1. 교육 과정",
        body: "회원은 매년 다음 표의 과정을 이수하여야 하며, 이수 시간은 온라인과 집합 교육을 합산한다.",
      },
      {
        type: "table",
        headers: ["과정명", "이수 시간", "이수 방법"],
        rows: [
          ["직무 윤리", "4시간", "온라인"],
          ["실무 심화", "8시간", "집합"],
          ["법규 개정 사항", "2시간", "온라인"],
        ],
      },
      {
        type: "section",
        heading: "2. 미이수 시 조치",
        body: "정당한 사유 없이 교육을 이수하지 아니한 회원에게는 자격 유지에 필요한 보수 교육을 별도로 부과할 수 있다.",
      },
    ],
  },
];

const buildTable = (headers: string[], rows: string[][]): Table => {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (h) =>
        new TableCell({
          shading: { fill: "E8F0EC" },
          children: [
            new Paragraph({
              children: [new TextRun({ text: h, bold: true })],
            }),
          ],
        })
    ),
  });

  const bodyRows = rows.map(
    (cells) =>
      new TableRow({
        children: cells.map(
          (c) =>
            new TableCell({
              children: [new Paragraph(c)],
            })
        ),
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows],
  });
};

const buildChildren = (spec: DocSpec) => {
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: spec.title, bold: true, size: 36 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: spec.meta, color: "666666", size: 18 })],
    }),
    new Paragraph({ text: "" }),
  ];

  for (const block of spec.blocks) {
    if (block.type === "section") {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: block.heading, bold: true })],
        })
      );
      children.push(new Paragraph({ text: block.body }));
      children.push(new Paragraph({ text: "" }));
    } else {
      children.push(buildTable(block.headers, block.rows));
      children.push(new Paragraph({ text: "" }));
    }
  }

  return children;
};

const main = async () => {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const spec of DOCS) {
    const doc = new Document({ sections: [{ children: buildChildren(spec) }] });
    const buffer = await Packer.toBuffer(doc);
    writeFileSync(join(OUT_DIR, spec.file), buffer);
    console.log(`  wrote data/documents/${spec.file}`);
  }
  console.log(`\nGenerated ${DOCS.length} sample .docx documents.`);
};

main();
