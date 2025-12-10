import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDateByLocale } from "@/lib/services/date-formatter.service";
import type { CommentDto } from "@/types";
import { Button } from "@/components/ui/button";

interface CommentItemProps {
  comment: CommentDto;
  currentUserId: string;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
}

export const CommentItem = ({ comment, currentUserId, onEdit, onDelete }: CommentItemProps) => {
  const { t, i18n } = useTranslation("tours");
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isOwner = comment.user_id === currentUserId;
  const isEdited = comment.created_at !== comment.updated_at;

  const handleSave = () => {
    if (editContent.trim() && editContent !== comment.content) {
      onEdit(comment.id, editContent);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  return (
    <div className="card bg-base-200 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{comment.display_name || comment.user_email || t("comments.anonymous")}</span>
          <span className="text-sm text-base-content/60">{formatDateByLocale(new Date(comment.created_at), i18n.language)}</span>
          {isEdited && <span className="text-xs text-base-content/40">{t("comments.edited")}</span>}
        </div>
        {isOwner && !isEditing && (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              {t("comments.edit")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(comment.id)} className="text-error">
              {t("comments.delete")}
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <label htmlFor={`edit-comment-textarea-${comment.id}`} className="sr-only">
            {t("comments.editLabel")}
          </label>
          <textarea
            id={`edit-comment-textarea-${comment.id}`}
            className="textarea textarea-bordered w-full"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            aria-label={t("comments.editLabel")}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              {t("comments.save")}
            </Button>
            <Button variant="neutral-outline" size="sm" onClick={handleCancel}>
              {t("comments.cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap">{comment.content}</p>
      )}
    </div>
  );
};
