import Image from "next/image";

type Props = {
  user: {
    name: string;
    email: string;
    role: string;
    avatar: string | null;
    isPrivate: boolean;
    createdAt: string;
  };
  onEditClick: () => void;
};

const ROLE_LABELS: Record<string, string> = {
  USER: "User",
  VENUE_OWNER: "Venue Owner",
  EVENT_ORGANIZER: "Event Organizer",
  MODERATOR: "Moderator",
  ADMIN: "Admin",
};

export default function ProfileHeader({ user, onEditClick }: Props) {
  const joinedDate = new Date(user.createdAt).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="mb-8 flex items-start gap-6">
      {/* Avatar */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-neutral-200">
        {user.avatar ? (
          <Image
            src={user.avatar}
            alt={user.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-neutral-500">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
          {user.isPrivate && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
              Private
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted">{user.email}</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700">
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
          <span className="text-xs text-muted">Member since {joinedDate}</span>
        </div>
      </div>

      {/* Edit button */}
      <button
        onClick={onEditClick}
        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface"
      >
        Edit profile
      </button>
    </div>
  );
}
