import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchTags } from "@/lib/hooks/useTags";

interface TagInputProps {
  onAddTag: (tagName: string) => void;
  existingTags: string[];
  isAdding?: boolean;
}

/**
 * Tag input component with autocomplete
 * Allows users to add tags with suggestions from existing tags
 */
export const TagInput = ({ onAddTag, existingTags, isAdding }: TagInputProps) => {
  const { t } = useTranslation("tours");
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Search tags when user types
  const { data: suggestions = [] } = useSearchTags(inputValue.trim() || undefined);

  // Filter out tags that already exist on this tour
  const filteredSuggestions = suggestions.filter(
    (tag) => !existingTags.includes(tag.name.toLowerCase())
  );

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (tagName: string) => {
    const trimmed = tagName.trim().toLowerCase();
    if (trimmed && !existingTags.includes(trimmed)) {
      onAddTag(trimmed);
      setInputValue("");
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(inputValue);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <div className="join w-full">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={t("tags.addPlaceholder")}
          className="input input-bordered join-item w-full"
          disabled={isAdding}
          maxLength={50}
        />
        <button
          onClick={() => handleSubmit(inputValue)}
          disabled={!inputValue.trim() || isAdding}
          className="btn btn-primary join-item"
        >
          {isAdding ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              {t("tags.adding")}
            </>
          ) : (
            t("tags.add")
          )}
        </button>
      </div>

      {/* Autocomplete Suggestions */}
      {showSuggestions && filteredSuggestions.length > 0 && inputValue.trim() && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 mt-1 w-full rounded-lg border border-base-300 bg-base-100 shadow-lg"
        >
          <ul className="menu p-2">
            {filteredSuggestions.slice(0, 5).map((tag) => (
              <li key={tag.id}>
                <button
                  onClick={() => {
                    setInputValue(tag.name);
                    handleSubmit(tag.name);
                  }}
                  className="w-full text-left"
                >
                  {tag.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
