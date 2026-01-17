import xss from 'xss';

/**
 * JSON stringify replacer that converts arrays to JSON strings for cleaner display
 * @param {string} key - The key being stringified
 * @param {any} value - The value being stringified
 * @returns {any} - The transformed value
 */
export function replacer(key, value) {
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  return value;
}

/**
 * XSS options for sanitization
 */
const xssOptions = {
  whiteList: {
    span: ["class"],
  },
  stripIgnoreTag: true
};

/**
 * Words to highlight with their corresponding CSS classes
 */
const wordsToHighlight = {
  "WARNING": "text-yellow-500",
  "INVALID": "text-red-500"
};

/**
 * Sanitizes HTML and highlights WARNING/INVALID keywords
 * @param {string} text - The text to sanitize and highlight
 * @returns {string} - Sanitized HTML with highlighted keywords
 */
export function sanitizeAndHighlightWarnings(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const regex = new RegExp(Object.keys(wordsToHighlight).join('|'), 'g');

  const highlightedText = text.replace(regex, match => {
    const colorClass = wordsToHighlight[match];
    return `<span class="${colorClass}">${match}</span>`;
  });

  return xss(highlightedText, xssOptions);
}

/**
 * Promise-based delay function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validates if a string is a valid hex-encoded key (32 hex characters for 16-byte key)
 * @param {string} key - The key to validate
 * @returns {boolean} - True if valid hex key
 */
export function isValidHexKey(key) {
  if (!key || typeof key !== 'string') {
    return false;
  }
  return /^[0-9A-Fa-f]{32}$/.test(key);
}

/**
 * Validates if a string is a valid LoRa packet (hex or base64)
 * @param {string} data - The packet data to validate
 * @returns {{ valid: boolean, encoding: string | null }} - Validation result
 */
export function validatePacketData(data) {
  if (!data || typeof data !== 'string' || data.trim() === '') {
    return { valid: false, encoding: null };
  }

  const trimmed = data.trim();
  
  // Check if hex-encoded
  if (/^[0-9A-Fa-f]+$/.test(trimmed)) {
    return { valid: true, encoding: 'hex' };
  }

  // Check if base64-encoded (basic validation)
  if (/^[A-Za-z0-9+/]+=*$/.test(trimmed)) {
    return { valid: true, encoding: 'base64' };
  }

  return { valid: false, encoding: null };
}

/**
 * Generates copyable plain-text content from decoded packet properties
 * @param {Array<{name: string, description: string}>} properties - Packet properties
 * @param {string} decoded - Decoded packet text
 * @returns {string} - Plain text content
 */
export function generateCopyableContent(properties, decoded) {
  const propertiesText = (properties || [])
    .map(p => `${p.name} = ${p.description}`)
    .join('\n');
  return `${propertiesText}\n${decoded || ''}`.trim();
}

/**
 * Formats a timestamp as a localized time string
 * @param {number} timestamp - Unix timestamp
 * @returns {string} - Formatted time string
 */
export function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleTimeString();
}
