/**
 * Analysis Page
 * List analyses and create new ones - Light Theme
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, RefreshCw, Plus, FileText } from 'lucide-react';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import apiService from '../services/api.service';
import socketService from '../services/socket.service';
import type { Analysis, AnalysisProgress, ModelType } from '../types';
import { MODEL_NAMES, MODEL_DESCRIPTIONS } from '../types';
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

export default function AnalysisPage() {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewAnalysisForm, setShowNewAnalysisForm] = useState(false);

  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>('cryptomining');
  
  // Model-specific parameters
  const [cryptominingParams, setCryptominingParams] = useState({
    pipeline_batch_size: '256',
    model_max_batch_size: '32',
    num_threads: '4'
  });
  
  const [fingerprintParams, setFingerprintParams] = useState({
    algorithm: 'sha256',
    include_metadata: true
  });
  
  const [sensitiveInfoParams, setSensitiveInfoParams] = useState({
    scan_pii: true,
    scan_credentials: true,
    scan_api_keys: true,
    confidence_threshold: '0.7'
  });
  
  const [phishingParams, setPhishingParams] = useState({
    check_urls: true,
    check_emails: true,
    analyze_content: true
  });
  
  const [fraudParams, setFraudParams] = useState({
    transaction_threshold: '1000',
    risk_level: 'medium'
  });
  
  const [ransomwareParams, setRansomwareParams] = useState({
    scan_encrypted_files: true,
    check_extensions: true,
    analyze_behavior: true
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
      
      // Build form data with model-specific parameters
      const formData: any = { model_name: selectedModel };
      
      switch (selectedModel) {
        case 'cryptomining':
          Object.assign(formData, cryptominingParams);
          break;
        case 'digital-fingerprint':
          Object.assign(formData, fingerprintParams);
          break;
        case 'sensitive-info':
          Object.assign(formData, sensitiveInfoParams);
          break;
        case 'phishing':
          Object.assign(formData, phishingParams);
          break;
        case 'fraud-detection':
          Object.assign(formData, fraudParams);
          break;
        case 'ransomware':
          Object.assign(formData, ransomwareParams);
          break;
      }
      
      await apiService.uploadFile(file, formData);
      
      // Reset form
      setFile(null);
      setShowNewAnalysisForm(false);

      // Reload analyses
      await loadAnalyses();
    } catch (err) {
      alert(`Error al crear análisis: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleViewDetails = (analysis: Analysis) => {
    navigate(`/analisis/${analysis.analysisId}`);
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

        <Card title="Configurar Análisis">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* File Input */}
              <div>
                <label style={{ display: 'block', color: '#1e293b', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  Archivo de Datos *
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".jsonlines,.jsonl,.ndjson,.json"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s'
                  }}
                />
                {file && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#10b981', fontWeight: '500' }}>
                    ✓ {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
                <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                  Formatos soportados: .jsonlines, .jsonl, .ndjson
                </p>
              </div>

              {/* Model Selection */}
              <div>
                <label style={{ display: 'block', color: '#1e293b', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  Modelo de Análisis *
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as ModelType)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="cryptomining">⛏️ {MODEL_NAMES['cryptomining']}</option>
                  <option value="digital-fingerprint">🔐 {MODEL_NAMES['digital-fingerprint']}</option>
                  <option value="sensitive-info">🔍 {MODEL_NAMES['sensitive-info']}</option>
                  <option value="phishing">🎣 {MODEL_NAMES['phishing']}</option>
                  <option value="fraud-detection">💰 {MODEL_NAMES['fraud-detection']}</option>
                  <option value="ransomware">🦠 {MODEL_NAMES['ransomware']}</option>
                </select>
                <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b', lineHeight: '1.5' }}>
                  {MODEL_DESCRIPTIONS[selectedModel]}
                </p>
              </div>

              {/* Model-specific Parameters */}
              <div style={{ 
                backgroundColor: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                borderRadius: '0.5rem', 
                padding: '1.5rem' 
              }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1rem', fontWeight: '600' }}>
                  Parámetros del Modelo
                </h3>

                {/* Cryptomining Parameters */}
                {selectedModel === 'cryptomining' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', color: '#475569', fontWeight: '500', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        Pipeline Batch Size
                      </label>
                      <input
                        type="number"
                        value={cryptominingParams.pipeline_batch_size}
                        onChange={(e) => setCryptominingParams({ ...cryptominingParams, pipeline_batch_size: e.target.value })}
                        min="1"
                        max="1024"
                        style={{
                          width: '100%',
                          padding: '0.625rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                      <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#64748b' }}>
                        Tamaño de lote para pipeline
                      </p>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', fontWeight: '500', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        Model Max Batch Size
                      </label>
                      <input
                        type="number"
                        value={cryptominingParams.model_max_batch_size}
                        onChange={(e) => setCryptominingParams({ ...cryptominingParams, model_max_batch_size: e.target.value })}
                        min="1"
                        max="256"
                        style={{
                          width: '100%',
                          padding: '0.625rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                      <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#64748b' }}>
                        Tamaño máximo de lote del modelo
                      </p>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', fontWeight: '500', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        Number of Threads
                      </label>
                      <input
                        type="number"
                        value={cryptominingParams.num_threads}
                        onChange={(e) => setCryptominingParams({ ...cryptominingParams, num_threads: e.target.value })}
                        min="1"
                        max="32"
                        style={{
                          width: '100%',
                          padding: '0.625rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                      <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#64748b' }}>
                        Número de hilos de procesamiento
                      </p>
                    </div>
                  </div>
                )}

                {/* Digital Fingerprint Parameters */}
                {selectedModel === 'digital-fingerprint' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', color: '#475569', fontWeight: '500', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        Algoritmo de Hash
                      </label>
                      <select
                        value={fingerprintParams.algorithm}
                        onChange={(e) => setFingerprintParams({ ...fingerprintParams, algorithm: e.target.value as any })}
                        style={{
                          width: '100%',
                          padding: '0.625rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="sha256">SHA-256</option>
                        <option value="md5">MD5</option>
                        <option value="ssdeep">SSDeep (Fuzzy)</option>
                      </select>
                      <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#64748b' }}>
                        Algoritmo para generar hashes
                      </p>
                    </div>

                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontWeight: '500', fontSize: '0.875rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={fingerprintParams.include_metadata}
                          onChange={(e) => setFingerprintParams({ ...fingerprintParams, include_metadata: e.target.checked })}
                          style={{ width: '1.125rem', height: '1.125rem', cursor: 'pointer' }}
                        />
                        Incluir Metadatos
                      </label>
                      <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#64748b', marginLeft: '1.625rem' }}>
                        Timestamps y tamaños de archivo
                      </p>
                    </div>
                  </div>
                )}

                {/* Sensitive Info Parameters */}
                {selectedModel === 'sensitive-info' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontWeight: '500', fontSize: '0.875rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={sensitiveInfoParams.scan_pii}
                          onChange={(e) => setSensitiveInfoParams({ ...sensitiveInfoParams, scan_pii: e.target.checked })}
                          style={{ width: '1.125rem', height: '1.125rem', cursor: 'pointer' }}
                        />
                        Escanear PII (emails, teléfonos, SSN)
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontWeight: '500', fontSize: '0.875rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={sensitiveInfoParams.scan_credentials}
                          onChange={(e) => setSensitiveInfoParams({ ...sensitiveInfoParams, scan_credentials: e.target.checked })}
                          style={{ width: '1.125rem', height: '1.125rem', cursor: 'pointer' }}
                        />
                        Escanear Credenciales (passwords)
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontWeight: '500', fontSize: '0.875rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={sensitiveInfoParams.scan_api_keys}
                          onChange={(e) => setSensitiveInfoParams({ ...sensitiveInfoParams, scan_api_keys: e.target.checked })}
                          style={{ width: '1.125rem', height: '1.125rem', cursor: 'pointer' }}
                        />
                        Escanear API Keys y Tokens
                      </label>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', fontWeight: '500', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        Umbral de Confianza
                      </label>
                      <input
                        type="number"
                        value={sensitiveInfoParams.confidence_threshold}
                        onChange={(e) => setSensitiveInfoParams({ ...sensitiveInfoParams, confidence_threshold: e.target.value })}
                        min="0"
                        max="1"
                        step="0.1"
                        style={{
                          width: '200px',
                          padding: '0.625rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                      <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#64748b' }}>
                        Nivel mínimo de confianza (0.0 - 1.0)
                      </p>
                    </div>
                  </div>
                )}

                {/* Phishing Parameters */}
                {selectedModel === 'phishing' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontWeight: '500', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={phishingParams.check_urls}
                        onChange={(e) => setPhishingParams({ ...phishingParams, check_urls: e.target.checked })}
                        style={{ width: '1.125rem', height: '1.125rem', cursor: 'pointer' }}
                      />
                      Verificar URLs y Dominios
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontWeight: '500', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={phishingParams.check_emails}
                        onChange={(e) => setPhishingParams({ ...phishingParams, check_emails: e.target.checked })}
                        style={{ width: '1.125rem', height: '1.125rem', cursor: 'pointer' }}
                      />
                      Verificar Correos Electrónicos
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontWeight: '500', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={phishingParams.analyze_content}
                        onChange={(e) => setPhishingParams({ ...phishingParams, analyze_content: e.target.checked })}
                        style={{ width: '1.125rem', height: '1.125rem', cursor: 'pointer' }}
                      />
                      Analizar Contenido y Keywords
                    </label>
                  </div>
                )}

                {/* Fraud Detection Parameters */}
                {selectedModel === 'fraud-detection' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', color: '#475569', fontWeight: '500', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        Umbral de Transacción ($)
                      </label>
                      <input
                        type="number"
                        value={fraudParams.transaction_threshold}
                        onChange={(e) => setFraudParams({ ...fraudParams, transaction_threshold: e.target.value })}
                        min="0"
                        step="100"
                        style={{
                          width: '100%',
                          padding: '0.625rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem'
                        }}
                      />
                      <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#64748b' }}>
                        Monto mínimo para alertas
                      </p>
                    </div>

                    <div>
                      <label style={{ display: 'block', color: '#475569', fontWeight: '500', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        Nivel de Riesgo
                      </label>
                      <select
                        value={fraudParams.risk_level}
                        onChange={(e) => setFraudParams({ ...fraudParams, risk_level: e.target.value as any })}
                        style={{
                          width: '100%',
                          padding: '0.625rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="low">Bajo</option>
                        <option value="medium">Medio</option>
                        <option value="high">Alto</option>
                      </select>
                      <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#64748b' }}>
                        Sensibilidad del análisis
                      </p>
                    </div>
                  </div>
                )}

                {/* Ransomware Parameters */}
                {selectedModel === 'ransomware' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontWeight: '500', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={ransomwareParams.scan_encrypted_files}
                        onChange={(e) => setRansomwareParams({ ...ransomwareParams, scan_encrypted_files: e.target.checked })}
                        style={{ width: '1.125rem', height: '1.125rem', cursor: 'pointer' }}
                      />
                      Escanear Archivos Cifrados
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontWeight: '500', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={ransomwareParams.check_extensions}
                        onChange={(e) => setRansomwareParams({ ...ransomwareParams, check_extensions: e.target.checked })}
                        style={{ width: '1.125rem', height: '1.125rem', cursor: 'pointer' }}
                      />
                      Verificar Extensiones Maliciosas
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontWeight: '500', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={ransomwareParams.analyze_behavior}
                        onChange={(e) => setRansomwareParams({ ...ransomwareParams, analyze_behavior: e.target.checked })}
                        style={{ width: '1.125rem', height: '1.125rem', cursor: 'pointer' }}
                      />
                      Analizar Patrones de Comportamiento
                    </label>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="submit"
                  disabled={uploading || !file}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    backgroundColor: uploading || !file ? '#cbd5e1' : '#f37726',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: uploading || !file ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    boxShadow: uploading || !file ? 'none' : '0 2px 4px rgba(243, 119, 38, 0.2)'
                  }}
                >
                  {uploading ? '⏳ Creando análisis...' : '🚀 Crear Análisis'}
                </button>
              </div>
            </div>
          </form>
        </Card>
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
                      <StatusBadge status={analysis.status} label={getStatusLabel(analysis.status)} />
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
