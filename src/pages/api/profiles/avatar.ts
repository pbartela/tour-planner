import type { APIRoute } from "astro";
import { validateSession } from "@/lib/server/session-validation.service";
import * as logger from "@/lib/server/logger.service";
import { profileService } from "@/lib/services/profile.service";

export const prerender = false;

/**
 * POST /api/profiles/avatar
 * Upload and update user's avatar
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const { supabase } = locals;

  try {
    // Validate session
    const user = await validateSession(supabase);
    if (!user) {
      return new Response(
        JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }),
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({ error: { code: "VALIDATION_ERROR", message: "Avatar file is required" } }),
        { status: 400 }
      );
    }

    // Validate file type (images only)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.",
          },
        }),
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({
          error: { code: "VALIDATION_ERROR", message: "File size exceeds 5MB limit" },
        }),
        { status: 400 }
      );
    }

    // Get current profile to check for existing avatar
    const { data: currentProfile } = await profileService.getProfile(supabase, user.id);

    // Delete old avatar if it exists
    if (currentProfile?.avatar_url) {
      try {
        // Extract file path from URL
        const url = new URL(currentProfile.avatar_url);
        const pathParts = url.pathname.split("/");
        const bucketIndex = pathParts.indexOf("avatars");
        if (bucketIndex !== -1) {
          const filePath = pathParts.slice(bucketIndex + 1).join("/");
          await supabase.storage.from("avatars").remove([filePath]);
        }
      } catch (error) {
        logger.warn("Failed to delete old avatar", error instanceof Error ? error : undefined);
        // Continue even if deletion fails
      }
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      logger.error("Error uploading avatar to storage", uploadError);
      return new Response(
        JSON.stringify({ error: { code: "UPLOAD_ERROR", message: "Failed to upload avatar" } }),
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(uploadData.path);

    // Update profile with new avatar URL
    const { data: updatedProfile, error: updateError } = await profileService.updateProfile(supabase, user.id, {
      avatar_url: publicUrl,
    });

    if (updateError) {
      logger.error("Error updating profile with avatar URL", updateError);
      return new Response(
        JSON.stringify({ error: { code: "UPDATE_ERROR", message: "Failed to update profile" } }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ data: updatedProfile }), { status: 200 });
  } catch (error) {
    logger.error("Unexpected error in POST /api/profiles/avatar", error instanceof Error ? error : undefined);
    return new Response(
      JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } }),
      { status: 500 }
    );
  }
};

/**
 * DELETE /api/profiles/avatar
 * Remove user's avatar
 */
export const DELETE: APIRoute = async ({ locals }) => {
  const { supabase } = locals;

  try {
    // Validate session
    const user = await validateSession(supabase);
    if (!user) {
      return new Response(
        JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }),
        { status: 401 }
      );
    }

    // Get current profile
    const { data: currentProfile } = await profileService.getProfile(supabase, user.id);

    if (!currentProfile?.avatar_url) {
      return new Response(
        JSON.stringify({ error: { code: "NOT_FOUND", message: "No avatar to delete" } }),
        { status: 404 }
      );
    }

    // Delete avatar from storage
    try {
      const url = new URL(currentProfile.avatar_url);
      const pathParts = url.pathname.split("/");
      const bucketIndex = pathParts.indexOf("avatars");
      if (bucketIndex !== -1) {
        const filePath = pathParts.slice(bucketIndex + 1).join("/");
        await supabase.storage.from("avatars").remove([filePath]);
      }
    } catch (error) {
      logger.warn("Failed to delete avatar from storage", error instanceof Error ? error : undefined);
      // Continue even if deletion fails
    }

    // Update profile to remove avatar URL
    const { data: updatedProfile, error: updateError } = await profileService.updateProfile(supabase, user.id, {
      avatar_url: null,
    });

    if (updateError) {
      logger.error("Error removing avatar URL from profile", updateError);
      return new Response(
        JSON.stringify({ error: { code: "UPDATE_ERROR", message: "Failed to update profile" } }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ data: updatedProfile }), { status: 200 });
  } catch (error) {
    logger.error("Unexpected error in DELETE /api/profiles/avatar", error instanceof Error ? error : undefined);
    return new Response(
      JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } }),
      { status: 500 }
    );
  }
};
