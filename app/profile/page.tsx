"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileHeader from "@components/profile/ProfileHeader";
import ProfileEditForm from "@components/profile/ProfileEditForm";
import ProfileTabs from "@components/profile/ProfileTabs";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  isPrivate: boolean;
  createdAt: string;
  _count: {
    reviews: number;
    favorites: number;
  };
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status]);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/users/me");
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setUser(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function handleEditSuccess(updatedUser: Partial<UserProfile>) {
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : prev));
    setIsEditing(false);
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <ProfileHeader
        user={user}
        onEditClick={() => setIsEditing(true)}
      />

      {isEditing && (
        <ProfileEditForm
          user={user}
          onSuccess={handleEditSuccess}
          onCancel={() => setIsEditing(false)}
        />
      )}

      <ProfileTabs
        reviewCount={user._count.reviews}
        favoriteCount={user._count.favorites}
      />
    </main>
  );
}
