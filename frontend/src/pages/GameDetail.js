import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

export const GameDetail = () => {
  const { gameId } = useParams();
  const { user, API, refreshBalance } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [betsInfo, setBetsInfo] = useState(null);
  const [userBets, setUserBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    fetchGameData();
  }, [gameId]);

  const fetchGameData = async () => {
    try {
      const [gameRes, betsRes, userBetsRes] = await Promise.all([
        axios.get(`${API}/games/${gameId}`),
        axios.get(`${API}/bets/game/${gameId}`),
        axios.get(`${API}/bets/`, { params: { game_id: gameId } })
      ]);
      
      setGame(gameRes.data);
      setBetsInfo(betsRes.data);
      setUserBets(userBetsRes.data);
    } catch (error) {
      toast.error('Erro ao carregar jogo');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBet = async () => {
    if (!selectedPlayer || !betAmount || parseFloat(betAmount) <= 0) {
      toast.error('Selecione um jogador e insira um valor válido');
      return;
    }

    if (parseFloat(betAmount) > user.balance) {
      toast.error('Saldo insuficiente');
      return;
    }

    setPlacing(true);
    try {
      await axios.post(`${API}/bets/`, {
        game_id: gameId,
        player_choice: selectedPlayer,
        amount: parseFloat(betAmount)
      });
      
      toast.success('Aposta realizada com sucesso!');
      setBetAmount('');
      setSelectedPlayer(null);
      await refreshBalance();
      await fetchGameData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao realizar aposta');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-zinc-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12" data-testid="game-detail-page">
      <div className="max-w-6xl mx-auto px-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6 text-zinc-400 hover:text-white"
          data-testid="back-to-dashboard"
        >
          ← Voltar aos Jogos
        </Button>

        {/* Game Header */}
        <div className="glass-effect rounded-lg p-8 mb-8" data-testid="game-header">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-heading text-4xl font-bold text-white uppercase">
              {game.player_a} vs {game.player_b}
            </h1>
            <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase ${
              game.status === 'live' ? 'bg-red-500 text-white' :
              game.status === 'upcoming' ? 'bg-secondary text-black' :
              'bg-zinc-700 text-white'
            }`}>
              {game.status === 'live' && <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse mr-2"></span>}
              {game.status === 'live' ? 'AO VIVO' : game.status === 'upcoming' ? 'EM BREVE' : 'FINALIZADO'}
            </span>
          </div>

          {game.description && (
            <p className="text-zinc-400 mb-4">{game.description}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-zinc-500 font-mono">
            <span>Data: {new Date(game.match_date).toLocaleString('pt-BR')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Betting Section */}
          <div className="lg:col-span-2">
            <div className="glass-effect rounded-lg p-8 mb-8" data-testid="betting-section">
              <h2 className="font-heading text-2xl font-bold text-white uppercase mb-6">Fazer Aposta</h2>

              {/* Player Selection */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setSelectedPlayer(game.player_a)}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    selectedPlayer === game.player_a
                      ? 'border-primary bg-primary/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  data-testid="select-player-a"
                >
                  <div className="font-heading text-xl font-bold text-white mb-2">{game.player_a}</div>
                  <div className="text-sm text-zinc-400">Total apostado</div>
                  <div className="font-mono text-lg text-primary">R$ {betsInfo?.player_a_bets?.total?.toFixed(2) || '0.00'}</div>
                </button>

                <button
                  onClick={() => setSelectedPlayer(game.player_b)}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    selectedPlayer === game.player_b
                      ? 'border-primary bg-primary/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  data-testid="select-player-b"
                >
                  <div className="font-heading text-xl font-bold text-white mb-2">{game.player_b}</div>
                  <div className="text-sm text-zinc-400">Total apostado</div>
                  <div className="font-mono text-lg text-primary">R$ {betsInfo?.player_b_bets?.total?.toFixed(2) || '0.00'}</div>
                </button>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <Label className="text-zinc-300 mb-2 block">Valor da Aposta (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-zinc-950/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-md h-14 text-white text-2xl font-mono"
                  data-testid="bet-amount-input"
                />
                <p className="text-xs text-zinc-500 mt-2">Saldo disponível: R$ {user.balance?.toFixed(2) || '0.00'}</p>
              </div>

              {/* Quick Bet Buttons */}
              <div className="flex gap-2 mb-6">
                {[50, 100, 200, 500].map(amount => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setBetAmount(amount.toString())}
                    className="border-white/10 text-white hover:bg-white/5"
                    data-testid={`quick-bet-${amount}`}
                  >
                    R$ {amount}
                  </Button>
                ))}
              </div>

              <Button
                onClick={handlePlaceBet}
                disabled={placing || !selectedPlayer || game.status === 'finished'}
                className="w-full bg-primary text-black font-bold uppercase tracking-wider hover:bg-primary/90 hover:shadow-neon transition-all duration-300 rounded-sm h-14 text-lg"
                data-testid="place-bet-button"
              >
                {placing ? 'Processando...' : 'Confirmar Aposta'}
              </Button>
            </div>

            {/* User's Bets */}
            {userBets.length > 0 && (
              <div className="glass-effect rounded-lg p-8" data-testid="user-bets-section">
                <h3 className="font-heading text-xl font-bold text-white uppercase mb-4">Suas Apostas Neste Jogo</h3>
                <div className="space-y-3">
                  {userBets.map(bet => (
                    <div key={bet.id} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg" data-testid={`user-bet-${bet.id}`}>
                      <div>
                        <div className="font-semibold text-white">{bet.player_choice}</div>
                        <div className="text-sm text-zinc-400">
                          {bet.matched_amount >= bet.amount ? 'Totalmente combinada' : `R$ ${bet.matched_amount.toFixed(2)} de R$ ${bet.amount.toFixed(2)} combinada`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-lg text-primary">R$ {bet.amount.toFixed(2)}</div>
                        <div className={`text-xs font-bold uppercase ${
                          bet.status === 'matched' ? 'text-primary' :
                          bet.status === 'won' ? 'text-green-500' :
                          bet.status === 'lost' ? 'text-red-500' :
                          'text-zinc-500'
                        }`}>
                          {bet.status === 'pending' ? 'Aguardando' :
                           bet.status === 'matched' ? 'Combinada' :
                           bet.status === 'won' ? 'Venceu' : 'Perdeu'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Match Stats */}
            <div className="glass-effect rounded-lg p-6" data-testid="match-stats">
              <h3 className="font-heading text-lg font-bold text-white uppercase mb-4">Estatísticas</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-zinc-400 mb-1">Total Apostado</div>
                  <div className="font-mono text-2xl text-primary">R$ {(betsInfo?.player_a_bets?.total + betsInfo?.player_b_bets?.total || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-zinc-400 mb-1">Total Combinado</div>
                  <div className="font-mono text-2xl text-secondary">R$ {(betsInfo?.total_matched * 2 || 0).toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Bet Distribution */}
            <div className="glass-effect rounded-lg p-6" data-testid="bet-distribution">
              <h3 className="font-heading text-lg font-bold text-white uppercase mb-4">Distribuição</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-white">{game.player_a}</span>
                    <span className="text-sm text-primary font-mono">R$ {betsInfo?.player_a_bets?.total?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${(betsInfo?.player_a_bets?.total / (betsInfo?.player_a_bets?.total + betsInfo?.player_b_bets?.total) * 100) || 0}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-white">{game.player_b}</span>
                    <span className="text-sm text-primary font-mono">R$ {betsInfo?.player_b_bets?.total?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${(betsInfo?.player_b_bets?.total / (betsInfo?.player_a_bets?.total + betsInfo?.player_b_bets?.total) * 100) || 0}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};