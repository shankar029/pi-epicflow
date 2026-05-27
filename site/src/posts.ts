/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Blog post registry. Each post is identified by its slug; the slug
 * appears in the URL (`/#/blog/<slug>`) and in the index listing.
 *
 * Posts are stored as plain TSX modules (one per file) so they can
 * use the same motion + lucide-react vocabulary as the landing page.
 */

import type { ComponentType } from "react";
import FeatureDecompositionPost from "./blog-posts/feature-decomposition";
import ProjectMemoryPost from "./blog-posts/project-memory";
import V014EndToEndPost from "./blog-posts/v0-14-end-to-end-guide";
import CompleteGuidePost from "./blog-posts/complete-guide";

export type PostMeta = {
  slug: string;
  title: string;
  subtitle: string;
  date: string; // ISO date — sorted desc on the index
  readMinutes: number;
  tag: "Epic workflow" | "Project memory" | "Engineering";
  Component: ComponentType;
};

export const posts: PostMeta[] = [
  {
    slug: "complete-guide",
    title: "pi-epicflow, end-to-end: a complete operator's guide",
    subtitle:
      "Both pillars in one read. What each piece is, when to reach for it, and why the choice was made — so the workflow sticks in your head instead of being a checklist you re-look up every Monday. Follows a single fictional project from empty directory through epic delivery through long-term brain maintenance.",
    date: "2026-05-27",
    readMinutes: 28,
    tag: "Engineering",
    Component: CompleteGuidePost,
  },
  {
    slug: "v0-14-end-to-end-guide",
    title: "v0.14, end-to-end: how to actually use it",
    subtitle:
      "A complete operator's manual for the v0.14 project-memory expansion — the global cross-repo overlay, the epicflow-steward persona, Phase 2 artifacts (gotchas, questions, module cards), capacity caps with manual rollover, and the trigger phrases that fire each write. Read this once before adopting.",
    date: "2026-05-26",
    readMinutes: 18,
    tag: "Project memory",
    Component: V014EndToEndPost,
  },
  {
    slug: "project-memory",
    title: "Project memory: pi sessions that stop forgetting",
    subtitle:
      "How v0.13's file-based brain at .pi/project/ keeps decisions, conventions, and backlog persistent across every pi session — without slash commands and without an opaque vector store.",
    date: "2026-05-26",
    readMinutes: 9,
    tag: "Project memory",
    Component: ProjectMemoryPost,
  },
  {
    slug: "feature-decomposition",
    title: "Feature decomposition: turning design.md into a parallel DAG",
    subtitle:
      "Why /epic-decompose splits one design into 3–60 small features with explicit dependencies, and how worker subagents in clean worktrees ship them faster than one heroic context ever could.",
    date: "2026-05-24",
    readMinutes: 8,
    tag: "Epic workflow",
    Component: FeatureDecompositionPost,
  },
];

export const postBySlug = (slug: string): PostMeta | undefined =>
  posts.find((p) => p.slug === slug);
