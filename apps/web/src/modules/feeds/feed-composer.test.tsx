import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { render } from "@/test/render";
import { FeedComposer } from "./feed-composer";

vi.mock("@/lib/api/client/hooks", () => ({
  useUsers: () => ({ data: [{ userId: "u2", name: "Bob", email: "b@x.test" }] }),
}));

afterEach(cleanup);

describe("FeedComposer", () => {
  test("submits escaped paragraph html and clears the box", async () => {
    const onSubmit = vi.fn(async () => {});
    render(<FeedComposer onSubmit={onSubmit} />);
    const box = screen.getByPlaceholderText("Write a post, use @ to mention a teammate");
    expect(screen.getByRole("button", { name: "Post" }).hasAttribute("disabled")).toBe(true);
    await userEvent.type(box, "hi <there>");
    await userEvent.click(screen.getByRole("button", { name: "Post" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("<p>hi &lt;there&gt;</p>", []));
    await waitFor(() => expect((box as HTMLTextAreaElement).value).toBe(""));
  });

  test("keeps the text and shows an alert when posting fails", async () => {
    const onSubmit = vi.fn(async () => {
      throw new Error("boom");
    });
    render(<FeedComposer onSubmit={onSubmit} />);
    await userEvent.type(screen.getByRole("textbox"), "keep me");
    await userEvent.click(screen.getByRole("button", { name: "Post" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("keep me");
  });
});
