import { Icons } from "@/components/ui/icon";

export function FieldPencil({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="detail-field-edit" aria-label={label} onClick={onClick}>
      <Icons.fieldEdit aria-hidden />
    </button>
  );
}
