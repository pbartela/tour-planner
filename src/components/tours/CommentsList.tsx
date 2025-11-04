import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useComments } from "@/lib/hooks/useComments";
import {
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} from "@/lib/hooks/useCommentMutations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; commentId: string }>({
    open: false,
    commentId: "",
  });

  const handleCreate = (content: string) => {
    createMutation.mutate({ content });
  };

  const handleEdit = (commentId: string, content: string) => {
    updateMutation.mutate({ commentId, data: { content } });
  };

  const handleDeleteClick = (commentId: string) => {
    setDeleteDialog({ open: true, commentId });
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(deleteDialog.commentId);
    setDeleteDialog({ open: false, commentId: "" });
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
        <p className="text-error">
          {t("comments.loadingError")}: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">
        {t("comments.title")} ({data?.pagination.total || 0})
      </h2>

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
              onDelete={handleDeleteClick}
            />
          ))
        )}
      </div>

      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, commentId: "" })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("comments.deleteTitle")}</DialogTitle>
            <DialogDescription>{t("comments.deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, commentId: "" })}
              disabled={deleteMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? t("comments.deleting") : t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
