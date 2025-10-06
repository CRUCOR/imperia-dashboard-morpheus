/**
 * Analysis Page
 * Upload files and monitor analysis in real-time - Light Theme
 */

import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, XCircle } from 'lucide-react';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import apiService from '../services/api.service';
import socketService from '../services/socket.service';
import type { AnalysisProgress } from '../types';

export default function Analysis() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    socketService.connect();

    const handleProgress = (data: AnalysisProgress) => {
      setProgress(data);
      if (currentAnalysis && data.analysisId === currentAnalysis.analysisId) {
        setCurrentAnalysis((prev: any) => ({
          ...prev,
          status: data.status,
        }));
      }
    };

    const handleComplete = (data: any) => {
      if (currentAnalysis && data.analysisId === currentAnalysis.analysisId) {
        setCurrentAnalysis((prev: any) => ({
          ...prev,
          status: 'completed',
          result: data.result,
        }));
        setProgress(null);
      }
    };

    const handleError = (data: any) => {
      if (currentAnalysis && data.analysisId === currentAnalysis.analysisId) {
        setCurrentAnalysis((prev: any) => ({
          ...prev,
          status: 'failed',
          error: data.error,
        }));
        setProgress(null);
      }
    };

    socketService.onAnalysisProgress(handleProgress);
    socketService.onAnalysisComplete(handleComplete);
    socketService.onAnalysisError(handleError);

    return () => {
      socketService.offAnalysisProgress(handleProgress);
      socketService.offAnalysisComplete(handleComplete);
      socketService.offAnalysisError(handleError);
    };
  }, [currentAnalysis]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(null);

    try {
      const response = await apiService.uploadFile(file, 'morpheus-abp');
      setCurrentAnalysis({
        analysisId: response.analysisId,
        status: response.status,
        fileName: file.name,
      });
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir archivo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: '2rem'
      }}>
        Análisis
      </h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Upload Section */}
        <Card title="Subir Archivo">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '0.5rem',
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: file ? '#f1f5f9' : 'transparent',
              }}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".csv,.txt,.jpg,.png,.pdf"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <Upload size={48} color="#f37726" style={{ margin: '0 auto 1rem' }} />
              {file ? (
                <div>
                  <FileText size={24} color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ color: '#1e293b', margin: '0.5rem 0', fontWeight: '500' }}>{file.name}</p>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ color: '#1e293b', margin: '0.5rem 0', fontWeight: '500' }}>
                    Click para seleccionar archivo
                  </p>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
                    Formatos: CSV, TXT, JPG, PNG, PDF
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#fee2e2',
                borderRadius: '0.5rem',
                color: '#dc2626',
                fontSize: '0.875rem',
                border: '1px solid #fecaca'
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: file && !uploading ? '#f37726' : '#cbd5e1',
                color: '#ffffff',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: file && !uploading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
            >
              {uploading ? 'Subiendo...' : 'Analizar Archivo'}
            </button>
          </div>
        </Card>

        {/* Current Analysis */}
        {currentAnalysis && (
          <Card title="Análisis Actual">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <p style={{ color: '#1e293b', fontWeight: '500', margin: 0 }}>
                    {currentAnalysis.fileName}
                  </p>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0 0', fontFamily: 'monospace' }}>
                    ID: {currentAnalysis.analysisId.substring(0, 16)}...
                  </p>
                </div>
                <StatusBadge status={currentAnalysis.status} />
              </div>

              {progress && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ color: '#1e293b', fontSize: '0.875rem', fontWeight: '500' }}>
                      Progreso
                    </span>
                    <span style={{ color: '#f37726', fontSize: '0.875rem', fontWeight: '600' }}>
                      {progress.progress}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${progress.progress}%`,
                      height: '100%',
                      backgroundColor: '#f37726',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
                    {progress.message}
                  </p>
                  {progress.gpuUsage !== undefined && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem' }}>
                      <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                        GPU: {progress.gpuUsage.toFixed(1)}%
                      </span>
                      <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                        VRAM: {progress.gpuMemMb?.toFixed(0)} MB
                      </span>
                    </div>
                  )}
                </div>
              )}

              {currentAnalysis.status === 'completed' && currentAnalysis.result && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#ecfdf5',
                  borderRadius: '0.5rem',
                  border: '1px solid #a7f3d0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <CheckCircle size={20} color="#10b981" />
                    <span style={{ color: '#059669', fontWeight: '600' }}>Análisis Completado</span>
                  </div>
                  <pre style={{
                    color: '#065f46',
                    fontSize: '0.75rem',
                    margin: '0.5rem 0 0 0',
                    overflow: 'auto',
                    maxHeight: '200px',
                    backgroundColor: '#ffffff',
                    padding: '0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1fae5'
                  }}>
                    {JSON.stringify(currentAnalysis.result, null, 2)}
                  </pre>
                </div>
              )}

              {currentAnalysis.status === 'failed' && currentAnalysis.error && (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#fee2e2',
                  borderRadius: '0.5rem',
                  border: '1px solid #fecaca'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <XCircle size={20} color="#ef4444" />
                    <span style={{ color: '#dc2626', fontWeight: '600' }}>Error en el Análisis</span>
                  </div>
                  <p style={{ color: '#991b1b', fontSize: '0.875rem', margin: 0 }}>
                    {currentAnalysis.error}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
