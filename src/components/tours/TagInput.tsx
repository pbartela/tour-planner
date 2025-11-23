import { useState, useRef, useEffect, useId } from "react";
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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // Search tags when user types
  const { data: suggestions = [] } = useSearchTags(inputValue.trim() || undefined);

  // Filter out tags that already exist on this tour
  const filteredSuggestions = suggestions.filter((tag) => !existingTags.includes(tag.name.toLowerCase()));
  const visibleSuggestions = filteredSuggestions.slice(0, 5);

  const getOptionId = (index: number) => `${listboxId}-option-${index}`;

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
      setActiveIndex(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      if (!visibleSuggestions.length) {
        return;
      }

      e.preventDefault();
      setShowSuggestions(true);
      setActiveIndex((prev) => {
        if (prev === null || prev === visibleSuggestions.length - 1) {
          return 0;
        }

        return prev + 1;
      });
      return;
    }

    if (e.key === "ArrowUp") {
      if (!visibleSuggestions.length) {
        return;
      }

      e.preventDefault();
      setShowSuggestions(true);
      setActiveIndex((prev) => {
        if (prev === null || prev === 0) {
          return visibleSuggestions.length - 1;
        }

        return prev - 1;
      });
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();

      if (activeIndex !== null && visibleSuggestions[activeIndex]) {
        const selected = visibleSuggestions[activeIndex];
        handleSubmit(selected.name);
        return;
      }

      handleSubmit(inputValue);
      return;
    }

    if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(null);
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
            setActiveIndex(null);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={t("tags.addPlaceholder")}
          className="input input-bordered join-item w-full"
          disabled={isAdding}
          maxLength={50}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showSuggestions && !!visibleSuggestions.length}
          aria-controls={showSuggestions && !!visibleSuggestions.length ? listboxId : undefined}
          aria-activedescendant={
            showSuggestions && activeIndex !== null && visibleSuggestions[activeIndex]
              ? getOptionId(activeIndex)
              : undefined
          }
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
      {showSuggestions && visibleSuggestions.length > 0 && inputValue.trim() && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 mt-1 w-full rounded-lg border border-base-300 bg-base-100 shadow-lg"
        >
          <ul className="menu p-2" role="listbox" id={listboxId}>
            {visibleSuggestions.map((tag, index) => (
              <li
                key={tag.id}
                id={getOptionId(index)}
                role="option"
                aria-selected={activeIndex === index}
              >
                <button
                  onClick={() => {
                    setInputValue(tag.name);
                    handleSubmit(tag.name);
                    setActiveIndex(null);
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
