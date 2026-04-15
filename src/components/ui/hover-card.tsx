import * as React from "react"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"

import { cn } from "@/lib/utils"

function getSafeAreaCollisionPadding() {
  const style = getComputedStyle(document.documentElement);
  const top = parseInt(style.getPropertyValue('--sat') || '0', 10) || 0;
  const bottom = parseInt(style.getPropertyValue('--sab') || '0', 10) || 0;
  return { top: top + 60, bottom: bottom + 80, left: 16, right: 16 };
}

const HoverCard = HoverCardPrimitive.Root

const HoverCardTrigger = HoverCardPrimitive.Trigger

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => {
  const padding = React.useMemo(() => getSafeAreaCollisionPadding(), []);
  return (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    collisionPadding={padding}
    className={cn(
      "z-[200] w-64 rounded-md border border-border/40 bg-popover/95 backdrop-blur-sm p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 duration-200",
      className
    )}
    {...props}
  />
  );
})
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName

export { HoverCard, HoverCardTrigger, HoverCardContent }
