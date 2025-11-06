import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { User } from "@/types";
import { ProfileEditForm } from "./ProfileEditForm";
import { Button } from "@/components/ui/button";

interface ProfileViewProps {
  user: User;
}

export const ProfileView = ({ user }: ProfileViewProps) => {
  const { t } = useTranslation("common");
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="container mx-auto max-w-2xl space-y-6 p-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h1 className="card-title text-3xl">{t("profile.title")}</h1>
            {!isEditing && <Button onClick={() => setIsEditing(true)}>{t("profile.editProfile")}</Button>}
          </div>

          <div className="divider"></div>

          {isEditing ? (
            <>
              <ProfileEditForm
                profile={user.profile}
                onSuccess={() => {
                  setIsEditing(false);
                }}
              />
              <Button variant="neutral-outline" onClick={() => setIsEditing(false)} className="mt-4">
                {t("profile.cancel")}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-base-content/60">{t("profile.email")}</p>
                <p className="text-lg">{user.email}</p>
              </div>

              <div>
                <p className="text-sm text-base-content/60">{t("profile.displayName")}</p>
                <p className="text-lg">{user.profile.display_name || t("profile.notSet")}</p>
              </div>

              {/* Dynamic language keys: t('profile.languages.en-US'), t('profile.languages.pl-PL') */}
              <div>
                <p className="text-sm text-base-content/60">{t("profile.language")}</p>
                <p className="text-lg">{t(`profile.languages.${user.profile.language}`)}</p>
              </div>

              {/* Dynamic theme keys: t('profile.themes.light'), t('profile.themes.dark'), t('profile.themes.system') */}
              <div>
                <p className="text-sm text-base-content/60">{t("profile.theme")}</p>
                <p className="text-lg">{t(`profile.themes.${user.profile.theme}`)}</p>
              </div>

              <div>
                <p className="text-sm text-base-content/60">{t("profile.memberSince")}</p>
                <p className="text-lg">{new Date(user.profile.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
