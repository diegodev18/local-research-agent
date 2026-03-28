import type { Components } from "react-markdown"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

const markdownComponents: Components = {
  p: ({ className, ...props }) => (
    <p className={cn("mb-2 last:mb-0", className)} {...props} />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn("my-2 list-disc pl-4 [li]:my-0.5", className)}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn("my-2 list-decimal pl-4 [li]:my-0.5", className)}
      {...props}
    />
  ),
  li: ({ className, ...props }) => (
    <li className={cn("text-foreground", className)} {...props} />
  ),
  h1: ({ className, ...props }) => (
    <h1
      className={cn("mt-3 mb-2 font-heading text-sm font-semibold first:mt-0", className)}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn("mt-3 mb-2 font-heading text-sm font-semibold first:mt-0", className)}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn("mt-2 mb-1 font-heading text-xs font-semibold first:mt-0", className)}
      {...props}
    />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "my-2 border-l-2 border-border pl-3 text-muted-foreground italic",
        className,
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("my-3 border-border", className)} {...props} />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn(
        "text-primary underline underline-offset-2 hover:text-primary/80",
        className,
      )}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  table: ({ className, ...props }) => (
    <div className="my-2 overflow-x-auto border border-border">
      <table className={cn("w-full border-collapse text-left text-xs", className)} {...props} />
    </div>
  ),
  thead: ({ className, ...props }) => (
    <thead className={cn("border-b border-border bg-muted/50", className)} {...props} />
  ),
  th: ({ className, ...props }) => (
    <th className={cn("border-border px-2 py-1.5 font-medium", className)} {...props} />
  ),
  td: ({ className, ...props }) => (
    <td className={cn("border-t border-border px-2 py-1.5", className)} {...props} />
  ),
  tr: ({ className, ...props }) => (
    <tr className={cn("border-border", className)} {...props} />
  ),
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "my-2 overflow-x-auto border border-border bg-muted p-2 font-mono text-[0.8rem] leading-relaxed",
        "[&_code]:p-0 [&_code]:bg-transparent [&_code]:text-inherit",
        className,
      )}
      {...props}
    />
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = /language-/.test(className ?? "")
    if (isBlock) {
      return (
        <code className={cn("block font-mono text-inherit", className)} {...props}>
          {children}
        </code>
      )
    }
    return (
      <code
        className={cn(
          "rounded-none bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </code>
    )
  },
  strong: ({ className, ...props }) => (
    <strong className={cn("font-semibold text-foreground", className)} {...props} />
  ),
  em: ({ className, ...props }) => (
    <em className={cn("italic", className)} {...props} />
  ),
}

type ChatMessageMarkdownProps = {
  children: string
  className?: string
}

export function ChatMessageMarkdown({
  children,
  className,
}: ChatMessageMarkdownProps) {
  return (
    <div
      className={cn(
        "min-w-0 text-xs leading-relaxed text-foreground [&_p]:text-foreground",
        className,
      )}
    >
      <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {children}
      </Markdown>
    </div>
  )
}
