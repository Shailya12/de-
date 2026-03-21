"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Question } from "@/data/papers";
import { TypewriterText } from "./TypewriterText";

interface QuestionCardProps {
  question: Question;
  paperLabel: string;
  animationEnabled: boolean;
  animationDelay?: number;
  index: number;
}

export function QuestionCard({
  question,
  paperLabel,
  animationEnabled,
  animationDelay = 0,
  index,
}: QuestionCardProps) {
  const [showMarkScheme, setShowMarkScheme] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), animationDelay);
    return () => clearTimeout(t);
  }, [animationDelay]);

  const marksColor =
    question.marks <= 2
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : question.marks <= 4
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-rose-100 text-rose-700 border-rose-200";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="group relative bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:border-zinc-300 hover:shadow-md transition-all duration-200"
        >
          {/* Top stripe */}
          <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          <div className="p-5 sm:p-6">
            {/* Header row */}
            <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-sm shrink-0">
                  {question.number}
                </div>
                <span className="text-xs font-medium text-zinc-400 bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded-full truncate max-w-[180px]">
                  {paperLabel}
                </span>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${marksColor} shrink-0`}
              >
                {question.marks} {question.marks === 1 ? "mark" : "marks"}
              </span>
            </div>

            {/* Question image */}
            {question.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={question.imageUrl}
                alt={`Question ${question.number}`}
                className="w-full rounded-xl mb-4 border border-zinc-100 bg-zinc-50 object-contain max-h-72"
              />
            )}

            {/* Question text */}
            {question.text && (
              <div className="text-zinc-800 text-[15px] leading-relaxed font-medium mb-4">
                <TypewriterText
                  text={question.text}
                  speed={12}
                  startDelay={0}
                  enabled={animationEnabled}
                />
              </div>
            )}

            {/* Subparts */}
            {question.subparts && question.subparts.length > 0 && (
              <div className="space-y-2 mb-4 pl-4 border-l-2 border-indigo-100">
                {question.subparts.map((sp) => (
                  <div key={sp.label} className="flex gap-3">
                    <span className="text-xs font-bold text-indigo-500 mt-0.5 shrink-0 w-5">
                      ({sp.label})
                    </span>
                    <div>
                      <span className="text-sm text-zinc-600">{sp.text}</span>
                      <span className="ml-2 text-xs text-zinc-400">
                        [{sp.marks} {sp.marks === 1 ? "mark" : "marks"}]
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
              <button
                onClick={() => setShowMarkScheme((v) => !v)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-all duration-150 ${
                  showMarkScheme
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-50 text-zinc-500 hover:bg-indigo-50 hover:text-indigo-600 border border-zinc-200 hover:border-indigo-200"
                }`}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={
                      showMarkScheme
                        ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    }
                  />
                </svg>
                {showMarkScheme ? "Hide" : "Mark Scheme"}
              </button>

              <span className="text-xs text-zinc-400">Q{question.number}</span>
            </div>

            {/* Mark scheme panel */}
            <AnimatePresence>
              {showMarkScheme && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <p className="text-xs font-semibold text-indigo-500 mb-2 uppercase tracking-wide">
                      Mark Scheme
                    </p>
                    <div className="text-sm text-indigo-900 font-mono whitespace-pre-wrap leading-relaxed">
                      {question.markScheme ||
                        question.subparts
                          ?.map((sp) => `(${sp.label}) ${sp.answer}`)
                          .join("\n") ||
                        "Mark scheme not available."}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
