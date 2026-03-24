/**
 * SpotlightCard — glassmorphism card with mouse-following spotlight.
 *
 * Tracks mouse position via CSS custom properties (--mouse-x, --mouse-y)
 * and renders a radial gradient that follows the cursor. Uses
 * backdrop-filter blur, semi-transparent bg, and layered shadows for
 * the glassmorphism aesthetic.
 */

import { useRef, useCallback } from 'react';
import type { ReactNode, MouseEvent } from 'react';

import './SpotlightCard.css';

interface SpotlightCardProps {
  /** Card content. */
  children: ReactNode;

  /** Additional CSS classes applied to the card container. */
  className?: string;
}

/**
 * SpotlightCard component.
 *
 * Wraps children in a glassmorphism card with a mouse-following
 * radial gradient spotlight effect. The spotlight is subtle — a
 * stream-green glow that appears on hover and tracks the cursor.
 */
export function SpotlightCard({ children, className }: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  }, []);

  return (
    <div
      ref={cardRef}
      className={`spotlight-card ${className ?? ''}`}
      onMouseMove={handleMouseMove}
    >
      {children}
    </div>
  );
}
