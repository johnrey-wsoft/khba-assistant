import type { ChatSource } from "@/components/chat/primitives";

// POC MOCK — static data for the chat UI. Replace with real queries when wired up.

export type ThreadStatus = "sourced" | "partial" | "unanswered";

export type MockMessage = {
  role: "user" | "assistant";
  text: string;
  time?: string;
  // The query that produced `sources` — used to seed the searchKhba tool part.
  query?: string;
  sources?: ChatSource[];
};

export type ChatThread = {
  id: string;
  title: string;
  subtitle: string;
  preview: string;
  when: string;
  baseDate?: string;
  status: ThreadStatus;
  messages: MockMessage[];
};

export const CHAT_THREADS: ChatThread[] = [
  {
    id: "t1",
    title: "Parking ratio in Suwon",
    subtitle: "Suwon · Parking",
    preview: "Under 30㎡ is 0.5 space per unit, 30 to 60㎡ is 0.6.",
    when: "2026-07-28 16:19",
    baseDate: "2026-03-15",
    status: "sourced",
    messages: [
      {
        role: "user",
        text: "What is the parking ratio for small multi-family housing in Suwon?",
        time: "16:18",
      },
      {
        role: "assistant",
        text: "Under 30㎡ exclusive area it is 0.5 space per unit, and 30㎡ to 60㎡ is 0.6 [1](cite:1). Any remainder in the total is rounded up before it applies [2](cite:2).",
        time: "16:19",
        query: "Suwon parking ratio small multi-family",
        sources: [
          {
            documentCode: "ORD-41390-000045",
            title: "수원시 주차장 설치 및 관리 조례",
            authorityType: "ORDINANCE",
            jurisdictionCode: "41390",
            securityClass: "PUBLIC",
            snippet: "전용면적 30㎡ 미만은 세대당 0.5대, 30㎡ 이상 60㎡ 이하는 0.6대로 한다.",
          },
          {
            documentCode: "LAW-2026-000210",
            title: "주차장법 시행령",
            authorityType: "LAW",
            jurisdictionCode: null,
            securityClass: "PUBLIC",
            snippet: "부설주차장의 설치기준은 별표1에 따른다.",
          },
        ],
      },
      {
        role: "user",
        text: "Does mechanical parking count toward that?",
        time: "16:24",
      },
      {
        role: "assistant",
        text: "It counts under the national decree [1](cite:1). Whether Suwon caps that share is decided in the ordinance, and that article is not in our index yet, so we are not going to guess at the number.",
        time: "16:25",
        query: "mechanical parking required count decree",
        sources: [
          {
            documentCode: "LAW-2026-000210",
            title: "주차장법 시행령 제6조",
            authorityType: "LAW",
            jurisdictionCode: null,
            securityClass: "PUBLIC",
            snippet: "기계식주차장치는 소요 대수에 포함할 수 있다.",
          },
        ],
      },
    ],
  },
  {
    id: "t2",
    title: "LH purchase-rental notice conditions",
    subtitle: "LH · Notice",
    preview: "Applications close 2026-08-08 with the revised unit table.",
    when: "2026-07-27 11:02",
    baseDate: "2026-07-10",
    status: "sourced",
    messages: [
      {
        role: "user",
        text: "What are the conditions in the latest LH purchase-rental notice?",
        time: "11:01",
      },
      {
        role: "assistant",
        text: "Applications close 2026-08-08, and the revised unit table applies from this notice [1](cite:1). Income and asset limits follow the standard purchase-rental bracket.",
        time: "11:02",
        query: "LH purchase-rental notice conditions",
        sources: [
          {
            documentCode: "NOTICE-2026-000512",
            title: "LH 매입임대 입주자 모집 공고",
            authorityType: "GUIDELINE",
            jurisdictionCode: null,
            securityClass: "PUBLIC",
            snippet: "신청 접수는 2026-08-08까지이며, 개정 세대 표를 적용한다.",
          },
        ],
      },
    ],
  },
  {
    id: "t3",
    title: "Relaxation for attached parking lots",
    subtitle: "Suwon · Relaxation",
    preview: "Partly covered. The Suwon clause was not found.",
    when: "2026-07-24 09:41",
    status: "partial",
    messages: [
      {
        role: "user",
        text: "Can the attached parking lot requirement be relaxed?",
        time: "09:40",
      },
      {
        role: "assistant",
        text: "The national decree allows relaxation in specific cases, but the Suwon clause that sets the local conditions is not in what we hold, so this is only partly covered.",
        time: "09:41",
      },
    ],
  },
  {
    id: "t4",
    title: "Association quarterly filing forms",
    subtitle: "Association · Filing",
    preview: "Form 3 and the appendix, with the current base date.",
    when: "2026-07-22 17:30",
    baseDate: "2026-06-30",
    status: "sourced",
    messages: [
      {
        role: "user",
        text: "Which forms do we file for the quarterly association report?",
        time: "17:29",
      },
      {
        role: "assistant",
        text: "File Form 3 with its appendix, using the current base date on the cover [1](cite:1).",
        time: "17:30",
        query: "association quarterly filing forms",
        sources: [
          {
            documentCode: "GUIDE-2026-000078",
            title: "협회 분기 신고 서식 안내",
            authorityType: "GUIDELINE",
            jurisdictionCode: null,
            securityClass: "PUBLIC",
            snippet: "서식 3호와 부록을 현행 기준일 기준으로 제출한다.",
          },
        ],
      },
    ],
  },
  {
    id: "t5",
    title: "Planned 2027 amendments",
    subtitle: "General",
    preview: "Not in the materials we hold, so we did not answer.",
    when: "2026-07-20 14:12",
    status: "unanswered",
    messages: [
      {
        role: "user",
        text: "What are the planned 2027 amendments to the parking ordinance?",
        time: "14:11",
      },
      {
        role: "assistant",
        text: "Planned 2027 amendments are not in the materials we hold, so we are not going to answer. Check the official legislative notice when it is published.",
        time: "14:12",
      },
    ],
  },
];

export const getThread = (id: string): ChatThread | null =>
  CHAT_THREADS.find((t) => t.id === id) ?? null;

export const CHAT_SUGGESTIONS = [
  "Does mechanical parking count?",
  "Relaxation conditions",
  "Compare with Yongin",
  "Open the ordinance",
];
