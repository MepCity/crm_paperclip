"use client";
import { Select, SelectItem } from "./select";
export default function SelectDemo() {
  return (
    <div className="max-w-sm space-y-4">
      <Select
        name="fruit"
        label="Select a fruit"
        items={[
          { id: 1, name: "Apple" },
          { id: 2, name: "Banana" },
        ]}
      >
        {(item: { id: number; name: string }) => <SelectItem id={item.id}>{item.name}</SelectItem>}
      </Select>
      <Select label="Disabled choice" isDisabled items={[{ id: 1, name: "Apple" }]}>
        {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
      </Select>
      <Select
        label="Invalid choice"
        description="Choose a fruit"
        isInvalid
        errorMessage="A choice is required"
        items={[{ id: 1, name: "Apple" }]}
      >
        {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
      </Select>
    </div>
  );
}
