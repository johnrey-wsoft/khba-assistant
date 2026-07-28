import { Toaster } from "sonner";
import { PropsWithChildren } from "react";
import NextTopLoader from "nextjs-toploader";

import { TooltipProvider } from "@/components/ui/tooltip";

export const AppProvider = ({ children }: PropsWithChildren) => {
  return (
    <TooltipProvider delayDuration={0}>
      <NextTopLoader showSpinner={false} easing="ease-out" />
      {children}
      <Toaster position="top-center" />
    </TooltipProvider>
  );
};
