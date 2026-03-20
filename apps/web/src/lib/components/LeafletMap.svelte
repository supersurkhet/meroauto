<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	type Zone = {
		name: string;
		center: [number, number];
		radius: number;
		color: string;
		fillOpacity: number;
	};

	type Location = {
		name: string;
		coords: [number, number];
		type: 'active' | 'hub' | 'coming-soon';
		description?: string;
	};

	let {
		zones = [] as Zone[],
		locations = [] as Location[],
		center = [28.6083, 81.6368] as [number, number],
		zoom = 13,
		height = '500px',
		onLocationClick
	}: {
		zones?: Zone[];
		locations?: Location[];
		center?: [number, number];
		zoom?: number;
		height?: string;
		onLocationClick?: (loc: Location) => void;
	} = $props();

	let mapContainer: HTMLDivElement;
	let map: any;

	onMount(() => {
		if (!browser) return;

		let styleEl: HTMLStyleElement;

		const init = async () => {
		const L = await import('leaflet');

		map = L.map(mapContainer).setView(center, zoom);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			maxZoom: 18
		}).addTo(map);

		// Draw zones as circles
		for (const zone of zones) {
			const circle = L.circle(zone.center, {
				radius: zone.radius,
				color: zone.color,
				fillColor: zone.color,
				fillOpacity: zone.fillOpacity,
				weight: 2,
				dashArray: zone.fillOpacity < 0.1 ? '8,4' : undefined
			}).addTo(map);
			circle.bindPopup(`<strong>${zone.name}</strong>`);
		}

		// Add location markers
		for (const loc of locations) {
			const iconColor = loc.type === 'hub' ? '#10b981' : loc.type === 'active' ? '#3b82f6' : '#f59e0b';
			const iconSize = loc.type === 'hub' ? 14 : 10;

			const icon = L.divIcon({
				className: 'custom-marker',
				html: `<div style="
					width: ${iconSize * 2}px;
					height: ${iconSize * 2}px;
					background: ${iconColor};
					border: 3px solid white;
					border-radius: 50%;
					box-shadow: 0 2px 8px rgba(0,0,0,0.3);
					${loc.type === 'hub' ? 'animation: pulse 2s infinite;' : ''}
				"></div>`,
				iconSize: [iconSize * 2, iconSize * 2],
				iconAnchor: [iconSize, iconSize]
			});

			const marker = L.marker(loc.coords, { icon }).addTo(map);

			const popupContent = `
				<div style="font-family: system-ui; min-width: 140px;">
					<strong style="font-size: 14px;">${loc.name}</strong>
					${loc.description ? `<p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">${loc.description}</p>` : ''}
					<span style="
						display: inline-block;
						margin-top: 4px;
						padding: 2px 8px;
						border-radius: 999px;
						font-size: 11px;
						font-weight: 500;
						background: ${loc.type === 'hub' ? '#ecfdf5' : loc.type === 'active' ? '#eff6ff' : '#fffbeb'};
						color: ${loc.type === 'hub' ? '#047857' : loc.type === 'active' ? '#1d4ed8' : '#b45309'};
					">${loc.type === 'hub' ? 'Main Hub' : loc.type === 'active' ? 'Active' : 'Coming Soon'}</span>
				</div>
			`;

			marker.bindPopup(popupContent);

			if (onLocationClick) {
				marker.on('click', () => onLocationClick(loc));
			}
		}

		// Add pulse animation style
		styleEl = document.createElement('style');
		styleEl.textContent = `
			@keyframes pulse {
				0%, 100% { transform: scale(1); opacity: 1; }
				50% { transform: scale(1.2); opacity: 0.8; }
			}
			.custom-marker { background: transparent !important; border: none !important; }
		`;
		document.head.appendChild(styleEl);
		};

		init();

		return () => {
			map?.remove();
			styleEl?.remove();
		};
	});
</script>

<svelte:head>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<div bind:this={mapContainer} style="height: {height}; width: 100%;" class="rounded-2xl z-0"></div>
