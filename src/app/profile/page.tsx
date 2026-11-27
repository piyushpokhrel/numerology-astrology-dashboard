"use client";

import { useProfile } from "@/components/ProfileProvider";
import { ProfileForm } from "@/components/ProfileForm";
import { Card, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/profile";

export default function ProfilePage() {
  const { profile, loaded } = useProfile();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={profile ? "Edit your profile" : "Create your profile"}
        blurb="These are the credentials every engine runs on. They are validated before saving, stored only in this browser, and every page updates the moment you correct them."
      />
      <Card>
        {!loaded ? (
          <p className="text-sm text-mist">Loading…</p>
        ) : (
          <ProfileForm />
        )}
      </Card>
      {profile && (
        <p className="mt-4 text-center text-xs text-fog">
          Profile created {formatDateTime(profile.createdAt)} · Last updated{" "}
          {formatDateTime(profile.updatedAt)}
        </p>
      )}
    </div>
  );
}
