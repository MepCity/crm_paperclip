"use client";
import { ComboBox, ComboBoxItem } from "./combo-box";

interface Account {
  id: string;
  name: string;
}

const accounts: Account[] = [
  { id: "account-1", name: "Northwind Traders" },
  { id: "account-2", name: "Contoso Ltd" },
  { id: "account-3", name: "Fabrikam Inc" },
];

function AccountItem(item: Account) {
  return (
    <ComboBoxItem id={item.id} textValue={item.name}>
      {item.name}
    </ComboBoxItem>
  );
}

// Stands in for a lookup endpoint: answers slowly and only knows the accounts above.
async function searchAccounts(query: string): Promise<Account[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const needle = query.toLowerCase();
  return accounts.filter((account) => account.name.toLowerCase().includes(needle));
}

export default function ComboBoxDemo() {
  return (
    <div className="flex max-w-sm flex-col gap-4">
      <ComboBox name="demo-combo" label="Empty" items={accounts}>
        {AccountItem}
      </ComboBox>
      <ComboBox
        name="demo-combo-filled"
        label="Filled"
        items={accounts}
        defaultSelectedKey="account-2"
      >
        {AccountItem}
      </ComboBox>
      <ComboBox
        name="demo-combo-lookup"
        label="Lookup"
        description="Searches as you type; try 'co' or 'zzz'"
        loadOptions={searchAccounts}
      >
        {AccountItem}
      </ComboBox>
      <ComboBox
        name="demo-combo-saved-lookup"
        label="Saved lookup"
        description="The saved selection remains when you leave an unfinished search"
        loadOptions={searchAccounts}
        defaultSelectedItem={{ id: "account-3", label: "Fabrikam Inc" }}
      >
        {AccountItem}
      </ComboBox>
      <ComboBox
        name="demo-combo-error"
        label="With error"
        items={accounts}
        isInvalid
        errorMessage="Pick an account"
      >
        {AccountItem}
      </ComboBox>
      <ComboBox name="demo-combo-disabled" label="Disabled" items={accounts} isDisabled>
        {AccountItem}
      </ComboBox>
      <ComboBox name="demo-combo-required" label="Required" items={accounts} isRequired>
        {AccountItem}
      </ComboBox>
    </div>
  );
}
