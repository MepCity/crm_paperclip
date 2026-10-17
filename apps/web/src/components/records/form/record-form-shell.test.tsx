import { cleanup, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { RecordFormShell } from "./record-form-shell";

afterEach(cleanup);

const actionLabels = {
  cancel: "Vazgeç",
  saveAndNew: "Kaydet ve Yeni",
  save: "Kaydet",
};

describe("RecordFormShell", () => {
  it("renders title, title accessory, button labels from actionLabels, and children", () => {
    render(
      <RecordFormShell
        title="Yeni Kayıt"
        formAriaLabel="Kayıt formu"
        actionLabels={actionLabels}
        titleAccessory={<span data-testid="accessory">Ek Bilgi</span>}
      >
        <div data-testid="form-content">Form içeriği</div>
      </RecordFormShell>,
    );

    const heading = screen.getByRole("heading", { level: 1, name: "Yeni Kayıt" });
    expect(heading).toBeTruthy();
    expect(heading.hasAttribute("data-record-form-title")).toBe(true);

    expect(screen.getByTestId("accessory").textContent).toBe("Ek Bilgi");
    expect(screen.getByRole("form", { name: "Kayıt formu" })).toBeTruthy();
    expect(screen.getByTestId("form-content")).toBeTruthy();

    expect(screen.getByRole("button", { name: "Vazgeç" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Kaydet ve Yeni" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Kaydet" })).toBeTruthy();
  });

  it("calls onCancel, onSaveAndNew, and onSave callbacks on button click", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onSaveAndNew = vi.fn();
    const onSave = vi.fn();

    render(
      <RecordFormShell
        title="Kayıt Düzenle"
        formAriaLabel="Kayıt formu"
        actionLabels={actionLabels}
        onCancel={onCancel}
        onSaveAndNew={onSaveAndNew}
        onSave={onSave}
      >
        <p>İçerik</p>
      </RecordFormShell>,
    );

    await user.click(screen.getByRole("button", { name: "Vazgeç" }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Kaydet ve Yeni" }));
    expect(onSaveAndNew).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("disables action buttons and prevents callback execution when disabled is true", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onSaveAndNew = vi.fn();
    const onSave = vi.fn();

    render(
      <RecordFormShell
        title="Kayıt Kaydediliyor"
        formAriaLabel="Kayıt formu"
        actionLabels={actionLabels}
        onCancel={onCancel}
        onSaveAndNew={onSaveAndNew}
        onSave={onSave}
        disabled={true}
      >
        <p>İçerik</p>
      </RecordFormShell>,
    );

    const cancelButton = screen.getByRole("button", {
      name: "Vazgeç",
    }) as HTMLButtonElement;
    const saveAndNewButton = screen.getByRole("button", {
      name: "Kaydet ve Yeni",
    }) as HTMLButtonElement;
    const saveButton = screen.getByRole("button", {
      name: "Kaydet",
    }) as HTMLButtonElement;

    expect(cancelButton.disabled).toBe(true);
    expect(saveAndNewButton.disabled).toBe(true);
    expect(saveButton.disabled).toBe(true);

    await user.click(cancelButton);
    await user.click(saveAndNewButton);
    await user.click(saveButton);

    expect(onCancel).not.toHaveBeenCalled();
    expect(onSaveAndNew).not.toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("renders error banner when provided", () => {
    render(
      <RecordFormShell
        title="Kayıt"
        formAriaLabel="Kayıt formu"
        actionLabels={actionLabels}
        errorBanner={<div data-testid="error-banner">Hata oluştu</div>}
      >
        <p>İçerik</p>
      </RecordFormShell>,
    );

    expect(screen.getByTestId("error-banner").textContent).toBe("Hata oluştu");
  });

  it("calls onSubmit when the underlying form is submitted", () => {
    const onSubmit = vi.fn((e) => e.preventDefault());

    render(
      <RecordFormShell
        title="Kayıt"
        formAriaLabel="Kayıt formu"
        actionLabels={actionLabels}
        onSubmit={onSubmit}
      >
        <button type="submit">Submit Inner</button>
      </RecordFormShell>,
    );

    const form = screen.getByRole("form", { name: "Kayıt formu" });
    fireEvent.submit(form);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("applies activity variant attributes and class names", () => {
    const { container } = render(
      <RecordFormShell
        title="Aktivite"
        variant="activity"
        formAriaLabel="Aktivite formu"
        actionLabels={actionLabels}
      >
        <p>Aktivite formu</p>
      </RecordFormShell>,
    );

    const shell = container.querySelector("[data-record-form-shell]");
    expect(shell?.getAttribute("data-form-variant")).toBe("activity");

    const body = container.querySelector(".record-form-activity-body");
    expect(body).toBeTruthy();
  });
});
