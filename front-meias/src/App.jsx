import { useState } from "react";
import "./App.css";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Materiais from "./pages/Materiais";
import Estoque from "./pages/Estoque";

export default function App() {
  // Estado de navegação
  const [view, setView] = useState("login"); // 'login' | 'home' | 'produtos' | 'estoque'
  const [user, setUser] = useState(null); // {id, nome, email, tipo}

  // Handlers de autenticação
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setView("home");
  };

  const handleLogout = () => {
    setUser(null);
    setView("login");
  };

  const handleNavigate = (page) => {
    setView(page);
  };

  // Render das páginas
  return (
    <div className="app-container">
      {view === "login" && (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}

      {view === "home" && (
        <Home
          user={user}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}

      {view === "produtos" && (
        <Materiais
          user={user}
          onNavigate={handleNavigate}
        />
      )}

      {view === "estoque" && (
        <Estoque
          user={user}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}