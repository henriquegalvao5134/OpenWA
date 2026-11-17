import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Wifi, WifiOff, AlertCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

interface Cliente {
  id: string;
  slug: string;
  nome: string;
  segmento: string | null;
  ativo: boolean;
  sessionId: string | null;
}

function getNegocioHeaders(): Record<string, string> {
  const token = sessionStorage.getItem('negocio_token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
}

export function Clientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const papel = sessionStorage.getItem('negocio_papel');

  useEffect(() => {
    const token = sessionStorage.getItem('negocio_token');
    if (!token) {
      navigate('/negocio/login');
      return;
    }

    fetch(`${API_BASE_URL}/negocio/clientes`, { headers: getNegocioHeaders() })
      .then(async (res) => {
        if (res.status === 401) { navigate('/negocio/login'); return; }
        if (!res.ok) throw new Error('Erro ao carregar clientes');
        const data = await res.json() as Cliente[];
        setClientes(data);
      })
      .catch((err: Error) => setErro(err.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Clientes</h1>
          <p style={{ opacity: 0.5, fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            Selecione um cliente para ver as conversões
          </p>
        </div>
        {papel === 'admin' && (
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1rem', background: '#22c55e', border: 'none',
              borderRadius: '6px', color: '#fff', fontWeight: 600, cursor: 'pointer',
            }}
            onClick={() => navigate('/negocio/novo-cliente')}
          >
            <Plus size={16} /> Novo cliente
          </button>
        )}
      </div>

      {erro && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', marginBottom: '1rem', color: '#f87171' }}>
          <AlertCircle size={16} /> {erro}
        </div>
      )}

      {clientes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.4 }}>
          <Users size={48} style={{ margin: '0 auto 1rem' }} />
          <p>Nenhum cliente cadastrado</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {clientes.map((c) => (
            <div
              key={c.id}
              onClick={() => navigate(`/negocio/${c.slug}/conversoes`)}
              style={{
                background: 'var(--color-surface, #1e293b)',
                borderRadius: '10px',
                padding: '1.25rem',
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.08)',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(34,197,94,0.4)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)')}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{c.nome}</h2>
                  {c.segmento && (
                    <span style={{ fontSize: '0.75rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {c.segmento}
                    </span>
                  )}
                </div>
                {c.sessionId ? (
                  <Wifi size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
                ) : (
                  <WifiOff size={18} style={{ opacity: 0.3, flexShrink: 0 }} />
                )}
              </div>
              <div style={{ marginTop: '1rem', fontSize: '0.75rem', opacity: 0.4 }}>
                {c.slug}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
