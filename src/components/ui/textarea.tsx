import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded border-[1.5px] border-line bg-paper2 px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ink disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red aria-invalid:ring-2 aria-invalid:ring-red/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
