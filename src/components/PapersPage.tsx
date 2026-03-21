"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { mathSubject, Paper, Question } from "@/data/papers";
import { TopicSidebar } from "./TopicSidebar";
import { QuestionCard } from "./QuestionCard";

type SortOrder = "newest" | "oldest";
type SeasonFilter = "all" | "May/June" | "Oct/Nov" | "Feb/Mar";

interface FilteredQuestion {
  question: Question;
  paper: Paper;
  paperLabel: string;
}

function getPaperLabel(paper: Paper) {
  return `${paper.year} ${paper.season} · P${paper.paperNumber}/${paper.variant}`;
}

export function PapersPage() {
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>("all");
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  const toggleTopic = useCallback((id: string) => {
    setSelectedTopicIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      // Re-trigger animations when selection changes
      setAnimationKey((k) => k + 1);
      return next;
    });
  }, []);

  const filteredQuestions = useMemo<FilteredQuestion[]>(() => {
    let papers = mathSubject.papers;

    // Season filter
    if (seasonFilter !== "all") {
      papers = papers.filter((p) => p.season === seasonFilter);
    }

    // Sort
    papers = [...papers].sort((a, b) =>
      sortOrder === "newest" ? b.year - a.year : a.year - b.year
    );

    const results: FilteredQuestion[] = [];

    for (const paper of papers) {
      // If no topics selected, show all
      const topicMatch =
        selectedTopicIds.length === 0 ||
        paper.topicIds.some((tid) => selectedTopicIds.includes(tid));

      if (topicMatch) {
        for (const question of paper.questions) {
          results.push({
            question,
            paper,
            paperLabel: getPaperLabel(paper),
          });
        }
      }
    }

    return results;
  }, [selectedTopicIds, sortOrder, seasonFilter]);

  const clearFilters = () => {
    setSelectedTopicIds([]);
    setSeasonFilter("all");
    setAnimationKey((k) => k + 1);
  };

  const seasons: SeasonFilter[] = ["all", "May/June", "Oct/Nov", "Feb/Mar"];

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {/* Top nav */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-zinc-200">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="p-2 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-500"
              title="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-bold text-zinc-900">Past Papers</span>
                <span className="hidden sm:inline text-xs text-zinc-400 ml-1.5">Cambridge IGCSE Mathematics · 0580</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Animation toggle */}
            <button
              onClick={() => {
                setAnimationEnabled((v) => !v);
                setAnimationKey((k) => k + 1);
              }}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-all duration-150 ${
                animationEnabled
                  ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                  : "bg-zinc-50 text-zinc-500 border-zinc-200"
              }`}
              title="Toggle typewriter animation"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              {animationEnabled ? "Typewriter On" : "Typewriter Off"}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto flex">
        {/* Desktop sidebar (inline, pushes content) */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="hidden lg:block sticky top-14 h-[calc(100vh-3.5rem)] overflow-hidden border-r border-zinc-200 bg-white shrink-0"
            >
              <TopicSidebar
                topics={mathSubject.topics}
                selectedTopicIds={selectedTopicIds}
                onToggleTopic={toggleTopic}
                totalQuestions={filteredQuestions.length}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Mobile sidebar (overlay drawer) */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="lg:hidden fixed inset-0 z-20 bg-black/30"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="lg:hidden fixed top-14 left-0 bottom-0 z-30 w-[280px] overflow-hidden border-r border-zinc-200 bg-white"
              >
                <TopicSidebar
                  topics={mathSubject.topics}
                  selectedTopicIds={selectedTopicIds}
                  onToggleTopic={toggleTopic}
                  totalQuestions={filteredQuestions.length}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6">
          {/* Filters bar */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {/* Season pills */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-white border border-zinc-200 rounded-xl">
              {seasons.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSeasonFilter(s);
                    setAnimationKey((k) => k + 1);
                  }}
                  className={`text-xs font-medium px-3 py-2 rounded-lg transition-all duration-150 ${
                    seasonFilter === s
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1 p-1 bg-white border border-zinc-200 rounded-xl">
              {(["newest", "oldest"] as SortOrder[]).map((o) => (
                <button
                  key={o}
                  onClick={() => {
                    setSortOrder(o);
                    setAnimationKey((k) => k + 1);
                  }}
                  className={`text-xs font-medium px-3 py-2 rounded-lg transition-all duration-150 ${
                    sortOrder === o
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {o === "newest" ? "Newest" : "Oldest"}
                </button>
              ))}
            </div>

            {/* Active topic tags */}
            {selectedTopicIds.length > 0 && (
              <>
                {selectedTopicIds.slice(0, 3).map((id) => {
                  const name =
                    mathSubject.topics
                      .flatMap((t) => [t, ...(t.subtopics ?? [])])
                      .find((t) => t.id === id)?.name ?? id;
                  return (
                    <button
                      key={id}
                      onClick={() => toggleTopic(id)}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      {name}
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  );
                })}
                {selectedTopicIds.length > 3 && (
                  <span className="text-xs text-zinc-400">
                    +{selectedTopicIds.length - 3} more
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="text-xs text-zinc-400 hover:text-zinc-600 underline underline-offset-2"
                >
                  Clear all
                </button>
              </>
            )}
          </div>

          {/* Result count */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-sm font-semibold text-zinc-500">
              {filteredQuestions.length === 0
                ? "No questions found"
                : `${filteredQuestions.length} question${filteredQuestions.length === 1 ? "" : "s"}`}
              {selectedTopicIds.length > 0 && (
                <span className="text-indigo-500"> in selected topics</span>
              )}
            </h1>
            <span className="text-xs text-zinc-400 hidden sm:block">
              Click question text to skip animation
            </span>
          </div>

          {/* Questions grid */}
          {filteredQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-zinc-600">No questions found</p>
              <p className="text-xs text-zinc-400 mt-1">Try selecting different topics or changing the season filter</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-xs font-medium text-indigo-600 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div
              key={animationKey}
              className="grid grid-cols-1 lg:grid-cols-2 gap-4"
            >
              {filteredQuestions.map(({ question, paperLabel }, i) => (
                <QuestionCard
                  key={`${animationKey}-${question.id}`}
                  question={question}
                  paperLabel={paperLabel}
                  animationEnabled={animationEnabled}
                  animationDelay={animationEnabled ? i * 120 : 0}
                  index={i}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
