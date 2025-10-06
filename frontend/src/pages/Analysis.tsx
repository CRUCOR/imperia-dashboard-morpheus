/**
 * Analysis Page
 * List analyses and view details - Light Theme
 */

import { useEffect, useState } from 'react';
import { Plus, Eye, RefreshCw, FileText, AlertCircle } from 'lucide-react';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import apiService from '../services/api.service';
import socketService from '../services/socket.service';
import type { Analysis, AnalysisProgress } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AnalysisPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [showNewAnalysisForm, setShowNewAnalysisForm] = useState(false);

  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    model_name: 'morpheus-abp',
    pipeline_batch_size: '256',
    model_max_batch_size: '32',
    num_threads: '4'
  });

  useEffect(() => {
    loadAnalyses();
    socketService.connect();

    const handleProgress = (data: AnalysisProgress) => {
      // Update analysis status in real-time
      setAnalyses(prev => prev.map(a => 
        a.analysisId === data.analysisId 
          ? { ...a, status: data.status as Analysis['status'] }
          : a
      ));
    };

    const handleComplete = () => {
      loadAnalyses();
    };

    const handleError = () => {
      loadAnalyses();
    };

    // Subscribe to events if socket service supports it
    // socketService.on('analysis:progress', handleProgress);
    // socketService.on('analysis:complete', handleComplete);
    // socketService.on('analysis:error', handleError);

    return () => {
      // socketService.off('analysis:progress', handleProgress);
      // socketService.off('analysis:complete', handleComplete);
      // socketService.off('analysis:error', handleError);
    };
  }, []);

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      const response = await apiService.listAnalyses(100, 0);
      setAnalyses(response.results);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar análisis');
      console.error('Error loading analyses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Por favor selecciona un archivo');
      return;
    }

    try {
      setUploading(true);
      await apiService.uploadFile(file, formData);
      
      // Reset form
      setFile(null);
      setShowNewAnalysisForm(false);
      setFormData({
        model_name: 'morpheus-abp',
        pipeline_batch_size: '256',
        model_max_batch_size: '32',
        num_threads: '4'
      });
      
      // Reload analyses
      await loadAnalyses();
    } catch (err) {
      alert('Error al crear análisis: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setUploading(false);
    }
  };

  const handleViewDetails = async (analysis: Analysis) => {
    try {
      const details = await apiService.getAnalysis(analysis.analysisId);
      setSelectedAnalysis(details);
    } catch (err) {
      alert('Error al cargar detalles: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  if (loading && analyses.length === 0) {
    return <LoadingSpinner />;
  }

  // Show new analysis form
  if (showNewAnalysisForm) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            Nuevo Análisis
          </h1>
          <button
            onClick={() => setShowNewAnalysisForm(false)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#64748b',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Cancelar
          </button>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* File Upload */}
              <div>
                <label style={{ display: 'block', color: '#1e293b', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Archivo *
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".csv,.json,.jsonlines,.parquet"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
                {file && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                    Archivo seleccionado: {file.name}
                  </p>
                )}
              </div>

              {/* Model Selection */}
              <div>
                <label style={{ display: 'block', color: '#1e293b', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Modelo
                </label>
                <select
                  value={formData.model_name}
                  onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="morpheus-abp">Anomalous Behavior Profiling (ABP)</option>
                </select>
                <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                  Modelo para detección de comportamiento anómalo
                </p>
              </div>

              {/* Configuration Parameters */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1rem' 
              }}>
                <div>
                  <label style={{ display: 'block', color: '#1e293b', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Pipeline Batch Size
                  </label>
                  <input
                    type="number"
                    value={formData.pipeline_batch_size}
                    onChange={(e) => setFormData({ ...formData, pipeline_batch_size: e.target.value })}
                    min="1"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#1e293b', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Model Max Batch Size
                  </label>
                  <input
                    type="number"
                    value={formData.model_max_batch_size}
                    onChange={(e) => setFormData({ ...formData, model_max_batch_size: e.target.value })}
                    min="1"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#1e293b', fontWeight: '500', marginBottom: '0.5rem' }}>
                    Number of Threads
                  </label>
                  <input
                    type="number"
                    value={formData.num_threads}
                    onChange={(e) => setFormData({ ...formData, num_threads: e.target.value })}
                    min="1"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploading || !file}
                style={{
                  padding: '0.875rem',
                  backgroundColor: uploading || !file ? '#cbd5e1' : '#f37726',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: uploading || !file ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'background-color 0.2s'
                }}
              >
                {uploading ? 'Creando análisis...' : 'Crear Análisis'}
              </button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  // Show analysis details
  if (selectedAnalysis) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            Detalle del Análisis
          </h1>
          <button
            onClick={() => setSelectedAnalysis(null)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#64748b',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Volver
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Metadata Card */}
          <Card title="Información General">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>ID de Análisis</p>
                <p style={{ color: '#1e293b', fontWeight: '500', margin: 0, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {selectedAnalysis.analysisId}
                </p>
              </div>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>Estado</p>
                <StatusBadge status={selectedAnalysis.status} />
              </div>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>Modelo</p>
                <p style={{ color: '#1e293b', fontWeight: '500', margin: 0 }}>{selectedAnalysis.modelName}</p>
              </div>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>Creado</p>
                <p style={{ color: '#1e293b', fontWeight: '500', margin: 0 }}>
                  {formatDistanceToNow(new Date(selectedAnalysis.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          </Card>

          {/* Results Card */}
          {selectedAnalysis.status === 'completed' && selectedAnalysis.result && (
            <Card title="Resultados">
              <div style={{ 
                backgroundColor: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                borderRadius: '0.5rem', 
                padding: '1rem',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                <pre style={{ 
                  margin: 0, 
                  fontSize: '0.875rem', 
                  color: '#1e293b',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {JSON.stringify(selectedAnalysis.result, null, 2)}
                </pre>
              </div>
            </Card>
          )}

          {/* Error Card */}
          {selectedAnalysis.status === 'failed' && selectedAnalysis.error && (
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444' }}>
                <AlertCircle size={24} />
                <div>
                  <p style={{ fontWeight: '600', margin: '0 0 0.5rem 0' }}>Error en el Análisis</p>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>{selectedAnalysis.error}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Show analyses list
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
          Análisis
        </h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
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
          <button
            onClick={() => setShowNewAnalysisForm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f37726',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            <Plus size={16} />
            Nuevo Análisis
          </button>
        </div>
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
              No hay análisis
            </p>
            <p style={{ margin: '0 0 1.5rem 0' }}>Crea tu primer análisis para comenzar</p>
            <button
              onClick={() => setShowNewAnalysisForm(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f37726',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              <Plus size={16} />
              Nuevo Análisis
            </button>
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
                    Modelo
                  </th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: '#64748b', fontWeight: '600', fontSize: '0.875rem', borderBottom: '1px solid #e2e8f0' }}>
                    Estado
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
                      {analysis.modelName}
                    </td>
                    <td style={{ padding: '1rem 0.75rem' }}>
                      <StatusBadge status={analysis.status} />
                    </td>
                    <td style={{ padding: '1rem 0.75rem', color: '#64748b', fontSize: '0.875rem' }}>
                      {analysis.createdAt ? formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true, locale: es }) : 'N/A'}
                    </td>
                    <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>
                      <button
                        onClick={() => handleViewDetails(analysis)}
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
