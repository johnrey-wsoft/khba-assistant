// Display metadata for the WS-1267 authority_type enum, shared by the source
// card, citation tooltip, and artifact panel.

export const AUTHORITY_GLYPH: Record<string, string> = {
  LAW: "法",
  ORDINANCE: "条",
  ADMIN_RULE: "規",
  INTERPRETATION: "解",
  ASSOCIATION_GUIDE: "指",
  MEMBER_CASE: "例",
};

export const AUTHORITY_LABEL: Record<string, string> = {
  LAW: "Law / decree",
  ORDINANCE: "Local ordinance",
  ADMIN_RULE: "Administrative rule",
  INTERPRETATION: "Interpretation",
  ASSOCIATION_GUIDE: "Association guide",
  MEMBER_CASE: "Member case",
};

export const authorityGlyph = (type: string): string => AUTHORITY_GLYPH[type] ?? "文";

export const authorityLabel = (type: string): string => AUTHORITY_LABEL[type] ?? type;
