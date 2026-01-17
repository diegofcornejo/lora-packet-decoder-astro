import lorapacket from 'lora-packet';

/**
 * Detects if the data is hex or base64 encoded
 * @param {string} data - The packet data
 * @returns {'hex' | 'base64'} - The encoding type
 */
export function detectEncoding(data) {
  return data.match(/^[0-9A-F]*$/i) ? 'hex' : 'base64';
}

/**
 * Parses a LoRa packet from wire format
 * @param {string} data - The packet data (hex or base64)
 * @returns {object} - The parsed packet
 */
export function parsePacket(data) {
  const encoding = detectEncoding(data);
  return lorapacket.fromWire(Buffer.from(data, encoding));
}

/**
 * Aligns decoded output lines by padding the property names
 * @param {string} decoded - The decoded text
 * @returns {string} - Aligned text
 */
export function alignDecodedOutput(decoded) {
  const lines = decoded.split('\n');
  const lengths = lines.map(s => s.replace(/^\s*(.*)( = .*)$/, (match, m1, m2) => m1).length);
  const max = Math.max(...lengths.filter(length => length > 0));
  return lines.map(s => s.replace(/^\s*(.*)( = .*)$/,
    (match, m1, m2) => ' '.repeat(max - m1.length) + m1 + m2)).join('\n');
}

/**
 * Finds the MSB for 32-bit frame counter by brute force
 * @param {object} packet - The LoRa packet
 * @param {Buffer} nwkSKey - Network session key
 * @param {Buffer} appSKey - App session key
 * @returns {{ msb: Buffer | null, found: boolean, iterations: number }}
 */
export function findFrameCounterMSB(packet, nwkSKey, appSKey) {
  const msb = Buffer.alloc(2);
  let i;
  
  for (i = 0; i < 1 << 16; i++) {
    msb.writeUInt16LE(i, 0);
    if (lorapacket.verifyMIC(packet, nwkSKey, appSKey, msb)) {
      return { msb, found: true, iterations: i };
    }
  }
  
  return { msb: null, found: false, iterations: i };
}

/**
 * Formats MSB value as a 4-character uppercase hex string
 * @param {number} value - The MSB value
 * @returns {string} - Formatted hex string
 */
export function formatMSB(value) {
  return ('0000' + value.toString(16)).toUpperCase().substr(-4);
}

/**
 * Decodes a LoRa packet with optional key validation
 * @param {string} data - The packet data (hex or base64)
 * @param {string} [appKeyHex] - Optional AppSKey in hex
 * @param {string} [nwkKeyHex] - Optional NwkSKey in hex
 * @returns {object} - Decoded packet result
 */
export function decodePacket(data, appKeyHex, nwkKeyHex) {
  const appSKey = appKeyHex ? Buffer.from(appKeyHex, 'hex') : undefined;
  const nwkSKey = nwkKeyHex ? Buffer.from(nwkKeyHex, 'hex') : undefined;

  const encoded = detectEncoding(data);
  const packet = lorapacket.fromWire(Buffer.from(data, encoded));

  const type = packet.getMType() || 'unknown';
  const isJoinAccept = type === 'Join Accept';
  const isJoinRequest = type === 'Join Request';
  const isJoin = isJoinAccept || isJoinRequest;
  
  let decoded = packet.toString();

  const properties = [
    {
      name: 'Encoded',
      description: encoded
    }
  ];

  if (isJoinAccept) {
    decoded = decoded.replace('Join Accept', 'Join Accept -- WARNING: The values below have not been decrypted');
  }

  if (appSKey) {
    // Brute-force to find the MSB for 32-bit frame counter
    let fCntMsb;
    const msb = Buffer.alloc(2);
    let i;
    
    for (i = 0; i < 1 << 16; i++) {
      msb.writeUInt16LE(i, 0);
      if (lorapacket.verifyMIC(packet, nwkSKey, appSKey, msb)) {
        fCntMsb = formatMSB(i);
        break;
      }
    }

    // Calculate expected MIC
    const expected = lorapacket.calculateMIC(packet, nwkSKey, appSKey, fCntMsb ? msb : null);
    const valid = lorapacket.verifyMIC(packet, nwkSKey, appSKey, fCntMsb ? msb : null);
    
    decoded = decoded.replace(/^(.*MIC = .*$)/m,
      '$1 (from packet)' + (valid ? '' : ' INVALID (tried MSB 0000-'
        + formatMSB(i - 1) + ')')
      + '\n = ' + expected.toString('hex').toUpperCase()
      + ' (expected, assuming 32 bits frame counter with MSB '
      + (fCntMsb ? fCntMsb : '0000') + ')'
    );

    if (valid) {
      decoded = decoded.replace(/^(.*FCnt = [0-9]*$)/m,
        '$1 (from packet, 16 bits) \n = ' + (i << 16 | packet.getFCnt())
        + ' (32 bits, assuming MSB 0x' + ('0000' + i.toString(16)).substr(-4) + ')'
      );
    }

    if (!isJoin) {
      const payload = lorapacket.decrypt(packet, appSKey, nwkSKey);
      decoded = decoded.replace(/^(.*FRMPayload) = .+$/m,
        (match, m1) => `${match} (from packet, encrypted)\n = ${payload.toString('hex').toUpperCase()} (decrypted)`);
    }
  }

  // Align output
  decoded = alignDecodedOutput(decoded);

  return {
    packet,
    decoded,
    properties
  };
}
