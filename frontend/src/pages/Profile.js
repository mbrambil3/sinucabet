import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

export const Profile = () => {
  const { user, API, fetchProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  
  // Stats
  const [stats, setStats] = useState(null);
  
  // Bets history
  const [bets, setBets] = useState([]);
  const [betsFilter, setBetsFilter] = useState('all');
  const [filteredBets, setFilteredBets] = useState([]);

  useEffect(() => {
    fetchProfileData();
  }, []);

  useEffect(() => {
    filterBets();
  }, [bets, betsFilter]);

  const fetchProfileData = async () => {
    try {
      const [profileRes, statsRes, betsRes] = await Promise.all([
        axios.get(`${API}/user/profile`),
        axios.get(`${API}/user/balance`),
        axios.get(`${API}/bets/`)
      ]);
      
      setName(profileRes.data.name);
      setEmail(profileRes.data.email);
      setCpf(profileRes.data.cpf || '');
      setStats(statsRes.data);
      setBets(betsRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados do perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await axios.put(`${API}/user/profile`, {
        name,
        cpf: cpf || null
      });
      
      toast.success('Perfil atualizado com sucesso!');
      // Refresh user data in context
      if (fetchProfile) {
        await fetchProfile();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const filterBets = () => {
    if (betsFilter === 'all') {
      setFilteredBets(bets);
    } else {
      setFilteredBets(bets.filter(bet => bet.status === betsFilter));
    }
  };

  const getBetStatusBadge = (status) => {
    const badges = {
      pending: 'bg-zinc-700 text-zinc-300',
      matched: 'bg-primary text-black',
      won: 'bg-green-500 text-white',
      lost: 'bg-red-500 text-white',
      cancelled: 'bg-zinc-800 text-zinc-400'
    };
    return badges[status] || 'bg-zinc-700';
  };

  const getBetStatusText = (status) => {
    const texts = {
      pending: 'Aguardando',
      matched: 'Combinada',
      won: 'Venceu',
      lost: 'Perdeu',
      cancelled: 'Cancelada'
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
    <div className="min-h-screen py-12" data-testid="profile-page">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-heading text-5xl font-bold text-white uppercase mb-4">
            Meu Perfil
          </h1>
          <p className="text-zinc-400 text-lg">Gerencie suas informações e acompanhe suas estatísticas</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Edit */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Info */}
            <div className="glass-effect rounded-lg p-8" data-testid="edit-profile-form">
              <h2 className="font-heading text-2xl font-bold text-white uppercase mb-6">Informações Pessoais</h2>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-zinc-300 mb-2 block">Nome Completo</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-zinc-950/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-md h-12 text-white"
                    data-testid="name-input"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-zinc-300 mb-2 block">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-zinc-950/50 border-white/10 rounded-md h-12 text-zinc-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-zinc-500 mt-1">Email não pode ser alterado</p>
                </div>

                <div>
                  <Label htmlFor="cpf" className="text-zinc-300 mb-2 block">CPF</Label>
                  <Input
                    id="cpf"
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="bg-zinc-950/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-md h-12 text-white"
                    data-testid="cpf-input"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-primary text-black font-bold uppercase tracking-wider hover:bg-primary/90 hover:shadow-neon transition-all duration-300 rounded-sm h-12"
                  data-testid="save-profile-button"
                >
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </form>
            </div>

            {/* Bets History */}
            <div className="glass-effect rounded-lg p-8" data-testid="bets-history-section">
              <h2 className="font-heading text-2xl font-bold text-white uppercase mb-6">Histórico de Apostas</h2>
              
              {/* Filters */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {[
                  { value: 'all', label: 'Todas' },
                  { value: 'pending', label: 'Pendentes' },
                  { value: 'matched', label: 'Combinadas' },
                  { value: 'won', label: 'Vencedoras' },
                  { value: 'lost', label: 'Perdidas' }
                ].map(filter => (
                  <Button
                    key={filter.value}
                    onClick={() => setBetsFilter(filter.value)}
                    variant={betsFilter === filter.value ? 'default' : 'outline'}
                    size="sm"
                    className={betsFilter === filter.value ? 'bg-primary text-black' : 'border-white/10 text-white hover:bg-white/5'}
                    data-testid={`bet-filter-${filter.value}`}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>

              {/* Bets List */}
              {filteredBets.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">Nenhuma aposta encontrada</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredBets.map(bet => (
                    <div
                      key={bet.id}
                      className="p-4 bg-zinc-900/50 rounded-lg hover:bg-zinc-900/70 transition-colors cursor-pointer"
                      onClick={() => navigate(`/game/${bet.game_id}`)}
                      data-testid={`bet-card-${bet.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="text-white font-semibold mb-1">
                            Aposta em {bet.player_choice}
                          </div>
                          <div className="text-xs text-zinc-500 font-mono">
                            {new Date(bet.created_at).toLocaleString('pt-BR')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-lg text-primary mb-1">
                            R$ {bet.amount.toFixed(2)}
                          </div>
                          <span className={`${getBetStatusBadge(bet.status)} px-2 py-1 rounded-full text-xs font-bold uppercase`}>
                            {getBetStatusText(bet.status)}
                          </span>
                        </div>
                      </div>
                      {bet.matched_amount < bet.amount && bet.status === 'pending' && (
                        <div className="text-xs text-zinc-500 mt-2">
                          Combinado: R$ {bet.matched_amount.toFixed(2)} de R$ {bet.amount.toFixed(2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <div className="glass-effect rounded-lg p-6" data-testid="stats-section">
              <h3 className="font-heading text-lg font-bold text-white uppercase mb-6">Estatísticas</h3>
              <div className="space-y-6">
                <div>
                  <div className="text-sm text-zinc-400 uppercase tracking-wider mb-2 font-mono">Saldo Atual</div>
                  <div className="font-mono text-3xl text-primary font-bold">
                    R$ {stats?.balance?.toFixed(2) || '0.00'}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <div className="text-sm text-zinc-400 uppercase tracking-wider mb-2 font-mono">Total Depositado</div>
                  <div className="font-mono text-xl text-white">
                    R$ {stats?.total_deposited?.toFixed(2) || '0.00'}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <div className="text-sm text-zinc-400 uppercase tracking-wider mb-2 font-mono">Total Apostado</div>
                  <div className="font-mono text-xl text-white">
                    R$ {stats?.total_bet?.toFixed(2) || '0.00'}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <div className="text-sm text-zinc-400 uppercase tracking-wider mb-2 font-mono">Total de Ganhos</div>
                  <div className="font-mono text-xl text-green-500">
                    R$ {stats?.total_won?.toFixed(2) || '0.00'}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <div className="text-sm text-zinc-400 uppercase tracking-wider mb-2 font-mono">Apostas Totais</div>
                  <div className="font-mono text-xl text-white">
                    {bets.length}
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
