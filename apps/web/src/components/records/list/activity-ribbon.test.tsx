import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { render } from "@/test/render";
import { ActivityRibbon } from "./activity-ribbon";

afterEach(cleanup);

describe("ActivityRibbon", () => {
  describe("activity kinds and accessible names", () => {
    it("renders task kind with check icon and accessible name", () => {
      render(<ActivityRibbon kind="task" dateText="Jul 2" />);

      const ribbon = screen.getByLabelText("Open task, due Jul 2");
      expect(ribbon).toBeTruthy();
      expect(ribbon.tagName).toBe("SPAN");
      expect(ribbon.getAttribute("aria-label")).toBe("Open task, due Jul 2");

      const icon = ribbon.querySelector("svg");
      expect(icon).toBeTruthy();
      expect(icon?.getAttribute("aria-hidden")).toBe("true");
      expect(icon?.getAttribute("data-kind")).toBe("task");
      expect(screen.getByText("Jul 2")).toBeTruthy();
    });

    it("renders meeting kind with calendar icon and accessible name", () => {
      render(<ActivityRibbon kind="meeting" dateText="Oct 15" />);

      const ribbon = screen.getByLabelText("Open meeting, Oct 15");
      expect(ribbon).toBeTruthy();
      expect(ribbon.getAttribute("aria-label")).toBe("Open meeting, Oct 15");

      const icon = ribbon.querySelector("svg");
      expect(icon).toBeTruthy();
      expect(icon?.getAttribute("aria-hidden")).toBe("true");
      expect(icon?.getAttribute("data-kind")).toBe("meeting");
      expect(screen.getByText("Oct 15")).toBeTruthy();
    });

    it("renders call kind with phone icon and accessible name", () => {
      render(<ActivityRibbon kind="call" dateText="Jun 29" />);

      const ribbon = screen.getByLabelText("Open call, Jun 29");
      expect(ribbon).toBeTruthy();
      expect(ribbon.getAttribute("aria-label")).toBe("Open call, Jun 29");

      const icon = ribbon.querySelector("svg");
      expect(icon).toBeTruthy();
      expect(icon?.getAttribute("aria-hidden")).toBe("true");
      expect(icon?.getAttribute("data-kind")).toBe("call");
      expect(screen.getByText("Jun 29")).toBeTruthy();
    });
  });

  describe("date text handling", () => {
    it("renders only icon when dateText is null", () => {
      const { container } = render(<ActivityRibbon kind="task" dateText={null} />);

      const ribbon = screen.getByLabelText("Open task");
      expect(ribbon).toBeTruthy();
      expect(ribbon.getAttribute("aria-label")).toBe("Open task");
      expect(container.querySelector("[data-part=date]")).toBeNull();
      expect(ribbon.querySelector("svg")).toBeTruthy();
      expect(ribbon.classList.contains("activity-ribbon--icon-only")).toBe(true);
    });

    it("renders only icon when dateText is an empty string", () => {
      const { container } = render(<ActivityRibbon kind="call" dateText="" />);

      const ribbon = screen.getByLabelText("Open call");
      expect(ribbon).toBeTruthy();
      expect(ribbon.getAttribute("aria-label")).toBe("Open call");
      expect(container.querySelector("[data-part=date]")).toBeNull();
      expect(ribbon.querySelector("svg")).toBeTruthy();
    });

    it("renders only icon when dateText is whitespace only", () => {
      const { container } = render(<ActivityRibbon kind="meeting" dateText="   " />);

      const ribbon = screen.getByLabelText("Open meeting");
      expect(ribbon).toBeTruthy();
      expect(ribbon.getAttribute("aria-label")).toBe("Open meeting");
      expect(container.querySelector("[data-part=date]")).toBeNull();
    });

    it("renders dateText element when a non-empty string is given", () => {
      render(<ActivityRibbon kind="task" dateText="Tomorrow 10:00 AM" />);

      const dateElement = screen.getByText("Tomorrow 10:00 AM");
      expect(dateElement).toBeTruthy();
      expect(dateElement.getAttribute("data-part")).toBe("date");
    });
  });

  describe("href link vs static element", () => {
    it("renders as anchor link when href is provided", () => {
      render(
        <ActivityRibbon kind="task" dateText="Jul 2" href="/crm/org123/tab/Tasks/record-456" />,
      );

      const link = screen.getByRole("link", { name: "Open task, due Jul 2" });
      expect(link).toBeTruthy();
      expect(link.tagName).toBe("A");
      expect(link.getAttribute("href")).toBe("/crm/org123/tab/Tasks/record-456");
    });

    it("renders as non-link span when href is not provided", () => {
      render(<ActivityRibbon kind="task" dateText="Jul 2" />);

      expect(screen.queryByRole("link")).toBeNull();
      const ribbon = screen.getByLabelText("Open task, due Jul 2");
      expect(ribbon.tagName).toBe("SPAN");
    });
  });

  describe("design constraints and details", () => {
    it("does not render a tooltip or title attribute", () => {
      render(<ActivityRibbon kind="call" dateText="Jun 29" />);

      const ribbon = screen.getByLabelText("Open call, Jun 29");
      expect(ribbon.getAttribute("title")).toBeNull();
    });

    it("merges custom className when provided", () => {
      render(<ActivityRibbon kind="meeting" dateText="Nov 1" className="custom-ribbon-class" />);

      const ribbon = screen.getByLabelText("Open meeting, Nov 1");
      expect(ribbon.classList.contains("activity-ribbon")).toBe(true);
      expect(ribbon.classList.contains("custom-ribbon-class")).toBe(true);
    });
  });
});
