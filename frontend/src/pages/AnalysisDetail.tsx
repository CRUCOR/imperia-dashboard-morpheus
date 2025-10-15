/**
 * Analysis Detail Page - Universal support for 6 models
 * Shows ALL results in table format
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

  // Render model-specific statistics
  const renderStatistics = () => {
    if (!analysis || !analysis.result) return null;
    const stats = analysis.result.statistics as any;
    if (!stats) return null;

    return (
      <Card title="Estadísticas del Análisis">
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

  // Render results based on model type - SHOWS ALL RESULTS
  const renderResults = () => {
    if (!analysis || !analysis.result) return <p style={{ color: '#64748b' }}>No hay resultados disponibles</p>;
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
      const colors: Record<string, string> = {
        critical: '#fee2e2',
        high: '#fed7aa',
        medium: '#fef3c7',
        low: '#dbeafe'
      };
      return colors[severity] || '#f1f5f9';
    };

    const getSeverityTextColor = (severity: string) => {
      const colors: Record<string, string> = {
        critical: '#991b1b',
        high: '#9a3412',
        medium: '#92400e',
        low: '#1e40af'
      };
      return colors[severity] || '#475569';
    };

    return (
      <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Row ID</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Tipo</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Contenido</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Severidad</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Confianza</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Campo</th>
            </tr>
          </thead>
          <tbody>
            {findings.slice(0, 200).map((finding, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: finding.severity === 'critical' || finding.severity === 'high' ? '#fef2f2' : 'transparent' }}>
                <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>{finding.row_id}</td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                    {finding.type.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {finding.content}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    backgroundColor: getSeverityColor(finding.severity), 
                    color: getSeverityTextColor(finding.severity), 
                    borderRadius: '0.25rem', 
                    fontSize: '0.75rem', 
                    fontWeight: '600' 
                  }}>
                    {finding.severity.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>
                  {(finding.confidence * 100).toFixed(1)}%
                </td>
                <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>
                  {finding.location?.field || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {findings.length > 200 && <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#64748b', textAlign: 'center' }}>Mostrando 200 de {findings.length} hallazgos</p>}
      </div>
    );
  };

  const renderCryptominingResults = (predictions: any[]) => {
    return (
      <div>
        <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Row ID</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>IP Origen</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>IP Destino</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Puerto</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Clasificación</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Probabilidad</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Confianza</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Anomalía</th>
              </tr>
            </thead>
            <tbody>
              {predictions.slice(0, 200).map((pred, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: pred.prediction?.is_mining ? '#fef2f2' : 'transparent' }}>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>{pred.row_id}</td>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>{pred.packet_info?.src_ip || 'N/A'}</td>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>{pred.packet_info?.dest_ip || 'N/A'}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.75rem' }}>{pred.packet_info?.dest_port || 'N/A'}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: pred.prediction?.is_mining ? '#fee2e2' : '#f0fdf4',
                      color: pred.prediction?.is_mining ? '#991b1b' : '#14532d',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {pred.prediction?.is_mining ? 'MINERÍA' : 'NORMAL'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>
                    {((pred.prediction?.mining_probability || 0) * 100).toFixed(2)}%
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#64748b' }}>
                    {((pred.prediction?.confidence || 0) * 100).toFixed(2)}%
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: (pred.prediction?.anomaly_score || 0) > 0.5 ? '#dc2626' : '#16a34a' }}>
                    {(pred.prediction?.anomaly_score || 0).toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {predictions.length > 200 && <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#64748b', textAlign: 'center' }}>Mostrando 200 de {predictions.length} paquetes</p>}
      </div>
    );
  };

  const renderPhishingResults = (detections: any[]) => {
    return (
      <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Row ID</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Fuente</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Clasificación</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Probabilidad</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Indicadores</th>
            </tr>
          </thead>
          <tbody>
            {detections.slice(0, 200).map((det, idx) => {
              const isPhishing = det.is_phishing || det.phishing_probability > 0.5;
              return (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isPhishing ? '#fef2f2' : 'transparent' }}>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>{det.row_id}</td>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {det.source?.url || det.source?.email || det.source?.subject || 'N/A'}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      backgroundColor: isPhishing ? '#fee2e2' : '#f0fdf4', 
                      color: isPhishing ? '#991b1b' : '#14532d', 
                      borderRadius: '0.25rem', 
                      fontSize: '0.75rem', 
                      fontWeight: '600' 
                    }}>
                      {isPhishing ? 'PHISHING' : 'LEGÍTIMO'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>
                    {(det.phishing_probability * 100).toFixed(1)}%
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
                    {det.indicators && det.indicators.length > 0 
                      ? det.indicators.slice(0, 2).map((ind: any) => ind.type).join(', ')
                      : 'N/A'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {detections.length > 200 && <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#64748b', textAlign: 'center' }}>Mostrando 200 de {detections.length} registros</p>}
      </div>
    );
  };

  const renderFraudResults = (transactions: any[]) => {
    const getRiskBgColor = (level: string) => {
      const colors: Record<string, string> = {
        critical: '#fee2e2',
        high: '#fed7aa',
        medium: '#fef3c7',
        low: '#dbeafe'
      };
      return colors[level] || '#f1f5f9';
    };

    const getRiskTextColor = (level: string) => {
      const colors: Record<string, string> = {
        critical: '#991b1b',
        high: '#9a3412',
        medium: '#92400e',
        low: '#1e40af'
      };
      return colors[level] || '#475569';
    };

    return (
      <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>TX ID</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Clasificación</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Riesgo</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Probabilidad</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Monto</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Usuario</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Anomalías</th>
            </tr>
          </thead>
          <tbody>
            {transactions.slice(0, 200).map((tx, idx) => {
              const isFraud = tx.is_fraudulent || tx.fraud_probability > 0.5;
              return (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isFraud ? '#fef2f2' : 'transparent' }}>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>{tx.transaction_id}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      backgroundColor: isFraud ? '#fee2e2' : '#f0fdf4', 
                      color: isFraud ? '#991b1b' : '#14532d', 
                      borderRadius: '0.25rem', 
                      fontSize: '0.75rem', 
                      fontWeight: '600' 
                    }}>
                      {isFraud ? 'FRAUDE' : 'LEGÍTIMA'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      backgroundColor: getRiskBgColor(tx.risk_level), 
                      color: getRiskTextColor(tx.risk_level), 
                      borderRadius: '0.25rem', 
                      fontSize: '0.75rem', 
                      fontWeight: '600' 
                    }}>
                      {tx.risk_level.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>
                    {(tx.fraud_probability * 100).toFixed(1)}%
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>
                    ${tx.transaction_data?.amount?.toLocaleString() || 'N/A'}
                  </td>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>
                    {tx.transaction_data?.user_id || 'N/A'}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
                    {tx.anomalies && tx.anomalies.length > 0 
                      ? `${tx.anomalies.length} detectadas`
                      : 'Ninguna'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {transactions.length > 200 && <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#64748b', textAlign: 'center' }}>Mostrando 200 de {transactions.length} transacciones</p>}
      </div>
    );
  };

  const renderRansomwareResults = (threats: any[]) => {
    const getThreatBgColor = (level: string) => {
      const colors: Record<string, string> = {
        critical: '#fee2e2',
        high: '#fed7aa',
        medium: '#fef3c7',
        low: '#dbeafe'
      };
      return colors[level] || '#f1f5f9';
    };

    const getThreatTextColor = (level: string) => {
      const colors: Record<string, string> = {
        critical: '#991b1b',
        high: '#9a3412',
        medium: '#92400e',
        low: '#1e40af'
      };
      return colors[level] || '#475569';
    };

    return (
      <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 }}>
            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Row ID</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Archivo</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Clasificación</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Amenaza</th>
              <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#475569' }}>Probabilidad</th>
              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#475569' }}>Cifrado</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Indicadores</th>
            </tr>
          </thead>
          <tbody>
            {threats.slice(0, 200).map((threat, idx) => {
              const isRansomware = threat.is_ransomware || threat.ransomware_probability > 0.5;
              return (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isRansomware ? '#fef2f2' : 'transparent' }}>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>{threat.row_id}</td>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {threat.file_info?.path || threat.file_info?.name || 'N/A'}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      backgroundColor: isRansomware ? '#fee2e2' : '#f0fdf4', 
                      color: isRansomware ? '#991b1b' : '#14532d', 
                      borderRadius: '0.25rem', 
                      fontSize: '0.75rem', 
                      fontWeight: '600' 
                    }}>
                      {isRansomware ? 'RANSOMWARE' : 'LIMPIO'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      backgroundColor: getThreatBgColor(threat.threat_level), 
                      color: getThreatTextColor(threat.threat_level), 
                      borderRadius: '0.25rem', 
                      fontSize: '0.75rem', 
                      fontWeight: '600' 
                    }}>
                      {threat.threat_level.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>
                    {(threat.ransomware_probability * 100).toFixed(1)}%
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    {threat.file_info?.is_encrypted ? (
                      <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '600' }}>
                        SÍ
                      </span>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '0.75rem' }}>NO</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
                    {threat.indicators && threat.indicators.length > 0 
                      ? `${threat.indicators.filter((i: any) => i.matched).length} detectados`
                      : 'Ninguno'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {threats.length > 200 && <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#64748b', textAlign: 'center' }}>Mostrando 200 de {threats.length} amenazas</p>}
      </div>
    );
  };

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: FileText },
    { id: 'results', label: 'Resultados', icon: Eye },
    { id: 'metrics', label: 'Métricas', icon: Activity },
    { id: 'params', label: 'Parámetros', icon: FileText },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444' }}>
          <AlertCircle size={24} />
          <div>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>Error</h3>
            <p style={{ margin: '0.25rem 0 0', color: '#64748b' }}>{error || 'Análisis no encontrado'}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => navigate('/analisis')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          backgroundColor: 'transparent',
          color: '#64748b',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.875rem',
          marginBottom: '1.5rem',
          transition: 'color 0.2s'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#f37726')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
      >
        <ArrowLeft size={16} />
        Volver a Análisis
      </button>

      {/* Header Card */}
      <Card>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>
                Análisis #{analysis.analysisId?.slice(0, 8)}
              </h2>
              <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.875rem' }}>
                Creado: {new Date(analysis.createdAt).toLocaleString('es-ES')}
              </p>
            </div>
            <StatusBadge status={analysis.status} />
          </div>
        </div>

        {/* Summary Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
          <div>
            <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>Archivo</p>
            <p style={{ color: '#1e293b', fontWeight: '600', margin: 0, fontSize: '0.875rem' }}>
              {analysis.fileMetadata?.file_name || 'N/A'}
            </p>
          </div>
          <div>
            <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>Tamaño</p>
            <p style={{ color: '#1e293b', fontWeight: '600', margin: 0, fontSize: '0.875rem' }}>
              {analysis.result?.metadata?.file_size_mb?.toFixed(2) || 'N/A'} MB
            </p>
          </div>
          <div>
            <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>Registros</p>
            <p style={{ color: '#1e293b', fontWeight: '600', margin: 0, fontSize: '0.875rem' }}>
              {analysis.result?.num_rows?.toLocaleString() || analysis.inputData?.num_rows?.toLocaleString() || 'N/A'}
            </p>
          </div>
          <div>
            <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.25rem 0', textTransform: 'uppercase' }}>Modelo</p>
            <p style={{ color: '#1e293b', fontWeight: '600', margin: 0, fontSize: '0.875rem' }}>
              {analysis.modelName.replace(/-/g, ' ').toUpperCase()}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: '2px solid #e2e8f0', marginTop: '1.5rem' }}>
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
        <div style={{ marginTop: '1.5rem' }}>
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {renderStatistics()}
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
                        Uso de GPU
                      </h4>
                      <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={analysis.metrics.gpu_usage}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                            <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} />
                            <Tooltip />
                            <Line type="monotone" dataKey="usage" stroke="#f37726" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* CPU Usage Chart */}
                  {analysis.metrics.cpu_usage && analysis.metrics.cpu_usage.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', margin: '0 0 1rem 0' }}>
                        Uso de CPU
                      </h4>
                      <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={analysis.metrics.cpu_usage}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                            <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} />
                            <Tooltip />
                            <Line type="monotone" dataKey="usage" stroke="#3b82f6" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ color: '#64748b' }}>No hay métricas disponibles</p>
              )}

              {/* Metadata */}
              {analysis.result?.metadata && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', margin: '0 0 1rem 0' }}>
                    Información de Procesamiento
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.5rem 0' }}>Tiempo de Procesamiento</p>
                      <p style={{ color: '#1e293b', fontSize: '1.125rem', fontWeight: '600', margin: 0 }}>
                        {analysis.result.metadata.processing_time_sec}s
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

          {activeTab === 'params' && (
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', margin: '0 0 1rem 0' }}>
                Parámetros del Modelo
              </h3>
              {analysis.modelParameters && Object.keys(analysis.modelParameters).length > 0 ? (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {Object.entries(analysis.modelParameters).map(([key, value]) => (
                    <div key={key} style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '1rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontWeight: '600', color: '#475569', textTransform: 'capitalize' }}>
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span style={{ color: '#1e293b', fontSize: '0.875rem' }}>
                        {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#64748b' }}>No hay parámetros del modelo disponibles</p>
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
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>Error de Análisis</h3>
              <p style={{ margin: '0.25rem 0 0', color: '#64748b' }}>{analysis.error}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
