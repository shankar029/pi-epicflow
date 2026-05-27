/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ReactNode } from "react";

// ---------- Reusable typographic primitives used by all blog posts ----------

export const Prose = ({ children }: { children: ReactNode }) => (
  <div className="prose-pi">{children}</div>
);

export const H2 = ({ children, id }: { children: ReactNode; id?: string }) => (
  <h2
    id={id}
    className="text-2xl md:text-3xl font-bold text-white tracking-tight mt-12 mb-4 scroll-mt-24"
  >
    {children}
  </h2>
);

export const H3 = ({ children, id }: { children: ReactNode; id?: string }) => (
  <h3
    id={id}
    className="text-xl md:text-2xl font-semibold text-white tracking-tight mt-8 mb-3 scroll-mt-24"
  >
    {children}
  </h3>
);

export const P = ({ children }: { children: ReactNode }) => (
  <p className="text-text-muted leading-relaxed mb-5 text-base md:text-lg">{children}</p>
);

export const Strong = ({ children }: { children: ReactNode }) => (
  <strong className="text-white font-semibold">{children}</strong>
);

export const Em = ({ children }: { children: ReactNode }) => (
  <em className="text-white/90 italic">{children}</em>
);

export const Code = ({ children }: { children: ReactNode }) => (
  <code className="text-vibrant-green font-mono text-[0.95em] bg-slate-surface/60 px-1.5 py-0.5 rounded border border-slate-border/60">
    {children}
  </code>
);

export const Ul = ({ children }: { children: ReactNode }) => (
  <ul className="list-disc list-outside pl-6 space-y-2 mb-5 text-text-muted text-base md:text-lg leading-relaxed marker:text-vibrant-green/60">
    {children}
  </ul>
);

export const Ol = ({ children }: { children: ReactNode }) => (
  <ol className="list-decimal list-outside pl-6 space-y-2 mb-5 text-text-muted text-base md:text-lg leading-relaxed marker:text-vibrant-green/60">
    {children}
  </ol>
);

export const Li = ({ children }: { children: ReactNode }) => <li>{children}</li>;

export const Pre = ({ children }: { children: ReactNode }) => (
  <pre className="bg-slate-surface border border-slate-border rounded-2xl p-5 overflow-x-auto text-sm leading-relaxed mb-6 font-mono">
    <code className="text-text-muted">{children}</code>
  </pre>
);

export const Callout = ({
  kind = "info",
  title,
  children,
}: {
  kind?: "info" | "warn" | "win";
  title?: string;
  children: ReactNode;
}) => {
  const palette =
    kind === "warn"
      ? "border-amber-400/30 bg-amber-400/5 text-amber-200"
      : kind === "win"
        ? "border-vibrant-green/30 bg-vibrant-green/5 text-vibrant-green"
        : "border-slate-border bg-slate-surface/50 text-text-muted";
  return (
    <div className={`border ${palette} rounded-2xl p-5 mb-6`}>
      {title && (
        <div className="font-bold uppercase tracking-widest text-xs mb-2">
          {title}
        </div>
      )}
      <div className="text-base leading-relaxed">{children}</div>
    </div>
  );
};

export const Quote = ({ children }: { children: ReactNode }) => (
  <blockquote className="border-l-4 border-vibrant-green/60 pl-5 py-1 my-6 text-white/90 italic text-lg">
    {children}
  </blockquote>
);
