import { useEffect, useState } from 'react';

interface DemoMessage {
  id: number;
  text: string;
  own: boolean;
  sender?: string;
  delay: number;
}

const SCRIPT: DemoMessage[] = [
  { id: 1, text: 'Hey! Did you see the new Pulse release? 🚀', own: false, sender: 'Maya', delay: 600 },
  { id: 2, text: 'Just opened it — the delivery is instant.', own: true, delay: 1500 },
  { id: 3, text: 'Creating a group for the launch team, joining?', own: false, sender: 'Maya', delay: 1400 },
  { id: 4, text: 'Already in. Sending the checklist now 📎', own: true, delay: 1600 },
  { id: 5, text: 'Perfect. This is what real-time feels like ⚡', own: false, sender: 'Dev', delay: 1400 },
];

export function ChatPreview() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: number;

    const step = (index: number) => {
      if (cancelled) return;
      if (index >= SCRIPT.length) {
        // Pause at full conversation, then restart the loop.
        timer = window.setTimeout(() => {
          if (!cancelled) {
            setVisibleCount(0);
            step(0);
          }
        }, 4000);
        return;
      }
      setVisibleCount(index + 1);
      timer = window.setTimeout(() => step(index + 1), SCRIPT[index].delay);
    };

    step(0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-sm" aria-hidden="true">
      {/* Glow */}
      <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-primary-500/25 via-fuchsia-500/15 to-cyan-400/20 blur-2xl" />

      <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-2xl shadow-zinc-900/10">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-zinc-100 bg-white px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 text-xs font-semibold text-zinc-500">Launch Team · 4 members</span>
        </div>

        {/* Messages */}
        <div className="flex h-[320px] flex-col justify-end gap-2.5 bg-zinc-50 p-4 sm:h-[360px]">
          {SCRIPT.slice(0, visibleCount).map((message) => (
            <div key={message.id} className={`flex ${message.own ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`${message.own ? 'rounded-br-md bg-primary-600 text-white' : 'rounded-bl-md border border-zinc-100 bg-white text-zinc-800'} max-w-[80%] animate-pop-in rounded-2xl px-3.5 py-2 text-[13px] leading-snug shadow-sm`}
              >
                {!message.own && message.sender && (
                  <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-primary-600">
                    {message.sender}
                  </span>
                )}
                {message.text}
              </div>
            </div>
          ))}
          {visibleCount < SCRIPT.length && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-zinc-100 bg-white px-3 py-2.5 shadow-sm">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 animate-bounce-dot rounded-full bg-zinc-300"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Composer mock */}
        <div className="border-t border-zinc-100 bg-white p-3">
          <div className="flex items-center gap-2">
            <div className="h-9 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs leading-9 text-zinc-400">
              Message Launch Team
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4 text-white">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
