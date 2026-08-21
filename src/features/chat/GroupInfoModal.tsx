import { useState } from 'react';
import { Crown, LogOut, Pencil, UserMinus, UserPlus, X } from 'lucide-react';
import type { Conversation } from '@/types';
import * as conversationsApi from '@/services/conversations';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

interface GroupInfoModalProps {
  conversation: Conversation | null;
  onClose: () => void;
}

export function GroupInfoModal({ conversation, onClose }: GroupInfoModalProps) {
  const token = useAuthStore((s) => s.token);
  const currentUser = useAuthStore((s) => s.user);
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const removeConversation = useChatStore((s) => s.removeConversation);

  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  if (!conversation || !token || !currentUser) return null;

  const isAdmin = (conversation.admins ?? []).includes(currentUser._id);
  const participants = conversation.participants ?? [];

  const applyUpdate = (updated: Conversation) => {
    upsertConversation(updated);
    setError(null);
  };

  const handleRename = async () => {
    if (!nameDraft.trim()) return;
    try {
      const updated = await conversationsApi.renameGroup(conversation._id, nameDraft.trim(), token);
      applyUpdate(updated);
      setRenaming(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rename failed.');
    }
  };

  const handlePromote = async (userId: string) => {
    setBusyUserId(userId);
    try {
      applyUpdate(await conversationsApi.promoteToAdmin(conversation._id, userId, token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not promote member.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleRemove = async (userId: string) => {
    setBusyUserId(userId);
    try {
      applyUpdate(await conversationsApi.removeParticipant(conversation._id, userId, token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove member.');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await conversationsApi.removeParticipant(conversation._id, currentUser._id, token);
      removeConversation(conversation._id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not leave the group.');
      setLeaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Group info" description={`${participants.length} members`}>
      <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-4">
        {/* Name */}
        <div className="mb-4">
          {renaming ? (
            <div className="flex items-center gap-2">
              <Input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                maxLength={60}
                aria-label="Group name"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && void handleRename()}
              />
              <Button size="sm" onClick={() => void handleRename()}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setRenaming(false)} aria-label="Cancel rename">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-lg font-bold text-zinc-900">{conversation.name}</h3>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setNameDraft(conversation.name ?? '');
                    setRenaming(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Rename
                </Button>
              )}
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {error}
          </p>
        )}

        {/* Members */}
        <ul className="space-y-1" aria-label="Group members">
          {participants.map((member) => {
            const memberIsAdmin = (conversation.admins ?? []).includes(member._id);
            const isSelf = member._id === currentUser._id;
            return (
              <li key={member._id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-zinc-50">
                <Avatar name={member.name} id={member._id} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-800">
                    {member.name}
                    {isSelf && <span className="ml-1 text-xs font-normal text-zinc-400">(you)</span>}
                  </p>
                  <p className="truncate text-xs text-zinc-500">{member.phone}</p>
                </div>
                {memberIsAdmin && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                    <Crown className="h-3 w-3" aria-hidden="true" /> Admin
                  </span>
                )}
                {isAdmin && !isSelf && (
                  <div className="flex shrink-0 items-center gap-1">
                    {!memberIsAdmin && (
                      <button
                        onClick={() => void handlePromote(member._id)}
                        disabled={busyUserId === member._id}
                        aria-label={`Promote ${member.name} to admin`}
                        title="Make admin"
                        className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-amber-50 hover:text-amber-600 disabled:opacity-50"
                      >
                        <UserPlus className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                    <button
                      onClick={() => void handleRemove(member._id)}
                      disabled={busyUserId === member._id}
                      aria-label={`Remove ${member.name} from group`}
                      title="Remove from group"
                      className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <UserMinus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-t border-zinc-100 px-5 py-3.5">
        <Button variant="danger" loading={leaving} onClick={() => void handleLeave()} className="w-full">
          <LogOut className="h-4 w-4" aria-hidden="true" /> Leave group
        </Button>
      </div>
    </Modal>
  );
}
