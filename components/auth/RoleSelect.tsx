import type { UserRole } from "@prisma/client";
import { REGISTRATION_ROLE_OPTIONS } from "@/lib/roles";

type RoleSelectProps = {
  defaultValue?: UserRole;
  disabled?: boolean;
  id?: string;
  name?: string;
  onChange?: (role: UserRole) => void;
  required?: boolean;
};

export function RoleSelect({
  defaultValue = "USER",
  disabled = false,
  id = "role",
  name = "role",
  onChange,
  required = true,
}: RoleSelectProps) {
  return (
    <label className="flex w-full flex-col gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
      Account type
      <select
        className="min-h-11 rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 shadow-sm transition-colors focus:border-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100 dark:disabled:bg-zinc-900"
        defaultValue={defaultValue}
        disabled={disabled}
        id={id}
        name={name}
        onChange={(event) => onChange?.(event.target.value as UserRole)}
        required={required}
      >
        {REGISTRATION_ROLE_OPTIONS.map(({ description, label, value }) => (
          <option key={value} value={value}>
            {label} - {description}
          </option>
        ))}
      </select>
    </label>
  );
}
