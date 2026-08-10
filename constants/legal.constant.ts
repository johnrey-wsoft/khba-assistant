// Static Terms-of-service content for the /terms page. Content only — no backend.

export const TERMS_META = {
  effectiveDate: "2026-07-01",
  version: "1.2",
  note: "applies to all member accounts",
};

export type TermsArticle = {
  id: string;
  title: string;
  body: string;
  items?: string[];
};

export const TERMS_ARTICLES: TermsArticle[] = [
  {
    id: "a1",
    title: "Article 1. What these terms cover",
    body: "These terms govern how members of the Korea Housing Builders Association use KHBA Assistant. By opening an account you accept them, and by continuing to use the service after a change takes effect you accept the changed version.",
  },
  {
    id: "a2",
    title: "Article 2. Who may hold an account",
    body: "Accounts are for verified member companies and the staff they nominate. The secretariat confirms the company against association records before an account is activated, and an account belongs to one person only.",
    items: [
      "Sharing credentials across staff is grounds for suspension.",
      "Leaving a member company means the account is closed on request of the company.",
      "A company may ask the desk to transfer or revoke the accounts it nominated.",
    ],
  },
  {
    id: "a3",
    title: "Article 3. What the service does, and does not do",
    body: "The service searches association materials, public notices and statutes, summarises what it finds, and cites the documents behind the summary with their base dates. It does not include feasibility review, profitability modelling, or automated checking of drawings.",
  },
  {
    id: "a4",
    title: "Article 4. Answers are reference material",
    body: "Answers support your judgement, they do not replace it. Before filing, applying, or committing money, the official text and the competent authority govern, and confirming there is your responsibility. The association is not liable for decisions made on an answer alone.",
  },
  {
    id: "a5",
    title: "Article 5. Base dates and revisions",
    body: "Every cited source carries the date the content reflects. Rules change, and a document that was current at its base date may since have been revised. Where we know a revision exists, we say so in the answer.",
  },
  {
    id: "a6",
    title: "Article 6. How your data is handled",
    body: "We keep the account details you provide, the questions you ask, and the answers returned, so the desk can improve coverage and resolve disputes.",
    items: [
      "Question history is retained for one year, then deleted.",
      "Account details are kept while the account is open and for five years after closure where law requires.",
      "Content is not sold, and is not shared outside the secretariat except where law compels it.",
    ],
  },
  {
    id: "a7",
    title: "Article 7. Things you agree not to do",
    body: "Automated bulk extraction, resale of answers as a commercial data product, attempts to bypass access control, and uploading material you have no right to share are all prohibited. We may suspend an account while we look into suspected misuse.",
  },
  {
    id: "a8",
    title: "Article 8. Interruptions and changes",
    body: "Maintenance, source outages and force majeure can interrupt the service. Planned maintenance is announced in advance where practical. Material changes to these terms are announced at least seven days before they take effect, and thirty days where the change reduces member rights.",
  },
];
