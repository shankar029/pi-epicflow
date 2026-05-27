/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Blog index + post-shell layout. Tiny hash-router (#/blog and
 * #/blog/<slug>) keeps the site zero-dep — no react-router needed.
 */

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, BookOpen, Brain, Layers } from "lucide-react";
import { posts, postBySlug } from "./posts";

const REPO = "https://github.com/shankar029/pi-epicflow";

const tagIcon = (tag: string) => {
  if (tag === "Project memory") return Brain;
  if (tag === "Epic workflow") return Layers;
  return BookOpen;
};

// ---------- Index ----------

export const BlogIndex = () => (
  <section className="px-4 py-16 md:py-20 max-w-5xl mx-auto">
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-12 text-center"
    >
      <div className="inline-flex items-center gap-2 bg-vibrant-green/10 text-vibrant-green text-xs font-bold font-mono px-3 py-1 rounded-full border border-vibrant-green/20 mb-5 uppercase tracking-widest">
        <BookOpen className="w-3 h-3" />
        pi-epicflow blog
      </div>
      <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
        Notes from shipping <span className="text-vibrant-green">multi-feature</span> work with AI agents
      </h1>
      <p className="text-text-muted text-lg max-w-2xl mx-auto leading-relaxed">
        Design rationale, failure modes we hit, and the small disciplines that turn out to
        matter. Vendor-neutral wherever possible — the ideas apply to any agentic coding
        workflow.
      </p>
    </motion.div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {posts.map((p, i) => {
        const Icon = tagIcon(p.tag);
        return (
          <motion.a
            key={p.slug}
            href={`#/blog/${p.slug}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
            className="bg-slate-surface border border-slate-border rounded-3xl p-7 md:p-8 hover:border-vibrant-green/40 transition-all group relative overflow-hidden block"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 text-xs font-bold font-mono px-2.5 py-1 rounded-full border mb-4 uppercase tracking-widest text-vibrant-green border-vibrant-green/30 bg-vibrant-green/5">
                <Icon className="w-3 h-3" />
                {p.tag}
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3 leading-tight group-hover:text-vibrant-green transition-colors">
                {p.title}
              </h3>
              <p className="text-text-muted leading-relaxed mb-5 text-base">
                {p.subtitle}
              </p>
              <div className="text-xs font-mono text-text-muted/70">
                {p.date} · {p.readMinutes} min read
              </div>
            </div>
          </motion.a>
        );
      })}
    </div>

    <div className="mt-12 text-center">
      <a
        href="/"
        className="text-vibrant-green hover:underline inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to landing
      </a>
    </div>
  </section>
);

// ---------- Post shell ----------

export const PostShell = ({ slug }: { slug: string }) => {
  const post = postBySlug(slug);
  if (!post) {
    return (
      <section className="px-4 py-20 max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Post not found</h1>
        <p className="text-text-muted mb-8">
          We couldn't find a post with slug{" "}
          <code className="text-vibrant-green font-mono">{slug}</code>.
        </p>
        <a href="#/blog" className="text-vibrant-green hover:underline">
          Back to all posts
        </a>
      </section>
    );
  }
  const Body = post.Component;
  return (
    <>
      <div className="border-b border-slate-border bg-surface/40">
        <div className="max-w-3xl mx-auto px-4 py-3 text-sm flex items-center justify-between">
          <a
            href="#/blog"
            className="text-text-muted hover:text-vibrant-green transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> All posts
          </a>
          <a
            href={`${REPO}/blob/main/docs/announcements/`}
            className="text-text-muted hover:text-vibrant-green transition-colors text-xs font-mono"
          >
            Source on GitHub →
          </a>
        </div>
      </div>
      <Body />
    </>
  );
};

// ---------- Hash router ----------

type Route =
  | { kind: "home" }
  | { kind: "blog-index" }
  | { kind: "blog-post"; slug: string };

const parseHash = (): Route => {
  const h = window.location.hash.replace(/^#/, "");
  if (h === "/blog" || h === "/blog/") return { kind: "blog-index" };
  const m = h.match(/^\/blog\/([a-z0-9-]+)\/?$/);
  if (m) return { kind: "blog-post", slug: m[1] };
  return { kind: "home" };
};

export const useHashRoute = (): Route => {
  const [route, setRoute] = useState<Route>(() => parseHash());
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash());
      // Scroll to top on route change so blog post starts at the top.
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
};
