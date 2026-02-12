/**
 * Parse and clean email content to extract readable text
 */
export function parseEmailContent(rawContent: string): {
  plainText: string;
  htmlContent: string;
} {
  if (!rawContent) {
    return { plainText: '', htmlContent: '' };
  }

  // Remove MIME headers (lines before the first blank line after headers)
  let content = rawContent;
  
  // Remove Content-Type, Content-Transfer-Encoding, and other MIME headers
  content = content.replace(/^(Content-Type|Content-Transfer-Encoding|MIME-Version|Boundary|--[a-f0-9]+).*$/gim, '');
  
  // Remove email headers like "On Wed, 11 Feb 2026 at 20:47..."
  content = content.replace(/^On\s+\w+,\s+\d+\s+\w+\s+\d+\s+at\s+[\d:]+.*?wrote:/im, '');
  
  // Remove quoted-printable encoding artifacts
  content = content.replace(/=\r?\n/g, '');
  content = content.replace(/=([0-9A-F]{2})/gi, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  // Extract text from HTML if present
  let plainText = content;
  
  // Remove HTML tags but keep the text content
  plainText = plainText.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  plainText = decodeHTMLEntities(plainText);
  
  // Remove multiple consecutive blank lines
  plainText = plainText.replace(/\n\s*\n\s*\n+/g, '\n\n');
  
  // Trim whitespace
  plainText = plainText.trim();
  
  // If content looks like HTML, try to render it nicely
  const htmlContent = content.includes('<') ? sanitizeHTML(content) : '';
  
  return {
    plainText,
    htmlContent,
  };
}

/**
 * Decode HTML entities
 */
function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
    '&apos;': "'",
  };
  
  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }
  
  // Handle numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (match, code) => {
    return String.fromCharCode(parseInt(code, 10));
  });
  
  return decoded;
}

/**
 * Sanitize HTML to prevent XSS while preserving formatting
 */
function sanitizeHTML(html: string): string {
  // Remove script tags and content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove style tags
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Keep only safe tags
  const allowedTags = ['p', 'br', 'div', 'span', 'b', 'strong', 'i', 'em', 'u', 'a', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  
  // Remove disallowed tags but keep content
  sanitized = sanitized.replace(/<\/?(?!(?:p|br|div|span|b|strong|i|em|u|a|ul|ol|li|blockquote|h[1-6])\b)[^>]*>/gi, '');
  
  return sanitized;
}

/**
 * Extract plain text from email, removing quoted sections
 */
export function extractMainContent(text: string): string {
  // Remove quoted text sections (lines starting with >)
  const lines = text.split('\n');
  const mainLines = lines.filter(line => !line.trim().startsWith('>'));
  
  return mainLines.join('\n').trim();
}

/**
 * Format email for display with proper line breaks and spacing
 */
export function formatEmailForDisplay(content: string): string {
  // Split into paragraphs
  const paragraphs = content.split(/\n\s*\n/);
  
  // Filter out empty paragraphs and trim
  const cleanParagraphs = paragraphs
    .map(p => p.trim())
    .filter(p => p.length > 0);
  
  return cleanParagraphs.join('\n\n');
}
