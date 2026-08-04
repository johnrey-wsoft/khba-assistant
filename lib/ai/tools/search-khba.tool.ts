import { tool } from "ai";
import { z } from "zod";

// POC MOCK — static in-memory KHBA documents.
// Shaped to mirror the WS-1267 `document` schema so this can later be swapped
// for a real DB / vector query without changing the tool's output contract.
const MOCK_DOCUMENTS = [
  {
    documentCode: "LAW-2026-000123",
    title: "개인정보 보호법 시행령",
    authorityType: "LAW",
    jurisdictionCode: null,
    securityClass: "PUBLIC",
    snippet:
      "개인정보처리자는 개인정보의 처리 목적을 명확하게 하고 그 목적에 필요한 범위에서 최소한의 개인정보만을 수집하여야 한다.",
  },
  {
    documentCode: "ORD-41390-000045",
    title: "수원시 정보공개 조례",
    authorityType: "ORDINANCE",
    jurisdictionCode: "41390",
    securityClass: "PUBLIC",
    snippet:
      "시장은 시민의 알권리를 보장하기 위하여 시가 보유·관리하는 정보를 적극적으로 공개하여야 한다.",
  },
  {
    documentCode: "GUIDE-2026-000078",
    title: "행정문서 작성 및 관리 지침",
    authorityType: "GUIDELINE",
    jurisdictionCode: null,
    securityClass: "PUBLIC",
    snippet: "행정문서는 정확하고 간결하게 작성하며, 증거자료의 출처를 명확히 기재하여야 한다.",
  },
] as const;

export const searchKhba = tool({
  description:
    "Search the KHBA knowledge base for public legal/administrative documents " +
    "(laws, ordinances, guidelines). Use this to ground answers in real documents " +
    "rather than guessing. Returns matching documents with a short snippet.",
  inputSchema: z.object({
    query: z
      .string()
      .min(1)
      .describe("Keywords to search for, e.g. a topic, title, or document code."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(10)
      .default(5)
      .describe("Max number of documents to return."),
  }),
  execute: async ({ query, limit }) => {
    const q = query.toLowerCase();

    // POC: naive substring match. Public documents only — this is an
    // unauthenticated endpoint, so restricted records must never be returned.
    const results = MOCK_DOCUMENTS.filter(
      (doc) =>
        doc.securityClass === "PUBLIC" &&
        (doc.title.toLowerCase().includes(q) ||
          doc.documentCode.toLowerCase().includes(q) ||
          doc.snippet.toLowerCase().includes(q))
    ).slice(0, limit);

    return {
      query,
      count: results.length,
      results,
    };
  },
});
