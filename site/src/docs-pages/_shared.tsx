/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tiny shared header strip for every reference doc page. Keeps the
 * eyebrow / title / subtitle visually consistent across all 8 pages
 * without re-typing them.
 */

import type { ComponentType, ReactNode } from "react";

export const DocHeader = ({
  eyebrow,
  Icon,
  title,
  subtitle,
}: {
  eyebrow: string;
  Icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle: ReactNode;
}) => (
  <header className="mb-8">
    <div className="inline-flex items-center gap-2 bg-vibrant-green/10 text-vibrant-green text-xs font-bold font-mono px-3 py-1 rounded-full border border-vibrant-green/20 mb-4 uppercase tracking-widest">
      <Icon className="w-3 h-3" /> {eyebrow}
    </div>
    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-3">
      {title}
    </h1>
    <p className="text-text-muted text-lg leading-relaxed">{subtitle}</p>
  </header>
);

export const DocFooter = () => (
  <div className="mt-12 pt-6 border-t border-slate-border flex flex-wrap gap-3 text-sm text-text-muted">
    <a href="#/docs" className="text-vibrant-green hover:underline">
      All docs
    </a>
    <span>&middot;</span>
    <a href="#/blog" className="text-vibrant-green hover:underline">
      Blog
    </a>
    <span>&middot;</span>
    <a
      href="https://github.com/shankar029/pi-epicflow"
      className="text-vibrant-green hover:underline"
    >
      GitHub
    </a>
  </div>
);
