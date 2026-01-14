import { ReactNode } from "react";
import { EloTier, getEloFrameStyles } from "@/lib/arena/eloUtils";
import { cn } from "@/lib/utils";

interface EloFrameProps {
  tier: EloTier;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const EloFrame = ({ tier, children, className, size = "md" }: EloFrameProps) => {
  const styles = getEloFrameStyles(tier);
  
  const sizeClasses = {
    sm: "p-0.5",
    md: "p-1",
    lg: "p-1.5",
  };

  return (
    <div 
      className={cn(
        "relative rounded-xl overflow-hidden",
        sizeClasses[size],
        className
      )}
      style={{
        background: styles.gradient,
        boxShadow: styles.shadow,
      }}
    >
      <div className="relative rounded-lg overflow-hidden bg-card">
        {children}
      </div>
      {/* Corner accents for higher tiers */}
      {["diamond", "master", "grandmaster", "challenger"].includes(tier) && (
        <>
          <div 
            className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 rounded-tl-xl"
            style={{ borderColor: styles.borderColor }}
          />
          <div 
            className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 rounded-tr-xl"
            style={{ borderColor: styles.borderColor }}
          />
          <div 
            className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 rounded-bl-xl"
            style={{ borderColor: styles.borderColor }}
          />
          <div 
            className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 rounded-br-xl"
            style={{ borderColor: styles.borderColor }}
          />
        </>
      )}
    </div>
  );
};

export default EloFrame;
