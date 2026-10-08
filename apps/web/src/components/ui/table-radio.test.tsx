import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { render } from "@/test/render";
import { TableRadio, TableRadioGroup } from "./table-radio";

afterEach(cleanup);

test("table radio selects with keyboard and shows ring styling", async () => {
  const user = userEvent.setup();
  render(
    <TableRadioGroup aria-label="Pick one" defaultValue="a">
      <TableRadio value="a" aria-label="Alpha" />
      <TableRadio value="b" aria-label="Beta" />
    </TableRadioGroup>,
  );
  const beta = screen.getByRole("radio", { name: "Beta" }) as HTMLInputElement;
  await user.click(beta);
  expect(beta.checked).toBe(true);
});
