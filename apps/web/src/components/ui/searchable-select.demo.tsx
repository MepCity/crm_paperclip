"use client";
import { SearchableSelect } from "./searchable-select";
import { SelectItem } from "./select";

interface Fruit {
  id: string;
  name: string;
}

const fruits: Fruit[] = [
  { id: "none", name: "None" },
  { id: "apple", name: "Apple" },
  { id: "banana", name: "Banana" },
  { id: "cherry", name: "Cherry" },
  { id: "fig", name: "Fig" },
  { id: "grape", name: "Grape" },
];

export default function SearchableSelectDemo() {
  const choices = [
    { selected: "none", label: "Nothing chosen" },
    { selected: "cherry", label: "One chosen" },
  ];
  return (
    <div className="max-w-sm space-y-4">
      {choices.map((choice) => {
        const valueText = fruits.find((fruit) => fruit.id === choice.selected)?.name ?? "None";
        return (
          <SearchableSelect
            key={choice.label}
            label={choice.label}
            panelTitle={`${choice.label} options`}
            searchLabel={`Search ${choice.label.toLowerCase()}`}
            valueText={valueText}
            options={fruits}
            optionKey={(fruit) => fruit.id}
            optionText={(fruit) => fruit.name}
            selectedKey={choice.selected}
            onSelect={() => undefined}
          >
            {(fruit) => <SelectItem id={fruit.id}>{fruit.name}</SelectItem>}
          </SearchableSelect>
        );
      })}
    </div>
  );
}
