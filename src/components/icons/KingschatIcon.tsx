import React from 'react';

interface KingschatIconProps {
  className?: string;
  size?: number;
}

export const KingschatIcon: React.FC<KingschatIconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Crown on top of chat bubble */}
      <path
        d="M6 8L8 4L12 7L16 4L18 8H6Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Chat bubble */}
      <path
        d="M4 10C4 9.44772 4.44772 9 5 9H19C19.5523 9 20 9.44772 20 10V17C20 17.5523 19.5523 18 19 18H13L9 21V18H5C4.44772 18 4 17.5523 4 17V10Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Chat dots */}
      <circle cx="8" cy="13.5" r="1" fill="white" />
      <circle cx="12" cy="13.5" r="1" fill="white" />
      <circle cx="16" cy="13.5" r="1" fill="white" />
    </svg>
  );
};

export default KingschatIcon;
