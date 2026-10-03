"use client";
import { Select, SelectItem } from "./select";
export default function SelectDemo() {
  return (
    <div className="max-w-sm">
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
    </div>
  );
}
