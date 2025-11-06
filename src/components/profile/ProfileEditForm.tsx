import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ProfileDto, UpdateProfileCommand } from "@/types";
import { useUpdateProfileMutation } from "@/lib/hooks/useProfileMutations";
import { Button } from "@/components/ui/button";
import { InputWithLabel } from "@/components/ui/InputWithLabel";

interface ProfileEditFormProps {
  profile: ProfileDto;
  onSuccess?: () => void;
}

export const ProfileEditForm = ({ profile, onSuccess }: ProfileEditFormProps) => {
  const { t } = useTranslation("common");
  const [formData, setFormData] = useState<UpdateProfileCommand>({
    display_name: profile.display_name || "",
    language: profile.language,
    theme: profile.theme,
  });

  const updateProfileMutation = useUpdateProfileMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  const hasChanges =
    formData.display_name !== (profile.display_name || "") ||
    formData.language !== profile.language ||
    formData.theme !== profile.theme;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        <Button type="submit" disabled={!hasChanges || updateProfileMutation.isPending}>
          {updateProfileMutation.isPending ? t("profile.saving") : t("profile.save")}
        </Button>
        {hasChanges && (
          <Button
            type="button"
            variant="neutral-outline"
            onClick={() =>
              setFormData({
                display_name: profile.display_name || "",
                language: profile.language,
                theme: profile.theme,
              })
            }
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
