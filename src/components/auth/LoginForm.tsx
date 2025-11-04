import { Button } from "@/components/ui/button";
import { InputWithLabel } from "@/components/ui/InputWithLabel";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { AuthHeader } from "./AuthHeader";
import { useMagicLinkMutation } from "@/lib/hooks/useAuthMutations";

const createMagicLinkSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().email(t("magicLink.validation.emailInvalid")),
  });

type MagicLinkFormData = z.infer<ReturnType<typeof createMagicLinkSchema>>;

export const LoginForm = ({ redirectTo }: { redirectTo?: string | null }) => {
  const { t, i18n } = useTranslation("auth");
  const magicLinkSchema = createMagicLinkSchema(t);

  const [message, setMessage] = useState("");

  const { mutate: requestMagicLink, isPending, isError, error } = useMagicLinkMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
  });

  const onSubmit = (data: MagicLinkFormData) => {
    setMessage("");

    requestMagicLink(
      {
        email: data.email,
        redirectTo,
        locale: i18n.language,
      },
      {
        onSuccess: () => {
          setMessage(t("magicLink.success"));
        },
      }
    );
  };

  return (
    <>
      <AuthHeader title={t("magicLink.title")} description={t("magicLink.description")} />
      <div className="mt-4 flex flex-col items-center gap-4 px-4 py-3">
        <form onSubmit={handleSubmit(onSubmit)} className="grid w-full gap-4">
          <InputWithLabel
            id="email"
            label={t("magicLink.emailLabel")}
            type="email"
            placeholder={t("magicLink.emailPlaceholder")}
            {...register("email")}
            error={errors.email?.message}
          />
          {message && <p className="text-sm text-green-600 dark:text-green-500">{message}</p>}
          {isError && <p className="text-sm text-destructive">{error?.message || t("magicLink.error")}</p>}
          <div className="flex w-full px-0 py-3">
            <Button type="submit" className="w-full" variant="primary" size="lg" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? t("magicLink.submitting") : t("magicLink.submit")}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default LoginForm;
