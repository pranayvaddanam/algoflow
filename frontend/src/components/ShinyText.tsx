/**
 * ShinyText — shimmer gradient text animation.
 *
 * Renders children inside a span with a sweeping gradient that uses
 * background-clip: text for a metallic shimmer effect. The gradient
 * alternates between white and stream-green (#5dcaa5).
 *
 * Use sparingly — only on 2-3 key text elements for visual impact.
 */

import type { ReactNode } from 'react';

import './ShinyText.css';

interface ShinyTextProps {
  /** Text content to shimmer. */
  children: ReactNode;

  /** Additional CSS classes. */
  className?: string;

  /** Animation duration in seconds (default 5). */
  speed?: number;
}

/**
 * ShinyText component.
 *
 * Applies a shimmer gradient animation to its children via
 * background-clip: text. The speed prop controls the animation
 * duration via a CSS custom property.
 */
export function ShinyText({ children, className, speed = 5 }: ShinyTextProps) {
  return (
    <span
      className={`shiny-text ${className ?? ''}`}
      style={{ '--shimmer-speed': `${speed}s` } as React.CSSProperties}
    >
      {children}
    </span>
  );
}
