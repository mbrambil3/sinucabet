import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export const Dashboard = () => {
  const { user, API } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('live');

  useEffect(() => {
    fetchGames();
  }, [filter]);

  const fetchGames = async () => {
    try {
      const response = await axios.get(`${API}/games/`, {
        params: { status: filter === 'all' ? null : filter }
      });
      setGames(response.data);
    } catch (error) {
      toast.error('Erro ao carregar jogos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      live: 'bg-red-500 text-white',
      upcoming: 'bg-secondary text-black',
      finished: 'bg-zinc-700 text-white',
      cancelled: 'bg-zinc-800 text-zinc-400'
    };
    return badges[status] || 'bg-zinc-700';
  };

  const getStatusText = (status) => {
    const texts = {
      live: 'AO VIVO',
      upcoming: 'EM BREVE',
      finished: 'FINALIZADO',
      cancelled: 'CANCELADO'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-zinc-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12" data-testid="dashboard-page">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-heading text-5xl font-bold text-white uppercase mb-4" data-testid="dashboard-title">
            Jogos Disponíveis
          </h1>
          <p className="text-zinc-400 text-lg">Escolha um jogo e faça sua aposta</p>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8" data-testid="game-filters">
          <Button
            onClick={() => setFilter('live')}
            variant={filter === 'live' ? 'default' : 'outline'}
            className={filter === 'live' ? 'bg-primary text-black' : 'border-white/10 text-white hover:bg-white/5'}
            data-testid="filter-live"
          >
            Ao Vivo
          </Button>
          <Button
            onClick={() => setFilter('upcoming')}
            variant={filter === 'upcoming' ? 'default' : 'outline'}
            className={filter === 'upcoming' ? 'bg-primary text-black' : 'border-white/10 text-white hover:bg-white/5'}
            data-testid="filter-upcoming"
          >
            Em Breve
          </Button>
          <Button
            onClick={() => setFilter('finished')}
            variant={filter === 'finished' ? 'default' : 'outline'}
            className={filter === 'finished' ? 'bg-primary text-black' : 'border-white/10 text-white hover:bg-white/5'}
            data-testid="filter-finished"
          >
            Finalizados
          </Button>
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'default' : 'outline'}
            className={filter === 'all' ? 'bg-primary text-black' : 'border-white/10 text-white hover:bg-white/5'}
            data-testid="filter-all"
          >
            Todos
          </Button>
        </div>

        {/* Games Grid */}
        {games.length === 0 ? (
          <div className="glass-effect rounded-lg p-12 text-center" data-testid="no-games-message">
            <p className="text-zinc-400 text-lg">Nenhum jogo encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <div
                key={game.id}
                className="glass-effect rounded-lg p-6 hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => navigate(`/game/${game.id}`)}
                data-testid={`game-card-${game.id}`}
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`${getStatusBadge(game.status)} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2`}>
                    {game.status === 'live' && <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>}
                    {getStatusText(game.status)}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">
                    {new Date(game.match_date).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                {/* Players */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-heading text-xl font-semibold text-white mb-1">{game.player_a}</div>
                      <div className="text-sm text-zinc-500">Total: R$ {game.total_bets_a?.toFixed(2) || '0.00'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-white/10"></div>
                    <span className="text-zinc-600 font-bold">VS</span>
                    <div className="flex-1 h-px bg-white/10"></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-heading text-xl font-semibold text-white mb-1">{game.player_b}</div>
                      <div className="text-sm text-zinc-500">Total: R$ {game.total_bets_b?.toFixed(2) || '0.00'}</div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {game.description && (
                  <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{game.description}</p>
                )}

                {/* Action Button */}
                {game.status === 'live' || game.status === 'upcoming' ? (
                  <Button
                    className="w-full bg-primary text-black font-bold hover:bg-primary/90"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/game/${game.id}`);
                    }}
                    data-testid={`bet-button-${game.id}`}
                  >
                    Apostar Agora
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-white/10 text-zinc-400"
                    disabled
                  >
                    Ver Detalhes
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};