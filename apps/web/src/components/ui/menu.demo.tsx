"use client";
import { Icons } from "./icon";
import { Menu, MenuButton, MenuItem, MenuTrigger } from "./menu";
export default function MenuDemo() {
  return (
    <MenuTrigger>
      <MenuButton className="inline-flex items-center gap-2 border border-border px-3 py-2 rounded-md hover:bg-surface-hover transition-colors">
        Options <Icons.chevronDown className="w-4 h-4" />
      </MenuButton>
      <Menu onAction={(key) => alert(key)}>
        <MenuItem
          id="edit"
          className="px-3 py-2 outline-none hover:bg-surface-hover cursor-default"
        >
          Edit
        </MenuItem>
        <MenuItem
          id="delete"
          className="px-3 py-2 outline-none text-danger hover:bg-danger/10 cursor-default"
        >
          Delete
        </MenuItem>
      </Menu>
    </MenuTrigger>
  );
}
