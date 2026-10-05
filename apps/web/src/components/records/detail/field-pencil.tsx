export function FieldPencil({ label }: { label: string }) {
  return (
    <svg
      role="img"
      aria-label={label}
      className="detail-field-edit"
      width="12.5"
      height="12"
      viewBox="0 0 12.5 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1.5 10.5h1.2l6.6-6.6-1.2-1.2-6.6 6.6v1.2zM9.9 3.3l1.2-1.2c.3-.3.3-.8 0-1.1l-.9-.9c-.3-.3-.8-.3-1.1 0l-1.2 1.2 1.2 1.2z"
        fill="currentColor"
      />
    </svg>
  );
}
