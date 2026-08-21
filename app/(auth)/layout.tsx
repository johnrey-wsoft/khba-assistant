import Link from "next/link";
import { PropsWithChildren } from "react";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 self-center font-extrabold tracking-tight"
        >
          <span className="grid size-8 place-items-center rounded-[10px] bg-[linear-gradient(150deg,var(--navy),var(--navy-3))] text-base font-extrabold text-white shadow-sm">
            近
          </span>
          KHBA Assistant
        </Link>
        {children}
      </div>
    </div>
  );
}
