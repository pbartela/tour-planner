import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

interface AuthHeaderProps extends ComponentProps<"div"> {
  title: string;
  description: string;
}

export function AuthHeader({ title, description, className, ...props }: AuthHeaderProps) {
  return (
    <div className={cn("flex flex-col items-center", className)} {...props}>
      <div className="mb-8 flex items-center justify-center rounded-full bg-primary/20 p-4">
        <span className="material-symbols-outlined text-4xl text-primary">travel_explore</span>
      </div>
      <h1 className="px-4 pb-3 pt-6 text-center text-4.5xl font-bold leading-tight tracking-light text-foreground">
        {title}
      </h1>
      <p className="px-4 pb-3 pt-1 text-center text-base font-normal leading-normal text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
