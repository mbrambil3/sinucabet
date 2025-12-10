import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

export const LandingPage = () => {
  return (
    <div className="min-h-screen" data-testid="landing-page">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1561840883-13989d7a9572?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxjaW5lbWF0aWMlMjBzbm9va2VyJTIwbWF0Y2glMjBjbG9zZSUyMHVwJTIwZGFyayUyMG1vb2R5fGVufDB8fHx8MTc2NTQwOTQxNnww&ixlib=rb-4.1.0&q=85"
            alt="Snooker table"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-background"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center" data-testid="hero-section">
          <h1 className="font-heading text-6xl md:text-8xl font-bold text-white uppercase tracking-tight mb-6 drop-shadow-2xl">
            Apostas P2P
            <br />
            <span className="text-primary">de Sinuca</span>
          </h1>
          <p className="text-xl md:text-2xl text-zinc-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Sistema de apostas entre usuários em jogos ao vivo de sinuca.
            <br />
            Sem casa de apostas. Usuário contra usuário.
          </p>
          <div className="flex gap-6 justify-center items-center">
            <Link to="/register">
              <Button
                size="lg"
                className="bg-primary text-black font-bold uppercase tracking-wider hover:bg-primary/90 hover:shadow-neon transition-all duration-300 rounded-sm px-12 py-6 text-lg"
                data-testid="hero-cta-button"
              >
                Começar Agora
              </Button>
            </Link>
            <Link to="/login">
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/5 hover:border-white/40 transition-all duration-300 rounded-sm px-12 py-6 text-lg"
                data-testid="hero-login-button"
              >
                Já Tenho Conta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-heading text-5xl font-bold text-white text-center mb-20 uppercase tracking-tight">
            Como Funciona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-effect p-8 rounded-lg hover:border-primary/30 transition-all" data-testid="feature-card-1">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl">1</span>
              </div>
              <h3 className="font-heading text-2xl font-semibold text-primary mb-4">Depósito via PIX</h3>
              <p className="text-zinc-400 leading-relaxed">
                Adicione fundos à sua carteira virtual usando PIX. Transferência instantânea e segura.
              </p>
            </div>

            <div className="glass-effect p-8 rounded-lg hover:border-primary/30 transition-all" data-testid="feature-card-2">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl">2</span>
              </div>
              <h3 className="font-heading text-2xl font-semibold text-primary mb-4">Aposte em Jogos</h3>
              <p className="text-zinc-400 leading-relaxed">
                Escolha um jogador e faça sua aposta. O sistema encontra automaticamente apostadores oponentes.
              </p>
            </div>

            <div className="glass-effect p-8 rounded-lg hover:border-primary/30 transition-all" data-testid="feature-card-3">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl">3</span>
              </div>
              <h3 className="font-heading text-2xl font-semibold text-primary mb-4">Ganhe e Saque</h3>
              <p className="text-zinc-400 leading-relaxed">
                Venceu? Receba automaticamente seus ganhos e faça saque via PIX a qualquer momento.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative" data-testid="cta-section">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="glass-heavy p-16 rounded-2xl">
            <h2 className="font-heading text-5xl font-bold text-white mb-6 uppercase tracking-tight">
              Pronto para Apostar?
            </h2>
            <p className="text-xl text-zinc-300 mb-10 leading-relaxed">
              Crie sua conta gratuitamente e comece a apostar em jogos ao vivo de sinuca.
            </p>
            <Link to="/register">
              <Button
                size="lg"
                className="bg-primary text-black font-bold uppercase tracking-wider hover:bg-primary/90 hover:shadow-neon transition-all duration-300 rounded-sm px-16 py-6 text-lg"
                data-testid="cta-register-button"
              >
                Criar Conta Grátis
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};