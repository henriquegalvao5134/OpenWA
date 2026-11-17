import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

export function NegocioLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/negocio/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || 'Credenciais inválidas');
      }

      const data = (await res.json()) as { token: string; usuario: { papel: string } };
      sessionStorage.setItem('negocio_token', data.token);
      sessionStorage.setItem('negocio_papel', data.usuario.papel);
      navigate('/negocio');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--color-bg, #0f172a)',
      }}
    >
      <div
        style={{
          background: 'var(--color-surface, #1e293b)',
          borderRadius: '12px',
          padding: '2rem',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}
      >
        <h1 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 700 }}>ELO</h1>
        <p style={{ marginBottom: '1.5rem', opacity: 0.6, fontSize: '0.875rem' }}>
          Plataforma de atribuição de vendas no WhatsApp
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem', opacity: 0.8 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                background: 'var(--color-bg, #0f172a)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '6px',
                color: 'inherit',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem', opacity: 0.8 }}>
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                background: 'var(--color-bg, #0f172a)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '6px',
                color: 'inherit',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {erro && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.6rem 0.8rem',
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: '#f87171',
              }}
            >
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.7rem',
              background: '#22c55e',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Entrar
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', opacity: 0.4 }}>
          Para acesso técnico (sessões WhatsApp), use o dashboard principal
        </p>
      </div>
    </div>
  );
}
