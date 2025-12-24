import avatarImg from "@/assets/avatar.png";
import framePrata from "@/assets/frame_prata.png";

interface AvatarFrameProps {
  level: number;
  size?: "sm" | "md" | "lg";
}

const AvatarFrame = ({ level, size = "lg" }: AvatarFrameProps) => {
  const sizeConfig = {
    sm: { frame: "w-24 h-24", avatar: "w-10 h-10", avatarTop: "top-[22%]", levelBottom: "bottom-[8%]", levelText: "text-[8px]" },
    md: { frame: "w-36 h-36", avatar: "w-16 h-16", avatarTop: "top-[22%]", levelBottom: "bottom-[8%]", levelText: "text-[10px]" },
    lg: { frame: "w-44 h-44", avatar: "w-20 h-20", avatarTop: "top-[22%]", levelBottom: "bottom-[8%]", levelText: "text-xs" },
  };

  const config = sizeConfig[size];

  return (
    <div className="relative flex flex-col items-center">
      <div className={`relative ${config.frame}`}>
        {/* Avatar behind the frame, slightly lower */}
        <div className={`absolute ${config.avatarTop} left-1/2 -translate-x-1/2 translate-y-[3px] ${config.avatar}`}>
          <img
            src={avatarImg}
            alt="Avatar"
            className="w-full h-full rounded-full object-cover"
          />
        </div>
        
        {/* Frame image on top */}
        <img
          src={framePrata}
          alt="Frame"
          className="w-full h-full object-contain pointer-events-none relative z-10"
        />
        
        {/* Level text on the banner */}
        <span className={`absolute ${config.levelBottom} left-1/2 -translate-x-1/2 font-bold text-foreground ${config.levelText} tracking-wide`}>
          Lv {level}
        </span>
      </div>
    </div>
  );
};

export default AvatarFrame;
