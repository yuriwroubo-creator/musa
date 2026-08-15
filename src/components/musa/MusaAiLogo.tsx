export function MusaAiLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle with gradient */}
      <defs>
        <linearGradient id="musaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF2D78" />
          <stop offset="100%" stopColor="#FF5BA3" />
        </linearGradient>
        <linearGradient id="shimmerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Main elegant flower/star shape */}
      <circle cx="32" cy="32" r="28" fill="url(#musaGradient)" />
      
      {/* Shimmer effect */}
      <circle cx="32" cy="32" r="28" fill="url(#shimmerGradient)" />
      
      {/* Stylized M letter in the center */}
      <path
        d="M24 20 L24 44 M24 20 L32 20 L32 32 M32 20 L40 20 L40 32 M32 32 L32 44 M24 32 L40 32"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Elegant decorative elements */}
      <circle cx="20" cy="22" r="2" fill="white" fillOpacity="0.6" />
      <circle cx="44" cy="22" r="2" fill="white" fillOpacity="0.6" />
      <circle cx="24" cy="42" r="1.5" fill="white" fillOpacity="0.4" />
      <circle cx="40" cy="42" r="1.5" fill="white" fillOpacity="0.4" />
      
      {/* Sparkle accents */}
      <path
        d="M16 16 L18 14 L20 16 L18 18 Z"
        fill="white"
        fillOpacity="0.8"
      />
      <path
        d="M44 48 L46 46 L48 48 L46 50 Z"
        fill="white"
        fillOpacity="0.8"
      />
    </svg>
  );
}
