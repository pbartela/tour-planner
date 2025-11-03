import { useTranslation } from "react-i18next";
import { useComments } from "@/lib/hooks/useComments";
import {
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} from "@/lib/hooks/useCommentMutations";
import { CommentItem } from "./CommentItem";
import { AddCommentForm } from "./AddCommentForm";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";

interface CommentsListProps {
  tourId: string;
  currentUserId: string;
}

export const CommentsList = ({ tourId, currentUserId }: CommentsListProps) => {
  const { t } = useTranslation("tours");
  const { data, isLoading, isError, error } = useComments({ tourId });
  const createMutation = useCreateCommentMutation(tourId);
  const updateMutation = useUpdateCommentMutation(tourId);
  const deleteMutation = useDeleteCommentMutation(tourId);

  const handleCreate = (content: string) => {
    createMutation.mutate({ content });
  };

  const handleEdit = (commentId: string, content: string) => {
    updateMutation.mutate({ commentId, data: { content } });
  };

  const handleDelete = (commentId: string) => {
    if (confirm(t("comments.deleteConfirm"))) {
      deleteMutation.mutate(commentId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{t("comments.title")}</h2>
        <SkeletonLoader />
        <SkeletonLoader />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">{t("comments.title")}</h2>
        <p className="text-error">{t("comments.loadingError")}: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t("comments.title")} ({data?.pagination.total || 0})</h2>

      <AddCommentForm onSubmit={handleCreate} isPending={createMutation.isPending} />

      <div className="space-y-4">
        {data?.data.length === 0 ? (
          <p className="text-center text-base-content/60">{t("comments.emptyState")}</p>
        ) : (
          data?.data.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};
