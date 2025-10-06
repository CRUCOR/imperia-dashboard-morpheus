/**
 * Layout Component
 * Main layout with sidebar and content area
 */

import { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      backgroundColor: '#f8fafc',
      overflow: 'hidden'
    }}>
      <Sidebar />
      <main style={{ 
        flex: 1, 
        overflow: 'auto',
        padding: '2rem'
      }}>
        {children}
      </main>
    </div>
  );
}
