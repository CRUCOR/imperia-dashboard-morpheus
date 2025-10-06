/**
 * StatusBadge Component
 */

interface StatusBadgeProps {
  status: 'healthy' | 'unhealthy' | 'unknown' | 'pending' | 'processing' | 'completed' | 'failed';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getColor = () => {
    switch (status) {
      case 'healthy':
      case 'completed':
        return { bg: '#10b981', text: '#ffffff' };
      case 'unhealthy':
      case 'failed':
        return { bg: '#ef4444', text: '#ffffff' };
      case 'processing':
      case 'pending':
        return { bg: '#f59e0b', text: '#ffffff' };
      default:
        return { bg: '#6b7280', text: '#ffffff' };
    }
  };

  const colors = getColor();

  return (
    <span style={{
      display: 'inline-block',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      backgroundColor: colors.bg,
      color: colors.text,
      textTransform: 'capitalize'
    }}>
      {status}
    </span>
  );
}
