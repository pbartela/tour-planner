import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import type { ProfileDto, UpdateProfileCommand } from "@/types";
import {
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useDeleteAvatarMutation,
} from "@/lib/hooks/useProfileMutations";
import { Button } from "@/components/ui/button";
import { InputWithLabel } from "@/components/ui/InputWithLabel";
import { Avatar } from "@/components/ui/Avatar";

interface ProfileEditFormProps {
  profile: ProfileDto;
  email: string;
  onSuccess?: () => void;
}

export const ProfileEditForm = ({ profile, email, onSuccess }: ProfileEditFormProps) => {
  const { t } = useTranslation("common");
  const [formData, setFormData] = useState<UpdateProfileCommand>({
    display_name: profile.display_name || "",
    language: profile.language,
    theme: profile.theme,
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProfileMutation = useUpdateProfileMutation();
  const uploadAvatarMutation = useUploadAvatarMutation();
  const deleteAvatarMutation = useDeleteAvatarMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // First, upload avatar if a new one was selected
      if (selectedFile) {
        await uploadAvatarMutation.mutateAsync(selectedFile);
      }

      // Check which fields have changed
      const changes: Partial<UpdateProfileCommand> = {};

      if (formData.display_name !== (profile.display_name || "")) {
        // Only include display_name if it's not empty or was explicitly cleared
        if (formData.display_name && formData.display_name.trim() !== "") {
          changes.display_name = formData.display_name;
        }
      }

      if (formData.language !== profile.language) {
        changes.language = formData.language;
      }

      if (formData.theme !== profile.theme) {
        changes.theme = formData.theme;
      }

      // Only update profile if there are actual changes
      if (Object.keys(changes).length > 0) {
        const languageChanged = changes.language !== undefined && changes.language !== profile.language;

        await updateProfileMutation.mutateAsync(changes);

        // If language changed, redirect to the new locale
        if (languageChanged && changes.language) {
          const currentPath = window.location.pathname;
          const pathParts = currentPath.split("/");
          // Replace the locale (first non-empty segment) with the new language
          pathParts[1] = changes.language;
          const newPath = pathParts.join("/");
          window.location.href = newPath;
          return;
        }
      }

      // Clean up after successful save
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarPreview(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast.success(t("profile.updateSuccess"));
      onSuccess?.();
    } catch (error) {
      // Error occurred during avatar upload or profile update
      toast.error(error instanceof Error ? error.message : t("profile.updateError"));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t("profile.invalidFileType"));
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(t("profile.fileTooLarge"));
      return;
    }

    // Clean up previous preview if exists
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    // Create preview and store file for later upload
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setSelectedFile(file);
  };

  const handleDeleteAvatar = () => {
    if (!window.confirm(t("profile.deleteAvatarConfirm"))) return;

    deleteAvatarMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(t("profile.avatarDeleteSuccess"));
      },
      onError: (error) => {
        toast.error(error.message || t("profile.avatarDeleteError"));
      },
    });
  };

  const hasChanges =
    formData.display_name !== (profile.display_name || "") ||
    formData.language !== profile.language ||
    formData.theme !== profile.theme ||
    selectedFile !== null;

  const isSaving = uploadAvatarMutation.isPending || updateProfileMutation.isPending;

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Upload Section */}
      <div>
        <label className="label">
          <span className="label-text">{t("profile.avatar")}</span>
        </label>
        <div className="flex items-center gap-4">
          <Avatar src={avatarPreview || profile.avatar_url} alt={profile.display_name || email} size="lg" />
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="file-input file-input-bordered file-input-sm w-full max-w-xs"
              disabled={isSaving}
            />
            {profile.avatar_url && !selectedFile && (
              <Button
                type="button"
                variant="error-outline"
                size="sm"
                onClick={handleDeleteAvatar}
                disabled={deleteAvatarMutation.isPending || isSaving}
              >
                {deleteAvatarMutation.isPending ? t("profile.deleting") : t("profile.deleteAvatar")}
              </Button>
            )}
            <p className="text-xs text-base-content/60">{t("profile.avatarHint")}</p>
          </div>
        </div>
      </div>

      <div className="divider"></div>

      <InputWithLabel
        label={t("profile.displayName")}
        type="text"
        value={formData.display_name || ""}
        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
        placeholder={t("profile.displayName")}
      />

      <div>
        <label className="label" htmlFor="language-select">
          <span className="label-text">{t("profile.language")}</span>
        </label>
        <select
          id="language-select"
          className="select select-bordered w-full"
          value={formData.language}
          onChange={(e) => setFormData({ ...formData, language: e.target.value })}
        >
          <option value="en-US">{t("profile.languages.en-US")}</option>
          <option value="pl-PL">{t("profile.languages.pl-PL")}</option>
        </select>
      </div>

      <div>
        <label className="label" htmlFor="theme-select">
          <span className="label-text">{t("profile.theme")}</span>
        </label>
        <select
          id="theme-select"
          className="select select-bordered w-full"
          value={formData.theme}
          onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
        >
          <option value="light">{t("profile.themes.light")}</option>
          <option value="dark">{t("profile.themes.dark")}</option>
          <option value="system">{t("profile.themes.system")}</option>
        </select>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={!hasChanges || isSaving}>
          {isSaving ? t("profile.saving") : t("profile.save")}
        </Button>
        {hasChanges && (
          <Button
            type="button"
            variant="neutral-outline"
            onClick={() => {
              setFormData({
                display_name: profile.display_name || "",
                language: profile.language,
                theme: profile.theme,
              });
              if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
                setAvatarPreview(null);
              }
              setSelectedFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
          >
            {t("profile.reset")}
          </Button>
        )}
      </div>

      {updateProfileMutation.isError && (
        <div className="alert alert-error">
          <span>
            {t("profile.updateError")}: {updateProfileMutation.error?.message}
          </span>
        </div>
      )}

      {updateProfileMutation.isSuccess && (
        <div className="alert alert-success">
          <span>{t("profile.updateSuccess")}</span>
        </div>
      )}
    </form>
  );
};
