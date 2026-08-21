import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, MessageCircle, ShieldCheck, Zap } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function LoginPage() {
  const navigate = useNavigate();
  const { token, status, error, login } = useAuthStore();
  const phoneRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (token) navigate('/chat', { replace: true });
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const phone = phoneRef.current?.value.trim() ?? '';
    const name = nameRef.current?.value.trim() ?? '';

    if (!phone || !name) {
      useAuthStore.setState({ error: !phone ? 'Phone number is required.' : 'Name is required.' });
      return;
    }
    if (name.length < 2) {
      useAuthStore.setState({ error: 'Please enter your full name (at least 2 characters).' });
      return;
    }
    const ok = await login(phone, name);
    if (ok) navigate('/chat', { replace: true });
  };

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-zinc-950 lg:flex lg:w-[45%] lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-2.5 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight">Pulse</span>
        </Link>

        <div className="relative">
          <h1 className="max-w-md text-4xl font-extrabold leading-tight tracking-tight text-white">
            Conversations that keep up with you.
          </h1>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-zinc-400">
            Real-time direct messages and group chats, delivered the instant they are sent.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-zinc-300">
            <li className="flex items-center gap-3">
              <Zap className="h-4 w-4 text-primary-400" aria-hidden="true" /> Instant delivery over WebSocket
            </li>
            <li className="flex items-center gap-3">
              <MessageCircle className="h-4 w-4 text-primary-400" aria-hidden="true" /> Direct &amp; group conversations
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-primary-400" aria-hidden="true" /> Secure token-based sessions
            </li>
          </ul>
        </div>

        <p className="relative text-xs text-zinc-500">© {new Date().getFullYear()} Pulse Messenger</p>
      </div>

      {/* Form panel */}
      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold tracking-tight">Pulse</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Welcome back</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
            Sign in with your phone number. New here? Your account is created automatically — no signup needed.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-zinc-700">
                Phone number
              </label>
              <Input
                ref={phoneRef}
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+1 555 123 4567"
                hasError={Boolean(error)}
                autoFocus
                required
              />
            </div>
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-zinc-700">
                Name
              </label>
              <Input
                ref={nameRef}
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Ada Lovelace"
                hasError={Boolean(error)}
                required
              />
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" loading={status === 'loading'} className="w-full">
              {status === 'loading' ? 'Signing in…' : 'Continue'}
              {status !== 'loading' && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-zinc-400">
            By continuing you agree to keep conversations friendly.
          </p>
        </div>
      </main>
    </div>
  );
}
