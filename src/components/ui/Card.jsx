/**
 * components/ui/Card.jsx
 */
import React from 'react';

const Card = ({ children, className = '', hover = false, padding = true, ...props }) => (
  <div
    className={[
      'rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]',
      'transition-shadow duration-200',
      hover ? 'hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.4)] cursor-pointer' : '',
      padding ? 'p-5' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...props}
  >
    {children}
  </div>
);

export default Card;
