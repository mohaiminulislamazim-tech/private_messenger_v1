import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BellRing,
  MessageCircle,
  MessagesSquare,
  Search,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { ChatPreview } from './ChatPreview';

const FEATURES = [
  {
    icon: Zap,
    title: 'Instant delivery',
    description:
      'Messages travel over a live WebSocket connection — no refresh, no waiting, no "checking for new mail".',
  },
  {
    icon: Users,
    title: 'Groups that work',
    description:
      'Create groups, add members, promote admins, rename the room. Everyone stays in sync automatically.',
  },
  {
    icon: Search,
    title: 'Find anyone fast',
    description: 'Look up people by name or phone number and start a conversation in two clicks.',
  },
  {
    icon: BellRing,
    title: 'Never miss a message',
    description:
      'Reading older messages? Pulse holds your place and shows a "New messages" pill instead of yanking you down.',
  },
  {
    icon: MessagesSquare,
    title: 'Built-in history',
    description: 'Full conversation history with smooth pagination — scroll up and earlier messages load in place.',
  },
  {
    icon: Sparkles,
    title: 'Crafted interface',
    description: 'A clean, focused design system that works beautifully on a phone in one hand or a 27" monitor.',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Sign in with just a phone number',
    body: 'No forms, no email verification loops. New numbers are registered automatically on first sign-in.',
  },
  {
    number: '02',
    title: 'Find people, start talking',
    body: 'Search by name or phone, open a direct chat, or pull several people into a group in seconds.',
  },
  {
    number: '03',
    title: 'Watch messages land instantly',
    body: 'Everything is pushed to you live over WebSocket — replies appear the moment they are sent.',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-zinc-100 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8" aria-label="Main">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
              <MessageCircle className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold tracking-tight">Pulse</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <a href="#features" className="hidden text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 sm:block">
              Features
            </a>
            <a href="#how" className="hidden text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 sm:block">
              How it works
            </a>
            <Link
              to="/login"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-700 active:scale-95"
            >
              Open app <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary-200/50 via-fuchsia-100/40 to-cyan-100/50 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-2 lg:gap-10 lg:pb-28 lg:pt-24">
          <div className="animate-slide-up text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500" />
              </span>
              Real-time by default
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-zinc-950 sm:text-5xl lg:text-[3.6rem]">
              Messaging that moves at the speed of{' '}
              <span className="bg-gradient-to-r from-primary-600 via-fuchsia-600 to-primary-600 bg-clip-text text-transparent">
                conversation
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg lg:mx-0">
              Pulse is a real-time chat product for direct messages and group conversations.
              Sign in with a phone number, find people instantly, and watch every message land the moment it's sent.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start sm:justify-center">
              <Link
                to="/login"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-7 text-sm font-bold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-700 hover:shadow-primary-700/30 active:scale-95 sm:w-auto"
              >
                Start chatting free <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="#features"
                className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-7 text-sm font-semibold text-zinc-800 shadow-sm transition-colors hover:bg-zinc-50 sm:w-auto"
              >
                See what's inside
              </a>
            </div>
            <p className="mt-4 text-xs text-zinc-400">No signup flow — your first sign-in creates your account.</p>
          </div>

          <div className="animate-float lg:justify-self-end">
            <ChatPreview />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-zinc-100 bg-zinc-50/60 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
              Everything a real conversation needs
            </h2>
            <p className="mt-3 text-base leading-relaxed text-zinc-600">
              Not a demo — a complete messaging experience, polished down to the last edge case.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="group rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary-100 hover:shadow-lg hover:shadow-primary-600/5"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-600 group-hover:text-white">
                  <feature.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-zinc-900">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.2fr]">
            <div className="lg:sticky lg:top-28">
              <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
                From zero to chatting in under a minute
              </h2>
              <p className="mt-3 text-base leading-relaxed text-zinc-600">
                Pulse strips messaging back to what matters: people and conversation. The rest is invisible engineering.
              </p>
              <Link
                to="/login"
                className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-zinc-900 px-6 text-sm font-bold text-white shadow-sm transition-all hover:bg-zinc-700 active:scale-95"
              >
                Try it now <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <ol className="space-y-4">
              {STEPS.map((step) => (
                <li key={step.number} className="flex gap-5 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
                  <span className="bg-gradient-to-b from-primary-600 to-fuchsia-500 bg-clip-text text-2xl font-extrabold text-transparent">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-600">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-zinc-950 py-20 lg:py-24">
        <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-primary-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
          <MessageCircle className="mx-auto mb-6 h-10 w-10 text-primary-400" aria-hidden="true" />
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Your first conversation is one tap away
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-400">
            Open Pulse, enter a phone number, and start talking. That's the whole onboarding.
          </p>
          <Link
            to="/login"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-8 text-sm font-bold text-zinc-950 shadow-lg transition-all hover:bg-zinc-100 active:scale-95"
          >
            Open Pulse <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-sm text-zinc-500 sm:flex-row sm:px-8">
          <span>© {new Date().getFullYear()} Pulse Messenger</span>
          <span>Built as a senior frontend take-home assignment.</span>
        </div>
      </footer>
    </div>
  );
}
