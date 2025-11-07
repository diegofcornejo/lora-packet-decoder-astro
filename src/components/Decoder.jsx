import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import xss from 'xss';
import Card from './Card.jsx';
import Skeleton from './Skeleton.jsx';
import History from './History.jsx';

const defaultHistory = [
	{
		id: 'default-3',
		name: 'Example - Hex with Keys',
		data: '40F17DBE4900020001954378762B11FF0D',
		appKey: 'ec925802ae430ca77fd3dd73cb2cc588',
		nwkKey: '44024241ed4ce9a68c6a8bc055233fd3',
		decoded: '',
		decodedBuffer: '',
		properties: [],
		favorite: false,
	},
	{
		id: 'default-2',
		name: 'Example - Base64 Lora Packet',
		data: 'QPF9vkkAAgABlUN4disR/w0=',
		appKey: '',
		nwkKey: '',
		decoded: '',
		decodedBuffer: '',
		properties: [],
		favorite: false,
	},
	{
		id: 'default-1',
		name: 'Example - Hex Lora Packet',
		data: '40F17DBE4900020001954378762B11FF0D',
		appKey: '',
		nwkKey: '',
		decoded: '',
		decodedBuffer: '',
		properties: [],
		favorite: false,
	}
];

export default function Home() {
	const [data, setData] = useState('');
	const [appKey, setAppKey] = useState('');
	const [nwkKey, setNwkKey] = useState('');
	const [properties, setProperties] = useState([]);
	const [decoded, setDecoded] = useState('');
	const [decodedBuffer, setDecodedBuffer] = useState('');
	const [isWarning, setIsWarning] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [history, setHistory] = useState([]);

	useEffect(() => {
		try {
			const savedHistory = localStorage.getItem('decodingHistory');
			if (savedHistory) {
				setHistory(JSON.parse(savedHistory));
			} else {
				setHistory(defaultHistory);
			}
		} catch (error) {
			console.error('Failed to load history from localStorage', error);
			toast.error('Failed to load history from localStorage');
		}
	}, []);

	useEffect(() => {
		try {
			localStorage.setItem('decodingHistory', JSON.stringify(history));
		} catch (error) {
			console.error('Failed to save history to localStorage', error);
			toast.error('Failed to save history to localStorage');
		}
	}, [history]);


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


	const sleep = (ms) => {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	const Decode = async (data, appKey, nwkKey) => {
		setIsLoading(true);
		handleClearResult();
		const loading = toast.loading('Decoding packet...');
		const response = await fetch('/decode', {
			method: 'POST',
			body: JSON.stringify({ data, appKey, nwkKey }),
			headers: {
				'Content-Type': 'application/json',
			},
		})
		await sleep(500);
		setIsLoading(false);
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
			setProperties(properties);

			const newHistoryItem = {
				id: Date.now(),
				name: `Execution - ${new Date().toLocaleTimeString()}`,
				data,
				appKey,
				nwkKey,
				decoded,
				decodedBuffer: JSON.stringify(packet, replacer, 2),
				properties,
				favorite: false,
			};

			setHistory(prevHistory => {
				const favorites = prevHistory.filter(item => item.favorite);
				const nonFavorites = prevHistory.filter(item => !item.favorite);
				const updatedNonFavorites = [newHistoryItem, ...nonFavorites];
				const finalNonFavorites = updatedNonFavorites.slice(0, 5);
				return [...favorites, ...finalNonFavorites];
			});

		} catch (error) {
			toast.error(`Error decoding packet: ${error.message}`, { duration: 5000 });
		}
	};

	const handleLoadHistory = (id) => {
		const item = history.find(item => item.id === id);
		if (item) {
			setData(item.data);
			setAppKey(item.appKey);
			setNwkKey(item.nwkKey);
			setDecoded(item.decoded);
			setDecodedBuffer(item.decodedBuffer);
			setProperties(item.properties);
			toast.success(`Loaded "${item.name}" from history.`);
		}
	};

	const handleDeleteHistory = (id) => {
		setHistory(prevHistory => prevHistory.filter(item => item.id !== id));
		toast.success('Execution deleted from history.');
	};

	const handleRenameHistory = (id, newName) => {
		setHistory(prevHistory =>
			prevHistory.map(item =>
				item.id === id ? { ...item, name: newName } : item
			)
		);
		toast.success('Execution renamed.');
	};

	const handleFavoriteHistory = (id) => {
		setHistory(prevHistory =>
			prevHistory.map(item =>
				item.id === id ? { ...item, favorite: !item.favorite } : item
			)
		);
		toast.success('Favorite status updated.');
	};

	const handleLoadDefaults = () => {
		if (window.confirm('This will replace your current history with the default examples. Are you sure?')) {
			setHistory(defaultHistory);
			toast.success('Default examples loaded.');
		}
	};


	const decodedPacketContent = () => {
		const propertiesText = properties.map(p => `${p.name} = ${p.description}`).join('\n');
		return `${propertiesText}\n${decoded}`.trim();
	};


	const handleClearInputs = () => {
		setIsWarning(false);
		setData('');
		setAppKey('');
		setNwkKey('');
	};

	const handleClearResult = () => {
		setDecoded('');
		setDecodedBuffer('');
		setProperties([]);
	};

	const handleClear = () => {
		handleClearInputs();
		handleClearResult();
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
		<main className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-white my-4 md:my-8">
			<Card title='Parameters'>
					<div className='flex flex-col gap-2'>
						<label className='text-sm font-bold text-gray-300'>
							Lora Packet (hex-encoded or Base64)
						</label>
						<input
							className={`w-full p-4  rounded-lg bg-gray-700 text-gray-300 text-sm md:text-base ${isWarning ? "border-yellow-500 border-2" : ""} `}
							type='text'
							name='lora-packet'
							id='lora-packet'
							placeholder='Paste your LoraWAN packet here'
							value={data}
							onChange={handleDataChange}
							data-umami-event="lora-packet-input"
						/>
					</div>
					<div className='flex flex-col gap-2'>
						<label className='text-sm font-bold text-gray-300'>
							AppSKey (hex-encoded; optional)
						</label>
						<input
							className='w-full p-4  rounded-lg bg-gray-700 text-gray-300 text-sm md:text-base'
							type='text'
							name='app-key'
							id='app-key'
							placeholder='Paste your App Session Key here'
							value={appKey}
							onChange={handleAppKeyChange}
							data-umami-event="appskey-input"
						/>
					</div>
					<div className='flex flex-col gap-2'>
						<label className='text-sm font-bold text-gray-300'>
							NwkSKey (hex-encoded; optional)
						</label>
						<input
							className='w-full p-4  rounded-lg bg-gray-700 text-gray-300 text-sm md:text-base'
							type='text'
							name='nwk-key'
							id='nwk-key'
							placeholder='Paste your Network Session Key here'
							value={nwkKey}
							onChange={handleNwkKeyChange}
							data-umami-event="nwkskey-input"
						/>
					</div>
					<div className='flex gap-4'>
						<button
							className='w-full px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-lg shadow-md hover:bg-red-700 focus:outline-hidden focus:ring-2 focus:ring-red-400 focus:ring-opacity-75'
							type='button'
							name='reset'
							id='reset'
							onClick={handleClear}
							data-umami-event="clear-button"
						>
							Reset
						</button>
						<button
							className='w-full px-4 py-2 text-sm font-bold text-white bg-blue-500 rounded-lg shadow-md hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75'
							type='button'
							name='decode'
							id='decode'
							onClick={handleDecode}
							data-umami-event="decode-button"
						>
							Decode
						</button>
				</div>
				<History
					history={history}
					onLoad={handleLoadHistory}
					onDelete={handleDeleteHistory}
					onRename={handleRenameHistory}
					onFavorite={handleFavoriteHistory}
					onLoadDefaults={handleLoadDefaults}
				/>
			</Card>
			<Card title='Decoded Packet' copyableContent={decodedPacketContent()}>
				{isLoading && <Skeleton />}
				{properties.map((property) => (
					<pre className='flex flex-col text-xs md:text-sm' key={property.name}>
						{property.name} = {property.description}
					</pre>
				))}
				<pre className='text-xs md:text-sm' dangerouslySetInnerHTML={{ __html: sanitizeAndHighlightWarnings(decoded) }}></pre>
			</Card>
			<Card title='Decoded Packet (Buffer)' copyableContent={decodedBuffer}>
				{isLoading && <Skeleton />}
				<pre className='text-xs md:text-sm'>{decodedBuffer}</pre>
			</Card>
			<Toaster position="top-center" richColors closeButton />
		</main>
	)
}
