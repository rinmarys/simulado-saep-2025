import { useState, useEffect, useMemo } from 'react';
import './Materiais.css';

export default function Materiais({ user, onNavigate }) {
    const [materiais, setMateriais] = useState([]);
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState('');

    // Form state
    const emptyForm = { id: null, nome: '', quantidade: 0, estoque_minimo: 0 };
    const [form, setForm] = useState(emptyForm);
    const [editandoId, setEditandoId] = useState(null);

    // Carregar materiais
    const carregarMateriais = async (term = q) => {
        setLoading(true);
        try {
            const url = term.trim()
                ? `http://localhost:3000/materiais?q=${encodeURIComponent(term)}`
                : 'http://localhost:3000/materiais';

            const response = await fetch(url);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Ordenar alfabeticamente
    const materiaisOrdenados = useMemo(() => {
        return [...materiais].sort((a, b) =>
            a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
        );
    }, [materiais]);

    // Buscar
    const buscar = async (e) => {
        e?.preventDefault();
        await carregarMateriais(q);
    };

    const limparBusca = () => {
        setQ('');
        carregarMateriais('');
    };

    // Form handlers
    const limparForm = () => {
        setForm(emptyForm);
        setEditandoId(null);
    };

    const validarForm = () => {
        if (!form.nome.trim()) return 'Informe o nome do material.';
        if (Number(form.quantidade) < 0) return 'Quantidade não pode ser negativa.';
        if (Number(form.estoque_minimo) < 0) return 'Estoque mínimo não pode ser negativo.';
        return null;
    };

    const criarMaterial = async () => {
        const erro = validarForm();
        if (erro) return alert(erro);

        try {
            const response = await fetch('http://localhost:3000/materiais', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: form.nome.trim(),
                    quantidade: Number(form.quantidade),
                    estoque_minimo: Number(form.estoque_minimo)
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erro ao criar material');
            }

            await carregarMateriais();
            limparForm();
            alert('Material cadastrado com sucesso!');
        } catch (error) {
            alert(error.message);
        }
    };

    const iniciarEdicao = (material) => {
        setEditandoId(material.id);
        setForm({
            id: material.id,
            nome: material.nome,
            quantidade: material.quantidade,
            estoque_minimo: material.estoque_minimo
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const salvarMaterial = async () => {
        if (!editandoId) return;

        const erro = validarForm();
        if (erro) return alert(erro);

        try {
            const response = await fetch(`http://localhost:3000/materiais/${editandoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: form.nome.trim(),
                    quantidade: Number(form.quantidade),
                    estoque_minimo: Number(form.estoque_minimo)
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erro ao salvar material');
            }

            await carregarMateriais();
            limparForm();
            alert('Material atualizado com sucesso!');
        } catch (error) {
            alert(error.message);
        }
    };

    const excluirMaterial = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este material?')) return;

        try {
            const response = await fetch(`http://localhost:3000/materiais/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erro ao excluir material');
            }

            await carregarMateriais();
            alert('Material excluído com sucesso!');
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="materiais-container">
            {/* Header */}
            <header className="materiais-header">
                <div className="header-content">
                    <div className="header-left">
                        <button className="back-button" onClick={() => onNavigate('home')}>
                            ← Voltar
                        </button>
                        <div>
                            <h1 className="page-title">Cadastro de Materiais</h1>
                            <p className="page-subtitle">Gerencie os materiais esportivos do estoque</p>
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

            <main className="materiais-main">
                {/* Busca */}
                <div className="search-section">
                    <form onSubmit={buscar} className="search-form">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="🔍 Buscar material por nome..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary">
                            Buscar
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={limparBusca}>
                            Limpar
                        </button>
                    </form>
                </div>

                {/* Formulário */}
                <div className="form-section">
                    <div className="form-header-section">
                        <h2 className="section-title">
                            {editandoId ? '✏️ Editar Material' : '➕ Novo Material'}
                        </h2>
                        {editandoId && (
                            <span className="editing-badge">Editando</span>
                        )}
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Nome do Material *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={form.nome}
                                onChange={(e) => setForm(s => ({ ...s, nome: e.target.value }))}
                                placeholder="Ex.: Bola de futebol, Coletes, Meias..."
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Quantidade em Estoque *</label>
                            <input
                                type="number"
                                className="form-input"
                                value={form.quantidade}
                                onChange={(e) => setForm(s => ({ ...s, quantidade: e.target.value }))}
                                min={0}
                                placeholder="0"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Estoque Mínimo *</label>
                            <input
                                type="number"
                                className="form-input"
                                value={form.estoque_minimo}
                                onChange={(e) => setForm(s => ({ ...s, estoque_minimo: e.target.value }))}
                                min={0}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        {editandoId ? (
                            <>
                                <button className="btn btn-success" onClick={salvarMaterial}>
                                    ✓ Salvar Alterações
                                </button>
                                <button className="btn btn-secondary" onClick={limparForm}>
                                    ✕ Cancelar
                                </button>
                            </>
                        ) : (
                            <button className="btn btn-primary" onClick={criarMaterial}>
                                ➕ Cadastrar Material
                            </button>
                        )}
                    </div>
                </div>

                {/* Listagem */}
                <div className="list-section">
                    <div className="list-header">
                        <h2 className="section-title">📦 Materiais Cadastrados</h2>
                        <span className="count-badge">{materiaisOrdenados.length} itens</span>
                    </div>

                    {loading ? (
                        <div className="loading">Carregando materiais...</div>
                    ) : materiaisOrdenados.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📭</div>
                            <p className="empty-text">Nenhum material cadastrado</p>
                            <p className="empty-subtext">Adicione o primeiro material usando o formulário acima</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="materiais-table">
                                <thead>
                                    <tr>
                                        <th className="th-left">Nome</th>
                                        <th className="th-center">Quantidade</th>
                                        <th className="th-center">Mínimo</th>
                                        <th className="th-center">Status</th>
                                        <th className="th-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {materiaisOrdenados.map((material) => (
                                        <tr key={material.id} className={material.quantidade < material.estoque_minimo ? 'row-alert' : ''}>
                                            <td className="td-left">
                                                <strong>{material.nome}</strong>
                                            </td>
                                            <td className="td-center">
                                                <span className="badge badge-qty">{material.quantidade}</span>
                                            </td>
                                            <td className="td-center">
                                                <span className="badge badge-min">{material.estoque_minimo}</span>
                                            </td>
                                            <td className="td-center">
                                                {material.quantidade < material.estoque_minimo ? (
                                                    <span className="status-badge status-warning">⚠️ Baixo</span>
                                                ) : (
                                                    <span className="status-badge status-ok">✓ OK</span>
                                                )}
                                            </td>
                                            <td className="td-center">
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-icon btn-edit"
                                                        onClick={() => iniciarEdicao(material)}
                                                        title="Editar"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        className="btn-icon btn-delete"
                                                        onClick={() => excluirMaterial(material.id)}
                                                        title="Excluir"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}