import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  replacer,
  sanitizeAndHighlightWarnings,
  sleep,
  isValidHexKey,
  validatePacketData,
  generateCopyableContent,
  formatTimestamp,
} from '../../src/utils/helpers.js';

describe('helpers', () => {
  describe('replacer', () => {
    it('should convert arrays to JSON strings', () => {
      const result = replacer('test', [1, 2, 3]);
      expect(result).toBe('[1,2,3]');
    });

    it('should return non-array values unchanged', () => {
      expect(replacer('key', 'string')).toBe('string');
      expect(replacer('key', 123)).toBe(123);
      expect(replacer('key', null)).toBe(null);
      expect(replacer('key', { a: 1 })).toEqual({ a: 1 });
    });

    it('should handle nested arrays in JSON.stringify', () => {
      const obj = { data: [1, 2, 3], name: 'test' };
      const result = JSON.stringify(obj, replacer, 2);
      expect(result).toContain('"data": "[1,2,3]"');
      expect(result).toContain('"name": "test"');
    });

    it('should handle empty arrays', () => {
      const result = replacer('key', []);
      expect(result).toBe('[]');
    });
  });

  describe('sanitizeAndHighlightWarnings', () => {
    it('should highlight WARNING keyword with yellow class', () => {
      const result = sanitizeAndHighlightWarnings('This is a WARNING message');
      expect(result).toContain('<span class="text-yellow-500">WARNING</span>');
    });

    it('should highlight INVALID keyword with red class', () => {
      const result = sanitizeAndHighlightWarnings('MIC is INVALID');
      expect(result).toContain('<span class="text-red-500">INVALID</span>');
    });

    it('should highlight multiple keywords', () => {
      const result = sanitizeAndHighlightWarnings('WARNING: Value is INVALID');
      expect(result).toContain('<span class="text-yellow-500">WARNING</span>');
      expect(result).toContain('<span class="text-red-500">INVALID</span>');
    });

    it('should return empty string for null input', () => {
      expect(sanitizeAndHighlightWarnings(null)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(sanitizeAndHighlightWarnings(undefined)).toBe('');
    });

    it('should return empty string for non-string input', () => {
      expect(sanitizeAndHighlightWarnings(123)).toBe('');
      expect(sanitizeAndHighlightWarnings({})).toBe('');
    });

    it('should sanitize XSS attacks', () => {
      const malicious = '<script>alert("xss")</script>WARNING';
      const result = sanitizeAndHighlightWarnings(malicious);
      expect(result).not.toContain('<script>');
      expect(result).toContain('<span class="text-yellow-500">WARNING</span>');
    });

    it('should preserve allowed span tags with class attribute', () => {
      const input = '<span class="existing">text</span> WARNING';
      const result = sanitizeAndHighlightWarnings(input);
      expect(result).toContain('<span class="existing">text</span>');
    });

    it('should return unchanged text without keywords', () => {
      const input = 'This is normal text';
      const result = sanitizeAndHighlightWarnings(input);
      expect(result).toBe('This is normal text');
    });
  });

  describe('sleep', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return a promise', () => {
      const result = sleep(100);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve after specified time', async () => {
      const promise = sleep(1000);
      vi.advanceTimersByTime(1000);
      await expect(promise).resolves.toBeUndefined();
    });

    it('should not resolve before specified time', async () => {
      let resolved = false;
      sleep(1000).then(() => { resolved = true; });
      
      vi.advanceTimersByTime(500);
      await Promise.resolve(); // Flush microtasks
      expect(resolved).toBe(false);
      
      vi.advanceTimersByTime(500);
      await Promise.resolve();
      expect(resolved).toBe(true);
    });
  });

  describe('isValidHexKey', () => {
    it('should return true for valid 32-character hex key', () => {
      expect(isValidHexKey('ec925802ae430ca77fd3dd73cb2cc588')).toBe(true);
      expect(isValidHexKey('44024241ed4ce9a68c6a8bc055233fd3')).toBe(true);
      expect(isValidHexKey('ABCDEF0123456789ABCDEF0123456789')).toBe(true);
    });

    it('should return false for keys with wrong length', () => {
      expect(isValidHexKey('ec925802ae430ca77fd3dd73cb2cc58')).toBe(false); // 31 chars
      expect(isValidHexKey('ec925802ae430ca77fd3dd73cb2cc5889')).toBe(false); // 33 chars
      expect(isValidHexKey('')).toBe(false);
    });

    it('should return false for non-hex characters', () => {
      expect(isValidHexKey('gc925802ae430ca77fd3dd73cb2cc588')).toBe(false);
      expect(isValidHexKey('ec925802ae430ca77fd3dd73cb2cc58!')).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isValidHexKey(null)).toBe(false);
      expect(isValidHexKey(undefined)).toBe(false);
    });

    it('should return false for non-string input', () => {
      expect(isValidHexKey(123)).toBe(false);
      expect(isValidHexKey({})).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isValidHexKey('EC925802AE430CA77FD3DD73CB2CC588')).toBe(true);
      expect(isValidHexKey('ec925802ae430ca77fd3dd73cb2cc588')).toBe(true);
    });
  });

  describe('validatePacketData', () => {
    it('should validate hex-encoded packets', () => {
      const result = validatePacketData('40F17DBE4900020001954378762B11FF0D');
      expect(result).toEqual({ valid: true, encoding: 'hex' });
    });

    it('should validate base64-encoded packets', () => {
      const result = validatePacketData('QPF9vkkAAgABlUN4disR/w0=');
      expect(result).toEqual({ valid: true, encoding: 'base64' });
    });

    it('should return invalid for empty string', () => {
      expect(validatePacketData('')).toEqual({ valid: false, encoding: null });
      expect(validatePacketData('   ')).toEqual({ valid: false, encoding: null });
    });

    it('should return invalid for null/undefined', () => {
      expect(validatePacketData(null)).toEqual({ valid: false, encoding: null });
      expect(validatePacketData(undefined)).toEqual({ valid: false, encoding: null });
    });

    it('should return invalid for non-string input', () => {
      expect(validatePacketData(123)).toEqual({ valid: false, encoding: null });
      expect(validatePacketData({})).toEqual({ valid: false, encoding: null });
    });

    it('should handle lowercase hex', () => {
      const result = validatePacketData('40f17dbe4900020001954378762b11ff0d');
      expect(result).toEqual({ valid: true, encoding: 'hex' });
    });

    it('should detect base64 with padding', () => {
      const result = validatePacketData('dGVzdA==');
      expect(result).toEqual({ valid: true, encoding: 'base64' });
    });
  });

  describe('generateCopyableContent', () => {
    it('should combine properties and decoded text', () => {
      const properties = [
        { name: 'Encoded', description: 'hex' },
        { name: 'Type', description: 'Unconfirmed Data Up' }
      ];
      const decoded = 'MType = Unconfirmed Data Up\nDevAddr = 49BE7DF1';
      
      const result = generateCopyableContent(properties, decoded);
      
      expect(result).toContain('Encoded = hex');
      expect(result).toContain('Type = Unconfirmed Data Up');
      expect(result).toContain('MType = Unconfirmed Data Up');
    });

    it('should handle empty properties array', () => {
      const result = generateCopyableContent([], 'decoded text');
      expect(result).toBe('decoded text');
    });

    it('should handle null properties', () => {
      const result = generateCopyableContent(null, 'decoded text');
      expect(result).toBe('decoded text');
    });

    it('should handle empty decoded text', () => {
      const properties = [{ name: 'Test', description: 'value' }];
      const result = generateCopyableContent(properties, '');
      expect(result).toBe('Test = value');
    });

    it('should handle both empty inputs', () => {
      const result = generateCopyableContent([], '');
      expect(result).toBe('');
    });

    it('should trim the final result', () => {
      const result = generateCopyableContent([], '  text with spaces  ');
      expect(result).toBe('text with spaces');
    });
  });

  describe('formatTimestamp', () => {
    it('should format a timestamp to localized time string', () => {
      const timestamp = new Date('2024-01-15T10:30:00').getTime();
      const result = formatTimestamp(timestamp);
      // The exact format depends on locale, but it should be a non-empty string
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle current timestamp', () => {
      const now = Date.now();
      const result = formatTimestamp(now);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
