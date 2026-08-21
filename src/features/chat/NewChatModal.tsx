import { useEffect, useRef, useState } from 'react';
import { Check, Search, UserPlus, Users } from 'lucide-react';
import type { Conversation, User } from '@/types';
import { searchUsers } from '@/services/users';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';

interface NewChatModalProps {
  open: boolean;
  onClose: () => void;
  onOpenConversation: (conversation: Conversation) => void;
}

type Mode = 'direct' | 'group';

export function NewChatModal({ open, onClose, onOpenConversation }: NewChatModalProps) {
  const token = useAuthStore((s) => s.token);
  const currentUser = useAuthStore((s) => s.user);
  const addDirectConversation = useChatStore((s) => s.addDirectConversation);
  const createGroup = useChatStore((s) => s.createGroup);

  const [mode, setMode] = useState<Mode>('direct');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const debouncedQuery = useDebouncedValue(query.trim(), 350);
  const abortRef = useRef<AbortController | null>(null);

  // Reset transient state whenever the modal opens.
  useEffect(() => {
    if (open) {
      setMode('direct');
      setQuery('');
      setResults([]);
      setSearchError(null);
      setSelected([]);
      setGroupName('');
      setSubmitError(null);
    }
  }, [open]);

  // Debounced user search with cancellation.
  useEffect(() => {
    if (!open || !token) return;
    if (!debouncedQuery) {
      setResults([]);
      setSearching(false);
      setSearchError(null);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSearching(true);
    setSearchError(null);
    searchUsers(debouncedQuery, token, controller.signal)
      .then((users) => {
        setResults(users.filter((u) => u._id !== currentUser?._id));
        setSearching(false);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setSearchError(err instanceof Error ? err.message : 'Search failed. Please try again.');
        setSearching(false);
      });

    return () => controller.abort();
  }, [debouncedQuery, open, token, currentUser?._id]);

  const toggleSelected = (user: User) => {
    setSelected((prev) =>
      prev.some((u) => u._id === user._id) ? prev.filter((u) => u._id !== user._id) : [...prev, user]
    );
  };

  const handleStartDirect = async (user: User) => {
    if (!token) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const conversation = await addDirectConversation(user._id, token);
      onOpenConversation(conversation);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not start the conversation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!token) return;
    if (!groupName.trim()) {
      setSubmitError('Please give your group a name.');
      return;
    }
    if (selected.length < 2) {
      setSubmitError('Groups need at least 2 other members (3 people total).');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const conversation = await createGroup(
        groupName.trim(),
        selected.map((u) => u._id),
        token
      );
      onOpenConversation(conversation);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not create the group.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New conversation"
      description={mode === 'direct' ? 'Find someone by name or phone number.' : 'Pick at least two people and name your group.'}
    >
      {/* Mode switch */}
      <div className="flex gap-1 border-b border-zinc-100 px-5 pt-1" role="tablist" aria-label="Conversation type">
        {(['direct', 'group'] as Mode[]).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              'flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-sm font-semibold transition-colors',
              mode === m ? 'border-b-2 border-primary-600 text-primary-700' : 'text-zinc-500 hover:text-zinc-800'
            )}
          >
            {m === 'direct' ? <UserPlus className="h-4 w-4" aria-hidden="true" /> : <Users className="h-4 w-4" aria-hidden="true" />}
            {m === 'direct' ? 'Direct' : 'Group'}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {/* Search input */}
        <div className="px-5 pt-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={mode === 'direct' ? 'Search by name or phone…' : 'Search people to add…'}
              className="pl-9"
              aria-label="Search users"
            />
          </div>
          {mode === 'group' && (
            <div className="mt-3">
              <label htmlFor="group-name" className="mb-1 block text-xs font-semibold text-zinc-600">
                Group name
              </label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Project Team"
                maxLength={60}
              />
            </div>
          )}
          {mode === 'group' && selected.length > 0 && (
            <p className="mt-2 text-xs font-medium text-primary-700" aria-live="polite">
              {selected.length} selected: {selected.map((u) => u.name.split(' ')[0]).join(', ')}
            </p>
          )}
        </div>

        {/* Results */}
        <div className="scrollbar-thin mt-3 min-h-[180px] flex-1 overflow-y-auto px-2 pb-2" aria-live="polite">
          {searching && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-400" role="status">
              <Spinner className="h-4 w-4" /> Searching…
            </div>
          )}

          {!searching && searchError && (
            <p role="alert" className="mx-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {searchError}
            </p>
          )}

          {!searching && !searchError && debouncedQuery && results.length === 0 && (
            <p className="py-10 text-center text-sm text-zinc-500">
              No people found for “{debouncedQuery}”.
            </p>
          )}

          {!searching && !debouncedQuery && (
            <p className="px-3 py-10 text-center text-sm text-zinc-400">
              Start typing to search for people by name or phone number.
            </p>
          )}

          {!searching &&
            results.map((user) => {
              const isSelected = selected.some((u) => u._id === user._id);
              return (
                <button
                  key={user._id}
                  onClick={() => (mode === 'direct' ? void handleStartDirect(user) : toggleSelected(user))}
                  disabled={submitting}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                    isSelected ? 'bg-primary-50' : 'hover:bg-zinc-50'
                  )}
                >
                  <Avatar name={user.name} id={user._id} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-zinc-900">{user.name}</span>
                    <span className="block truncate text-xs text-zinc-500">{user.phone}</span>
                  </span>
                  {mode === 'group' ? (
                    <span
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-md border transition-colors',
                        isSelected ? 'border-primary-600 bg-primary-600 text-white' : 'border-zinc-300'
                      )}
                      aria-hidden="true"
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-primary-600">{submitting ? 'Opening…' : 'Chat'}</span>
                  )}
                </button>
              );
            })}
        </div>

        {/* Footer */}
        {mode === 'group' && (
          <div className="border-t border-zinc-100 px-5 py-3.5">
            {submitError && (
              <p role="alert" className="mb-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">
                {submitError}
              </p>
            )}
            <Button onClick={() => void handleCreateGroup()} loading={submitting} disabled={!groupName.trim() || selected.length < 2} className="w-full">
              Create group ({selected.length + 1} members)
            </Button>
          </div>
        )}
        {mode === 'direct' && submitError && (
          <div className="border-t border-zinc-100 px-5 py-3">
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">
              {submitError}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
