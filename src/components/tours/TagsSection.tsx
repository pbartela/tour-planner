import { useTranslation } from "react-i18next";
import { useTourTags, useAddTag, useRemoveTag } from "@/lib/hooks/useTags";
import { TagBadge } from "./TagBadge";
import { TagInput } from "./TagInput";
import { useState } from "react";

interface TagsSectionProps {
  tourId: string;
}

/**
 * Tags section component for archived tours
 * Displays tags and allows participants to add/remove tags
 */
export const TagsSection = ({ tourId }: TagsSectionProps) => {
  const { t } = useTranslation("tours");
  const { data: tags = [], isLoading } = useTourTags(tourId);
  const addTagMutation = useAddTag(tourId);
  const removeTagMutation = useRemoveTag(tourId);
  const [removingTagId, setRemovingTagId] = useState<number | null>(null);

  const handleAddTag = async (tagName: string) => {
    try {
      await addTagMutation.mutateAsync(tagName);
    } catch (error) {
      console.error("Failed to add tag:", error);
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    setRemovingTagId(tagId);
    try {
      await removeTagMutation.mutateAsync(tagId);
    } catch (error) {
      console.error("Failed to remove tag:", error);
    } finally {
      setRemovingTagId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">{t("tags.title")}</h3>
          <div className="flex items-center gap-2">
            <span className="loading loading-spinner loading-sm"></span>
            <span className="text-sm text-base-content/60">Loading tags...</span>
          </div>
        </div>
      </div>
    );
  }

  const existingTagNames = tags.map((tag) => tag.name.toLowerCase());

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title">{t("tags.title")}</h3>

        {/* Tag Input */}
        <div className="mb-4">
          <TagInput onAddTag={handleAddTag} existingTags={existingTagNames} isAdding={addTagMutation.isPending} />
          {addTagMutation.isError && (
            <p className="mt-2 text-sm text-error">
              {addTagMutation.error instanceof Error ? addTagMutation.error.message : t("tags.addError")}
            </p>
          )}
        </div>

        {/* Tags Display */}
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <TagBadge
                key={tag.id}
                name={tag.name}
                onRemove={() => handleRemoveTag(tag.id)}
                isRemoving={removingTagId === tag.id}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-base-content/60">{t("tags.noTags")}</p>
        )}

        {removeTagMutation.isError && (
          <p className="mt-2 text-sm text-error">
            {removeTagMutation.error instanceof Error ? removeTagMutation.error.message : t("tags.removeError")}
          </p>
        )}
      </div>
    </div>
  );
};
