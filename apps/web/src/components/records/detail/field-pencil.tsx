import { Icons } from "@/components/ui/icon";

export function FieldPencil({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="detail-field-edit" aria-label={label} onClick={onClick}>
      <Icons.fieldEdit width={12.5} height={12} aria-hidden />
    </button>
  );
}
