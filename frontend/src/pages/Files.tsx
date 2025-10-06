/**
 * Files Page
 * List and manage analyzed files - Light Theme
 */

import { useEffect, useState } from 'react';
import { Trash2, Download, RefreshCw, FileText } from 'lucide-react';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import apiService from '../services/api.service';
import type { Analysis } from '../types';
import { formatDistanceToNow } from 'date-fns';

export default function Files() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este análisis?')) {
      return;
    }

    try {
      setDeleting(id);
      await apiService.deleteAnalysis(id);
      setAnalyses(analyses.filter((a) => a.analysisId !== id));
    } catch (err) {
      alert('Error al eliminar: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (analysis: Analysis) => {
    const dataStr = JSON.stringify(analysis, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis-${analysis.analysisId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error && analyses.length === 0) {
    return (
      <div>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#1e293b',
          marginBottom: '2rem'
        }}>
          Archivos
        </h1>
        <div style={{ color: '#ef4444', textAlign: 'center', padding: '2rem', backgroundColor: '#fee2e2', borderRadius: '0.5rem', border: '1px solid #fecaca' }}>
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#1e293b',
          margin: 0
        }}>
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
            backgroundColor: '#f37726',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <RefreshCw size={18} />
          Actualizar
        </button>
      </div>

      <Card>
        {analyses.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#64748b'
          }}>
            <FileText size={64} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
            <p style={{ fontSize: '1.125rem', margin: 0, color: '#475569' }}>
              No hay archivos analizados
            </p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Sube archivos en la sección de Análisis
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    color: '#475569',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    ID
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    color: '#475569',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    Modelo
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    color: '#475569',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    Estado
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    color: '#475569',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    Creado
                  </th>
                  <th style={{
                    padding: '1rem',
                    textAlign: 'right',
                    color: '#475569',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((analysis) => (
                  <tr
                    key={analysis.analysisId}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <td style={{
                      padding: '1rem',
                      color: '#64748b',
                      fontSize: '0.875rem',
                      fontFamily: 'monospace'
                    }}>
                      {analysis.analysisId.substring(0, 8)}...
                    </td>
                    <td style={{
                      padding: '1rem',
                      color: '#1e293b',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      {analysis.modelName}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <StatusBadge status={analysis.status} />
                    </td>
                    <td style={{
                      padding: '1rem',
                      color: '#64748b',
                      fontSize: '0.875rem'
                    }}>
                      {formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}
                    </td>
                    <td style={{
                      padding: '1rem',
                      textAlign: 'right'
                    }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleDownload(analysis)}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: 'transparent',
                            color: '#10b981',
                            border: '1px solid #10b981',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Descargar"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(analysis.analysisId)}
                          disabled={deleting === analysis.analysisId}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: 'transparent',
                            color: deleting === analysis.analysisId ? '#94a3b8' : '#ef4444',
                            border: `1px solid ${deleting === analysis.analysisId ? '#94a3b8' : '#ef4444'}`,
                            borderRadius: '0.375rem',
                            cursor: deleting === analysis.analysisId ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
