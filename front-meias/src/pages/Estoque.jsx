import { useState, useEffect, useMemo } from 'react';
import './Estoque.css';

export default function Estoque({ user, onNavigate }) {
    const [materiais, setMateriais] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form de movimentação
    const [materialId, setMaterialId] = useState('');
    const [tipo, setTipo] = useState('emprestimo');
    const [quantidade, setQuantidade] = useState('');
    const [dataMovimentacao, setDataMovimentacao] = useState('');
    const [dataDevolucao, setDataDevolucao] = useState('');
    const [observacao, setObservacao] = useState('');
    const [processando, setProcessando] = useState(false);

    // Carregar materiais
    const carregarMateriais = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/materiais');

            if (!response.ok) {
                throw new Error('Erro ao carregar materiais');
            }

            const data = await response.json();
            setMateriais(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Erro ao carregar materiais:', error);
            alert('Erro ao carregar materiais');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarMateriais();
    }, []);

    // Ordenar alfabeticamente
    const materiaisOrdenados = useMemo(() => {
        return [...materiais].sort((a, b) =>
            a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
        );
    }, [materiais]);

    // Material selecionado
    const materialSelecionado = useMemo(() => {
        return materiais.find(m => m.id === Number(materialId));
    }, [materiais, materialId]);

    // Limpar formulário
    const limparForm = () => {
        setQuantidade('');
        setObservacao('');
        setDataMovimentacao('');
        setDataDevolucao('');
    };

    // Validar formulário
    const validarForm = () => {
        if (!user) return 'Você precisa estar logado.';
        if (!materialId) return 'Selecione um material.';
        if (!tipo) return 'Selecione o tipo de movimentação.';

        const qtd = Number(quantidade);
        if (!qtd || qtd <= 0) return 'Informe uma quantidade válida (maior que 0).';

        // Validar se há estoque suficiente para empréstimo
        if (tipo === 'emprestimo' && materialSelecionado) {
            if (qtd > materialSelecionado.quantidade) {
                return `Estoque insuficiente! Disponível: ${materialSelecionado.quantidade}`;
            }
        }

        return null;
    };

    // Registrar movimentação
    const registrarMovimentacao = async () => {
        const erro = validarForm();
        if (erro) return alert(erro);

        setProcessando(true);

        try {
            const payload = {
                material_id: Number(materialId),
                usuario_id: user.id,
                tipo: tipo,
                quantidade: Number(quantidade),
                data_movimentacao: dataMovimentacao || null,
                data_devolucao: tipo === 'emprestimo' && dataDevolucao ? dataDevolucao : null,
                status: tipo === 'emprestimo' ? 'emprestado' : 'devolvido'
            };

            const response = await fetch('http://localhost:3000/movimentacoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erro ao registrar movimentação');
            }

            const data = await response.json();

            // Verificar se ficou abaixo do mínimo
            if (data.material && data.material.abaixo_do_minimo) {
                alert('⚠️ ATENÇÃO: O estoque deste material ficou abaixo do mínimo!');
            } else {
                alert('✅ Movimentação registrada com sucesso!');
            }

            // Recarregar materiais e limpar form
            await carregarMateriais();
            limparForm();

        } catch (error) {
            alert(error.message);
        } finally {
            setProcessando(false);
        }
    };

    // Obter data atual no formato YYYY-MM-DD
    const getDataAtual = () => {
        const hoje = new Date();
        return hoje.toISOString().split('T')[0];
    };

    return (
        <div className="estoque-container">
            {/* Header */}
            <header className="estoque-header">
                <div className="header-content">
                    <div className="header-left">
                        <button className="back-button" onClick={() => onNavigate('home')}>
                            ← Voltar
                        </button>
                        <div>
                            <h1 className="page-title">Gestão de Estoque</h1>
                            <p className="page-subtitle">Registre empréstimos e devoluções de materiais</p>
                        </div>
                    </div>
                    <div className="header-right">
                        <div className="user-badge">
                            <span className="user-avatar">{user?.nome?.charAt(0).toUpperCase()}</span>
                            <span className="user-name">{user?.nome}</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="estoque-main">
                <div className="estoque-grid">
                    {/* Lista de Materiais */}
                    <div className="materiais-panel">
                        <div className="panel-header">
                            <h2 className="section-title">📦 Materiais Disponíveis</h2>
                            <span className="count-badge">{materiaisOrdenados.length} itens</span>
                        </div>

                        {loading ? (
                            <div className="loading">Carregando materiais...</div>
                        ) : materiaisOrdenados.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📭</div>
                                <p className="empty-text">Nenhum material cadastrado</p>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => onNavigate('produtos')}
                                >
                                    Cadastrar Materiais
                                </button>
                            </div>
                        ) : (
                            <div className="materiais-list">
                                {materiaisOrdenados.map((material) => (
                                    <div
                                        key={material.id}
                                        className={`material-card ${material.quantidade < material.estoque_minimo ? 'card-alert' : ''} ${Number(materialId) === material.id ? 'card-selected' : ''}`}
                                        onClick={() => setMaterialId(String(material.id))}
                                    >
                                        <div className="material-info">
                                            <h3 className="material-name">{material.nome}</h3>
                                            <div className="material-stats">
                                                <span className="stat">
                                                    <span className="stat-label">Disponível:</span>
                                                    <span className="stat-value">{material.quantidade}</span>
                                                </span>
                                                <span className="stat">
                                                    <span className="stat-label">Mínimo:</span>
                                                    <span className="stat-value">{material.estoque_minimo}</span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="material-status">
                                            {material.quantidade < material.estoque_minimo ? (
                                                <span className="status-badge status-warning">⚠️ Baixo</span>
                                            ) : material.quantidade === 0 ? (
                                                <span className="status-badge status-danger">❌ Esgotado</span>
                                            ) : (
                                                <span className="status-badge status-ok">✓ OK</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Formulário de Movimentação */}
                    <div className="movimentacao-panel">
                        <div className="panel-header">
                            <h2 className="section-title">📝 Registrar Movimentação</h2>
                        </div>

                        <div className="form-content">
                            {/* Material Selecionado */}
                            <div className="form-group">
                                <label className="form-label">Material *</label>
                                <select
                                    className="form-select"
                                    value={materialId}
                                    onChange={(e) => setMaterialId(e.target.value)}
                                    disabled={processando}
                                >
                                    <option value="">Selecione um material...</option>
                                    {materiaisOrdenados.map((material) => (
                                        <option key={material.id} value={material.id}>
                                            {material.nome} (Disponível: {material.quantidade})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Preview do Material */}
                            {materialSelecionado && (
                                <div className="material-preview">
                                    <div className="preview-row">
                                        <span className="preview-label">Material:</span>
                                        <span className="preview-value">{materialSelecionado.nome}</span>
                                    </div>
                                    <div className="preview-row">
                                        <span className="preview-label">Disponível:</span>
                                        <span className="preview-value">{materialSelecionado.quantidade}</span>
                                    </div>
                                    <div className="preview-row">
                                        <span className="preview-label">Estoque Mínimo:</span>
                                        <span className="preview-value">{materialSelecionado.estoque_minimo}</span>
                                    </div>
                                </div>
                            )}

                            {/* Tipo de Movimentação */}
                            <div className="form-group">
                                <label className="form-label">Tipo de Movimentação *</label>
                                <div className="radio-group">
                                    <label className={`radio-option ${tipo === 'emprestimo' ? 'radio-selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="tipo"
                                            value="emprestimo"
                                            checked={tipo === 'emprestimo'}
                                            onChange={(e) => setTipo(e.target.value)}
                                            disabled={processando}
                                        />
                                        <span className="radio-icon">📤</span>
                                        <span className="radio-text">Empréstimo</span>
                                    </label>
                                    <label className={`radio-option ${tipo === 'devolucao' ? 'radio-selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="tipo"
                                            value="devolucao"
                                            checked={tipo === 'devolucao'}
                                            onChange={(e) => setTipo(e.target.value)}
                                            disabled={processando}
                                        />
                                        <span className="radio-icon">📥</span>
                                        <span className="radio-text">Devolução</span>
                                    </label>
                                </div>
                            </div>

                            {/* Quantidade */}
                            <div className="form-group">
                                <label className="form-label">Quantidade *</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={quantidade}
                                    onChange={(e) => setQuantidade(e.target.value)}
                                    min={1}
                                    placeholder="Informe a quantidade"
                                    disabled={processando}
                                />
                            </div>

                            {/* Data da Movimentação */}
                            <div className="form-group">
                                <label className="form-label">Data da Movimentação</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={dataMovimentacao}
                                    onChange={(e) => setDataMovimentacao(e.target.value)}
                                    max={getDataAtual()}
                                    disabled={processando}
                                />
                                <span className="form-hint">Deixe em branco para usar a data atual</span>
                            </div>

                            {/* Data de Devolução (apenas para empréstimos) */}
                            {tipo === 'emprestimo' && (
                                <div className="form-group">
                                    <label className="form-label">Data Prevista de Devolução</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={dataDevolucao}
                                        onChange={(e) => setDataDevolucao(e.target.value)}
                                        min={getDataAtual()}
                                        disabled={processando}
                                    />
                                    <span className="form-hint">Opcional</span>
                                </div>
                            )}

                            {/* Observação */}
                            <div className="form-group">
                                <label className="form-label">Observação</label>
                                <textarea
                                    className="form-textarea"
                                    value={observacao}
                                    onChange={(e) => setObservacao(e.target.value)}
                                    placeholder="Adicione informações adicionais (opcional)"
                                    rows={3}
                                    disabled={processando}
                                />
                            </div>

                            {/* Ações */}
                            <div className="form-actions">
                                <button
                                    className="btn btn-success btn-block"
                                    onClick={registrarMovimentacao}
                                    disabled={processando}
                                >
                                    {processando ? '⏳ Processando...' : '✓ Registrar Movimentação'}
                                </button>
                                <button
                                    className="btn btn-secondary btn-block"
                                    onClick={limparForm}
                                    disabled={processando}
                                >
                                    🗑️ Limpar Formulário
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}