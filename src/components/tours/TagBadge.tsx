import { useTranslation } from "react-i18next";

interface TagBadgeProps {
  name: string;
  onRemove?: () => void;
  isRemoving?: boolean;
}

/**
 * Tag badge component
 * Displays a tag with optional remove button
 */
export const TagBadge = ({ name, onRemove, isRemoving }: TagBadgeProps) => {
  const { t } = useTranslation("tours");

  return (
    <span className="badge badge-primary gap-2">
      <span>{name}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          disabled={isRemoving}
          className="btn btn-ghost btn-xs h-4 w-4 min-h-0 p-0 hover:bg-transparent"
          aria-label={t("tags.remove")}
          title={t("tags.remove")}
        >
          {isRemoving ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="h-3 w-3 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          )}
        </button>
      )}
    </span>
  );
};
