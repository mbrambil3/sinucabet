import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';

export const Wallet = () => {
  const { user, API, refreshBalance } = useAuth();
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixCode, setPixCode] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        axios.get(`${API}/user/balance`),
        axios.get(`${API}/user/transactions`)
      ]);
      setBalance(balanceRes.data);
      setTransactions(transactionsRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados da carteira');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Insira um valor válido');
      return;
    }

    if (parseFloat(depositAmount) > 3000) {
      toast.error('Valor máximo por transação: R$ 3000');
      return;
    }

    setProcessing(true);
    try {
      const response = await axios.post(`${API}/transactions/deposit`, {
        amount: parseFloat(depositAmount),
        type: 'deposit'
      });
      
      setPixCode(response.data.pix_code);
      toast.success('Código PIX gerado com sucesso!');
      setDepositAmount('');
      await fetchWalletData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar depósito');
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Insira um valor válido');
      return;
    }

    if (!pixKey) {
      toast.error('Insira sua chave PIX');
      return;
    }

    if (parseFloat(withdrawAmount) > balance.balance) {
      toast.error('Saldo insuficiente');
      return;
    }

    setProcessing(true);
    try {
      await axios.post(`${API}/transactions/withdrawal`, {
        amount: parseFloat(withdrawAmount),
        pix_key: pixKey,
        type: 'withdrawal'
      });
      
      toast.success('Solicitação de saque realizada! Processamento em até 24h.');
      setWithdrawAmount('');
      setPixKey('');
      await refreshBalance();
      await fetchWalletData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao solicitar saque');
    } finally {
      setProcessing(false);
    }
  };

  const getTransactionIcon = (type) => {
    const icons = {
      deposit: '↑',
      withdrawal: '↓',
      bet_placed: '🎱',
      bet_won: '🏆',
      bet_refund: '↻'
    };
    return icons[type] || '•';
  };

  const getTransactionColor = (type) => {
    const colors = {
      deposit: 'text-primary',
      withdrawal: 'text-red-400',
      bet_placed: 'text-zinc-400',
      bet_won: 'text-green-500',
      bet_refund: 'text-secondary'
    };
    return colors[type] || 'text-zinc-400';
  };

  const getTransactionLabel = (type) => {
    const labels = {
      deposit: 'Depósito',
      withdrawal: 'Saque',
      bet_placed: 'Aposta',
      bet_won: 'Prêmio',
      bet_refund: 'Reembolso'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-zinc-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12" data-testid="wallet-page">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-heading text-5xl font-bold text-white uppercase mb-4" data-testid="wallet-title">
            Carteira
          </h1>
          <p className="text-zinc-400 text-lg">Gerencie seus fundos e transações</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Balance Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Balance */}
            <div className="glass-effect rounded-lg p-8" data-testid="balance-card">
              <div className="text-sm text-zinc-400 uppercase tracking-wider mb-2 font-mono">Saldo Disponível</div>
              <div className="font-mono text-6xl font-bold text-primary mb-6" data-testid="current-balance">
                R$ {balance.balance?.toFixed(2) || '0.00'}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Depositado</div>
                  <div className="font-mono text-lg text-white">R$ {balance.total_deposited?.toFixed(2) || '0.00'}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Sacado</div>
                  <div className="font-mono text-lg text-white">R$ {balance.total_withdrawn?.toFixed(2) || '0.00'}</div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Apostado</div>
                  <div className="font-mono text-lg text-white">R$ {balance.total_bet?.toFixed(2) || '0.00'}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-6">
              {/* Deposit Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <div className="glass-effect rounded-lg p-8 cursor-pointer hover:border-primary/30 transition-all" data-testid="deposit-trigger">
                    <div className="text-4xl mb-4">↑</div>
                    <div className="font-heading text-2xl font-bold text-white uppercase">Depositar</div>
                    <div className="text-sm text-zinc-400 mt-2">Adicionar fundos via PIX</div>
                  </div>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-white/10" data-testid="deposit-dialog">
                  <DialogHeader>
                    <DialogTitle className="font-heading text-2xl text-white uppercase">Depósito via PIX</DialogTitle>
                  </DialogHeader>
                  {pixCode ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-zinc-950 rounded-lg">
                        <p className="text-sm text-zinc-400 mb-2">Código PIX (Copiar e Colar):</p>
                        <code className="block p-3 bg-zinc-900 rounded text-xs break-all text-primary font-mono">
                          {pixCode}
                        </code>
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(pixCode);
                            toast.success('Código copiado!');
                          }}
                          className="w-full mt-3"
                          variant="outline"
                          data-testid="copy-pix-button"
                        >
                          Copiar Código
                        </Button>
                      </div>
                      <p className="text-sm text-zinc-400">
                        1. Copie o código acima<br />
                        2. Abra seu aplicativo bancário<br />
                        3. Selecione PIX Copia e Cola<br />
                        4. Cole o código e confirme
                      </p>
                      <p className="text-xs text-zinc-500 font-mono">
                        * O saldo será creditado após confirmação do pagamento (demo: solicite confirmação ao admin)
                      </p>
                      <Button onClick={() => setPixCode(null)} variant="outline" className="w-full">
                        Novo Depósito
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-zinc-300 mb-2 block">Valor (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          placeholder="0.00"
                          className="bg-zinc-950 border-white/10 text-white h-12 text-2xl font-mono"
                          data-testid="deposit-amount-input"
                        />
                        <p className="text-xs text-zinc-500 mt-1">Máximo: R$ 3.000 por transação</p>
                      </div>
                      <div className="flex gap-2">
                        {[100, 200, 500, 1000].map(amount => (
                          <Button
                            key={amount}
                            variant="outline"
                            size="sm"
                            onClick={() => setDepositAmount(amount.toString())}
                            className="border-white/10 text-white"
                          >
                            R$ {amount}
                          </Button>
                        ))}
                      </div>
                      <Button
                        onClick={handleDeposit}
                        disabled={processing}
                        className="w-full bg-primary text-black font-bold"
                        data-testid="confirm-deposit-button"
                      >
                        {processing ? 'Gerando...' : 'Gerar Código PIX'}
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              {/* Withdraw Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <div className="glass-effect rounded-lg p-8 cursor-pointer hover:border-primary/30 transition-all" data-testid="withdraw-trigger">
                    <div className="text-4xl mb-4">↓</div>
                    <div className="font-heading text-2xl font-bold text-white uppercase">Sacar</div>
                    <div className="text-sm text-zinc-400 mt-2">Retirar fundos via PIX</div>
                  </div>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-white/10" data-testid="withdraw-dialog">
                  <DialogHeader>
                    <DialogTitle className="font-heading text-2xl text-white uppercase">Saque via PIX</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-zinc-300 mb-2 block">Valor (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0.00"
                        className="bg-zinc-950 border-white/10 text-white h-12 text-2xl font-mono"
                        data-testid="withdraw-amount-input"
                      />
                      <p className="text-xs text-zinc-500 mt-1">Saldo disponível: R$ {balance.balance?.toFixed(2)}</p>
                    </div>
                    <div>
                      <Label className="text-zinc-300 mb-2 block">Chave PIX</Label>
                      <Input
                        type="text"
                        value={pixKey}
                        onChange={(e) => setPixKey(e.target.value)}
                        placeholder="CPF, email, telefone ou chave aleatória"
                        className="bg-zinc-950 border-white/10 text-white h-12"
                        data-testid="pix-key-input"
                      />
                    </div>
                    <Button
                      onClick={handleWithdraw}
                      disabled={processing}
                      className="w-full bg-primary text-black font-bold"
                      data-testid="confirm-withdraw-button"
                    >
                      {processing ? 'Processando...' : 'Solicitar Saque'}
                    </Button>
                    <p className="text-xs text-zinc-500">
                      * Saques são processados em até 24 horas úteis (demo: solicite confirmação ao admin)
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Transactions */}
          <div className="glass-effect rounded-lg p-6" data-testid="transactions-section">
            <h3 className="font-heading text-xl font-bold text-white uppercase mb-6">Histórico</h3>
            {transactions.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-8">Nenhuma transação ainda</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {transactions.map(tx => (
                  <div
                    key={tx.id}
                    className="p-4 bg-zinc-900/50 rounded-lg"
                    data-testid={`transaction-${tx.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-2xl ${getTransactionColor(tx.type)}`}>
                          {getTransactionIcon(tx.type)}
                        </span>
                        <div>
                          <div className="text-white font-semibold text-sm">{getTransactionLabel(tx.type)}</div>
                          <div className="text-xs text-zinc-500 font-mono">
                            {new Date(tx.created_at).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono font-bold ${tx.amount > 0 ? 'text-primary' : 'text-red-400'}`}>
                          {tx.amount > 0 ? '+' : ''}R$ {Math.abs(tx.amount).toFixed(2)}
                        </div>
                        <div className={`text-xs font-bold uppercase ${
                          tx.status === 'completed' ? 'text-green-500' :
                          tx.status === 'pending' ? 'text-secondary' :
                          'text-red-500'
                        }`}>
                          {tx.status === 'pending' ? 'Pendente' :
                           tx.status === 'completed' ? 'Concluído' : 'Falhou'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};