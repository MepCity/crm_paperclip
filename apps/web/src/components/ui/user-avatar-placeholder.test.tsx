import { describe, expect, it } from "vitest";
import { render } from "@/test/render";
import { UserAvatarPlaceholder } from "./user-avatar-placeholder";

describe("UserAvatarPlaceholder", () => {
  it("is hidden from assistive tech by default", () => {
    const { container } = render(<UserAvatarPlaceholder />);
    const root = container.querySelector(".user-avatar-placeholder") as HTMLElement;
    expect(root.getAttribute("aria-hidden")).toBe("true");
    expect(root.hasAttribute("style")).toBe(false);
  });

  it("can be exposed and applies the size variable", () => {
    const { container } = render(<UserAvatarPlaceholder size="40px" aria-hidden={false} />);
    const root = container.querySelector(".user-avatar-placeholder") as HTMLElement;
    expect(root.getAttribute("aria-hidden")).toBe("false");
    expect(root.style.getPropertyValue("--user-avatar-placeholder-size")).toBe("40px");
  });
});
