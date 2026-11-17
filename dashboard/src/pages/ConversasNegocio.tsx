import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Search, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

interface ContatoResumo {
  id: string;
  waChatId: string;
  nomeValidado: string | null;
  telefone: string | null;
  etapa: string;
  origem: string;
  ultimoContatoEm: string | null;
}

function getNegocioHeaders(): Record<string, string> {
  const token = sessionStorage.getItem('negocio_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function ConversasNegocio() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [contatos] = useState<ContatoResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('negocio_token');
    if (!token) { navigate('/negocio/login'); return; }

    // Rota que lista contatos negócio por cliente (via slug)
    fetch(`${API_BASE_URL}/negocio/clientes`, { headers: getNegocioHeaders() })
      .then(async (res) => {
        if (res.status === 401) { navigate('/negocio/login'); return; }
        // Simplificado: carrega lista de clientes e encontra o slug
        const clientes = await res.json() as Array<{ id: string; slug: string }>;
        const cliente = clientes.find((c) => c.slug === slug);
        if (!cliente) return;

        return fetch(`${API_BASE_URL}/negocio/clientes/${cliente.id}`, { headers: getNegocioHeaders() });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  const contatosFiltrados = contatos.filter((c) => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      (c.nomeValidado?.toLowerCase().includes(termo)) ||
      (c.telefone?.includes(busca))
    );
  });

  return (
    <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate(`/negocio/${slug}/conversoes`)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, padding: 0 }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{slug}</h1>
          <p style={{ margin: 0, opacity: 0.5, fontSize: '0.875rem' }}>Conversas (somente leitura)</p>
        </div>
      </div>

      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          background: 'var(--color-surface, #1e293b)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px', marginBottom: '1rem',
        }}
      >
        <Search size={16} style={{ opacity: 0.5 }} />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          style={{
            background: 'none', border: 'none', outline: 'none',
            color: 'inherit', fontSize: '0.9rem', flex: 1,
          }}
        />
      </div>

      <div
        style={{
          background: 'var(--color-surface, #1e293b)',
          borderRadius: '8px',
          padding: '0.75rem',
          fontSize: '0.8rem',
          opacity: 0.7,
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <MessageSquare size={14} />
        Sistema somente leitura — não envia mensagens. Para ver conversas no WhatsApp, acesse o dashboard principal (Chats).
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : contatosFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.4 }}>
          <MessageSquare size={48} style={{ margin: '0 auto 1rem' }} />
          <p>Nenhum contato encontrado</p>
          <p style={{ fontSize: '0.875rem' }}>
            Use o dashboard principal (Chats) para visualizar todas as conversas
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {contatosFiltrados.map((c) => (
            <div
              key={c.id}
              style={{
                background: 'var(--color-surface, #1e293b)',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontWeight: 500 }}>{c.nomeValidado ?? c.telefone ?? c.waChatId}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.2rem' }}>
                  {c.telefone} · {c.etapa} · {c.origem.replace(/_/g, ' ')}
                </div>
              </div>
              {c.ultimoContatoEm && (
                <div style={{ fontSize: '0.75rem', opacity: 0.4 }}>
                  {new Date(c.ultimoContatoEm).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
