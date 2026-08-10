import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";

import { createCanvas, GlobalFonts } from "@napi-rs/canvas";

// Generate sample Korean legal/administrative document IMAGES (.png / .jpg) for
// testing LlamaCloud agentic-OCR ingestion of scanned/image inputs
// (`pnpm ingest`). Text is rasterized (not selectable), so the parser must run
// real OCR. Includes a bordered table so it must reconstruct a markdown table.

const FONT_REGULAR = join(process.env.WINDIR ?? "C:/Windows", "Fonts", "malgun.ttf");
const FONT_BOLD = join(process.env.WINDIR ?? "C:/Windows", "Fonts", "malgunbd.ttf");
GlobalFonts.registerFromPath(FONT_REGULAR, "Malgun");
GlobalFonts.registerFromPath(FONT_BOLD, "MalgunBold");

const OUT_DIR = resolve(process.cwd(), "data/documents");

type Block =
  | { type: "section"; heading: string; body: string }
  | { type: "table"; headers: string[]; rows: string[][] };

type ImageSpec = {
  file: string;
  format: "png" | "jpeg";
  title: string;
  meta: string;
  blocks: Block[];
};

const IMAGES: ImageSpec[] = [
  {
    file: "parking-fee-adjustment-notice.png",
    format: "png",
    title: "공영주차장 요금 조정 공고",
    meta: "문서번호 ADMIN-11000-000401 · 공고일 2026-07-25 · 공개",
    blocks: [
      {
        type: "section",
        heading: "1. 조정 개요",
        body: "노외 공영주차장의 시간당 주차요금을 다음과 같이 조정하여 시행한다. 조정된 요금은 공고일 다음 달 1일부터 적용한다.",
      },
      {
        type: "table",
        headers: ["구역", "현행 요금", "조정 요금"],
        rows: [
          ["1급지", "시간당 1,000원", "시간당 1,200원"],
          ["2급지", "시간당 700원", "시간당 800원"],
          ["3급지", "시간당 400원", "시간당 500원"],
        ],
      },
      {
        type: "section",
        heading: "2. 감면",
        body: "경형 자동차와 저공해 차량은 조정 후 요금의 50퍼센트를 감면한다. 감면을 받으려는 자는 관련 증빙을 제시하여야 한다.",
      },
    ],
  },
  {
    file: "resident-parking-permit-guide.jpg",
    format: "jpeg",
    title: "거주자 우선주차 신청 안내",
    meta: "문서번호 ADMIN-11000-000402 · 안내일 2026-06-30 · 공개",
    blocks: [
      {
        type: "section",
        heading: "1. 신청 자격",
        body: "해당 주차구획이 지정된 도로에 인접한 건축물에 주민등록을 둔 거주자로서, 자동차를 소유한 자가 신청할 수 있다.",
      },
      {
        type: "table",
        headers: ["구분", "월 사용료", "비고"],
        rows: [
          ["전일제", "40,000원", "24시간 배정"],
          ["주간제", "25,000원", "09시-18시"],
          ["야간제", "20,000원", "18시-익일 09시"],
        ],
      },
      {
        type: "section",
        heading: "2. 접수",
        body: "신청은 관할 구청 교통행정과에 방문 또는 온라인으로 접수하며, 배정 대수를 초과하는 경우 추첨으로 선정한다.",
      },
    ],
  },
  {
    file: "road-control-notice.png",
    format: "png",
    title: "도로 공사 통제 안내문",
    meta: "문서번호 ADMIN-11000-000403 · 공고일 2026-07-28 · 공개",
    blocks: [
      {
        type: "section",
        heading: "1. 통제 개요",
        body: "상수도 관로 정비 공사를 위하여 다음 구간의 차량 통행을 한시적으로 통제한다.",
      },
      {
        type: "table",
        headers: ["통제 구간", "통제 기간", "우회 안내"],
        rows: [
          ["시청로 1-3구간", "8월 5일-8월 9일", "중앙로 이용"],
          ["역전로 전 구간", "8월 10일-8월 12일", "산업로 이용"],
        ],
      },
      {
        type: "section",
        heading: "2. 협조 사항",
        body: "통제 구간 인근 주민과 상인은 차량 이동에 협조하여 주시기 바라며, 긴급 차량은 통제에서 제외한다.",
      },
    ],
  },
  {
    file: "waste-collection-schedule-notice.jpg",
    format: "jpeg",
    title: "생활폐기물 배출 요일제 시행 공고",
    meta: "문서번호 ORD-11000-000012 · 공고일 2026-06-15 · 공개",
    blocks: [
      {
        type: "section",
        heading: "1. 시행 개요",
        body: "생활폐기물의 종류별 배출 요일을 다음과 같이 정하여 시행한다. 배출은 해당 요일 저녁 6시부터 자정까지 한다.",
      },
      {
        type: "table",
        headers: ["폐기물 종류", "배출 요일", "배출 장소"],
        rows: [
          ["일반 쓰레기", "월·수·금", "지정 봉투"],
          ["음식물 쓰레기", "화·목·토", "전용 용기"],
          ["재활용품", "일요일", "품목별 분리"],
        ],
      },
      {
        type: "section",
        heading: "2. 위반 시 조치",
        body: "요일을 위반하여 배출한 경우 관계 법령에 따라 과태료를 부과할 수 있다.",
      },
    ],
  },
  {
    file: "civil-complaint-processing-period.png",
    format: "png",
    title: "민원 처리 기간 안내",
    meta: "문서번호 ADMIN-11000-000404 · 안내일 2026-05-30 · 공개",
    blocks: [
      {
        type: "section",
        heading: "1. 처리 기간",
        body: "민원의 종류별 처리 기간은 다음 표와 같으며, 부득이한 경우 1회에 한하여 연장할 수 있다.",
      },
      {
        type: "table",
        headers: ["민원 종류", "처리 기간", "담당 부서"],
        rows: [
          ["건축 허가", "10일", "건축과"],
          ["영업 신고", "3일", "위생과"],
          ["도로 점용", "7일", "교통행정과"],
        ],
      },
      {
        type: "section",
        heading: "2. 안내",
        body: "처리 기간에는 공휴일과 토요일은 산입하지 아니하며, 보완에 걸리는 기간도 제외한다.",
      },
    ],
  },
];

const WIDTH = 960;
const MARGIN = 64;
const CONTENT_W = WIDTH - MARGIN * 2;

// Char-based wrap (Korean rarely uses inter-word spaces, so measure per char).
const wrapText = (
  ctx: ReturnType<ReturnType<typeof createCanvas>["getContext"]>,
  text: string,
  maxWidth: number
): string[] => {
  const lines: string[] = [];
  let line = "";
  for (const ch of text) {
    const candidate = line + ch;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
};

// Two passes: measure the required height, then render at that height.
const layoutAndRender = (spec: ImageSpec): Buffer => {
  const rowH = 40;
  const measure = createCanvas(WIDTH, 10).getContext("2d");

  // --- Measure ---
  let h = MARGIN + 44 + 28; // title + meta
  for (const block of spec.blocks) {
    if (block.type === "section") {
      measure.font = "20px Malgun";
      h += 34; // heading
      h += wrapText(measure, block.body, CONTENT_W).length * 28 + 18;
    } else {
      h += (block.rows.length + 1) * rowH + 24;
    }
  }
  h += MARGIN;

  // --- Render ---
  const canvas = createCanvas(WIDTH, h);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, h);
  ctx.fillStyle = "#111111";
  ctx.textBaseline = "top";

  ctx.font = "28px MalgunBold";
  ctx.textAlign = "center";
  ctx.fillText(spec.title, WIDTH / 2, MARGIN);
  ctx.font = "14px Malgun";
  ctx.fillStyle = "#666666";
  ctx.fillText(spec.meta, WIDTH / 2, MARGIN + 42);
  ctx.fillStyle = "#111111";
  ctx.textAlign = "left";

  let y = MARGIN + 44 + 28;
  for (const block of spec.blocks) {
    if (block.type === "section") {
      ctx.font = "20px MalgunBold";
      ctx.fillText(block.heading, MARGIN, y);
      y += 34;
      ctx.font = "17px Malgun";
      for (const line of wrapText(ctx, block.body, CONTENT_W)) {
        ctx.fillText(line, MARGIN, y);
        y += 28;
      }
      y += 18;
    } else {
      const colW = CONTENT_W / block.headers.length;
      const drawRow = (cells: string[], ry: number, header: boolean) => {
        ctx.font = header ? "16px MalgunBold" : "16px Malgun";
        cells.forEach((cell, c) => {
          const x = MARGIN + c * colW;
          if (header) {
            ctx.fillStyle = "#e8f0ec";
            ctx.fillRect(x, ry, colW, rowH);
            ctx.fillStyle = "#111111";
          }
          ctx.strokeStyle = "#999999";
          ctx.strokeRect(x, ry, colW, rowH);
          ctx.fillText(cell, x + 10, ry + 11, colW - 20);
        });
      };
      drawRow(block.headers, y, true);
      y += rowH;
      for (const row of block.rows) {
        drawRow(row, y, false);
        y += rowH;
      }
      y += 24;
    }
  }

  return spec.format === "png" ? canvas.toBuffer("image/png") : canvas.toBuffer("image/jpeg", 92);
};

const main = () => {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const spec of IMAGES) {
    writeFileSync(join(OUT_DIR, spec.file), layoutAndRender(spec));
    console.log(`  wrote data/documents/${spec.file}`);
  }
  console.log(`\nGenerated ${IMAGES.length} sample image documents.`);
};

main();
