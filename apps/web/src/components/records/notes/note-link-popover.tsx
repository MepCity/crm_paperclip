"use client";

import { type KeyboardEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

export interface NoteLinkPopoverProps {
  initialText?: string;
  onInsert: (href: string, text: string) => void;
  onClose: () => void;
}

const ALLOWED_SCHEMES = new Set(["http:", "https:", "mailto:"]);

/** Returns a safe href, or `null` when the input is empty or uses a disallowed scheme. */
export function normalizeNoteLinkHref(input: string): string | null {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: strips control characters used to hide schemes
  const cleaned = input.replace(/[\u0000-\u001f\u007f\s]+/g, "");
  if (!cleaned) return null;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(cleaned);
  if (scheme) {
    const name = `${(scheme[1] ?? "").toLowerCase()}:`;
    if (!ALLOWED_SCHEMES.has(name)) {
      // `host:port` without a scheme is a plain address, not a scheme.
      if (!/^[^:/]+:\d+(?:[/?#]|$)/.test(cleaned)) return null;
      return `https://${cleaned}`;
    }
    return `${name}${cleaned.slice(name.length)}`;
  }
  if (cleaned.startsWith("//")) return `https:${cleaned}`;
  return `https://${cleaned}`;
}

export function NoteLinkPopover({ initialText = "", onInsert, onClose }: NoteLinkPopoverProps) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState(initialText);
  const [invalid, setInvalid] = useState(false);

  const submit = () => {
    const href = normalizeNoteLinkHref(url);
    if (!href) {
      setInvalid(true);
      return;
    }
    onInsert(href, text.trim() || href);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: key handling for the whole popover body
    <div className="flex w-72 flex-col gap-3 p-3" onKeyDown={onKeyDown}>
      <TextField
        label="URL"
        value={url}
        onChange={(value) => {
          setUrl(value);
          setInvalid(false);
        }}
        isRequired
        isInvalid={invalid}
        errorMessage="Please enter a valid URL."
        autoFocus
      />
      <TextField label="Text" value={text} onChange={setText} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="record" onPress={onClose}>
          Cancel
        </Button>
        <Button variant="primary" size="record" onPress={submit}>
          Insert
        </Button>
      </div>
    </div>
  );
}
