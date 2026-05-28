'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentService } from '../../services/comment.service';
import { authService } from '../../services/auth.service';
import { MessageSquare, Send, Trash2, Edit2, Check, X, Loader2, User } from 'lucide-react';

interface TaskCommentsProps {
  taskId: string;
}

export default function TaskComments({ taskId }: TaskCommentsProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: authService.getMe,
    retry: false,
  });

  const { data: comments, isLoading, isError } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => commentService.getCommentsByTask(taskId),
  });

  const createMutation = useMutation({
    mutationFn: () => commentService.createComment(taskId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      setContent('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ commentId, newContent }: { commentId: string; newContent: string }) =>
      commentService.updateComment(commentId, newContent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      setEditingCommentId(null);
      setEditContent('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => commentService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createMutation.mutate();
  };

  const handleUpdateSubmit = (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    updateMutation.mutate({ commentId, newContent: editContent });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserIdStr = (userObj: any) => {
    if (!userObj) return '';
    return userObj.id || userObj._id || userObj.toString();
  };

  const currentUserId = me ? getUserIdStr(me) : '';

  return (
    <div className="space-y-6 mt-8 border-t border-white/5 pt-6 select-text">
      <div className="flex items-center gap-2 text-white font-bold text-base">
        <MessageSquare className="w-5 h-5 text-indigo-400" />
        <span>Bình luận ({comments?.length || 0})</span>
      </div>

      <form onSubmit={handleCreateSubmit} className="flex gap-3 items-start">
        <div className="w-8 h-8 rounded-full bg-indigo-600/10 border border-indigo-500/10 flex items-center justify-center font-bold text-indigo-400 uppercase text-xs shrink-0 mt-1">
          {me?.name ? me.name.charAt(0) : <User className="w-4 h-4" />}
        </div>
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Viết bình luận công việc..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-[#0b0f19]/60 border border-white/8 focus:border-indigo-500 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none placeholder-neutral-600 transition-all duration-200"
          />
          <button
            type="submit"
            disabled={createMutation.isPending || !content.trim()}
            className="absolute right-2 top-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white disabled:opacity-40 transition-colors"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map((n) => (
            <div key={n} className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-white/5 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/5 rounded w-1/4" />
                <div className="h-3 bg-white/5 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-sm text-red-400">Không thể tải bình luận.</div>
      ) : !comments || comments.length === 0 ? (
        <div className="text-center py-6 text-sm text-neutral-500">
          Chưa có bình luận nào. Hãy bắt đầu cuộc thảo luận ngay!
        </div>
      ) : (
        <div className="space-y-5">
          {comments.map((comment) => {
            const commentUser = comment.userId as any;
            const commentUserId = getUserIdStr(commentUser);
            const isMyComment = commentUserId === currentUserId;
            const isEditing = editingCommentId === comment.id;

            return (
              <div key={comment.id} className="flex gap-3 items-start group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white uppercase text-xs shrink-0 border border-white/10">
                  {commentUser?.name ? commentUser.name.charAt(0) : <User className="w-3.5 h-3.5" />}
                </div>

                <div className="flex-1 space-y-1 overflow-hidden">
                  <div className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{commentUser?.name || 'Thành viên'}</span>
                      <span className="text-[10px] text-neutral-500 font-medium">{formatDate(comment.createdAt)}</span>
                    </div>

                    {isMyComment && !isEditing && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditContent(comment.content);
                          }}
                          className="p-1 rounded text-neutral-500 hover:text-white hover:bg-white/5"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Bạn có chắc chắn muốn xóa bình luận này không?')) {
                              deleteMutation.mutate(comment.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <form onSubmit={(e) => handleUpdateSubmit(e, comment.id)} className="flex gap-2 items-center w-full mt-1">
                      <input
                        type="text"
                        required
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 bg-[#090d16] border border-white/8 focus:border-indigo-500 rounded-lg py-1 px-3 text-xs text-white focus:outline-none"
                      />
                      <button type="submit" className="p-1 text-indigo-400">
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditContent('');
                        }}
                        className="p-1 text-neutral-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </form>
                  ) : (
                    <p className="text-neutral-300 text-xs leading-relaxed bg-[#1e293b]/20 border border-white/[0.02] p-3 rounded-xl w-fit max-w-[85%] break-words">
                      {comment.content}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
