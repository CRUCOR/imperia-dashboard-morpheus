/**
 * Sidebar Component
 * Navigation sidebar with menu items
 */

import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, FolderOpen } from 'lucide-react';

export default function Sidebar() {
  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/analysis', icon: Activity, label: 'Análisis' },
    { path: '/files', icon: FolderOpen, label: 'Archivos' },
  ];

  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 0',
      boxShadow: '2px 0 10px rgba(0,0,0,0.05)'
    }}>
      {/* Logo */}
      <div style={{
        padding: '0 1.5rem',
        marginBottom: '2rem'
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#f37726',
          margin: 0
        }}>
          Imperia
        </h1>
        <p style={{
          fontSize: '0.875rem',
          color: '#64748b',
          margin: '0.25rem 0 0 0'
        }}>
          Morpheus Dashboard
        </p>
      </div>

      {/* Menu Items */}
      <nav style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        padding: '0 1rem'
      }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              color: isActive ? '#f37726' : '#64748b',
              backgroundColor: isActive ? '#fff7ed' : 'transparent',
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: isActive ? '600' : '500',
              transition: 'all 0.2s',
              border: isActive ? '1px solid #fed7aa' : '1px solid transparent',
            })}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '1rem 1.5rem',
        borderTop: '1px solid #e2e8f0',
        fontSize: '0.75rem',
        color: '#94a3b8',
        textAlign: 'center'
      }}>
        v1.0.0
      </div>
    </aside>
  );
}
