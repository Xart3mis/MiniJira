import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PaperPlaneTilt } from '@phosphor-icons/react';
import { commentsApi } from '../../api/comments';
import Avatar from '../ui/Avatar';
import { SkeletonRow } from '../ui/Skeleton';
import useAuthStore from '../../store/authStore';
import { formatRelative } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function CommentSection({ taskId }) {
  const [text, setText] = useState('');
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentsApi.getByTask(taskId),
    enabled: !!taskId,
  });

  const addComment = useMutation({
    mutationFn: (body) => commentsApi.create(taskId, { text: body }),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: ['comments', taskId] });
      const prev = qc.getQueryData(['comments', taskId]);
      const optimistic = {
        commentId: `optimistic-${Date.now()}`,
        text: body,
        userId: user?.userId,
        userName: user?.name ?? user?.email,
        createdAt: new Date().toISOString(),
      };
      qc.setQueryData(['comments', taskId], (old = []) => [...old, optimistic]);
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      qc.setQueryData(['comments', taskId], ctx.prev);
      toast.error('Failed to post comment');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['comments', taskId] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    addComment.mutate(trimmed);
  };

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <div className="space-y-0.5">
          {[0, 1].map((i) => <SkeletonRow key={i} />)}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-brand-silver/30 py-3 text-center">
          No comments yet. Be the first.
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.commentId} className="flex items-start gap-2.5">
              <Avatar name={c.userName ?? c.userId} size="sm" className="shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xs font-medium text-brand-silver/70">
                    {c.userName ?? c.userId}
                  </span>
                  <span className="text-[10px] text-brand-silver/25 font-mono">
                    {formatRelative(c.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-brand-silver/60 leading-relaxed break-words">
                  {c.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 pt-2 border-t border-[var(--border-subtle)]"
      >
        <Avatar name={user?.name} size="sm" className="shrink-0 mb-1" />
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Write a comment..."
            rows={2}
            className="w-full text-sm text-brand-silver bg-brand-elevated rounded-lg px-3 py-2 pr-10 resize-none border border-[var(--border-default)] placeholder:text-brand-silver/25 focus:outline-none focus:border-brand-rose/40 focus:ring-1 focus:ring-brand-rose/20 transition-colors"
          />
          <button
            type="submit"
            disabled={!text.trim() || addComment.isPending}
            className="absolute right-2 bottom-2 w-6 h-6 flex items-center justify-center rounded bg-brand-rose text-[#f0edee] disabled:opacity-30 transition-opacity"
            aria-label="Send comment"
          >
            <PaperPlaneTilt size={12} weight="fill" />
          </button>
        </div>
      </form>
    </div>
  );
}
