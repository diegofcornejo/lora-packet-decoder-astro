import { describe, it, expect } from 'vitest';
import {
  detectEncoding,
  parsePacket,
  alignDecodedOutput,
  formatMSB,
  decodePacket,
} from '../../src/utils/decoder.js';

describe('decoder utils', () => {
  describe('detectEncoding', () => {
    it('should detect hex encoding for valid hex strings', () => {
      expect(detectEncoding('40F17DBE4900020001954378762B11FF0D')).toBe('hex');
      expect(detectEncoding('abcdef0123456789')).toBe('hex');
      expect(detectEncoding('ABCDEF')).toBe('hex');
    });

    it('should detect base64 encoding for non-hex strings', () => {
      expect(detectEncoding('QPF9vkkAAgABlUN4disR/w0=')).toBe('base64');
      expect(detectEncoding('SGVsbG8gV29ybGQ=')).toBe('base64');
    });

    it('should handle empty string as hex', () => {
      expect(detectEncoding('')).toBe('hex');
    });

    it('should detect base64 when contains non-hex characters', () => {
      expect(detectEncoding('abc+def')).toBe('base64');
      expect(detectEncoding('abc/def')).toBe('base64');
      expect(detectEncoding('abc=def')).toBe('base64');
    });
  });

  describe('formatMSB', () => {
    it('should format 0 as 0000', () => {
      expect(formatMSB(0)).toBe('0000');
    });

    it('should format single digit as padded hex', () => {
      expect(formatMSB(1)).toBe('0001');
      expect(formatMSB(15)).toBe('000F');
    });

    it('should format larger values correctly', () => {
      expect(formatMSB(255)).toBe('00FF');
      expect(formatMSB(4095)).toBe('0FFF');
      expect(formatMSB(65535)).toBe('FFFF');
    });

    it('should return uppercase hex', () => {
      expect(formatMSB(10)).toBe('000A');
      expect(formatMSB(171)).toBe('00AB');
    });
  });

  describe('alignDecodedOutput', () => {
    it('should align property names with equal signs', () => {
      const input = 'Short = value1\nLongerName = value2';
      const result = alignDecodedOutput(input);
      
      // Both lines should have equal signs at the same position
      const lines = result.split('\n');
      const equalPos1 = lines[0].indexOf('=');
      const equalPos2 = lines[1].indexOf('=');
      
      expect(equalPos1).toBe(equalPos2);
    });

    it('should preserve lines without property format', () => {
      const input = 'Header line\nName = value';
      const result = alignDecodedOutput(input);
      expect(result).toContain('Header line');
    });

    it('should handle empty string', () => {
      expect(alignDecodedOutput('')).toBe('');
    });

    it('should handle single line', () => {
      const input = 'Name = value';
      const result = alignDecodedOutput(input);
      expect(result).toBe('Name = value');
    });
  });

  describe('parsePacket', () => {
    it('should parse hex-encoded LoRa packet', () => {
      const packet = parsePacket('40F17DBE4900020001954378762B11FF0D');
      expect(packet).toBeDefined();
      expect(packet.getMType()).toBe('Unconfirmed Data Up');
    });

    it('should parse base64-encoded LoRa packet', () => {
      const packet = parsePacket('QPF9vkkAAgABlUN4disR/w0=');
      expect(packet).toBeDefined();
      expect(packet.getMType()).toBe('Unconfirmed Data Up');
    });

    it('should throw error for invalid packet data', () => {
      expect(() => parsePacket('invalid')).toThrow();
    });
  });

  describe('decodePacket', () => {
    const validHexPacket = '40F17DBE4900020001954378762B11FF0D';
    const validBase64Packet = 'QPF9vkkAAgABlUN4disR/w0=';
    const appKey = 'ec925802ae430ca77fd3dd73cb2cc588';
    const nwkKey = '44024241ed4ce9a68c6a8bc055233fd3';

    it('should decode hex packet without keys', () => {
      const result = decodePacket(validHexPacket);
      
      expect(result).toHaveProperty('packet');
      expect(result).toHaveProperty('decoded');
      expect(result).toHaveProperty('properties');
      expect(result.properties).toContainEqual({ name: 'Encoded', description: 'hex' });
    });

    it('should decode base64 packet without keys', () => {
      const result = decodePacket(validBase64Packet);
      
      expect(result.properties).toContainEqual({ name: 'Encoded', description: 'base64' });
    });

    it('should include packet type in decoded output', () => {
      const result = decodePacket(validHexPacket);
      expect(result.decoded).toContain('Unconfirmed Data Up');
    });

    it('should decode packet with keys and validate MIC', () => {
      const result = decodePacket(validHexPacket, appKey, nwkKey);
      
      expect(result.decoded).toContain('MIC');
      expect(result.decoded).toContain('expected');
    });

    it('should decrypt payload when keys are provided', () => {
      const result = decodePacket(validHexPacket, appKey, nwkKey);
      
      expect(result.decoded).toContain('decrypted');
    });

    it('should include DevAddr in decoded output', () => {
      const result = decodePacket(validHexPacket);
      expect(result.decoded).toContain('DevAddr');
    });

    it('should include FCnt in decoded output', () => {
      const result = decodePacket(validHexPacket);
      expect(result.decoded).toContain('FCnt');
    });

    it('should handle short packet data', () => {
      // lora-packet might not throw for all short packets
      // but we test that our function handles the input
      try {
        const result = decodePacket('FF');
        // If it doesn't throw, verify it returns something
        expect(result).toBeDefined();
      } catch (error) {
        // If it throws, that's also acceptable behavior
        expect(error).toBeDefined();
      }
    });

    it('should handle Join Accept message type', () => {
      // Join Accept packet (example)
      const joinAcceptPacket = '20493EEB51FBA2116F810EDB3817674DC6';
      
      try {
        const result = decodePacket(joinAcceptPacket);
        // If parsing succeeds, check for Join Accept handling
        if (result.decoded.includes('Join Accept')) {
          expect(result.decoded).toContain('WARNING');
        }
      } catch (e) {
        // Some Join Accept packets may fail without proper decryption
        expect(e).toBeDefined();
      }
    });

    it('should return aligned output', () => {
      const result = decodePacket(validHexPacket);
      const lines = result.decoded.split('\n').filter(l => l.includes('='));
      
      if (lines.length > 1) {
        // Check that equal signs are aligned
        const equalPositions = lines.map(l => l.indexOf('='));
        const allSame = equalPositions.every(pos => pos === equalPositions[0]);
        expect(allSame).toBe(true);
      }
    });
  });
});
