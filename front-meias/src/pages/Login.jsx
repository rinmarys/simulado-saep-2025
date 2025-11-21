import { useState } from 'react';
import './Login.css';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    
    if (!email.trim() || !senha.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const data = await response.json();

      if (response.ok) {
        // Chama a função de callback passada pelo App.jsx
        if (onLoginSuccess) {
          onLoginSuccess(data);
        }
      } else {
        setError(data.error || 'Credenciais inválidas');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="login-container">
      {/* Painel Lateral Esquerdo */}
      <div className="login-sidebar">
        <div className="sidebar-content">
          <div className="logo-icon">🏋️</div>
          <h1 className="sidebar-title">Bem-vindo de volta!</h1>
          <p className="sidebar-description">
            Sistema de gestão de materiais esportivos do Coxão do Santinho - Crossfit & Galeteria
          </p>
        </div>
        <div className="sidebar-footer">
          © 2025 Coxão do Santinho
        </div>
      </div>

      {/* Painel Direito - Formulário */}
      <div className="login-form-panel">
        <div className="login-form-container">
          {/* Cabeçalho */}
          <div className="form-header">
            <h2 className="form-title">Fazer Login</h2>
            <p className="form-subtitle">
              Acesse sua conta para gerenciar o estoque
            </p>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="error-message">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Campos do Formulário */}
          <div className="form-group">
            <label className="form-label">📧 Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="seu@email.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">🔒 Senha</label>
            <input
              type="password"
              className="form-input"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          {/* Botão de Login */}
          <button
            className={`login-button ${loading ? 'loading' : ''}`}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          {/* Credenciais de Teste */}
          <div className="test-credentials">
            <div className="test-credentials-title">💡 Credenciais de teste:</div>
            <div className="test-credentials-info">
              <div>Email: joao.silva@coxaosantinho.com</div>
              <div>Senha: senha123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}