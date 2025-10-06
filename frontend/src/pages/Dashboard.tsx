/**
 * Dashboard Page
 * Main dashboard with system overview - Light Theme
 */

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Database, Cpu, HardDrive } from 'lucide-react';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import apiService from '../services/api.service';
import type { DashboardStats, GpuUsageHistory } from '../types';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [gpuHistory, setGpuHistory] = useState<GpuUsageHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, gpuData] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getGpuUsageHistory(),
      ]);
      setStats(statsData);
      setGpuHistory(gpuData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading dashboard data');
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return <LoadingSpinner />;
  }

  if (error && !stats) {
    return (
      <div style={{ color: '#ef4444', textAlign: 'center', padding: '2rem', backgroundColor: '#fee2e2', borderRadius: '0.5rem', border: '1px solid #fecaca', margin: '2rem' }}>
        Error: {error}
      </div>
    );
  }

  if (!stats || !gpuHistory) {
    return null;
  }

  return (
    <div>
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: '2rem'
      }}>
        Dashboard
      </h1>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>Total Análisis</p>
              <p style={{ color: '#1e293b', fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>
                {stats.totalAnalyses}
              </p>
            </div>
            <Activity size={40} color="#f37726" />
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>En Progreso</p>
              <p style={{ color: '#1e293b', fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>
                {stats.analysesInProgress}
              </p>
            </div>
            <Database size={40} color="#f59e0b" />
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>Completados</p>
              <p style={{ color: '#1e293b', fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>
                {stats.completedAnalyses}
              </p>
            </div>
            <HardDrive size={40} color="#10b981" />
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>Uso GPU</p>
              <p style={{ color: '#1e293b', fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>
                {stats.gpu.usage.toFixed(1)}%
              </p>
            </div>
            <Cpu size={40} color="#8b5cf6" />
          </div>
        </Card>
      </div>

      {/* GPU Charts */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* GPU Usage Chart */}
        <Card title="Uso de GPU">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={gpuHistory.history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="timestamp" 
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(_value, index) => {
                  const totalPoints = gpuHistory.history.length;
                  const secondsAgo = (totalPoints - index - 1) * 5;
                  const minutes = Math.floor(secondsAgo / 60);
                  const seconds = secondsAgo % 60;
                  // Solo mostrar labels en minutos exactos (1m, 2m, 3m, 4m, 5m)
                  if (seconds === 0 && minutes > 0) return `${minutes}m`;
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
                labelFormatter={(value) => {
                  const index = gpuHistory.history.findIndex(item => item.timestamp === value);
                  const totalPoints = gpuHistory.history.length;
                  const secondsAgo = (totalPoints - index - 1) * 5;
                  const minutes = Math.floor(secondsAgo / 60);
                  const seconds = secondsAgo % 60;
                  let timeLabel = '';
                  if (minutes === 0) timeLabel = `${seconds}s atrás`;
                  else if (seconds === 0) timeLabel = `${minutes}m atrás`;
                  else timeLabel = `${minutes}m${seconds}s atrás`;
                  return timeLabel;
                }}
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'GPU Usage']}
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
        </Card>

        {/* GPU Memory Chart */}
        <Card title="Memoria GPU">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={gpuHistory.history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="timestamp" 
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(_value, index) => {
                  const totalPoints = gpuHistory.history.length;
                  const secondsAgo = (totalPoints - index - 1) * 5;
                  const minutes = Math.floor(secondsAgo / 60);
                  const seconds = secondsAgo % 60;
                  // Solo mostrar labels en minutos exactos (1m, 2m, 3m, 4m, 5m)
                  if (seconds === 0 && minutes > 0) return `${minutes}m`;
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
                labelFormatter={(value) => {
                  const index = gpuHistory.history.findIndex(item => item.timestamp === value);
                  const totalPoints = gpuHistory.history.length;
                  const secondsAgo = (totalPoints - index - 1) * 5;
                  const minutes = Math.floor(secondsAgo / 60);
                  const seconds = secondsAgo % 60;
                  let timeLabel = '';
                  if (minutes === 0) timeLabel = `${seconds}s atrás`;
                  else if (seconds === 0) timeLabel = `${minutes}m atrás`;
                  else timeLabel = `${minutes}m${seconds}s atrás`;
                  return timeLabel;
                }}
                formatter={(value: number) => [`${value.toFixed(2)} MB`, 'Memoria']}
              />
              <Line 
                type="monotone" 
                dataKey="memory" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Memoria"
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
              Uso de memoria
            </span>
          </div>
        </Card>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Services Status */}
        <Card title="Estado de Servicios">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '0.75rem',
              backgroundColor: '#f8fafc',
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0'
            }}>
              <span style={{ color: '#1e293b', fontWeight: '500' }}>Backend</span>
              <StatusBadge status={stats.services.backend.status} />
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '0.75rem',
              backgroundColor: '#f8fafc',
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0'
            }}>
              <span style={{ color: '#1e293b', fontWeight: '500' }}>PostgreSQL</span>
              <StatusBadge status={stats.services.postgres.status} />
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '0.75rem',
              backgroundColor: '#f8fafc',
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0'
            }}>
              <span style={{ color: '#1e293b', fontWeight: '500' }}>Morpheus/Triton</span>
              <StatusBadge status={stats.services.morpheus.status} />
            </div>
          </div>
        </Card>

        {/* Recent Analyses */}
        <Card title="Análisis Recientes">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {stats.recentAnalyses.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', margin: '2rem 0' }}>
                No hay análisis recientes
              </p>
            ) : (
              stats.recentAnalyses.slice(0, 5).map((analysis) => (
                <div
                  key={analysis.analysisId}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '0.5rem',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ 
                      color: '#1e293b', 
                      fontWeight: '500',
                      fontSize: '0.875rem'
                    }}>
                      {analysis.modelName}
                    </span>
                    <StatusBadge status={analysis.status} />
                  </div>
                  <p style={{ 
                    color: '#64748b', 
                    fontSize: '0.75rem', 
                    margin: 0 
                  }}>
                    {formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true, locale: { code: 'es' } })}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
