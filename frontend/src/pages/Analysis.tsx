/**
 * Analysis Page
 * List analyses and view details - Light Theme
 */

import { useEffect, useState } from 'react';
import { Upload, AlertCircle, Eye, FileText, Activity, RefreshCw, Plus } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'metrics' | 'params'>('overview');

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
    const tabs = [
      { id: 'overview', label: 'Resumen', icon: FileText },
      { id: 'results', label: 'Resultados', icon: Eye },
      { id: 'metrics', label: 'Métricas', icon: Activity },
      { id: 'params', label: 'Parámetros', icon: FileText }
    ];

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
            Detalle del Análisis
          </h1>
          <button
            onClick={() => { setSelectedAnalysis(null); setActiveTab('overview'); }}
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

        {/* Metadata Card */}
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>ID de Análisis</p>
              <p style={{ color: '#1e293b', fontWeight: '600', margin: 0, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                {selectedAnalysis.analysisId}
              </p>
            </div>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>Estado</p>
              <StatusBadge status={selectedAnalysis.status} />
            </div>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>Modelo</p>
              <p style={{ color: '#1e293b', fontWeight: '600', margin: 0, fontSize: '0.875rem' }}>
                {selectedAnalysis.result?.model || selectedAnalysis.modelName}
              </p>
            </div>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>Duración</p>
              <p style={{ color: '#1e293b', fontWeight: '600', margin: 0, fontSize: '0.875rem' }}>
                {selectedAnalysis.durationMs ? `${(selectedAnalysis.durationMs / 1000).toFixed(2)}s` : 'N/A'}
              </p>
            </div>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>Registros</p>
              <p style={{ color: '#1e293b', fontWeight: '600', margin: 0, fontSize: '0.875rem' }}>
                {selectedAnalysis.result?.num_rows?.toLocaleString() || selectedAnalysis.inputData?.num_rows?.toLocaleString() || 'N/A'}
              </p>
            </div>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>Tasa de Minería</p>
              <p style={{ color: '#1e293b', fontWeight: '600', margin: 0, fontSize: '0.875rem' }}>
                {selectedAnalysis.result?.statistics?.mining_rate !== undefined 
                  ? `${selectedAnalysis.result.statistics.mining_rate}%` 
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.25rem',
                      backgroundColor: 'transparent',
                      color: activeTab === tab.id ? '#f37726' : '#64748b',
                      border: 'none',
                      borderBottom: `2px solid ${activeTab === tab.id ? '#f37726' : 'transparent'}`,
                      marginBottom: '-2px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: activeTab === tab.id ? '600' : '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Statistics */}
                {selectedAnalysis.result?.statistics && (
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: '0 0 1rem 0' }}>
                      Estadísticas del Análisis
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                        <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.5rem 0' }}>Total de Paquetes</p>
                        <p style={{ color: '#1e293b', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
                          {selectedAnalysis.result.statistics.total_packets?.toLocaleString()}
                        </p>
                      </div>
                      <div style={{ padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fecaca' }}>
                        <p style={{ color: '#991b1b', fontSize: '0.75rem', margin: '0 0 0.5rem 0' }}>Minería Detectada</p>
                        <p style={{ color: '#dc2626', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
                          {selectedAnalysis.result.statistics.mining_detected?.toLocaleString()}
                        </p>
                      </div>
                      <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
                        <p style={{ color: '#14532d', fontSize: '0.75rem', margin: '0 0 0.5rem 0' }}>Tráfico Benigno</p>
                        <p style={{ color: '#16a34a', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
                          {selectedAnalysis.result.statistics.benign_traffic?.toLocaleString()}
                        </p>
                      </div>
                      <div style={{ padding: '1rem', backgroundColor: '#fff7ed', borderRadius: '0.5rem', border: '1px solid #fed7aa' }}>
                        <p style={{ color: '#7c2d12', fontSize: '0.75rem', margin: '0 0 0.5rem 0' }}>Tasa de Minería</p>
                        <p style={{ color: '#ea580c', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
                          {selectedAnalysis.result.statistics.mining_rate}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Suspicious IPs */}
                {selectedAnalysis.result?.statistics?.suspicious_ips && selectedAnalysis.result.statistics.suspicious_ips.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: '0 0 1rem 0' }}>
                      IPs Sospechosas (Top 10)
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '0.875rem' }}>
                              IP Address
                            </th>
                            <th style={{ padding: '0.75rem', textAlign: 'right', color: '#64748b', fontWeight: '600', fontSize: '0.875rem' }}>
                              Paquetes de Minería
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedAnalysis.result.statistics.suspicious_ips.map((ipInfo: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: '#1e293b', fontSize: '0.875rem' }}>
                                {ipInfo.ip}
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#dc2626', fontSize: '0.875rem' }}>
                                {ipInfo.mining_packets.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* File Metadata */}
                {selectedAnalysis.fileMetadata && (
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: '0 0 1rem 0' }}>
                      Información del Archivo
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <div>
                        <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.25rem 0' }}>Nombre</p>
                        <p style={{ color: '#1e293b', fontWeight: '500', margin: 0, fontSize: '0.875rem' }}>
                          {(selectedAnalysis.fileMetadata as any).file_name}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.25rem 0' }}>Tamaño</p>
                        <p style={{ color: '#1e293b', fontWeight: '500', margin: 0, fontSize: '0.875rem' }}>
                          {(selectedAnalysis.fileMetadata as any).file_size_mb?.toFixed(2)} MB
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.25rem 0' }}>Tipo</p>
                        <p style={{ color: '#1e293b', fontWeight: '500', margin: 0, fontSize: '0.875rem' }}>
                          {(selectedAnalysis.fileMetadata as any).file_type}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.25rem 0' }}>Filas</p>
                        <p style={{ color: '#1e293b', fontWeight: '500', margin: 0, fontSize: '0.875rem' }}>
                          {((selectedAnalysis.fileMetadata as any).num_rows || selectedAnalysis.inputData?.num_rows)?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'results' && (
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: '0 0 1rem 0' }}>
                  Predicciones por Paquete
                </h3>
                {selectedAnalysis.result?.predictions && selectedAnalysis.result.predictions.length > 0 ? (
                  <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
                        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>Row ID</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>Src IP</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', color: '#64748b', fontWeight: '600' }}>Dest IP</th>
                          <th style={{ padding: '0.75rem', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>Dest Port</th>
                          <th style={{ padding: '0.75rem', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>Predicción</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right', color: '#64748b', fontWeight: '600' }}>Confianza</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right', color: '#64748b', fontWeight: '600' }}>Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAnalysis.result.predictions.map((pred: any) => (
                          <tr key={pred.row_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: '#64748b' }}>{pred.row_id}</td>
                            <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: '#1e293b' }}>{pred.packet_info.src_ip}</td>
                            <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: '#1e293b' }}>{pred.packet_info.dest_ip}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'center', fontFamily: 'monospace', color: '#64748b' }}>{pred.packet_info.dest_port}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                backgroundColor: pred.prediction.is_mining ? '#fef2f2' : '#f0fdf4',
                                color: pred.prediction.is_mining ? '#dc2626' : '#16a34a'
                              }}>
                                {pred.prediction.is_mining ? 'MINING' : 'BENIGN'}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>
                              {(pred.prediction.confidence * 100).toFixed(2)}%
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: pred.prediction.anomaly_score > 0.5 ? '#dc2626' : '#16a34a' }}>
                              {pred.prediction.anomaly_score.toFixed(4)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No hay resultados disponibles</p>
                )}
              </div>
            )}

            {activeTab === 'metrics' && (
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: '0 0 1rem 0' }}>
                  Métricas de Rendimiento
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                  Las métricas de GPU y CPU durante la ejecución estarán disponibles próximamente.
                </p>
              </div>
            )}

            {activeTab === 'params' && (
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: '0 0 1rem 0' }}>
                  Parámetros del Modelo
                </h3>
                {selectedAnalysis.modelParameters && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    {Object.entries(selectedAnalysis.modelParameters).map(([key, value]) => (
                      <div key={key} style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                        <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>
                          {key.replace(/_/g, ' ')}
                        </p>
                        <p style={{ color: '#1e293b', fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                          {String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {selectedAnalysis.result?.metadata && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', margin: '0 0 1rem 0' }}>
                      Metadata de Ejecución
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                      <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                        <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.5rem 0' }}>Tiempo de Procesamiento</p>
                        <p style={{ color: '#1e293b', fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                          {selectedAnalysis.result.metadata.processing_time_sec}s
                        </p>
                      </div>
                      <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                        <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.5rem 0' }}>Throughput</p>
                        <p style={{ color: '#1e293b', fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                          {selectedAnalysis.result.metadata.throughput_packets_per_sec?.toFixed(2)} pkt/s
                        </p>
                      </div>
                      <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                        <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.5rem 0' }}>GPU Utilizado</p>
                        <p style={{ color: '#1e293b', fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                          {selectedAnalysis.result.metadata.gpu_used ? 'Sí' : 'No'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

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
                      {analysis.analysisId}
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
