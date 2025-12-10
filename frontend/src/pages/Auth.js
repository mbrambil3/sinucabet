import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h1 className="font-heading text-5xl font-bold text-white uppercase mb-3">Login</h1>
            <p className="text-zinc-400">Entre na sua conta para apostar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-zinc-300 mb-2 block">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-zinc-950/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-md h-12 text-white"
                data-testid="login-email-input"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-zinc-300 mb-2 block">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-zinc-950/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-md h-12 text-white"
                data-testid="login-password-input"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-black font-bold uppercase tracking-wider hover:bg-primary/90 hover:shadow-neon transition-all duration-300 rounded-sm h-12"
              data-testid="login-submit-button"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <p className="mt-8 text-center text-zinc-400">
            Não tem conta?{' '}
            <Link to="/register" className="text-primary hover:underline" data-testid="login-register-link">
              Registre-se
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden md:block w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1520970192450-03c23cea6b80?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxjaW5lbWF0aWMlMjBzbm9va2VyJTIwbWF0Y2glMjBjbG9zZSUyMHVwJTIwZGFyayUyMG1vb2R5fGVufDB8fHx8MTc2NTQwOTQxNnww&ixlib=rb-4.1.0&q=85"
          alt="Snooker"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent"></div>
      </div>
    </div>
  );
};

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await register(name, email, password, cpf || null);
      toast.success('Conta criada com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="register-page">
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h1 className="font-heading text-5xl font-bold text-white uppercase mb-3">Registrar</h1>
            <p className="text-zinc-400">Crie sua conta para começar a apostar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-zinc-300 mb-2 block">Nome Completo</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-zinc-950/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-md h-12 text-white"
                data-testid="register-name-input"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-zinc-300 mb-2 block">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-zinc-950/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-md h-12 text-white"
                data-testid="register-email-input"
              />
            </div>

            <div>
              <Label htmlFor="cpf" className="text-zinc-300 mb-2 block">CPF (opcional)</Label>
              <Input
                id="cpf"
                type="text"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                className="bg-zinc-950/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-md h-12 text-white"
                data-testid="register-cpf-input"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-zinc-300 mb-2 block">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-zinc-950/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 rounded-md h-12 text-white"
                data-testid="register-password-input"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-black font-bold uppercase tracking-wider hover:bg-primary/90 hover:shadow-neon transition-all duration-300 rounded-sm h-12"
              data-testid="register-submit-button"
            >
              {loading ? 'Criando conta...' : 'Criar Conta'}
            </Button>
          </form>

          <p className="mt-8 text-center text-zinc-400">
            Já tem conta?{' '}
            <Link to="/login" className="text-primary hover:underline" data-testid="register-login-link">
              Faça login
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden md:block w-1/2 relative">
        <img
          src="https://images.unsplash.com/photo-1520970192450-03c23cea6b80?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwzfHxjaW5lbWF0aWMlMjBzbm9va2VyJTIwbWF0Y2glMjBjbG9zZSUyMHVwJTIwZGFyayUyMG1vb2R5fGVufDB8fHx8MTc2NTQwOTQxNnww&ixlib=rb-4.1.0&q=85"
          alt="Snooker"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent"></div>
      </div>
    </div>
  );
};