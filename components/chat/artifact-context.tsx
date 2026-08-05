"use client";

import * as React from "react";

import type { ChatSource } from "@/components/chat/primitives";

type ArtifactValue = {
  openSource: (source: ChatSource) => void;
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
