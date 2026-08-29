import type { ReactNode } from "react";
import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  from?: "up" | "left" | "right" | "scale";
};

const hidden: Record<NonNullable<RevealProps["from"]>, string> = {
  up: "translate-y-10 opacity-0",
  left: "-translate-x-10 opacity-0",
  right: "translate-x-10 opacity-0",
  scale: "scale-95 opacity-0",
};

export function Reveal({ children, className, delay = 0, from = "up" }: RevealProps) {
  const { ref, shown } = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-700 ease-out will-change-transform motion-reduce:transition-none",
        shown ? "translate-x-0 translate-y-0 scale-100 opacity-100" : hidden[from],
        className,
      )}
    >
      {children}
    </div>
  );
}
