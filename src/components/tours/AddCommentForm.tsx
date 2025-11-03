import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface AddCommentFormProps {
  onSubmit: (content: string) => void;
  isPending?: boolean;
}

export const AddCommentForm = ({ onSubmit, isPending = false }: AddCommentFormProps) => {
  const { t } = useTranslation("tours");
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content);
      setContent("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        className="textarea textarea-bordered w-full"
        placeholder={t("comments.addPlaceholder")}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        disabled={isPending}
        required
      />
      <Button type="submit" disabled={isPending || !content.trim()}>
        {isPending ? t("comments.posting") : t("comments.postButton")}
      </Button>
    </form>
  );
};
