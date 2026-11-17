import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, RefreshCw, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

interface Analise {
  id: string;
  contatoId: string;
  status: string;
  produto: string | null;
  valorCentavos: number | null;
  confianca: number;
  resumo: string | null;
  evidencias: string[];
  revisao: string;
  modeloIa: string | null;
  criadoEm: string;
}

function getNegocioHeaders(): Record<string, string> {
  const token = sessionStorage.getItem('negocio_token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
}

const STATUS_LABEL: Record<string, string> = {
  venda: 'Venda',
  perdida: 'Perdida',
  em_aberto: 'Em aberto',
  nao_comercial: 'Não comercial',
};

const REVISAO_LABEL: Record<string, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: '#f59e0b' },
  confirmada: { label: 'Confirmada', color: '#22c55e' },
  rejeitada: { label: 'Rejeitada', color: '#ef4444' },
};

function BarraConfianca({ valor }: { valor: number }) {
  const cor = valor >= 80 ? '#22c55e' : valor >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${valor}%`, height: '100%', background: cor, borderRadius: '3px' }} />
      </div>
      <span style={{ fontSize: '0.75rem', color: cor, minWidth: '32px' }}>{valor}%</span>
    </div>
  );
}

export function Conversoes() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [analises, setAnalises] = useState<Analise[]>([]);
  const [loading, setLoading] = useState(true);
  const [acao, setAcao] = useState<{ id: string; tipo: string } | null>(null);
  const [filtro, setFiltro] = useState<string>('pendente');

  const carregar = () => {
    const token = sessionStorage.getItem('negocio_token');
    if (!token) { navigate('/negocio/login'); return; }

    setLoading(true);
    fetch(`${API_BASE_URL}/negocio/${slug}/conversoes?revisao=${filtro}&limite=50`, {
      headers: getNegocioHeaders(),
    })
      .then(async (res) => {
        if (res.status === 401) { navigate('/negocio/login'); return; }
        const data = await res.json() as Analise[];
        setAnalises(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(carregar, [slug, filtro]);

  const executarAcao = async (analiseId: string, tipo: string) => {
    setAcao({ id: analiseId, tipo });
    try {
      await fetch(`${API_BASE_URL}/negocio/${slug}/conversoes/revisar`, {
        method: 'POST',
        headers: getNegocioHeaders(),
        body: JSON.stringify({ analiseId, acao: tipo }),
      });
      carregar();
    } catch (err) {
      console.error(err);
    } finally {
      setAcao(null);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => navigate('/negocio')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, padding: 0 }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{slug}</h1>
          <p style={{ margin: 0, opacity: 0.5, fontSize: '0.875rem' }}>Conversões</p>
        </div>
        <button
          onClick={carregar}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Filtros de aba */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { key: 'pendente', label: 'Pendentes' },
          { key: 'confirmada', label: 'Confirmadas' },
          { key: 'rejeitada', label: 'Rejeitadas' },
          { key: '', label: 'Todos' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: '20px',
              border: '1px solid',
              cursor: 'pointer',
              fontSize: '0.875rem',
              borderColor: filtro === f.key ? '#22c55e' : 'rgba(255,255,255,0.15)',
              background: filtro === f.key ? 'rgba(34,197,94,0.15)' : 'transparent',
              color: filtro === f.key ? '#22c55e' : 'inherit',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : analises.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.4 }}>
          Nenhuma conversão encontrada neste filtro
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {analises.map((a) => {
            const revisaoInfo = REVISAO_LABEL[a.revisao] ?? { label: a.revisao, color: '#94a3b8' };
            const valorReais = a.valorCentavos != null ? (a.valorCentavos / 100).toFixed(2) : null;

            return (
              <div
                key={a.id}
                style={{
                  background: 'var(--color-surface, #1e293b)',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600 }}>{STATUS_LABEL[a.status] ?? a.status}</span>
                      {a.produto && <span style={{ opacity: 0.6, fontSize: '0.875rem' }}>· {a.produto}</span>}
                      <span
                        style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          background: `${revisaoInfo.color}20`,
                          color: revisaoInfo.color,
                          border: `1px solid ${revisaoInfo.color}40`,
                        }}
                      >
                        {revisaoInfo.label}
                      </span>
                    </div>

                    {valorReais ? (
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#22c55e', marginBottom: '0.5rem' }}>
                        R$ {valorReais}
                      </div>
                    ) : (
                      a.status === 'venda' && (
                        <div style={{ fontSize: '0.875rem', color: '#f59e0b', marginBottom: '0.5rem' }}>
                          Valor não informado
                        </div>
                      )
                    )}

                    <BarraConfianca valor={a.confianca} />

                    {a.resumo && (
                      <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem', opacity: 0.7, lineHeight: 1.4 }}>
                        {a.resumo}
                      </p>
                    )}

                    {a.evidencias?.length > 0 && (
                      <div style={{ marginTop: '0.5rem' }}>
                        {a.evidencias.map((ev, i) => (
                          <span
                            key={i}
                            style={{
                              display: 'inline-block',
                              margin: '0.15rem',
                              padding: '0.15rem 0.5rem',
                              background: 'rgba(255,255,255,0.05)',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontStyle: 'italic',
                              opacity: 0.8,
                            }}
                          >
                            "{ev}"
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  {a.revisao === 'pendente' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
                      <button
                        onClick={() => executarAcao(a.id, 'confirmar')}
                        disabled={acao?.id === a.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.4rem 0.8rem', background: 'rgba(34,197,94,0.15)',
                          border: '1px solid rgba(34,197,94,0.3)', borderRadius: '6px',
                          color: '#22c55e', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                        }}
                      >
                        {acao?.id === a.id && acao.tipo === 'confirmar' ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <CheckCircle size={12} />
                        )}
                        Confirmar
                      </button>
                      <button
                        onClick={() => executarAcao(a.id, 'rejeitar')}
                        disabled={acao?.id === a.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.4rem 0.8rem', background: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px',
                          color: '#f87171', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                        }}
                      >
                        <XCircle size={12} />
                        Rejeitar
                      </button>
                    </div>
                  )}
                  {a.revisao === 'confirmada' && (
                    <button
                      onClick={() => executarAcao(a.id, 'desfazer')}
                      disabled={acao?.id === a.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px',
                        color: 'inherit', cursor: 'pointer', fontSize: '0.8rem', opacity: 0.7,
                      }}
                    >
                      <RotateCcw size={12} /> Desfazer
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
