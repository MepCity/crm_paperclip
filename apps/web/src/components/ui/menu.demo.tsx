"use client";
import { useState } from "react";
import { Icons } from "./icon";
import { Menu, MenuButton, MenuItem, MenuTrigger } from "./menu";
export default function MenuDemo() {
  const [action, setAction] = useState("No action selected");
  return (
    <div className="space-y-4">
      <MenuTrigger>
        <MenuButton>
          Options <Icons.chevronDown className="w-4 h-4 ml-2" aria-hidden />
        </MenuButton>
        <Menu onAction={(key) => setAction(`Selected: ${key}`)}>
          <MenuItem id="edit">Edit</MenuItem>
          <MenuItem id="delete" variant="danger">
            Delete
          </MenuItem>
          <MenuItem id="unavailable" isDisabled>
            Unavailable
          </MenuItem>
        </Menu>
      </MenuTrigger>
      <MenuTrigger>
        <MenuButton>Measured menu</MenuButton>
        <Menu
          appearance="measured"
          aria-label="Measured options"
          selectionMode="single"
          selectedKeys={["current"]}
          header={<p>Example identity</p>}
        >
          <MenuItem appearance="measured" id="current">
            Current organization
          </MenuItem>
          <MenuItem appearance="measured" id="other">
            Another organization
          </MenuItem>
        </Menu>
      </MenuTrigger>
      <MenuButton isDisabled>Disabled menu</MenuButton>
      <p role="status">{action}</p>
    </div>
  );
}
