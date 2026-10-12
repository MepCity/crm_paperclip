"use client";

import type { ReactNode } from "react";
import {
  Text,
  UNSTABLE_Toast as Toast,
  UNSTABLE_ToastContent as ToastContent,
  UNSTABLE_ToastQueue as ToastQueue,
  UNSTABLE_ToastRegion as ToastRegion,
} from "react-aria-components";
import { Button } from "./button";
import { Icons } from "./icon";

const toastStyles = {
  success: "border-success text-success",
  danger: "border-danger text-danger",
  info: "border-primary text-primary",
} as const;

const toastIcons = {
  success: Icons.success,
  danger: Icons.error,
  info: Icons.info,
} as const;

export interface ToastContentValue {
  variant: keyof typeof toastStyles;
  title: string;
  message?: string;
}

export const TOAST_TIMEOUT_MS = 5000;

const toastQueue = new ToastQueue<ToastContentValue>({ maxVisibleToasts: 5 });

export function toast(content: ToastContentValue) {
  return toastQueue.add(content, { timeout: TOAST_TIMEOUT_MS });
}

export function clearToasts() {
  toastQueue.clear();
}

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ToastRegion
        queue={toastQueue}
        className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2 outline-none"
      >
        {({ toast: item }) => {
          const Icon = toastIcons[item.content.variant];
          return (
            <Toast
              toast={item}
              className={`motion-safe:animate-toast-in flex items-start gap-3 rounded-md border bg-surface p-4 shadow-lg outline-none ${toastStyles[item.content.variant]}`}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <ToastContent className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
                <Text slot="title" className="font-semibold">
                  {item.content.title}
                </Text>
                {item.content.message ? (
                  <Text slot="description" className="text-text">
                    {item.content.message}
                  </Text>
                ) : null}
              </ToastContent>
              <Button slot="close" variant="ghost" size="sm">
                <Icons.close className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Toast>
          );
        }}
      </ToastRegion>
    </>
  );
}
