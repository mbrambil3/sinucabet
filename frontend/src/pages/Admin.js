import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';

export const Admin = () => {
  const { API } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [games, setGames] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  // Create game form
  const [createGameOpen, setCreateGameOpen] = useState(false);
  const [playerA, setPlayerA] = useState('');
  const [playerB, setPlayerB] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  
  // Finish game
  const [finishGameId, setFinishGameId] = useState(null);
  const [winner, setWinner] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [statsRes, gamesRes, transactionsRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/games/`),
        axios.get(`${API}/transactions/pending`)
      ]);
      
      setStats(statsRes.data);
      setGames(gamesRes.data);
      setTransactions(transactionsRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados do admin');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGame = async (e) => {
    e.preventDefault();
    
    if (!playerA || !playerB || !matchDate) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setCreating(true);
    try {
      await axios.post(`${API}/games/`, {
        player_a: playerA,
        player_b: playerB,
        match_date: new Date(matchDate).toISOString(),
        description: description || null
      });
      
      toast.success('Jogo criado com sucesso!');
      setCreateGameOpen(false);
      setPlayerA('');
      setPlayerB('');
      setMatchDate('');
      setDescription('');
      await fetchAdminData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar jogo');
    } finally {
      setCreating(false);
    }
  };

  const handleStartGame = async (gameId) => {
    try {
      await axios.put(`${API}/games/${gameId}`, {
        status: 'live'
      });
      
      toast.success('Jogo iniciado!');
      await fetchAdminData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao iniciar jogo');
    }
  };

  const handleFinishGame = async () => {
    if (!winner) {
      toast.error('Selecione o vencedor');
      return;
    }

    try {
      await axios.put(`${API}/games/${finishGameId}`, {
        status: 'finished',
        winner: winner
      });
      
      toast.success('Jogo finalizado!');
      setFinishGameId(null);
      setWinner('');
      await fetchAdminData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao finalizar jogo');
    }
  };

  const handleCancelGame = async (gameId) => {
    try {
      await axios.put(`${API}/games/${gameId}`, {
        status: 'cancelled'
      });
      
      toast.success('Jogo cancelado!');
      await fetchAdminData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao cancelar jogo');
    }
  };

  const handleApproveTransaction = async (transactionId) => {
    try {
      await axios.put(`${API}/transactions/${transactionId}/approve`);
      toast.success('Transação aprovada!');
      await fetchAdminData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao aprovar transação');
    }
  };

  const handleRejectTransaction = async (transactionId) => {
    try {
      await axios.put(`${API}/transactions/${transactionId}/reject`);
      toast.success('Transação rejeitada!');
      await fetchAdminData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao rejeitar transação');
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

  const getTransactionTypeBadge = (type) => {
    return type === 'deposit' ? 'bg-primary text-black' : 'bg-red-500 text-white';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-zinc-400">Carregando...</div>
      </div>
    );
  }

  const activeGames = games.filter(g => g.status === 'upcoming' || g.status === 'live');
  const finishedGames = games.filter(g => g.status === 'finished' || g.status === 'cancelled');

  return (
    <div className="min-h-screen py-12" data-testid="admin-page">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-heading text-5xl font-bold text-white uppercase mb-4">
            Painel Admin
          </h1>
          <p className="text-zinc-400 text-lg">Gerencie jogos, apostas e transações da plataforma</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12" data-testid="admin-stats-section">
          <div className="glass-effect rounded-lg p-6">
            <div className="text-sm text-zinc-400 uppercase tracking-wider mb-2 font-mono">Total Usuários</div>
            <div className="font-mono text-4xl font-bold text-primary">{stats?.total_users || 0}</div>
          </div>
          <div className="glass-effect rounded-lg p-6">
            <div className="text-sm text-zinc-400 uppercase tracking-wider mb-2 font-mono">Total Jogos</div>
            <div className="font-mono text-4xl font-bold text-secondary">{stats?.total_games || 0}</div>
          </div>
          <div className="glass-effect rounded-lg p-6">
            <div className="text-sm text-zinc-400 uppercase tracking-wider mb-2 font-mono">Total Apostado</div>
            <div className="font-mono text-4xl font-bold text-white">R$ {stats?.total_bets?.toFixed(0) || 0}</div>
          </div>
          <div className="glass-effect rounded-lg p-6">
            <div className="text-sm text-zinc-400 uppercase tracking-wider mb-2 font-mono">Transações Pendentes</div>
            <div className="font-mono text-4xl font-bold text-red-400">{transactions.length}</div>
          </div>
        </div>

        {/* Create Game Button */}
        <div className="mb-8">
          <Dialog open={createGameOpen} onOpenChange={setCreateGameOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-black font-bold hover:bg-primary/90" data-testid="create-game-trigger">
                + Criar Novo Jogo
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-white/10" data-testid="create-game-dialog">
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl text-white uppercase">Criar Novo Jogo</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateGame} className="space-y-4">
                <div>
                  <Label className="text-zinc-300 mb-2 block">Jogador A</Label>
                  <Input
                    type="text"
                    value={playerA}
                    onChange={(e) => setPlayerA(e.target.value)}
                    placeholder="Nome do Jogador A"
                    required
                    className="bg-zinc-950 border-white/10 text-white h-12"
                    data-testid="player-a-input"
                  />
                </div>
                <div>
                  <Label className="text-zinc-300 mb-2 block">Jogador B</Label>
                  <Input
                    type="text"
                    value={playerB}
                    onChange={(e) => setPlayerB(e.target.value)}
                    placeholder="Nome do Jogador B"
                    required
                    className="bg-zinc-950 border-white/10 text-white h-12"
                    data-testid="player-b-input"
                  />
                </div>
                <div>
                  <Label className="text-zinc-300 mb-2 block">Data e Hora do Jogo</Label>
                  <Input
                    type="datetime-local"
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    required
                    className="bg-zinc-950 border-white/10 text-white h-12"
                    data-testid="match-date-input"
                  />
                </div>
                <div>
                  <Label className="text-zinc-300 mb-2 block">Descrição (opcional)</Label>
                  <Input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição do jogo"
                    className="bg-zinc-950 border-white/10 text-white h-12"
                    data-testid="description-input"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={creating}
                  className="w-full bg-primary text-black font-bold"
                  data-testid="submit-create-game"
                >
                  {creating ? 'Criando...' : 'Criar Jogo'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Games Management */}
        <div className="glass-effect rounded-lg p-8 mb-8">
          <h2 className="font-heading text-2xl font-bold text-white uppercase mb-6">Gerenciar Jogos</h2>
          
          <Tabs defaultValue="active" data-testid="game-tabs">
            <TabsList className="bg-zinc-900 border-white/10 mb-6">
              <TabsTrigger value="active" className="data-[state=active]:bg-primary data-[state=active]:text-black" data-testid="active-games-tab">
                Jogos Ativos
              </TabsTrigger>
              <TabsTrigger value="finished" className="data-[state=active]:bg-primary data-[state=active]:text-black" data-testid="finished-games-tab">
                Jogos Finalizados
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {activeGames.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">Nenhum jogo ativo</p>
              ) : (
                <div className="space-y-4">
                  {activeGames.map(game => (
                    <div key={game.id} className="p-6 bg-zinc-900/50 rounded-lg" data-testid={`game-card-${game.id}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`${getStatusBadge(game.status)} px-3 py-1 rounded-full text-xs font-bold uppercase`}>
                              {getStatusText(game.status)}
                            </span>
                          </div>
                          <div className="font-heading text-2xl font-bold text-white mb-2">
                            {game.player_a} vs {game.player_b}
                          </div>
                          <div className="text-sm text-zinc-400 font-mono">
                            {new Date(game.match_date).toLocaleString('pt-BR')}
                          </div>
                          {game.description && (
                            <p className="text-sm text-zinc-500 mt-2">{game.description}</p>
                          )}
                          <div className="flex gap-6 mt-3 text-sm">
                            <div>
                              <span className="text-zinc-500">Total Apostado A:</span>
                              <span className="text-primary font-mono ml-2">R$ {game.total_bets_a?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div>
                              <span className="text-zinc-500">Total Apostado B:</span>
                              <span className="text-primary font-mono ml-2">R$ {game.total_bets_b?.toFixed(2) || '0.00'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          {game.status === 'upcoming' && (
                            <Button
                              onClick={() => handleStartGame(game.id)}
                              size="sm"
                              className="bg-green-600 text-white hover:bg-green-700"
                              data-testid={`start-game-${game.id}`}
                            >
                              Iniciar Jogo
                            </Button>
                          )}
                          {(game.status === 'live' || game.status === 'upcoming') && (
                            <>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    onClick={() => {
                                      setFinishGameId(game.id);
                                      setWinner('');
                                    }}
                                    size="sm"
                                    className="bg-primary text-black hover:bg-primary/90"
                                    data-testid={`finish-game-${game.id}`}
                                  >
                                    Finalizar
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-zinc-900 border-white/10">
                                  <DialogHeader>
                                    <DialogTitle className="font-heading text-2xl text-white uppercase">Finalizar Jogo</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <p className="text-zinc-400">Selecione o vencedor do jogo:</p>
                                    <div className="space-y-2">
                                      <Button
                                        onClick={() => setWinner(game.player_a)}
                                        variant={winner === game.player_a ? 'default' : 'outline'}
                                        className={`w-full ${winner === game.player_a ? 'bg-primary text-black' : 'border-white/10 text-white'}`}
                                      >
                                        {game.player_a}
                                      </Button>
                                      <Button
                                        onClick={() => setWinner(game.player_b)}
                                        variant={winner === game.player_b ? 'default' : 'outline'}
                                        className={`w-full ${winner === game.player_b ? 'bg-primary text-black' : 'border-white/10 text-white'}`}
                                      >
                                        {game.player_b}
                                      </Button>
                                    </div>
                                    <Button
                                      onClick={handleFinishGame}
                                      disabled={!winner}
                                      className="w-full bg-primary text-black font-bold"
                                    >
                                      Confirmar Vencedor
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button
                                onClick={() => handleCancelGame(game.id)}
                                size="sm"
                                variant="outline"
                                className="border-red-500 text-red-500 hover:bg-red-500/10"
                                data-testid={`cancel-game-${game.id}`}
                              >
                                Cancelar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="finished">
              {finishedGames.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">Nenhum jogo finalizado</p>
              ) : (
                <div className="space-y-4">
                  {finishedGames.map(game => (
                    <div key={game.id} className="p-6 bg-zinc-900/50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`${getStatusBadge(game.status)} px-3 py-1 rounded-full text-xs font-bold uppercase`}>
                              {getStatusText(game.status)}
                            </span>
                          </div>
                          <div className="font-heading text-2xl font-bold text-white mb-2">
                            {game.player_a} vs {game.player_b}
                          </div>
                          <div className="text-sm text-zinc-400 font-mono mb-2">
                            {new Date(game.match_date).toLocaleString('pt-BR')}
                          </div>
                          {game.winner && (
                            <div className="text-sm mb-2">
                              <span className="text-zinc-500">Vencedor:</span>
                              <span className="text-primary font-bold ml-2">{game.winner}</span>
                            </div>
                          )}
                          <div className="flex gap-6 text-sm">
                            <div>
                              <span className="text-zinc-500">Total Apostado:</span>
                              <span className="text-primary font-mono ml-2">
                                R$ {((game.total_bets_a || 0) + (game.total_bets_b || 0)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Pending Transactions */}
        <div className="glass-effect rounded-lg p-8" data-testid="pending-transactions-section">
          <h2 className="font-heading text-2xl font-bold text-white uppercase mb-6">
            Transações Pendentes ({transactions.length})
          </h2>
          
          {transactions.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">Nenhuma transação pendente</p>
          ) : (
            <div className="space-y-4">
              {transactions.map(tx => (
                <div key={tx.id} className="p-6 bg-zinc-900/50 rounded-lg" data-testid={`transaction-${tx.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`${getTransactionTypeBadge(tx.type)} px-3 py-1 rounded-full text-xs font-bold uppercase`}>
                          {tx.type === 'deposit' ? 'Depósito' : 'Saque'}
                        </span>
                        <span className="text-xs text-zinc-500 font-mono">
                          {new Date(tx.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="mb-2">
                        <span className="text-zinc-500 text-sm">Usuário:</span>
                        <span className="text-white ml-2">{tx.user_email}</span>
                      </div>
                      <div className="mb-2">
                        <span className="text-zinc-500 text-sm">Valor:</span>
                        <span className="text-primary font-mono text-xl ml-2">R$ {tx.amount.toFixed(2)}</span>
                      </div>
                      {tx.pix_key && (
                        <div className="mb-2">
                          <span className="text-zinc-500 text-sm">Chave PIX:</span>
                          <span className="text-white ml-2 font-mono">{tx.pix_key}</span>
                        </div>
                      )}
                      {tx.pix_code && (
                        <div className="mt-3">
                          <div className="text-xs text-zinc-500 mb-1">Código PIX:</div>
                          <div className="flex gap-2 items-center">
                            <code className="text-xs bg-zinc-950 p-2 rounded font-mono text-primary break-all flex-1">
                              {tx.pix_code}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(tx.pix_code);
                                toast.success('Código copiado!');
                              }}
                              className="border-white/10"
                            >
                              Copiar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        onClick={() => handleApproveTransaction(tx.id)}
                        size="sm"
                        className="bg-green-600 text-white hover:bg-green-700"
                        data-testid={`approve-transaction-${tx.id}`}
                      >
                        Aprovar
                      </Button>
                      <Button
                        onClick={() => handleRejectTransaction(tx.id)}
                        size="sm"
                        variant="outline"
                        className="border-red-500 text-red-500 hover:bg-red-500/10"
                        data-testid={`reject-transaction-${tx.id}`}
                      >
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
