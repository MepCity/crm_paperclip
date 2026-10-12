"use client";

import { useActionState, useRef, useState } from "react";
import { createOrganizationAction } from "@/app/orgs/new/actions";
import { Form, SubmitButton } from "@/components/ui/form";
import { TextField } from "@/components/ui/text-field";
import { initialActionState } from "@/lib/action";
import { slugify } from "@/lib/slugify";

export function OrganizationForm() {
  const [state, formAction] = useActionState(createOrganizationAction, initialActionState);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const slugTouched = useRef(false);

  return (
    <Form
      action={formAction}
      actionState={state}
      validationBehavior="native"
      aria-label="Create organization"
    >
      <TextField
        name="name"
        label="Name"
        isRequired
        autoComplete="organization"
        value={name}
        onChange={(value) => {
          setName(value);
          if (!slugTouched.current) setSlug(slugify(value));
        }}
      />
      <TextField
        name="slug"
        label="Slug"
        isRequired
        autoComplete="off"
        description="Used in the organization address."
        value={slug}
        onChange={(value) => {
          slugTouched.current = true;
          setSlug(value);
        }}
      />
      <SubmitButton>Create organization</SubmitButton>
    </Form>
  );
}
