import { useState, useEffect } from 'react';
import './Home.css';

export default function Home({ user, onNavigate, onLogout }) {
  const [stats, setStats] = useState({
    totalMateriais: 0,
    materiaisAbaixoMinimo: 0,
    emprestimosAtivos: 0
  });

  // Carregar estatísticas (opcional - pode comentar se não quiser)
  useEffect(() => {
    const loadStats = async () => {
      try {
        // Carregar materiais
        const materiaisRes = await fetch('http://localhost:3000/materiais');
        
        // Verifica se a resposta foi bem-sucedida
        if (!materiaisRes.ok) {
          console.warn('Backend não retornou dados. Usando valores padrão.');
          return;
        }
        
        const materiais = await materiaisRes.json();
        
        // Verifica se é um array
        if (!Array.isArray(materiais)) {
          console.warn('Resposta não é um array. Usando valores padrão.');
          return;
        }
        
        const total = materiais.length;
        const abaixoMinimo = materiais.filter(m => m.quantidade < m.estoque_minimo).length;
        
        setStats({
          totalMateriais: total,
          materiaisAbaixoMinimo: abaixoMinimo,
          emprestimosAtivos: 0 // Você pode adicionar endpoint para isso depois
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        // Mantém valores padrão (0, 0, 0)
      }
    };

    loadStats();
  }, []);

  return (
    <div className="home-container">
      {/* Header */}
      <header className="home-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">🏋️</div>
            <div>
              <h1 className="header-title">Coxão do Santinho</h1>
              <p className="header-subtitle">Sistema de Gestão de Materiais</p>
            </div>
          </div>
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar">
                {user?.nome?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="user-details">
                <span className="user-name">{user?.nome}</span>
                <span className="user-email">{user?.email}</span>
              </div>
            </div>
            <button className="logout-button" onClick={onLogout}>
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="home-main">
        <div className="welcome-section">
          <h2 className="welcome-title">Olá, {user?.nome?.split(' ')[0]}! 👋</h2>
          <p className="welcome-text">
            Bem-vindo ao sistema de gestão de materiais esportivos. 
            O que você gostaria de fazer hoje?
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="stats-grid">
          <div className="stat-card stat-card-blue">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <span className="stat-value">{stats.totalMateriais}</span>
              <span className="stat-label">Materiais Cadastrados</span>
            </div>
          </div>

          <div className="stat-card stat-card-orange">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <span className="stat-value">{stats.materiaisAbaixoMinimo}</span>
              <span className="stat-label">Abaixo do Estoque Mínimo</span>
            </div>
          </div>

          <div className="stat-card stat-card-green">
            <div className="stat-icon">🔄</div>
            <div className="stat-content">
              <span className="stat-value">{stats.emprestimosAtivos}</span>
              <span className="stat-label">Empréstimos Ativos</span>
            </div>
          </div>
        </div>

        {/* Cards de Ações Principais */}
        <div className="actions-section">
          <h3 className="section-title">Ações Rápidas</h3>
          
          <div className="action-cards">
            {/* Card 1 - Cadastro de Material */}
            <div 
              className="action-card"
              onClick={() => onNavigate('produtos')}
            >
              <div className="action-card-icon action-icon-purple">
                <span>📝</span>
              </div>
              <div className="action-card-content">
                <h4 className="action-card-title">Cadastro de Materiais</h4>
                <p className="action-card-description">
                  Adicione, edite ou remova materiais esportivos do estoque
                </p>
              </div>
              <div className="action-card-arrow">→</div>
            </div>

            {/* Card 2 - Gestão de Estoque */}
            <div 
              className="action-card"
              onClick={() => onNavigate('estoque')}
            >
              <div className="action-card-icon action-icon-teal">
                <span>📊</span>
              </div>
              <div className="action-card-content">
                <h4 className="action-card-title">Gestão de Estoque</h4>
                <p className="action-card-description">
                  Registre empréstimos e devoluções de materiais
                </p>
              </div>
              <div className="action-card-arrow">→</div>
            </div>
          </div>
        </div>

        {/* Atalhos Adicionais */}
        <div className="quick-links">
          <div className="quick-link" onClick={() => onNavigate('produtos')}>
            <span className="quick-link-icon">🔍</span>
            <span>Ver Todos os Materiais</span>
          </div>
          <div className="quick-link" onClick={() => onNavigate('estoque')}>
            <span className="quick-link-icon">➕</span>
            <span>Registrar Movimentação</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="home-footer">
        <p>© 2025 Coxão do Santinho - Crossfit & Galeteria</p>
      </footer>
    </div>
  );
}