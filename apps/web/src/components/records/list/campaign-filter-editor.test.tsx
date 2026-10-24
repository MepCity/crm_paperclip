import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { CampaignFilterEditor } from "./campaign-filter-editor";

afterEach(cleanup);

const mockCampaignOptions = [
  { id: "camp-1", label: "Campaign One" },
  { id: "camp-2", label: "Campaign Two" },
  { id: "camp-3", label: "Campaign Three" },
  { id: "camp-4", label: "Campaign Four" },
  { id: "camp-5", label: "Campaign Five" },
  { id: "camp-6", label: "Campaign Six" },
];

describe("CampaignFilterEditor", () => {
  it("renders Campaign Name and Member Status controls", () => {
    render(
      <CampaignFilterEditor
        value={{ campaignIds: [] }}
        onChange={() => {}}
        campaignOptions={mockCampaignOptions}
      />,
    );

    expect(screen.getByRole("button", { name: "Campaign Name" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Member Status" })).toBeTruthy();
  });

  it("selects campaign options and calls onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <CampaignFilterEditor
        value={{ campaignIds: [] }}
        onChange={onChange}
        campaignOptions={mockCampaignOptions}
      />,
    );

    const campaignTrigger = screen.getByRole("button", { name: "Campaign Name" });
    await user.click(campaignTrigger);

    const option1 = screen.getByRole("option", { name: "Campaign One" });
    await user.click(option1);

    expect(onChange).toHaveBeenCalledWith({
      campaignIds: ["camp-1"],
    });
  });

  it("caps campaign selection at 5 and shows warning when selecting 6th", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <CampaignFilterEditor
        value={{ campaignIds: ["camp-1", "camp-2", "camp-3", "camp-4", "camp-5"] }}
        onChange={onChange}
        campaignOptions={mockCampaignOptions}
      />,
    );

    const campaignTrigger = screen.getByRole("button", { name: "Campaign Name" });
    await user.click(campaignTrigger);

    const option6 = screen.getByRole("option", { name: "Campaign Six" });
    await user.click(option6);

    expect(onChange).toHaveBeenCalledWith({
      campaignIds: ["camp-1", "camp-2", "camp-3", "camp-4", "camp-5"],
    });
    expect(screen.getByRole("alert", { hidden: true }).textContent).toBe(
      "Maximum 5 campaigns can be selected.",
    );
  });

  it("selects member status and calls onChange with memberStatuses array", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <CampaignFilterEditor
        value={{ campaignIds: ["camp-1"] }}
        onChange={onChange}
        campaignOptions={mockCampaignOptions}
      />,
    );

    const statusTrigger = screen.getByRole("button", { name: "Member Status" });
    await user.click(statusTrigger);

    const plannedOption = screen.getByRole("option", { name: "Planned" });
    await user.click(plannedOption);

    expect(onChange).toHaveBeenCalledWith({
      campaignIds: ["camp-1"],
      memberStatuses: ["Planned"],
    });
  });

  it("clears memberStatuses to undefined when all statuses deselected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <CampaignFilterEditor
        value={{ campaignIds: ["camp-1"], memberStatuses: ["Planned"] }}
        onChange={onChange}
        campaignOptions={mockCampaignOptions}
      />,
    );

    const statusTrigger = screen.getByRole("button", { name: "Member Status" });
    await user.click(statusTrigger);

    const plannedOption = screen.getByRole("option", { name: "Planned" });
    await user.click(plannedOption);

    expect(onChange).toHaveBeenCalledWith({
      campaignIds: ["camp-1"],
      memberStatuses: undefined,
    });
  });
});
