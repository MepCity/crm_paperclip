"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Menu, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { type AuthResult, signOut } from "@/lib/auth-client";

export interface ShellUser {
  id: string;
  name: string;
  email: string;
}

export function UserMenu({
  user,
  onSignOut = signOut,
}: {
  user: ShellUser;
  onSignOut?: () => Promise<AuthResult>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const initials =
    user.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?";
  async function logout() {
    setPending(true);
    setError(undefined);
    try {
      const result = await onSignOut();
      if (result.ok) {
        router.replace("/sign-in");
        router.refresh();
      } else setError(result.message);
    } catch {
      setError("Sign out failed. Please try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <MenuTrigger>
        <Button
          variant="avatar"
          size="avatar"
          aria-label="User menu"
          isPending={pending}
          className="size-(--size-topbar-avatar) shrink-0"
        >
          {initials}
        </Button>
        <Menu
          appearance="measured"
          aria-label="User actions"
          header={
            <>
              <p className="font-semibold break-words">{user.name}</p>
              <p className="text-sm text-text-muted break-all">{user.email}</p>
            </>
          }
          onAction={() => void logout()}
        >
          <MenuItem appearance="measured" id="sign-out" textValue="Sign out" isDisabled={pending}>
            <Icons.signOut className="size-(--size-menu-icon)" aria-hidden />
            Sign out
          </MenuItem>
        </Menu>
      </MenuTrigger>
      {error && (
        <div className="absolute right-4 top-(--size-topbar-height) z-20 max-w-full p-4">
          <Alert variant="danger">{error}</Alert>
        </div>
      )}
    </>
  );
}
