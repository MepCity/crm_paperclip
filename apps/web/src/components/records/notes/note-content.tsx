import { type CSSProperties, createElement, Fragment, type JSX, type ReactNode } from "react";
import {
  ALLOWED_TAGS,
  DROPPED_TAGS,
  hasDomParser,
  safeHref,
  sanitizeStyle,
  stripMarkup,
} from "./note-content-policy";

function convertChildren(node: Node, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  Array.from(node.childNodes).forEach((child, i) => {
    const converted = convertNode(child, `${keyPrefix}.${i}`);
    if (converted !== null && converted !== undefined) out.push(converted);
  });
  return out;
}

function convertNode(node: Node, key: string): ReactNode {
  if (node.nodeType === 3) return node.nodeValue ?? "";
  if (node.nodeType !== 1) return null; // comments and others drop
  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  if (DROPPED_TAGS.has(tag)) return null;
  const children = convertChildren(el, key);

  if (!ALLOWED_TAGS.has(tag))
    return children.length ? <Fragment key={key}>{children}</Fragment> : null;

  if (tag === "br") return <br key={key} />;

  if (tag === "a") {
    const href = safeHref(el.getAttribute("href"));
    if (!href) return <Fragment key={key}>{children}</Fragment>;
    return (
      <a key={key} href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  if (tag === "font") {
    const style = sanitizeStyle(`color:${el.getAttribute("color") ?? ""}`, "span");
    return (
      <span key={key} style={style as CSSProperties | undefined}>
        {children}
      </span>
    );
  }

  const style = sanitizeStyle(el.getAttribute("style"), tag) as CSSProperties | undefined;
  return createElement(tag, style ? { key, style } : { key }, ...children);
}

export function NoteContent(props: { html: string; className?: string }): JSX.Element {
  const { html, className } = props;
  if (!html || html.trim() === "") return <div className={className} />;

  if (!hasDomParser()) {
    return <div className={className}>{stripMarkup(html).trim()}</div>;
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  return <div className={className}>{convertChildren(doc.body, "n")}</div>;
}
