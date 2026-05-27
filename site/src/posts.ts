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
