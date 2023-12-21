import { useState } from 'react';
import { Toaster, toast } from 'sonner';
import xss from 'xss';
import Card from './Card.jsx';

export default function Home() {
	const [data, setData] = useState('');
	const [appKey, setAppKey] = useState('');
	const [nwkKey, setNwkKey] = useState('');
	const [properties, setProperties] = useState([]);
	const [decoded, setDecoded] = useState('');
	const [decodedBuffer, setDecodedBuffer] = useState('');
	const [isWarning, setIsWarning] = useState(false);


	function replacer(key, value) {
		if (Array.isArray(value)) {
			return JSON.stringify(value);
		}
		return value;
	}

	const xssOptions = {
		whiteList: {
			span: ["class"],
		},
		stripIgnoreTag: true
	};

	function sanitizeAndHighlightWarnings(text) {
		const wordsToHighlight = {
			"WARNING": "text-yellow-500",
			"INVALID": "text-red-500"
		};

		const regex = new RegExp(Object.keys(wordsToHighlight).join('|'), 'g');

		const highlightedText = text.replace(regex, match => {
			const colorClass = wordsToHighlight[match];
			return `<span class="${colorClass}">${match}</span>`;
		});

		return xss(highlightedText, xssOptions);
	}


	const Decode = async (data, appKey, nwkKey) => {
		const loading = toast.loading('Decoding packet...');
		const response = await fetch('/decode', {
			method: 'POST',
			body: JSON.stringify({ data, appKey, nwkKey }),
			headers: {
				'Content-Type': 'application/json',
			},
		})
		toast.dismiss(loading);
		if (response.status !== 200) {
			const data = await response.json();
			console.log('data', data);
			toast.error(`Error decoding packet: ${data.error}`, { duration: 5000 });
			return;
		}

		return await response.json();
	}

	const handleDecode = async () => {

		try {
			if (!data.trim()) {
				toast.warning('Please provide the Lora packet');
				setIsWarning(true);
				return;
			}
			setIsWarning(false);
			const { packet, decoded, properties } = await Decode(data, appKey, nwkKey);
			setDecoded(decoded);
			setDecodedBuffer(JSON.stringify(packet, replacer, 2));
			setProperties(properties)
		} catch (error) {
			toast.error(`Error decoding packet: ${error.message}`, { duration: 5000 });
		}
	};

	const handleClear = () => {
		setData('');
		setAppKey('');
		setNwkKey('');
		setDecoded('');
		setDecodedBuffer('');
		setIsWarning(false);
		setProperties([]);
	};

	const handleDataChange = (e) => {
		setData(e.target.value);
	};

	const handleAppKeyChange = (e) => {
		setAppKey(e.target.value);
	};

	const handleNwkKeyChange = (e) => {
		setNwkKey(e.target.value);
	};

	return (
		<main className="flex flex-col lg:flex-row gap-4 w-full text-white h-dvh">
			<Card title='Parameters'>
				<div className='flex flex-col gap-2'>
					<label className='text-sm font-bold text-gray-700 dark:text-gray-300'>
						Lora Packet (hex-encoded or Base64)
					</label>
					<input
						className={`w-full p-4 text-gray-700 bg-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-300 text-sm md:text-base ${isWarning ? "border-yellow-500 border-2" : ""} `}
						type='text'
						name='lora-packet'
						id='lora-packet'
						placeholder='Paste your LoraWAN packet here'
						value={data}
						onChange={handleDataChange}
					/>
				</div>
				<div className='flex flex-col gap-2'>
					<label className='text-sm font-bold text-gray-700 dark:text-gray-300'>
						AppSKey (hex-encoded; optional)
					</label>
					<input
						className='w-full p-4 text-gray-700 bg-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-300 text-sm md:text-base'
						type='text'
						name='app-key'
						id='app-key'
						placeholder='Paste your App Session Key here'
						value={appKey}
						onChange={handleAppKeyChange}
					/>
				</div>
				<div className='flex flex-col gap-2'>
					<label className='text-sm font-bold text-gray-700 dark:text-gray-300'>
						NwkSKey (hex-encoded; optional)
					</label>
					<input
						className='w-full p-4 text-gray-700 bg-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-300 text-sm md:text-base'
						type='text'
						name='nwk-key'
						id='nwk-key'
						placeholder='Paste your Network Session Key here'
						value={nwkKey}
						onChange={handleNwkKeyChange}
					/>
				</div>
				<div className='flex gap-4'>
					<button
						className='w-full px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75'
						type='button'
						name='reset'
						id='reset'
						onClick={handleClear}
					>
						Reset
					</button>
					<button
						className='w-full px-4 py-2 text-sm font-bold text-white bg-blue-500 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75'
						type='button'
						name='decode'
						id='decode'
						onClick={handleDecode}
					>
						Decode
					</button>
				</div>
			</Card>
			<Card title='Decoded Packet'>
				{properties.map((property) => (
					<pre className='flex flex-col text-xs md:text-sm' key={property.name}>
						{property.name} = {property.description}
					</pre>
				))}
				<pre className='text-xs md:text-sm' dangerouslySetInnerHTML={{ __html: sanitizeAndHighlightWarnings(decoded) }}></pre>
			</Card>
			<Card title='Decoded Packet (Buffer)'>
				<pre className='text-xs md:text-sm'>{decodedBuffer}</pre>
			</Card>
			<Toaster position="top-center" richColors closeButton />
		</main>
	)
}
