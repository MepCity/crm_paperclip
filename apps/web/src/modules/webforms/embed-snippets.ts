export function sanitizePublicUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return parsed.toString();
  } catch {
    // If relative path
    if (url.startsWith("/")) {
      return url.replace(/["'<>]/g, "");
    }
    return "";
  }
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeJsString(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/'/g, "\\'");
}

export function getScriptEmbedCode(publicUrl: string): string {
  const safeUrl = escapeJsString(sanitizePublicUrl(publicUrl));
  return `<script type="text/javascript">
(function() {
  var ifr = document.createElement("iframe");
  ifr.src = "${safeUrl}";
  ifr.width = "100%";
  ifr.height = "600";
  ifr.frameBorder = "0";
  ifr.style.border = "none";
  var target = document.currentScript || document.scripts[document.scripts.length - 1];
  target.parentNode.insertBefore(ifr, target.nextSibling);
})();
</script>`;
}

export function getIframeEmbedCode(publicUrl: string): string {
  const safeUrl = escapeHtml(sanitizePublicUrl(publicUrl));
  return `<iframe src="${safeUrl}" width="100%" height="600" frameborder="0" style="border:0;" allowfullscreen></iframe>`;
}

export function getHostedUrl(publicUrl: string): string {
  return sanitizePublicUrl(publicUrl);
}
