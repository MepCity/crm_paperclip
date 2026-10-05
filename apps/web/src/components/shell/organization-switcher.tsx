"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Menu, MenuItem, MenuTrigger } from "@/components/ui/menu";

export interface ShellOrganization {
  name: string;
  slug: string;
}

export function OrganizationSwitcher({
  organizations,
  currentSlug,
}: {
  organizations: readonly ShellOrganization[];
  currentSlug: string;
}) {
  const router = useRouter();
  const current = organizations.find((org) => org.slug === currentSlug);
  return (
    <MenuTrigger>
      <Button
        variant="rail"
        size="selector"
        aria-label="Organization switcher"
        className="h-(--size-rail-product-selector-height) min-w-0 gap-(--size-rail-product-gap) "
      >
        <Icons.building className="size-(--size-rail-product-mark) shrink-0" aria-hidden />
        <span className="truncate">{current?.name}</span>
        <Icons.chevronDown className="size-(--size-rail-group-icon) shrink-0" aria-hidden />
      </Button>
      <Menu
        appearance="measured"
        aria-label="Organizations"
        selectionMode="single"
        selectedKeys={[currentSlug]}
        onAction={(key) =>
          router.push(key === ":create-organization" ? "/orgs/new" : `/crm/${String(key)}`)
        }
      >
        {organizations.map((org) => (
          <MenuItem appearance="measured" id={org.slug} key={org.slug} textValue={org.name}>
            {({ isSelected }) => (
              <>
                <span className="flex-1 truncate">{org.name}</span>
                {isSelected && (
                  <Icons.check className="size-(--size-menu-icon) shrink-0" aria-hidden />
                )}
              </>
            )}
          </MenuItem>
        ))}
        <MenuItem appearance="measured" id=":create-organization" textValue="Create organization">
          <Icons.plus className="size-(--size-menu-icon)" aria-hidden />
          Create organization
        </MenuItem>
      </Menu>
    </MenuTrigger>
  );
}
