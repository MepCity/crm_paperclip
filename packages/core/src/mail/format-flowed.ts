/**
 * RFC 3676 §4 decoder for `format=flowed` plain-text bodies. Pure function.
 */

export interface FormatFlowedOptions {
  /** `DelSp=Yes`: the trailing space of a soft line break is removed when joined. */
  delSp?: boolean;
}

const SIGNATURE_SEPARATOR = "-- ";

export function decodeFormatFlowed(text: string, opts: FormatFlowedOptions = {}): string {
  if (text === "") return "";
  const delSp = opts.delSp === true;
  const rawLines = text.split(/\r\n|\n/);
  const endsWithNewline = rawLines.length > 1 && rawLines[rawLines.length - 1] === "";
  if (endsWithNewline) rawLines.pop();

  const out: string[] = [];
  let buffer: string | null = null;
  let bufferDepth = 0;

  const flush = (): void => {
    if (buffer === null) return;
    out.push(bufferDepth > 0 ? `${">".repeat(bufferDepth)} ${buffer}` : buffer);
    buffer = null;
  };

  for (const raw of rawLines) {
    let depth = 0;
    while (raw[depth] === ">") depth += 1;
    let content = raw.slice(depth);
    if (content.startsWith(" ")) content = content.slice(1);

    if (buffer !== null && depth !== bufferDepth) flush();

    const isSignature = content === SIGNATURE_SEPARATOR;
    const flowed = !isSignature && content.endsWith(" ");

    if (buffer === null) {
      bufferDepth = depth;
      buffer = "";
    }
    buffer += flowed && delSp ? content.slice(0, -1) : content;
    if (!flowed) flush();
  }
  flush();

  const result = out.join("\n");
  return endsWithNewline ? `${result}\n` : result;
}
