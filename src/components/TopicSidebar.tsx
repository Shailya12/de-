"use client";

import { useState } from "react";
import { Topic } from "@/data/papers";
import { motion, AnimatePresence } from "framer-motion";

interface TopicSidebarProps {
  topics: Topic[];
  selectedTopicIds: string[];
  onToggleTopic: (id: string) => void;
  totalQuestions: number;
}

export function TopicSidebar({
  topics,
  selectedTopicIds,
  onToggleTopic,
  totalQuestions,
}: TopicSidebarProps) {
  const [expandedIds, setExpandedIds] = useState<string[]>(topics.map((t) => t.id));

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const isSelected = (id: string) => selectedTopicIds.includes(id);

  const parentSelected = (topic: Topic) => {
    if (!topic.subtopics) return isSelected(topic.id);
    return topic.subtopics.some((s) => isSelected(s.id));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Topics
        </h2>
        {selectedTopicIds.length > 0 && (
          <p className="text-xs text-indigo-500 mt-0.5">
            {selectedTopicIds.length} selected · {totalQuestions} questions
          </p>
        )}
      </div>

      {/* Topic list */}
      <div className="flex-1 overflow-y-auto py-2">
        {topics.map((topic) => (
          <div key={topic.id}>
            {/* Parent topic */}
            <div
              className={`group flex items-center gap-2 px-4 py-3 cursor-pointer transition-colors duration-100 ${
                parentSelected(topic)
                  ? "bg-indigo-50"
                  : "hover:bg-zinc-50"
              }`}
              onClick={() => toggleExpand(topic.id)}
            >
              {/* Expand chevron */}
              <motion.svg
                animate={{ rotate: expandedIds.includes(topic.id) ? 90 : 0 }}
                transition={{ duration: 0.15 }}
                className="w-3.5 h-3.5 text-zinc-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </motion.svg>

              <span
                className={`flex-1 text-sm font-medium truncate ${
                  parentSelected(topic) ? "text-indigo-700" : "text-zinc-700"
                }`}
              >
                {topic.name}
              </span>

              {topic.questionCount !== undefined && (
                <span className="text-xs text-zinc-400 tabular-nums shrink-0">
                  {topic.questionCount}
                </span>
              )}
            </div>

            {/* Subtopics */}
            <AnimatePresence initial={false}>
              {expandedIds.includes(topic.id) && topic.subtopics && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {topic.subtopics.map((sub) => (
                    <label
                      key={sub.id}
                      className={`flex items-center gap-2.5 px-4 py-2.5 pl-8 cursor-pointer transition-colors duration-100 ${
                        isSelected(sub.id)
                          ? "bg-indigo-50 text-indigo-700"
                          : "hover:bg-zinc-50 text-zinc-600"
                      }`}
                    >
                      <div
                        onClick={() => onToggleTopic(sub.id)}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-150 shrink-0 ${
                          isSelected(sub.id)
                            ? "bg-indigo-600 border-indigo-600"
                            : "border-zinc-300 hover:border-indigo-400"
                        }`}
                      >
                        {isSelected(sub.id) && (
                          <svg
                            className="w-2.5 h-2.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <span
                        className="flex-1 text-xs font-medium truncate"
                        onClick={() => onToggleTopic(sub.id)}
                      >
                        {sub.name}
                      </span>
                      {sub.questionCount !== undefined && (
                        <span className="text-xs text-zinc-400 tabular-nums shrink-0">
                          {sub.questionCount}
                        </span>
                      )}
                    </label>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
