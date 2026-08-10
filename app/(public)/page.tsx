import type { Metadata } from "next";

import { PageClient } from "./page.client";

export const metadata: Metadata = {
  title: "KHBA Assistant · Ask in plain words, get the source with the answer",
  description:
    "A member consultation channel for the Korea Housing Builders Association. Association materials, public notices and statutes in one place — every answer comes back with its source and base date.",
};

export default function Page() {
  return <PageClient />;
}
