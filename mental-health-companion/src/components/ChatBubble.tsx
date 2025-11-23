"use client";

import clsx from "clsx";
import { motion } from "framer-motion";

type ChatBubbleProps = {
  role: "user" | "assistant" | "system";
  content: string;
  meta?: string;
};

export const ChatBubble = ({ role, content, meta }: ChatBubbleProps) => {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={clsx("flex w-full flex-col gap-2 text-sm sm:text-base", {
        "items-end": isUser,
        "items-start": !isUser,
      })}
    >
      <div
        className={clsx(
          "max-w-lg whitespace-pre-line rounded-2xl px-4 py-3 shadow-sm ring-1 ring-black/5",
          {
            "bg-gradient-to-br from-sky-600 via-sky-500 to-sky-400 text-white":
              !isUser,
            "bg-white text-slate-900": isUser,
          },
        )}
      >
        {content}
      </div>
      {meta ? (
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {meta}
        </span>
      ) : null}
    </motion.div>
  );
};
