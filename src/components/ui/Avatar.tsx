import { useState } from "react";
import { generateInitials } from "@/lib/utils/user-name.util";

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

  const initials = fallback || generateInitials(alt, null);
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
