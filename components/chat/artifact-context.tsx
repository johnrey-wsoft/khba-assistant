"use client";

import * as React from "react";

import type { ChatSource } from "@/components/chat/primitives";

type ArtifactValue = {
  // `siblings` are the other sources cited in the same answer — the panel shows
  // them as tabs, opening on `source`.
  openSource: (source: ChatSource, siblings?: ChatSource[]) => void;
};

const ArtifactContext = React.createContext<ArtifactValue>({
  openSource: () => {},
});

export const ArtifactProvider = ({
  openSource,
  children,
}: React.PropsWithChildren<ArtifactValue>) => (
  <ArtifactContext.Provider value={{ openSource }}>{children}</ArtifactContext.Provider>
);

export const useArtifact = () => React.useContext(ArtifactContext);
