import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { type MeetingsParticipant, MeetingsParticipantsCard } from "./meetings-participants-card";

afterEach(cleanup);

describe("MeetingsParticipantsCard", () => {
  describe("header", () => {
    it("renders the Participants heading", () => {
      render(<MeetingsParticipantsCard participants={[]} />);
      expect(screen.getByRole("heading", { name: "Participants" })).toBeTruthy();
    });

    it("renders the Add button", () => {
      render(<MeetingsParticipantsCard participants={[]} />);
      expect(screen.getByRole("button", { name: "Add" })).toBeTruthy();
    });
  });

  describe("empty state", () => {
    it("shows 'No participant found' when participants is empty", () => {
      render(<MeetingsParticipantsCard participants={[]} />);
      expect(screen.getByText("No participant found")).toBeTruthy();
    });

    it("does not render participant rows when participants is empty", () => {
      render(<MeetingsParticipantsCard participants={[]} />);
      expect(screen.queryByRole("list")).toBeNull();
    });
  });

  describe("filled state", () => {
    const sampleParticipants: MeetingsParticipant[] = [
      { id: "p1", name: "Alice Nakamura" },
      { id: "p2", name: "Bob Okafor" },
    ];

    it("renders participant names when participants are provided", () => {
      render(<MeetingsParticipantsCard participants={sampleParticipants} />);
      expect(screen.getByText("Alice Nakamura")).toBeTruthy();
      expect(screen.getByText("Bob Okafor")).toBeTruthy();
    });

    it("does not show the empty state text when participants are provided", () => {
      render(<MeetingsParticipantsCard participants={sampleParticipants} />);
      expect(screen.queryByText("No participant found")).toBeNull();
    });
  });

  describe("Add button behaviour", () => {
    it("calls onAdd when provided and Add is pressed", () => {
      const onAdd = vi.fn();
      render(<MeetingsParticipantsCard participants={[]} onAdd={onAdd} />);
      fireEvent.click(screen.getByRole("button", { name: "Add" }));
      expect(onAdd).toHaveBeenCalledTimes(1);
    });

    it("does not throw when Add is pressed without onAdd", () => {
      render(<MeetingsParticipantsCard participants={[]} />);
      expect(() => {
        fireEvent.click(screen.getByRole("button", { name: "Add" }));
      }).not.toThrow();
    });
  });
});
