/**
 * Card Component
 * Reusable card container
 */

import { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  style?: CSSProperties;
}

export default function Card({ children, title, style }: CardProps) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '0.75rem',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      ...style
    }}>
      {title && (
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#1e293b'
          }}>
            {title}
          </h3>
        </div>
      )}
      <div style={{ padding: title ? '1.5rem' : '1.25rem' }}>
        {children}
      </div>
    </div>
  );
}
