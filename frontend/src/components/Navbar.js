import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="glass-effect sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" data-testid="nav-logo">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-xl">S</span>
            </div>
            <span className="font-heading text-2xl font-bold text-white uppercase tracking-tight">
              SnookerBet
            </span>
          </Link>

          <div className="flex items-center gap-6">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link to="/admin" data-testid="nav-admin-link">
                    <Button variant="ghost" className="text-zinc-400 hover:text-white">
                      Admin
                    </Button>
                  </Link>
                )}
                <Link to="/dashboard" data-testid="nav-dashboard-link">
                  <Button variant="ghost" className="text-zinc-400 hover:text-white">
                    Jogos
                  </Button>
                </Link>
                <Link to="/wallet" data-testid="nav-wallet-link">
                  <Button variant="ghost" className="text-zinc-400 hover:text-white">
                    Carteira
                  </Button>
                </Link>
                <Link to="/profile" data-testid="nav-profile-link">
                  <Button variant="ghost" className="text-zinc-400 hover:text-white">
                    Perfil
                  </Button>
                </Link>
                <div className="flex items-center gap-3 ml-4" data-testid="user-balance-display">
                  <div className="text-right">
                    <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Saldo</div>
                    <div className="text-lg font-bold text-primary font-mono">R$ {user.balance?.toFixed(2) || '0.00'}</div>
                  </div>
                  <Button onClick={handleLogout} variant="outline" className="border-white/10" data-testid="logout-button">
                    Sair
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" data-testid="nav-login-link">
                  <Button variant="ghost" className="text-zinc-400 hover:text-white">
                    Login
                  </Button>
                </Link>
                <Link to="/register" data-testid="nav-register-link">
                  <Button className="bg-primary text-black hover:bg-primary/90" data-testid="register-cta-button">
                    Registrar
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};