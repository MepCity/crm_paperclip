"use client";

import type { CSSProperties } from "react";
import { Icons } from "./icon";
import "./user-avatar-placeholder.css";

export interface UserAvatarPlaceholderProps {
  size?: CSSProperties["width"];
  "aria-hidden"?: boolean;
}

export function UserAvatarPlaceholder({
  size,
  "aria-hidden": ariaHidden = true,
}: UserAvatarPlaceholderProps) {
  const style = size ? ({ "--user-avatar-placeholder-size": size } as CSSProperties) : undefined;
  return (
    <span className="user-avatar-placeholder" style={style} aria-hidden={ariaHidden}>
      <Icons.avatarPerson className="user-avatar-placeholder-glyph" aria-hidden />
    </span>
  );
}
