"use client";

import "./record-input.css";

import type { ComponentProps, ReactNode } from "react";
import {
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
  FieldError,
  Input,
  Label,
  Text,
} from "react-aria-components";
import { Icons } from "./icon";
import { laterModuleProps, type ModuleKey, useLaterModule } from "./later-module";

export interface TextFieldProps extends AriaTextFieldProps {
  label: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  endAction?: ReactNode;
  hideLabel?: boolean;
  placeholder?: string;
  variant?: "default" | "filter-search" | "search";
  /** `measured` keeps the filter search width token; `fill` spans the container it sits in. */
  size?: "measured" | "fill";
  /** Optional class on the filter-search field wrapper (replaces styling primitive internals). */
  filterSearchWrapperClassName?: string;
  description?: string;
  errorMessage?: string | ((v: import("react-aria-components").ValidationResult) => string);
  laterModule?: ModuleKey;
  /**
   * On-screen keyboard hint for the native input. React Aria does not read this prop, so it is
   * forwarded to `Input` here rather than left in the spread.
   */
  inputMode?: ComponentProps<"input">["inputMode"];
}

export function TextField({
  label,
  prefix,
  suffix,
  endAction,
  hideLabel = false,
  placeholder,
  variant = "default",
  size = "measured",
  filterSearchWrapperClassName,
  description,
  errorMessage,
  laterModule,
  inputMode,
  ...props
}: TextFieldProps) {
  const laterRef = useLaterModule<HTMLInputElement>(laterModule);
  return (
    <AriaTextField
      {...props}
      className={
        variant === "filter-search"
          ? size === "fill"
            ? "flex w-full flex-col gap-0"
            : "flex flex-col gap-0"
          : "flex flex-col gap-1"
      }
    >
      <Label
        className={variant === "filter-search" || hideLabel ? "sr-only" : "record-label text-md"}
      >
        {label}
      </Label>
      {variant === "search" ? (
        <div className="flex items-center gap-2">
          {prefix}
          <Input
            ref={laterRef}
            placeholder={placeholder}
            inputMode={inputMode}
            className="min-w-0 flex-1 bg-transparent py-1 text-md text-text outline-none placeholder:text-text-muted"
            readOnly={Boolean(laterModule) || props.isReadOnly}
            {...(laterModule ? laterModuleProps(laterModule) : {})}
          />
          {suffix}
        </div>
      ) : variant === "filter-search" ? (
        <div
          className={
            filterSearchWrapperClassName ??
            (size === "fill"
              ? "record-filter-search-wrap record-filter-search-wrap--fill"
              : "record-filter-search-wrap")
          }
        >
          <Icons.filterSearch
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-(--size-list-filter-search-icon-inset) h-(--size-list-filter-search-icon) w-(--size-list-filter-search-icon) -translate-y-1/2 text-text"
          />
          <Input
            placeholder={placeholder}
            inputMode={inputMode}
            className="h-(--size-list-filter-search-height) w-full min-w-0 rounded-md border border-control-border bg-surface pr-3 pl-(--size-list-filter-search-padding) text-md font-normal text-text outline-none placeholder:text-md placeholder:font-normal placeholder:text-text-placeholder data-disabled:bg-surface-hover data-disabled:opacity-50 data-focused:border-primary data-focused:ring-2 data-focused:ring-focus-ring data-focus-visible:border-primary data-focus-visible:ring-2 data-focus-visible:ring-focus-ring data-invalid:border-danger"
          />
        </div>
      ) : (
        <div
          className="record-control record-input-frame"
          data-required={props.isRequired || undefined}
          data-invalid={props.isInvalid || undefined}
        >
          {prefix}
          <Input
            ref={laterRef}
            placeholder={placeholder}
            inputMode={inputMode}
            className="record-control"
            readOnly={Boolean(laterModule) || props.isReadOnly}
            {...(laterModule ? laterModuleProps(laterModule) : {})}
          />
          {suffix}
          {endAction}
        </div>
      )}
      {description && (
        <Text slot="description" className="text-sm text-text-muted">
          {description}
        </Text>
      )}
      <FieldError className="record-form-validation-error">{errorMessage}</FieldError>
    </AriaTextField>
  );
}
