/**
 * Analysis Detail Page
 * View detailed analysis results - Light Theme
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, FileText, Activity, ArrowLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import apiService from '../services/api.service';
import type { Analysis } from '../types';

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'Pendiente',
    'processing': 'Procesando',
    'completed': 'Completado',
    'failed': 'Fallido'
  };
  return statusMap[status] || status;
};

export default function AnalysisDetail() {
  const { analysisId } = useParams<{ analysisId: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'metrics' | 'params'>('overview');

  useEffect(() => {
    loadAnalysis();
  }, [analysisId]);

  const loadAnalysis = async () => {
    if (!analysisId) return;
    
    try {
      setLoading(true);
      const data = await apiService.getAnalysis(analysisId);
      setAnalysis(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar análisis');
      console.error('Error loading analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div>
        <button
          onClick={() => navigate('/analisis')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#64748b',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            marginBottom: '2rem'
          }}
        >
          <ArrowLeft size={16} />
          Volver a Análisis
        </button>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444' }}>
            <AlertCircle size={24} />
            <div>
              <p style={{ fontWeight: '600', margin: '0 0 0.5rem 0' }}>Error</p>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>{error || 'Análisis no encontrado'}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

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
          onClick={() => navigate('/analisis')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
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
          <ArrowLeft size={16} />
          Volver
        </button>
      </div>

      {/* Metadata Card */}
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>ID de Análisis</p>
            <p style={{ color: '#1e293b', fontWeight: '600', margin: 0, fontFamily: 'monospace', fontSize: '0.875rem' }}>
              {analysis.analysisId}
            </p>
          </div>
          <div>
            <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>Estado</p>
            <StatusBadge status={analysis.status} label={getStatusLabel(analysis.status)} />
          </div>
          <div>
            <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>Modelo</p>
            <p style={{ color: '#1e293b', fontWeight: '600', margin: 0, fontSize: '0.875rem' }}>
              {analysis.result?.model || analysis.modelName}
            </p>
          </div>
          <div>
            <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>Duración</p>
            <p style={{ color: '#1e293b', fontWeight: '600', margin: 0, fontSize: '0.875rem' }}>
              {analysis.durationMs ? `${(analysis.durationMs / 1000).toFixed(2)}s` : 'N/A'}
            </p>
          </div>
          <div>
            <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>Registros</p>
            <p style={{ color: '#1e293b', fontWeight: '600', margin: 0, fontSize: '0.875rem' }}>
              {analysis.result?.num_rows?.toLocaleString() || analysis.inputData?.num_rows?.toLocaleString() || 'N/A'}
            </p>
          </div>
          <div>
            <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>Tasa de Minería</p>
            <p style={{ color: '#1e293b', fontWeight: '600', margin: 0, fontSize: '0.875rem' }}>
              {analysis.result?.statistics?.mining_rate !== undefined 
                ? `${analysis.result.statistics.mining_rate}%` 
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
              {analysis.result?.statistics && (
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: '0 0 1rem 0' }}>
                    Estadísticas del Análisis
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.5rem 0' }}>Total de Paquetes</p>
                      <p style={{ color: '#1e293b', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
                        {analysis.result.statistics.total_packets?.toLocaleString()}
                      </p>
                    </div>
                    <div style={{ padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fecaca' }}>
                      <p style={{ color: '#991b1b', fontSize: '0.75rem', margin: '0 0 0.5rem 0' }}>Minería Detectada</p>
                      <p style={{ color: '#dc2626', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
                        {analysis.result.statistics.mining_detected?.toLocaleString()}
                      </p>
                    </div>
                    <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #bbf7d0' }}>
                      <p style={{ color: '#14532d', fontSize: '0.75rem', margin: '0 0 0.5rem 0' }}>Tráfico Regular</p>
                      <p style={{ color: '#16a34a', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
                        {(analysis.result.statistics.regular_traffic || analysis.result.statistics.benign_traffic)?.toLocaleString()}
                      </p>
                    </div>
                    <div style={{ padding: '1rem', backgroundColor: '#fff7ed', borderRadius: '0.5rem', border: '1px solid #fed7aa' }}>
                      <p style={{ color: '#7c2d12', fontSize: '0.75rem', margin: '0 0 0.5rem 0' }}>Tasa de Minería</p>
                      <p style={{ color: '#ea580c', fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
                        {analysis.result.statistics.mining_rate}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Suspicious IPs */}
              {analysis.result?.statistics?.suspicious_ips && analysis.result.statistics.suspicious_ips.length > 0 && (
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
                        {analysis.result.statistics.suspicious_ips.map((ipInfo: any, idx: number) => (
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
              {analysis.fileMetadata && (
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: '0 0 1rem 0' }}>
                    Información del Archivo
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.25rem 0' }}>Nombre</p>
                      <p style={{ color: '#1e293b', fontWeight: '500', margin: 0, fontSize: '0.875rem' }}>
                        {(analysis.fileMetadata as any).file_name}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.25rem 0' }}>Tamaño</p>
                      <p style={{ color: '#1e293b', fontWeight: '500', margin: 0, fontSize: '0.875rem' }}>
                        {(analysis.fileMetadata as any).file_size_mb?.toFixed(2)} MB
                      </p>
                    </div>
                    <div>
                      <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.25rem 0' }}>Tipo</p>
                      <p style={{ color: '#1e293b', fontWeight: '500', margin: 0, fontSize: '0.875rem' }}>
                        {(analysis.fileMetadata as any).file_type}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.25rem 0' }}>Filas</p>
                      <p style={{ color: '#1e293b', fontWeight: '500', margin: 0, fontSize: '0.875rem' }}>
                        {((analysis.fileMetadata as any).num_rows || analysis.inputData?.num_rows)?.toLocaleString()}
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
              {analysis.result?.predictions && analysis.result.predictions.length > 0 ? (
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
                      {analysis.result.predictions.map((pred: any) => (
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
                              {pred.prediction.is_mining ? 'MINERÍA' : 'REGULAR'}
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
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: '0 0 1.5rem 0' }}>
                Métricas de Rendimiento
              </h3>
              {analysis.metrics ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                  {/* GPU Usage Chart */}
                  {analysis.metrics.gpu_usage && analysis.metrics.gpu_usage.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', margin: '0 0 1rem 0' }}>
                        Uso de GPU durante la Ejecución
                      </h4>
                      <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={analysis.metrics.gpu_usage}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis 
                              dataKey="timestamp" 
                              stroke="#64748b"
                              tick={{ fill: '#64748b', fontSize: 11 }}
                              tickFormatter={(_value, index) => {
                                const totalPoints = analysis.metrics.gpu_usage.length;
                                const interval = Math.ceil(totalPoints / 5);
                                if (index % interval === 0) {
                                  return `${Math.floor((index / totalPoints) * 100)}%`;
                                }
                                return '';
                              }}
                            />
                            <YAxis 
                              stroke="#64748b" 
                              tick={{ fill: '#64748b', fontSize: 12 }}
                              domain={[0, 100]}
                              label={{ 
                                value: 'Porcentaje (%)', 
                                angle: -90, 
                                position: 'insideLeft',
                                style: { fill: '#64748b', fontSize: 12 }
                              }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#ffffff', 
                                border: '1px solid #e2e8f0',
                                borderRadius: '0.5rem',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                padding: '0.75rem'
                              }}
                              labelStyle={{ color: '#1e293b', fontWeight: 'bold', marginBottom: '0.5rem' }}
                              formatter={(value: number) => [`${value.toFixed(2)}%`, 'Uso de GPU']}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="usage" 
                              stroke="#f37726" 
                              strokeWidth={2}
                              name="Uso de GPU"
                              dot={false}
                              isAnimationActive={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                        <div style={{ 
                          marginTop: '1rem', 
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <div style={{ 
                            width: '16px', 
                            height: '3px', 
                            backgroundColor: '#f37726',
                            borderRadius: '2px'
                          }}></div>
                          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                            Uso de GPU
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* GPU Memory Chart */}
                  {analysis.metrics.gpu_memory && analysis.metrics.gpu_memory.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', margin: '0 0 1rem 0' }}>
                        Memoria GPU durante la Ejecución
                      </h4>
                      <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={analysis.metrics.gpu_memory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis 
                              dataKey="timestamp" 
                              stroke="#64748b"
                              tick={{ fill: '#64748b', fontSize: 11 }}
                              tickFormatter={(_value, index) => {
                                const totalPoints = analysis.metrics.gpu_memory.length;
                                const interval = Math.ceil(totalPoints / 5);
                                if (index % interval === 0) {
                                  return `${Math.floor((index / totalPoints) * 100)}%`;
                                }
                                return '';
                              }}
                            />
                            <YAxis 
                              stroke="#64748b" 
                              tick={{ fill: '#64748b', fontSize: 12 }}
                              label={{ 
                                value: 'Memoria (MB)', 
                                angle: -90, 
                                position: 'insideLeft',
                                style: { fill: '#64748b', fontSize: 12 }
                              }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#ffffff', 
                                border: '1px solid #e2e8f0',
                                borderRadius: '0.5rem',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                padding: '0.75rem'
                              }}
                              labelStyle={{ color: '#1e293b', fontWeight: 'bold', marginBottom: '0.5rem' }}
                              formatter={(value: number) => [`${value.toFixed(2)} MB`, 'Memoria GPU']}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="memory" 
                              stroke="#8b5cf6" 
                              strokeWidth={2}
                              name="Memoria GPU"
                              dot={false}
                              isAnimationActive={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                        <div style={{ 
                          marginTop: '1rem', 
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <div style={{ 
                            width: '16px', 
                            height: '3px', 
                            backgroundColor: '#8b5cf6',
                            borderRadius: '2px'
                          }}></div>
                          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                            Memoria GPU
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CPU Usage Chart */}
                  {analysis.metrics.cpu_usage && analysis.metrics.cpu_usage.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', margin: '0 0 1rem 0' }}>
                        Uso de CPU durante la Ejecución
                      </h4>
                      <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={analysis.metrics.cpu_usage}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis 
                              dataKey="timestamp" 
                              stroke="#64748b"
                              tick={{ fill: '#64748b', fontSize: 11 }}
                              tickFormatter={(_value, index) => {
                                const totalPoints = analysis.metrics.cpu_usage.length;
                                const interval = Math.ceil(totalPoints / 5);
                                if (index % interval === 0) {
                                  return `${Math.floor((index / totalPoints) * 100)}%`;
                                }
                                return '';
                              }}
                            />
                            <YAxis 
                              stroke="#64748b" 
                              tick={{ fill: '#64748b', fontSize: 12 }}
                              domain={[0, 100]}
                              label={{ 
                                value: 'Porcentaje (%)', 
                                angle: -90, 
                                position: 'insideLeft',
                                style: { fill: '#64748b', fontSize: 12 }
                              }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#ffffff', 
                                border: '1px solid #e2e8f0',
                                borderRadius: '0.5rem',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                padding: '0.75rem'
                              }}
                              labelStyle={{ color: '#1e293b', fontWeight: 'bold', marginBottom: '0.5rem' }}
                              formatter={(value: number) => [`${value.toFixed(2)}%`, 'Uso de CPU']}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="usage" 
                              stroke="#10b981" 
                              strokeWidth={2}
                              name="Uso de CPU"
                              dot={false}
                              isAnimationActive={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                        <div style={{ 
                          marginTop: '1rem', 
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <div style={{ 
                            width: '16px', 
                            height: '3px', 
                            backgroundColor: '#10b981',
                            borderRadius: '2px'
                          }}></div>
                          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                            Uso de CPU
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* RAM Chart */}
                  {analysis.metrics.ram_mb && analysis.metrics.ram_mb.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', margin: '0 0 1rem 0' }}>
                        Memoria RAM durante la Ejecución
                      </h4>
                      <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={analysis.metrics.ram_mb}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis 
                              dataKey="timestamp" 
                              stroke="#64748b"
                              tick={{ fill: '#64748b', fontSize: 11 }}
                              tickFormatter={(_value, index) => {
                                const totalPoints = analysis.metrics.ram_mb.length;
                                const interval = Math.ceil(totalPoints / 5);
                                if (index % interval === 0) {
                                  return `${Math.floor((index / totalPoints) * 100)}%`;
                                }
                                return '';
                              }}
                            />
                            <YAxis 
                              stroke="#64748b" 
                              tick={{ fill: '#64748b', fontSize: 12 }}
                              label={{ 
                                value: 'Memoria (MB)', 
                                angle: -90, 
                                position: 'insideLeft',
                                style: { fill: '#64748b', fontSize: 12 }
                              }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#ffffff', 
                                border: '1px solid #e2e8f0',
                                borderRadius: '0.5rem',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                padding: '0.75rem'
                              }}
                              labelStyle={{ color: '#1e293b', fontWeight: 'bold', marginBottom: '0.5rem' }}
                              formatter={(value: number) => [`${value.toFixed(2)} MB`, 'Memoria RAM']}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="memory" 
                              stroke="#f59e0b" 
                              strokeWidth={2}
                              name="Memoria RAM"
                              dot={false}
                              isAnimationActive={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                        <div style={{ 
                          marginTop: '1rem', 
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <div style={{ 
                            width: '16px', 
                            height: '3px', 
                            backgroundColor: '#f59e0b',
                            borderRadius: '2px'
                          }}></div>
                          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                            Memoria RAM
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ 
                  padding: '2rem', 
                  textAlign: 'center', 
                  backgroundColor: '#f8fafc', 
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0' 
                }}>
                  <Activity size={48} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
                  <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
                    No hay métricas disponibles para este análisis.
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                    Las métricas se recopilan durante la ejecución del análisis.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'params' && (
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: '0 0 1rem 0' }}>
                Parámetros del Modelo
              </h3>
              {analysis.modelParameters && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  {Object.entries(analysis.modelParameters).map(([key, value]) => (
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
              {analysis.result?.metadata && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', margin: '0 0 1rem 0' }}>
                    Metadata de Ejecución
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                    <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.5rem 0' }}>Tiempo de Procesamiento</p>
                      <p style={{ color: '#1e293b', fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                        {analysis.result.metadata.processing_time_sec}s
                      </p>
                    </div>
                    <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.5rem 0' }}>Throughput</p>
                      <p style={{ color: '#1e293b', fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                        {analysis.result.metadata.throughput_packets_per_sec?.toFixed(2)} pkt/s
                      </p>
                    </div>
                    <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.5rem 0' }}>GPU Utilizado</p>
                      <p style={{ color: '#1e293b', fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                        {analysis.result.metadata.gpu_used ? 'Sí' : 'No'}
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
      {analysis.status === 'failed' && analysis.error && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444', marginTop: '1.5rem' }}>
            <AlertCircle size={24} />
            <div>
              <p style={{ fontWeight: '600', margin: '0 0 0.5rem 0' }}>Error en el Análisis</p>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>{analysis.error}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
