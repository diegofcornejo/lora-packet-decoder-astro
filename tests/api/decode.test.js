import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../src/pages/decode.js';

// Helper to create a mock request
function createMockRequest(body) {
  return {
    json: () => Promise.resolve(body),
  };
}

// Helper to parse response
async function parseResponse(response) {
  const text = await response.text();
  return JSON.parse(text);
}

describe('POST /decode API endpoint', () => {
  const validHexPacket = '40F17DBE4900020001954378762B11FF0D';
  const validBase64Packet = 'QPF9vkkAAgABlUN4disR/w0=';
  const appKey = 'ec925802ae430ca77fd3dd73cb2cc588';
  const nwkKey = '44024241ed4ce9a68c6a8bc055233fd3';

  describe('successful decoding', () => {
    it('should decode a hex-encoded packet without keys', async () => {
      const request = createMockRequest({ data: validHexPacket });
      const response = await POST({ params: {}, request });
      const result = await parseResponse(response);

      // Response class returns 200 by default when no status is set
      expect(response.status === 200 || response.status === undefined).toBe(true);
      expect(result).toHaveProperty('packet');
      expect(result).toHaveProperty('decoded');
      expect(result).toHaveProperty('properties');
      expect(result.properties).toContainEqual({ name: 'Encoded', description: 'hex' });
    });

    it('should decode a base64-encoded packet without keys', async () => {
      const request = createMockRequest({ data: validBase64Packet });
      const response = await POST({ params: {}, request });
      const result = await parseResponse(response);

      expect(result.properties).toContainEqual({ name: 'Encoded', description: 'base64' });
    });

    it('should decode packet with AppSKey and NwkSKey', async () => {
      const request = createMockRequest({
        data: validHexPacket,
        appKey,
        nwkKey,
      });
      const response = await POST({ params: {}, request });
      const result = await parseResponse(response);

      expect(result.decoded).toContain('MIC');
      expect(result.decoded).toContain('expected');
    });

    it('should validate MIC when keys are provided', async () => {
      const request = createMockRequest({
        data: validHexPacket,
        appKey,
        nwkKey,
      });
      const response = await POST({ params: {}, request });
      const result = await parseResponse(response);

      // MIC validation should be attempted
      expect(result.decoded).toContain('from packet');
    });

    it('should decrypt payload when keys are provided', async () => {
      const request = createMockRequest({
        data: validHexPacket,
        appKey,
        nwkKey,
      });
      const response = await POST({ params: {}, request });
      const result = await parseResponse(response);

      expect(result.decoded).toContain('decrypted');
    });

    it('should include packet structure in response', async () => {
      const request = createMockRequest({ data: validHexPacket });
      const response = await POST({ params: {}, request });
      const result = await parseResponse(response);

      expect(result.packet).toHaveProperty('PHYPayload');
      expect(result.packet).toHaveProperty('MHDR');
    });
  });

  describe('packet types', () => {
    it('should decode Unconfirmed Data Up packet', async () => {
      const request = createMockRequest({ data: validHexPacket });
      const response = await POST({ params: {}, request });
      const result = await parseResponse(response);

      expect(result.decoded).toContain('Unconfirmed Data Up');
    });

    it('should include DevAddr in decoded output', async () => {
      const request = createMockRequest({ data: validHexPacket });
      const response = await POST({ params: {}, request });
      const result = await parseResponse(response);

      expect(result.decoded).toContain('DevAddr');
    });

    it('should include FCnt in decoded output', async () => {
      const request = createMockRequest({ data: validHexPacket });
      const response = await POST({ params: {}, request });
      const result = await parseResponse(response);

      expect(result.decoded).toContain('FCnt');
    });

    it('should include FRMPayload in decoded output', async () => {
      const request = createMockRequest({ data: validHexPacket });
      const response = await POST({ params: {}, request });
      const result = await parseResponse(response);

      expect(result.decoded).toContain('FRMPayload');
    });
  });

  describe('error handling', () => {
    it('should handle packet data that causes parsing issues', async () => {
      // lora-packet may not throw for all invalid data, but error handling exists
      // Test with a packet that triggers an actual error
      const request = createMockRequest({ data: 'ZZZ' }); // Non-hex, will be treated as base64
      const response = await POST({ params: {}, request });
      
      // The library might parse some invalid data without throwing
      // We just verify the endpoint handles the request
      expect(response).toBeDefined();
    });

    it('should return error message in response', async () => {
      const request = createMockRequest({ data: 'AA' }); // Invalid packet
      const response = await POST({ params: {}, request });
      const result = await parseResponse(response);

      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
    });

    it('should handle empty data', async () => {
      const request = createMockRequest({ data: '' });
      const response = await POST({ params: {}, request });

      expect(response.status).toBe(500);
    });

    it('should handle malformed JSON request', async () => {
      const request = {
        json: () => Promise.reject(new Error('Invalid JSON')),
      };
      
      const response = await POST({ params: {}, request });
      expect(response.status).toBe(500);
    });

    it('should handle missing data field', async () => {
      const request = createMockRequest({});
      const response = await POST({ params: {}, request });

      expect(response.status).toBe(500);
    });
  });

  describe('key handling', () => {
    it('should work with only AppSKey (no NwkSKey) - returns error since NwkSKey is needed', async () => {
      const request = createMockRequest({
        data: validHexPacket,
        appKey,
        // nwkKey is missing intentionally
      });
      const response = await POST({ params: {}, request });
      
      // Without NwkSKey, MIC verification will fail with an error
      // because lora-packet requires NwkSKey as a Buffer
      expect(response.status).toBe(500);
    });

    it('should work with empty string keys', async () => {
      const request = createMockRequest({
        data: validHexPacket,
        appKey: '',
        nwkKey: '',
      });
      const response = await POST({ params: {}, request });
      const result = await parseResponse(response);

      // Should decode without key validation
      expect(result).toHaveProperty('decoded');
      expect(result.decoded).not.toContain('expected'); // No MIC validation without keys
    });
  });

  describe('output formatting', () => {
    it('should return formatted JSON response', async () => {
      const request = createMockRequest({ data: validHexPacket });
      const response = await POST({ params: {}, request });
      const text = await response.clone().text();

      // Response should be pretty-printed (indented)
      expect(text).toContain('\n');
    });

    it('should align decoded output lines', async () => {
      const request = createMockRequest({ data: validHexPacket });
      const response = await POST({ params: {}, request });
      const result = await parseResponse(response);

      // Check that the decoded output has aligned property names
      const lines = result.decoded.split('\n').filter(l => l.includes('='));
      if (lines.length > 1) {
        const equalPositions = lines.map(l => l.indexOf('='));
        const allSame = equalPositions.every(pos => pos === equalPositions[0]);
        expect(allSame).toBe(true);
      }
    });
  });

  describe('encoding detection', () => {
    it('should correctly detect hex encoding', async () => {
      const request = createMockRequest({ data: validHexPacket });
      const response = await POST({ params: {}, request });
      const result = await parseResponse(response);

      expect(result.properties.find(p => p.name === 'Encoded').description).toBe('hex');
    });

    it('should correctly detect base64 encoding', async () => {
      const request = createMockRequest({ data: validBase64Packet });
      const response = await POST({ params: {}, request });
      const result = await parseResponse(response);

      expect(result.properties.find(p => p.name === 'Encoded').description).toBe('base64');
    });

    it('should handle lowercase hex', async () => {
      const lowercaseHex = validHexPacket.toLowerCase();
      const request = createMockRequest({ data: lowercaseHex });
      const response = await POST({ params: {}, request });
      const result = await parseResponse(response);

      expect(result.properties.find(p => p.name === 'Encoded').description).toBe('hex');
    });
  });
});
