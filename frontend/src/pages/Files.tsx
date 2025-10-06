/**
 * Files Page
 * List and manage analyzed files - Light Theme
 */

import { useEffect, useState } from 'react';
import { Eye, RefreshCw, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import apiService from '../services/api.service';
import type { Analysis } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'Pendiente',
    'processing': 'Procesando',
    'completed': 'Completado',
    'failed': 'Fallido'
  };
  return statusMap[status] || status;
};

export default function Files() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      const response = await apiService.listAnalyses(100, 0);
      setAnalyses(response.results);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar archivos');
      console.error('Error loading files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnalysis = (analysisId: string) => {
    // Navigate directly to analysis detail view
    navigate(`/analisis/${analysisId}`);
  };

  if (loading && analyses.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
          Archivos
        </h1>
        <button
          onClick={loadAnalyses}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#ffffff',
            color: '#1e293b',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      {error && (
        <div style={{ 
          backgroundColor: '#fee2e2', 
          border: '1px solid #fecaca', 
          borderRadius: '0.5rem', 
          padding: '1rem', 
          marginBottom: '1.5rem',
          color: '#ef4444'
        }}>
          {error}
        </div>
      )}

      {analyses.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
            <FileText size={48} style={{ margin: '0 auto 1rem' }} />
            <p style={{ fontSize: '1.125rem', fontWeight: '500', margin: '0 0 0.5rem 0' }}>
              No hay archivos analizados
            </p>
            <p style={{ margin: 0 }}>Los archivos analizados aparecerán aquí</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b', fontWeight: '600', fontSize: '0.875rem', borderBottom: '1px solid #e2e8f0' }}>
                    ID
                  </th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b', fontWeight: '600', fontSize: '0.875rem', borderBottom: '1px solid #e2e8f0' }}>
                    Archivo
                  </th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b', fontWeight: '600', fontSize: '0.875rem', borderBottom: '1px solid #e2e8f0' }}>
                    Modelo
                  </th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b', fontWeight: '600', fontSize: '0.875rem', borderBottom: '1px solid #e2e8f0' }}>
                    Estado
                  </th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b', fontWeight: '600', fontSize: '0.875rem', borderBottom: '1px solid #e2e8f0' }}>
                    Tamaño
                  </th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b', fontWeight: '600', fontSize: '0.875rem', borderBottom: '1px solid #e2e8f0' }}>
                    Creado
                  </th>
                  <th style={{ textAlign: 'center', padding: '0.75rem', color: '#64748b', fontWeight: '600', fontSize: '0.875rem', borderBottom: '1px solid #e2e8f0' }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((analysis) => (
                  <tr key={analysis.analysisId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem 0.75rem', color: '#1e293b', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                      {analysis.analysisId.substring(0, 8)}...
                    </td>
                    <td style={{ padding: '1rem 0.75rem', color: '#1e293b', fontSize: '0.875rem' }}>
                      {(analysis.fileMetadata as any)?.file_name || 'N/A'}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', color: '#1e293b', fontSize: '0.875rem' }}>
                      {analysis.modelName}
                    </td>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      <StatusBadge status={analysis.status} label={getStatusLabel(analysis.status)} />
                    </td>
                    <td style={{ padding: '1rem 0.75rem', color: '#64748b', fontSize: '0.875rem' }}>
                      {(analysis.fileMetadata as any)?.file_size_mb
                        ? `${(analysis.fileMetadata as any).file_size_mb.toFixed(2)} MB`
                        : (analysis.fileMetadata as any)?.file_size_bytes
                        ? `${((analysis.fileMetadata as any).file_size_bytes / (1024 * 1024)).toFixed(2)} MB`
                        : 'N/A'
                      }
                    </td>
                    <td style={{ padding: '1rem 0.75rem', color: '#64748b', fontSize: '0.875rem' }}>
                      {analysis.createdAt ? formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true, locale: es }) : 'N/A'}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
                      <button
                        onClick={() => handleViewAnalysis(analysis.analysisId)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          backgroundColor: '#f37726',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}
                      >
                        <Eye size={14} />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
