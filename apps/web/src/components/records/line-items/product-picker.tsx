"use client";

import type { ProductForLine } from "@crm/core/records/line-items";
import { useEffect, useId, useRef, useState } from "react";
import { Icons } from "@/components/ui/icon";
import { useOptionalClientRecordService } from "@/lib/api/client/provider";

interface ProductHit extends ProductForLine {
  Product_Code?: string | null;
}

export interface ProductPickerProps {
  value: { id: string; name?: string } | null;
  label: string;
  disabled?: boolean;
  invalid?: boolean;
  onPick: (product: ProductForLine) => void;
}

/** Lookup of active products (ADR 0016 §6): type to search, pick from the list. */
export function ProductPicker({ value, label, disabled, invalid, onPick }: ProductPickerProps) {
  const service = useOptionalClientRecordService();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [hits, setHits] = useState<ProductHit[]>([]);
  const [loading, setLoading] = useState(false);
  const viewId = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !service) return;
    let active = true;
    setLoading(true);
    void (async () => {
      try {
        if (!viewId.current) {
          const views = await service.listViews("Products");
          viewId.current = (views.find((view) => view.isDefault) ?? views[0])?.id ?? null;
        }
        if (!viewId.current) return;
        const result = await service.list("Products", {
          viewId: viewId.current,
          page: 1,
          perPage: 10,
          search: text.trim() || undefined,
          filters: { field: "Product_Active", comparator: "equal", value: true },
        });
        if (active)
          setHits(result.records.map((record) => ({ id: record.id, ...record.fields })) as never);
      } catch {
        if (active) setHits([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, text, service]);

  return (
    <div className="line-items__product">
      <div className="line-items__product-box">
        <input
          type="text"
          className="line-items__input"
          aria-label={label}
          aria-invalid={invalid || undefined}
          aria-controls={open ? listId : undefined}
          autoComplete="off"
          disabled={disabled}
          value={open ? text : (value?.name ?? "")}
          placeholder="Search product"
          onFocus={() => {
            setText("");
            setOpen(true);
          }}
          onChange={(event) => {
            setText(event.target.value);
            setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
        />
        <Icons.recordLookup module="Products" className="line-items__product-icon" aria-hidden />
      </div>
      {open && (
        <div id={listId} className="line-items__menu">
          {loading && hits.length === 0 ? (
            <p className="line-items__menu-note">Loading…</p>
          ) : hits.length === 0 ? (
            <p className="line-items__menu-note">No active products found</p>
          ) : (
            hits.map((hit) => (
              <div key={hit.id}>
                <button
                  type="button"
                  className="line-items__menu-item"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onPick(hit);
                    setOpen(false);
                  }}
                >
                  <span>{hit.Product_Name}</span>
                  {hit.Product_Code ? (
                    <span className="line-items__menu-meta">{hit.Product_Code}</span>
                  ) : null}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
