/**
 * Parse email content to extract readable text from HTML/MIME format
 */
export function parseEmailContent(rawContent: string): string {
  if (!rawContent) return "";

  // Remove MIME headers (Content-Type, Content-Transfer-Encoding, etc.)
  let content = rawContent.replace(/^--[a-zA-Z0-9]+.*$/gm, ""); // Remove MIME boundaries
  content = content.replace(/^Content-Type:.*$/gm, "");
  content = content.replace(/^Content-Transfer-Encoding:.*$/gm, "");
  
  // Extract text from HTML if present
  if (content.includes("<html") || content.includes("<div")) {
    // Remove HTML tags but preserve line breaks
    content = content.replace(/<br\s*\/?>/gi, "\n");
    content = content.replace(/<\/p>/gi, "\n\n");
    content = content.replace(/<\/div>/gi, "\n");
    content = content.replace(/<[^>]+>/g, "");
  }
  
  // Decode HTML entities
  content = content.replace(/&lt;/g, "<");
  content = content.replace(/&gt;/g, ">");
  content = content.replace(/&amp;/g, "&");
  content = content.replace(/&quot;/g, '"');
  content = content.replace(/&#39;/g, "'");
  content = content.replace(/&nbsp;/g, " ");
  
  // Remove excessive whitespace
  content = content.replace(/\n{3,}/g, "\n\n");
  content = content.trim();
  
  return content;
}

/**
 * Extract quoted text from email replies
 */
export function extractQuotedText(content: string): { original: string; quoted: string } {
  const quoteMarkers = [
    /^On .+ wrote:$/m,
    /^>.*$/gm,
    /^From:.*$/m,
  ];
  
  let splitIndex = -1;
  for (const marker of quoteMarkers) {
    const match = content.match(marker);
    if (match && match.index !== undefined) {
      splitIndex = match.index;
      break;
    }
  }
  
  if (splitIndex > 0) {
    return {
      original: content.substring(0, splitIndex).trim(),
      quoted: content.substring(splitIndex).trim(),
    };
  }
  
  return {
    original: content,
    quoted: "",
  };
}
