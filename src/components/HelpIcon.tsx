import { HelpCircle } from "lucide-react";
import { useState } from "react";
import { HELP, type HelpEntry } from "@/content/helpContent";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface HelpIconProps {
  helpKey: string;
  size?: number;
  className?: string;
  align?: "start" | "center" | "end";
}

export default function HelpIcon({
  helpKey,
  size = 14,
  className = "",
  align = "center",
}: HelpIconProps) {
  const [open, setOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const isMobile = useIsMobile();

  const entry: HelpEntry | undefined = HELP[helpKey];

  if (!entry) {
    console.warn(`HelpIcon: No content found for key "${helpKey}"`);
    return null;
  }

  const hasExtendedContent = !!(entry.example || (entry.tips && entry.tips.length > 0));

  // Mobile: Dialog / Bottom Sheet
  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex items-center justify-center min-w-[44px] min-h-[44px] -m-3 p-3 text-muted-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
          aria-label={`Ajuda: ${entry.title}`}
        >
          <HelpCircle size={size} />
        </button>

        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setShowMore(false); }}>
          <DialogContent className="max-w-sm mx-4 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg">{entry.title}</DialogTitle>
              <DialogDescription className="text-muted-foreground text-left">
                {entry.body}
              </DialogDescription>
            </DialogHeader>

            {/* Extended content */}
            {(showMore || !hasExtendedContent) && entry.example && (
              <div className="mt-2 p-3 rounded-lg bg-secondary/50 border border-border">
                <p className="text-sm text-foreground">
                  <span className="font-medium">Exemplo: </span>
                  {entry.example}
                </p>
              </div>
            )}

            {(showMore || !hasExtendedContent) && entry.tips && entry.tips.length > 0 && (
              <ul className="mt-2 space-y-1">
                {entry.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Show more button */}
            {hasExtendedContent && !showMore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMore(true)}
                className="mt-2 text-primary hover:text-primary/80"
              >
                Saiba mais
              </Button>
            )}

            {/* Close button */}
            <Button
              onClick={() => { setOpen(false); setShowMore(false); }}
              className="mt-4 w-full"
            >
              Entendi
            </Button>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Desktop: Tooltip with optional click for more
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`inline-flex items-center justify-center p-1 text-muted-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
            aria-label={`Ajuda: ${entry.title}`}
          >
            <HelpCircle size={size} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          align={align}
          className="max-w-xs p-3"
        >
          <p className="font-medium text-sm mb-1">{entry.title}</p>
          <p className="text-xs text-muted-foreground">{entry.body}</p>
          {hasExtendedContent && (
            <p className="text-xs text-primary mt-2">Clique para saber mais</p>
          )}
        </TooltipContent>
      </Tooltip>

      {/* Desktop dialog for extended content */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setShowMore(false); }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">{entry.title}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-left">
              {entry.body}
            </DialogDescription>
          </DialogHeader>

          {entry.example && (
            <div className="mt-2 p-3 rounded-lg bg-secondary/50 border border-border">
              <p className="text-sm text-foreground">
                <span className="font-medium">Exemplo: </span>
                {entry.example}
              </p>
            </div>
          )}

          {entry.tips && entry.tips.length > 0 && (
            <ul className="mt-2 space-y-1">
              {entry.tips.map((tip, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          )}

          <Button
            onClick={() => setOpen(false)}
            className="mt-4 w-full"
          >
            Entendi
          </Button>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
