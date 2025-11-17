import { useState } from "react";

export interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fallback?: string;
  className?: string;
}

const sizeClasses = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-12 h-12 text-base",
  lg: "w-16 h-16 text-lg",
  xl: "w-24 h-24 text-2xl",
};

/**
 * Avatar component for displaying user avatars with fallback to initials
 * Follows DaisyUI avatar patterns with automatic fallback handling
 */
export const Avatar = ({ src, alt, size = "md", fallback, className = "" }: AvatarProps) => {
  const [imageError, setImageError] = useState(false);

  // Generate initials from alt text (usually display_name or email)
  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const initials = fallback || getInitials(alt);
  const shouldShowImage = src && !imageError;

  return (
    <div className={`avatar ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full ${!shouldShowImage ? "bg-primary text-primary-content" : ""}`}>
        {shouldShowImage ? (
          <img src={src} alt={alt} onError={() => setImageError(true)} />
        ) : (
          <span className="flex items-center justify-center font-semibold">{initials}</span>
        )}
      </div>
    </div>
  );
};
