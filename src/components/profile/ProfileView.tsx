import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { User } from "@/types";
import { ProfileEditForm } from "./ProfileEditForm";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/Avatar";
import { useProfile } from "@/lib/hooks/useProfileMutations";

interface ProfileViewProps {
  user: User;
}

export const ProfileView = ({ user }: ProfileViewProps) => {
  const { t } = useTranslation("common");
  const [isEditing, setIsEditing] = useState(false);

  // Use React Query to get profile data - this will automatically update when mutations change the cache
  const { data: profile } = useProfile(user.profile);

  // Fallback to initial user.profile if profile is not loaded yet (shouldn't happen with initialData)
  const currentProfile = profile || user.profile;

  console.log("[ProfileView] Render - avatar_url:", currentProfile.avatar_url);

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
                profile={currentProfile}
                email={user.email}
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
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar src={currentProfile.avatar_url} alt={currentProfile.display_name || user.email} size="xl" />
                <div>
                  <p className="text-sm text-base-content/60">{t("profile.avatar")}</p>
                  <p className="text-sm">
                    {currentProfile.avatar_url ? t("profile.avatarSet") : t("profile.noAvatar")}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-base-content/60">{t("profile.email")}</p>
                <p className="text-lg">{user.email}</p>
              </div>

              <div>
                <p className="text-sm text-base-content/60">{t("profile.displayName")}</p>
                <p className="text-lg">{currentProfile.display_name || t("profile.notSet")}</p>
              </div>

              {/* Dynamic language keys: t('profile.languages.en-US'), t('profile.languages.pl-PL') */}
              <div>
                <p className="text-sm text-base-content/60">{t("profile.language")}</p>
                <p className="text-lg">{t(`profile.languages.${currentProfile.language}`)}</p>
              </div>

              {/* Dynamic theme keys: t('profile.themes.light'), t('profile.themes.dark'), t('profile.themes.system') */}
              <div>
                <p className="text-sm text-base-content/60">{t("profile.theme")}</p>
                <p className="text-lg">{t(`profile.themes.${currentProfile.theme}`)}</p>
              </div>

              <div>
                <p className="text-sm text-base-content/60">{t("profile.memberSince")}</p>
                <p className="text-lg">{new Date(currentProfile.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
