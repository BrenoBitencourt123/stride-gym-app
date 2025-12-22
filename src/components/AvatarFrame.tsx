import avatarImg from "@/assets/avatar.png";

interface AvatarFrameProps {
  level: number;
  size?: "sm" | "md" | "lg";
}

const AvatarFrame = ({ level, size = "lg" }: AvatarFrameProps) => {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-28 h-28",
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Wings decoration */}
      <div className="absolute top-1/2 -translate-y-1/2 w-44 h-32 pointer-events-none">
        <svg viewBox="0 0 180 100" className="w-full h-full opacity-40">
          {/* Left wing */}
          <path
            d="M90 50 L60 30 L40 35 L25 25 L20 40 L10 35 L15 50 L10 65 L20 60 L25 75 L40 65 L60 70 Z"
            fill="none"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="1.5"
          />
          {/* Right wing */}
          <path
            d="M90 50 L120 30 L140 35 L155 25 L160 40 L170 35 L165 50 L170 65 L160 60 L155 75 L140 65 L120 70 Z"
            fill="none"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Avatar container with metallic frame */}
      <div className="relative">
        {/* Outer metallic border */}
        <div 
          className={`${sizeClasses[size]} rounded-[2rem] p-1`}
          style={{
            background: 'linear-gradient(135deg, #4a5568 0%, #2d3748 30%, #1a202c 70%, #4a5568 100%)',
          }}
        >
          {/* Inner border */}
          <div 
            className="w-full h-full rounded-[1.75rem] p-0.5"
            style={{
              background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 50%, #2d3748 100%)',
            }}
          >
            {/* Avatar image */}
            <img
              src={avatarImg}
              alt="Avatar"
              className="w-full h-full rounded-[1.5rem] object-cover"
            />
          </div>
        </div>

        {/* Level badge */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-secondary border border-border rounded-lg shadow-lg">
          <span className="text-sm font-bold text-foreground">Lv {level}</span>
        </div>
      </div>
    </div>
  );
};

export default AvatarFrame;
