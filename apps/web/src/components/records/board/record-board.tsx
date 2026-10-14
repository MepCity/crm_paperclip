"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { ModuleKey } from "@/components/ui/later-module";
import { Link } from "@/components/ui/link";
import { Skeleton } from "@/components/ui/skeleton";
import "./record-board.css";

export interface BoardCard {
  id: string;
  rows: readonly { text: string; href?: string; tone?: "danger"; strong?: boolean }[];
  iconLink?: { href: string; label: string; icon: ReactNode; laterModule?: ModuleKey };
}
export interface BoardColumn {
  key: string;
  label: string;
  count: number;
  percentage?: string;
  totalText?: string;
  cards: readonly BoardCard[];
}
// biome-ignore lint/suspicious/noConfusingVoidType: mutation callbacks may resolve without an explicit result
export type BoardMoveResult = "moved" | "cancelled" | { to: string } | void;
export interface RecordBoardProps {
  columns: readonly BoardColumn[];
  toolbar?: ReactNode;
  createLabel: string;
  onCreate: (columnKey: string) => void;
  onMove: (cardId: string, fromKey: string, toKey: string) => Promise<BoardMoveResult>;
  /** Pure module-owned projection for pending and redirected moves; omitted preserves all rows. */
  buildOptimisticCard?: (card: BoardCard, targetColumn: BoardColumn) => BoardCard;
  loading?: boolean;
  children?: ReactNode;
}

/** Service-free board. Optimistic moves remain until incoming data acknowledges them. */
export function RecordBoard({
  columns,
  toolbar,
  createLabel,
  onCreate,
  onMove,
  buildOptimisticCard,
  loading,
  children,
}: RecordBoardProps) {
  const [moves, setMoves] = useState<Record<string, { from: string; to: string; card: BoardCard }>>(
    {},
  );
  const pending = useRef(new Set<string>());
  const dragging = useRef<{ id: string; from: string } | null>(null);

  useEffect(() => {
    setMoves((current) => {
      const next = { ...current };
      let changed = false;
      for (const [id, movement] of Object.entries(current)) {
        if (!pending.current.has(id)) {
          const inTarget = columns
            .find((column) => column.key === movement.to)
            ?.cards.some((card) => card.id === id);
          const inSource = columns
            .find((column) => column.key === movement.from)
            ?.cards.some((card) => card.id === id);
          const inAny = columns.some((column) => column.cards.some((card) => card.id === id));
          if (inTarget || (!inSource && inAny) || !inAny) {
            delete next[id];
            changed = true;
          }
        }
      }
      return changed ? next : current;
    });
  }, [columns]);

  async function move(id: string, from: string, to: string) {
    if (from === to || pending.current.has(id)) return;
    const previous = moves[id];
    const originalCard =
      previous?.card ??
      columns.find((column) => column.key === from)?.cards.find((item) => item.id === id);
    if (!originalCard) return;
    const targetColumn = columns.find((column) => column.key === to);
    const card =
      targetColumn && buildOptimisticCard
        ? buildOptimisticCard(originalCard, targetColumn)
        : originalCard;
    pending.current.add(id);
    setMoves((current) => ({ ...current, [id]: { from, to, card } }));
    try {
      const result = await onMove(id, from, to);
      if (result !== "cancelled") {
        const finalTo = typeof result === "object" && result && "to" in result ? result.to : to;
        const finalTargetColumn = columns.find((column) => column.key === finalTo);
        const finalCard =
          finalTargetColumn && buildOptimisticCard
            ? buildOptimisticCard(originalCard, finalTargetColumn)
            : card;
        setMoves((current) => ({
          ...current,
          [id]: { from, to: finalTo, card: finalCard },
        }));
        return;
      }
    } catch {
      // Rejected moves restore the original position without inventing an error control.
    } finally {
      pending.current.delete(id);
    }
    setMoves((current) => {
      const next = { ...current };
      if (previous) next[id] = previous;
      else delete next[id];
      return next;
    });
  }

  return (
    <div className="record-board" data-record-board>
      {toolbar ? <div className="record-board-toolbar">{toolbar}</div> : null}
      <div className="record-board-scroll" data-board-scroll>
        {columns.map((column) => {
          const cards = column.cards.filter(
            (card) => !moves[card.id] || moves[card.id]?.to === column.key,
          );
          for (const [id, movement] of Object.entries(moves)) {
            if (movement.to === column.key && !cards.some((card) => card.id === id))
              cards.push(movement.card);
          }
          return (
            <section
              key={column.key}
              className="record-board-column"
              aria-label={column.label}
              data-board-column={column.key}
              onDragOver={(event) => {
                if (dragging.current) event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                const source = dragging.current;
                dragging.current = null;
                if (source) void move(source.id, source.from, column.key);
              }}
            >
              <header className="record-board-header">
                <div className="record-board-heading">
                  <span>{column.label}</span>
                  <span className="record-board-count">{column.count}</span>
                  {column.percentage !== undefined ? (
                    <>
                      <span className="text-text-muted" aria-hidden>
                        •
                      </span>
                      <span>{column.percentage}</span>
                    </>
                  ) : null}
                </div>
                {column.totalText !== undefined ? (
                  <div className="font-semibold record-board-total">{column.totalText}</div>
                ) : null}
                <div className="record-board-checkbox">
                  <Checkbox label={`Select ${column.label}`} hideLabel />
                </div>
              </header>
              <div className="record-board-cards">
                {loading ? (
                  <Skeleton />
                ) : (
                  cards.map((card) => (
                    <article
                      key={card.id}
                      className="record-board-card"
                      data-board-card={card.id}
                      draggable={!pending.current.has(card.id)}
                      onDragStart={(event) => {
                        dragging.current = { id: card.id, from: column.key };
                        event.dataTransfer.setData("text/plain", card.id);
                        event.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => {
                        dragging.current = null;
                      }}
                    >
                      {card.rows.map((row, index) => (
                        <div
                          // biome-ignore lint/suspicious/noArrayIndexKey: ordered, stateless display lines can repeat text
                          key={`${index}-${row.text}`}
                          className={
                            [
                              row.tone === "danger" ? "text-danger" : "",
                              row.strong ? "font-semibold" : "",
                            ]
                              .filter(Boolean)
                              .join(" ") || undefined
                          }
                        >
                          {row.href ? (
                            <Link
                              href={row.href}
                              variant="body"
                              className={index === 0 || row.strong ? "font-semibold" : undefined}
                            >
                              {row.text}
                            </Link>
                          ) : (
                            row.text
                          )}
                        </div>
                      ))}
                      {card.iconLink ? (
                        <Link
                          href={card.iconLink.href}
                          laterModule={card.iconLink.laterModule}
                          aria-label={card.iconLink.label}
                          variant="icon"
                          className="record-board-icon-link"
                        >
                          {card.iconLink.icon}
                        </Link>
                      ) : null}
                    </article>
                  ))
                )}
              </div>
              <footer className="record-board-footer">
                <Button
                  variant="ghost"
                  data-board-footer-create
                  onPress={() => onCreate(column.key)}
                  className="text-primary flex-1 justify-start"
                >
                  {createLabel}
                </Button>
                <span className="record-board-footer-arrows" aria-hidden>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M2 12h7m-3-3 3 3-3 3M22 12h-7m3-3-3 3 3 3M12 6v12" />
                  </svg>
                </span>
              </footer>
            </section>
          );
        })}
      </div>
      {children}
    </div>
  );
}
