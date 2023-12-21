import lorapacket from 'lora-packet';

export async function POST({ params, request }) {

	try {
		//{ data, appKey, nwkKey }
		const body = await request.json();
		const data = body.data;
		const appSKey = body.appKey ? Buffer.from(body.appKey, 'hex') : undefined;
		const nwkSKey = body.nwkKey ? Buffer.from(body.nwkKey, 'hex') : undefined;

		const encoded = data.match(/^[0-9A-F]*$/i) ? 'hex' : 'base64';
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
		]

		if (isJoinAccept) {
			decoded = decoded.replace('Join Accept', 'Join Accept -- WARNING: The values below have not been decrypted');
		}

		// For a Join Request, we only need the AppKey, so allow NwkSKey to be empty
		if (appSKey) {
			// In LoRaWAN 1.0.x, the value of FCnt only holds the 16 least-significant bits (LSB) of the
			// actual frame counter. But for a 32 bits frame counter still all 32 bits are used when
			// calculating the MIC. So, brute-force to find the counter's 16 most significant bits. This
			// will try 65,536 values...
			let fCntMsb;
			const msb = new Buffer(2);
			let i;
			for (i = 0; i < 1 << 16; i++) {
				// console.log(`Trying: ${i}`);
				msb.writeUInt16LE(i, 0);
				// TODO This needs AppKey, not AppSKey, for Join Accept
				if (lorapacket.verifyMIC(packet, nwkSKey, appSKey, msb)) {
					fCntMsb = ('0000' + i.toString(16)).toUpperCase().substr(-4);
					// console.log(`Found MSB: 0x${fCntMsb}`);
					// console.log(`32 bits FCnt: ${i << 16 | packet.getFCnt()}`);
					break;
				}
			}
			// When no MSB is found, show the expected value for MSB 0x0000 rather than for 0xFFFF:
			const expected = lorapacket.calculateMIC(packet, nwkSKey, appSKey, fCntMsb ? msb : null);
			const valid = lorapacket.verifyMIC(packet, nwkSKey, appSKey, fCntMsb ? msb : null);
			decoded = decoded.replace(/^(.*MIC = .*$)/m,
				'$1 (from packet)' + (valid ? '' : ' INVALID (tried MSB 0000-'
					+ ('0000' + (i - 1).toString(16)).toUpperCase().substr(-4) + ')')
				+ '\n = ' + expected.toString('hex').toUpperCase()
				+ ' (expected, assuming 32 bits frame counter with MSB '
				+ (fCntMsb ? fCntMsb : '0000') + ')'
			);

			if (valid) {
				// The first occurence of "FCnt" is for FHDR and includes "(Big Endian); we want the 2nd occurence
				// in the summary, which is a bare decimal number
				decoded = decoded.replace(/^(.*FCnt = [0-9]*$)/m,
					'$1 (from packet, 16 bits) \n = ' + (i << 16 | packet.getFCnt())
					+ ' (32 bits, assuming MSB 0x' + ('0000' + i.toString(16)).substr(-4) + ')'
				);
			}

			if (!isJoin) {
				const payload = lorapacket.decrypt(packet, appSKey, nwkSKey);
				// We don't have to align the additional line here, as it will be re-aligned later
				decoded = decoded.replace(/^(.*FRMPayload) = .+$/m,
					(match, m1) => `${match} (from packet, encrypted)\n = ${payload.toString('hex').toUpperCase()} (decrypted)`);
			}
		}
		else {
			// decoded += '\nProvide AppSKey and NwkSKey to validate MIC and decrypt payload'; 
		}

		const lines = decoded.split('\n');
		const lengths = lines.map(s => s.replace(/^\s*(.*)( = .*)$/, (match, m1, m2) => m1).length);
		const max = Math.max(...lengths.filter(length => length > 0));
		decoded = lines.map(s => s.replace(/^\s*(.*)( = .*)$/,
			(match, m1, m2) => ' '.repeat(max - m1.length) + m1 + m2)).join('\n');

		// if(appKey && nwkKey) {
		// 	const NwkSKey = Buffer.from(nwkKey, 'hex');
		// 	const AppSKey = Buffer.from(appKey, 'hex');
		// 	const isMicValid = lorapacket.verifyMIC(Packet, NwkSKey);
		// 	console.log("🚀 ~ file: decode.js:32 ~ POST ~ isMicValid:", isMicValid)
		// 	properties.push({
		// 		name: 'Is MIC valid?',
		// 		description: isMicValid ? 'true' : 'false'
		// 	})
		// 	const decryptedPayload = lorapacket.decrypt(Packet, AppSKey, NwkSKey);
		// 	const decryptedPayloadHex = decryptedPayload.toString("hex");
		// 	const decryptedPayloadAscii = decryptedPayload.toString("ascii");

		// 	properties.push({
		// 		name: 'Decrypted (HEX)',
		// 		description: decryptedPayloadHex
		// 	})
		// 	properties.push({
		// 		name: 'Decrypted (ASCII)',
		// 		description: decryptedPayloadAscii
		// 	})
		// }

		const response = {
			packet,
			decoded,
			properties
		}

		return new Response(
			JSON.stringify(response, null, 2)
		)
	} catch (error) {
		console.log('error', error);
		return new Response(
			JSON.stringify({ error: error.message }),
			{ status: 500 }
		)
	}
}