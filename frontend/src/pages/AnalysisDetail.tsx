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

  // Render model-specific statistics
  const renderStatistics = () => {
    if (!analysis.result) return null;
    const stats = analysis.result.statistics as any;
    if (!stats) return null;

    return (
      <Card title="📊 Estadísticas del Análisis">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {Object.entries(stats).map(([key, value]) => {
            if (typeof value === 'object' || Array.isArray(value)) return null;
            return (
              <div key={key}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  {key.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
                  {typeof value === 'number' ? value.toLocaleString() : String(value)}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  // Render results based on model type
  const renderResults = () => {
    if (!analysis.result) return <p style={{ color: '#64748b' }}>No hay resultados disponibles</p>;
    const result = analysis.result as any;

    // Detect which type of results we have
    if (result.fingerprints && result.fingerprints.length > 0) {
      return renderFingerprintResults(result.fingerprints);
    }
    if (result.findings && result.findings.length > 0) {
      return renderSensitiveInfoResults(result.findings);
    }
    if (result.predictions && result.predictions.length > 0) {
      return renderCryptominingResults(result.predictions);
    }
    if (result.detections && result.detections.length > 0) {
      return renderPhishingResults(result.detections);
    }
    if (result.transactions && result.transactions.length > 0) {
      return renderFraudResults(result.transactions);
    }
    if (result.threats && result.threats.length > 0) {
      return renderRansomwareResults(result.threats);
    }

    return <p style={{ color: '#64748b' }}>No hay resultados detallados disponibles</p>;
  };

  const renderFingerprintResults = (fingerprints: any[]) => (
    <div style={{ overflowX: 'auto' }}>
      <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>🔐 Huellas Digitales ({fingerprints.length})</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Archivo/Ruta</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Algoritmo</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Hash</th>
            <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Tamaño</th>
          </tr>
        </thead>
        <tbody>
          {fingerprints.slice(0, 100).map((fp, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>{fp.file_path || `Row ${idx}`}</td>
              <td style={{ padding: '0.75rem' }}>
                <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                  {fp.algorithm}
                </span>
              </td>
              <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.7rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {fp.hash}
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#64748b' }}>{(fp.size_bytes / 1024).toFixed(2)} KB</td>
            </tr>
          ))}
        </tbody>
      </table>
      {fingerprints.length > 100 && (
        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#64748b', textAlign: 'center' }}>
          Mostrando 100 de {fingerprints.length} huellas
        </p>
      )}
    </div>
  );

  const renderSensitiveInfoResults = (findings: any[]) => {
    const getSeverityColor = (severity: string) => {
      const colors: Record<string, { bg: string; text: string }> = {
        critical: { bg: '#fee2e2', text: '#991b1b' },
        high: { bg: '#fed7aa', text: '#9a3412' },
        medium: { bg: '#fef3c7', text: '#92400e' },
        low: { bg: '#dbeafe', text: '#1e40af' }
      };
      return colors[severity] || { bg: '#f1f5f9', text: '#475569' };
    };

    return (
      <div>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>🔍 Información Confidencial Detectada ({findings.length})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {findings.slice(0, 50).map((finding, idx) => {
            const colors = getSeverityColor(finding.severity);
            return (
              <div key={idx} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', backgroundColor: '#fafafa' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: '600', color: '#1e293b' }}>Fila #{finding.row_id}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                      {finding.type.toUpperCase()}
                    </span>
                    <span style={{ padding: '0.25rem 0.5rem', backgroundColor: colors.bg, color: colors.text, borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '600' }}>
                      {finding.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '0.875rem', fontFamily: 'monospace', padding: '0.5rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.25rem', marginBottom: '0.5rem' }}>
                  {finding.content}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Confianza: {(finding.confidence * 100).toFixed(1)}%
                  {finding.location?.field && ` | Campo: ${finding.location.field}`}
                </div>
              </div>
            );
          })}
        </div>
        {findings.length > 50 && <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#64748b', textAlign: 'center' }}>Mostrando 50 de {findings.length} hallazgos</p>}
      </div>
    );
  };

  const renderCryptominingResults = (predictions: any[]) => {
    const miningPredictions = predictions.filter((p: any) => p.prediction?.is_mining);
    return (
      <div>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>⛏️ Detecciones de Criptominería ({miningPredictions.length}/{predictions.length})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {miningPredictions.slice(0, 50).map((pred, idx) => (
            <div key={idx} style={{ padding: '1rem', border: '1px solid #fee2e2', borderRadius: '0.5rem', backgroundColor: '#fef2f2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: '600', color: '#1e293b' }}>Paquete #{pred.row_id}</span>
                <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '600' }}>
                  MINING
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                <div><span style={{ color: '#64748b' }}>Probabilidad: </span><span style={{ fontWeight: '600' }}>{(pred.prediction.mining_probability * 100).toFixed(2)}%</span></div>
                <div><span style={{ color: '#64748b' }}>Confianza: </span><span style={{ fontWeight: '600' }}>{(pred.prediction.confidence * 100).toFixed(2)}%</span></div>
                <div><span style={{ color: '#64748b' }}>Anomalía: </span><span style={{ fontWeight: '600' }}>{pred.prediction.anomaly_score?.toFixed(2)}</span></div>
              </div>
              {pred.packet_info && (
                <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#475569', padding: '0.5rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }}>
                  {pred.packet_info.src_ip}:{pred.packet_info.src_port} → {pred.packet_info.dest_ip}:{pred.packet_info.dest_port}
                </div>
              )}
            </div>
          ))}
        </div>
        {miningPredictions.length > 50 && <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#64748b', textAlign: 'center' }}>Mostrando 50 de {miningPredictions.length}</p>}
      </div>
    );
  };

  const renderPhishingResults = (detections: any[]) => {
    const phishingDetections = detections.filter((d: any) => d.is_phishing);
    return (
      <div>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>🎣 Detecciones de Phishing ({phishingDetections.length}/{detections.length})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {phishingDetections.slice(0, 50).map((det, idx) => (
            <div key={idx} style={{ padding: '1rem', border: '1px solid #fee2e2', borderRadius: '0.5rem', backgroundColor: '#fef2f2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: '600', color: '#1e293b' }}>Fila #{det.row_id}</span>
                <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '600' }}>
                  {(det.phishing_probability * 100).toFixed(1)}% PHISHING
                </span>
              </div>
              {det.source && (
                <div style={{ fontSize: '0.875rem', fontFamily: 'monospace', padding: '0.5rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.25rem', marginBottom: '0.75rem', wordBreak: 'break-all' }}>
                  {det.source.url || det.source.email || det.source.subject || 'N/A'}
                </div>
              )}
              {det.indicators && det.indicators.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {det.indicators.slice(0, 3).map((ind: any, i: number) => (
                    <div key={i} style={{ fontSize: '0.75rem', padding: '0.5rem', backgroundColor: 'white', borderLeft: '3px solid #f59e0b', paddingLeft: '0.75rem' }}>
                      <span style={{ fontWeight: '600', color: '#92400e' }}>[{ind.type}]</span> {ind.description}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {phishingDetections.length > 50 && <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#64748b', textAlign: 'center' }}>Mostrando 50 de {phishingDetections.length}</p>}
      </div>
    );
  };

  const renderFraudResults = (transactions: any[]) => {
    const fraudulent = transactions.filter((t: any) => t.is_fraudulent);
    const getRiskColor = (level: string) => {
      const colors: Record<string, { bg: string; text: string }> = {
        critical: { bg: '#fee2e2', text: '#991b1b' },
        high: { bg: '#fed7aa', text: '#9a3412' },
        medium: { bg: '#fef3c7', text: '#92400e' },
        low: { bg: '#dbeafe', text: '#1e40af' }
      };
      return colors[level] || { bg: '#f1f5f9', text: '#475569' };
    };

    return (
      <div>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>💰 Transacciones Fraudulentas ({fraudulent.length}/{transactions.length})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {fraudulent.slice(0, 50).map((tx, idx) => {
            const colors = getRiskColor(tx.risk_level);
            return (
              <div key={idx} style={{ padding: '1rem', border: '1px solid #fee2e2', borderRadius: '0.5rem', backgroundColor: '#fef2f2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.875rem' }}>TX: {tx.transaction_id}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ padding: '0.25rem 0.5rem', backgroundColor: colors.bg, color: colors.text, borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '600' }}>
                      {tx.risk_level.toUpperCase()}
                    </span>
                    <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                      {(tx.fraud_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                {tx.transaction_data && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                    {tx.transaction_data.amount && <div><span style={{ color: '#64748b' }}>Monto: </span><span style={{ fontWeight: '600' }}>${tx.transaction_data.amount.toLocaleString()}</span></div>}
                    {tx.transaction_data.user_id && <div><span style={{ color: '#64748b' }}>Usuario: </span><span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{tx.transaction_data.user_id}</span></div>}
                  </div>
                )}
                {tx.anomalies && tx.anomalies.length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {tx.anomalies.slice(0, 3).map((a: any, i: number) => (
                      <div key={i}>• {a.description}</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {fraudulent.length > 50 && <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#64748b', textAlign: 'center' }}>Mostrando 50 de {fraudulent.length}</p>}
      </div>
    );
  };

  const renderRansomwareResults = (threats: any[]) => {
    const ransomware = threats.filter((t: any) => t.is_ransomware);
    const getThreatColor = (level: string) => {
      const colors: Record<string, { bg: string; text: string }> = {
        critical: { bg: '#fee2e2', text: '#991b1b' },
        high: { bg: '#fed7aa', text: '#9a3412' },
        medium: { bg: '#fef3c7', text: '#92400e' },
        low: { bg: '#dbeafe', text: '#1e40af' }
      };
      return colors[level] || { bg: '#f1f5f9', text: '#475569' };
    };

    return (
      <div>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>🦠 Amenazas de Ransomware ({ransomware.length}/{threats.length})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {ransomware.slice(0, 50).map((threat, idx) => {
            const colors = getThreatColor(threat.threat_level);
            return (
              <div key={idx} style={{ padding: '1rem', border: '1px solid #fee2e2', borderRadius: '0.5rem', backgroundColor: '#fef2f2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: '600', color: '#1e293b' }}>Fila #{threat.row_id}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ padding: '0.25rem 0.5rem', backgroundColor: colors.bg, color: colors.text, borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '600' }}>
                      {threat.threat_level.toUpperCase()}
                    </span>
                    <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                      {(threat.ransomware_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                {threat.file_info && (
                  <div style={{ fontSize: '0.875rem', fontFamily: 'monospace', padding: '0.5rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.25rem', marginBottom: '0.75rem' }}>
                    {threat.file_info.path || threat.file_info.name}
                    {threat.file_info.is_encrypted && (
                      <span style={{ marginLeft: '0.5rem', padding: '0.125rem 0.375rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                        ENCRYPTED
                      </span>
                    )}
                  </div>
                )}
                {threat.indicators && threat.indicators.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {threat.indicators.filter((i: any) => i.matched).slice(0, 4).map((ind: any, i: number) => (
                      <span key={i} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                        {ind.type}: {ind.description}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {ransomware.length > 50 && <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#64748b', textAlign: 'center' }}>Mostrando 50 de {ransomware.length}</p>}
      </div>
    );
  };

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
            <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>Tasa de Detección</p>
            <p style={{ color: '#1e293b', fontWeight: '600', margin: 0, fontSize: '0.875rem' }}>
              {analysis.result && (analysis.result.statistics as any)?.mining_rate !== undefined 
                ? `${(analysis.result.statistics as any).mining_rate}%` 
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
              {renderStatistics()}

              {/* Suspicious IPs - only for cryptomining */}
              {analysis.result && (analysis.result as any).statistics?.suspicious_ips && (analysis.result as any).statistics.suspicious_ips.length > 0 && (
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
                        {(analysis.result.statistics as any).suspicious_ips.map((ipInfo: any, idx: number) => (
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
                Resultados del Análisis
              </h3>
              {renderResults()}
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
                                const totalPoints = analysis.metrics?.gpu_usage?.length || 1;
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
                                const totalPoints = analysis.metrics?.gpu_memory?.length || 1;
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
                                const totalPoints = analysis.metrics?.cpu_usage?.length || 1;
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
                                const totalPoints = analysis.metrics?.ram_mb?.length || 1;
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
                        {(analysis.result.metadata as any).throughput_packets_per_sec?.toFixed(2) || 'N/A'} {(analysis.result.metadata as any).throughput_packets_per_sec ? 'pkt/s' : ''}
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
