import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wifi, WifiOff, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

interface StatusCliente {
  id: string;
  slug: string;
  nome: string;
  sessionId: string | null;
  mensagens24h: number;
  analises24h: number;
  pendentes: number;
  errosEnvio: number;
}

function getNegocioHeaders(): Record<string, string> {
  const token = sessionStorage.getItem('negocio_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function SaudeNegocio() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<StatusCliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('negocio_token');
    if (!token) { navigate('/negocio/login'); return; }

    // Carrega lista de clientes como proxy de saúde
    fetch(`${API_BASE_URL}/negocio/clientes`, { headers: getNegocioHeaders() })
      .then(async (res) => {
        if (res.status === 401) { navigate('/negocio/login'); return; }
        const data = await res.json() as Array<{ id: string; slug: string; nome: string; sessionId: string | null }>;
        // Mapeia para StatusCliente com valores padrão (sem endpoint de saúde dedicado ainda)
        setClientes(
          data.map((c) => ({
            ...c,
            mensagens24h: 0,
            analises24h: 0,
            pendentes: 0,
            errosEnvio: 0,
          })),
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate('/negocio')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, padding: 0 }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Saúde do sistema</h1>
          <p style={{ margin: 0, opacity: 0.5, fontSize: '0.875rem' }}>
            Status de WhatsApp, análise IA e envios
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {clientes.map((c) => (
            <div
              key={c.id}
              style={{
                background: 'var(--color-surface, #1e293b)',
                borderRadius: '10px',
                padding: '1.25rem',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{c.nome}</h2>
                  <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{c.slug}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {c.sessionId ? (
                    <>
                      <Wifi size={16} style={{ color: '#22c55e' }} />
                      <span style={{ fontSize: '0.8rem', color: '#22c55e' }}>Conectado</span>
                    </>
                  ) : (
                    <>
                      <WifiOff size={16} style={{ color: '#ef4444' }} />
                      <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>Desconectado</span>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                {[
                  { label: 'Msg 24h', value: c.mensagens24h, ok: c.mensagens24h > 0 },
                  { label: 'Análises 24h', value: c.analises24h, ok: true },
                  { label: 'Pendentes', value: c.pendentes, ok: c.pendentes < 30 },
                  { label: 'Erros envio', value: c.errosEnvio, ok: c.errosEnvio === 0 },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '6px',
                      padding: '0.6rem',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: item.ok ? 'inherit' : '#f59e0b',
                      }}
                    >
                      {item.value}
                    </div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{item.label}</div>
                  </div>
                ))}
              </div>

              {!c.sessionId && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(239,68,68,0.1)',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    color: '#f87171',
                  }}
                >
                  <AlertTriangle size={14} />
                  Sessão WhatsApp não vinculada. Configure em Clientes → Editar.
                </div>
              )}
            </div>
          ))}

          {clientes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.4 }}>
              <CheckCircle size={48} style={{ margin: '0 auto 1rem' }} />
              <p>Nenhum cliente cadastrado</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
