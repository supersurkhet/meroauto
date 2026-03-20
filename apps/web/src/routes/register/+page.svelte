<script lang="ts">
	import { t } from '$i18n';
	import { User, Car, FileText, CheckCircle, Upload, ArrowLeft, ArrowRight, AlertCircle, X, Image, Phone, Mail, MapPin, Calendar, Palette, LogIn, LogOut, Shield } from 'lucide-svelte';
	import { Input, Select, Checkbox, Label } from '$lib/components/ui';

	let { data } = $props();

	let currentStep = $state(1);
	let submitted = $state(false);
	let errors = $state<Record<string, string>>({});
	let agreeTos = $state(false);

	const user = $derived(data.user);
	const initFirst = data.user?.firstName || '';
	const initLast = data.user?.lastName || '';
	const initEmail = data.user?.email || '';

	let addressMapEl: HTMLDivElement;
	let addressMap: any;
	let addressMarker: any;

	function initAddressMap() {
		if (addressMap || !addressMapEl) return;
		import('leaflet').then((L) => {
			const link = document.createElement('link');
			link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
			document.head.appendChild(link);
			setTimeout(() => {
				addressMap = L.map(addressMapEl).setView([28.601, 81.617], 14);
				L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM', maxZoom: 19 }).addTo(addressMap);
				addressMarker = L.marker([28.601, 81.617], { draggable: true }).addTo(addressMap);
				addressMarker.on('dragend', () => {
					const pos = addressMarker.getLatLng();
					form.address = `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)} (Surkhet)`;
				});
				addressMap.on('click', (e: any) => {
					addressMarker.setLatLng(e.latlng);
					form.address = `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)} (Surkhet)`;
				});
			}, 200);
		});
	}

	$effect(() => { if (currentStep === 1) setTimeout(initAddressMap, 100); });

	let form = $state({
		firstName: initFirst,
		lastName: initLast,
		phone: '',
		email: initEmail,
		address: '',
		city: 'Surkhet',
		dateOfBirth: '',
		emergencyContact: '',
		emergencyPhone: '',
		vehicleType: 'auto-rickshaw',
		vehicleNumber: '',
		vehicleYear: '',
		vehicleColor: '',
		vehicleCapacity: '3',
		vehicleMake: '',
		hasInsurance: false,
		insuranceExpiry: '',
		license: null as File | null,
		citizenship: null as File | null,
		vehicleRegistration: null as File | null,
		photo: null as File | null
	});

	let previews = $state<Record<string, string>>({});

	const steps = [
		{ num: 1, key: 'register.step1', icon: User },
		{ num: 2, key: 'register.step2', icon: Car },
		{ num: 3, key: 'register.step3', icon: FileText },
		{ num: 4, key: 'register.step4', icon: CheckCircle }
	];

	const docRequirements = [
		{ label: 'register.license', field: 'license' as const, required: true, accept: 'image/*,.pdf', maxSize: 5, hint: 'Valid driving license (front & back)' },
		{ label: 'register.citizenship', field: 'citizenship' as const, required: true, accept: 'image/*,.pdf', maxSize: 5, hint: 'Citizenship card (front & back)' },
		{ label: 'register.vehicleRegistration', field: 'vehicleRegistration' as const, required: true, accept: 'image/*,.pdf', maxSize: 5, hint: 'Bluebook with valid renewal' },
		{ label: 'register.photo', field: 'photo' as const, required: true, accept: 'image/*', maxSize: 3, hint: 'Clear passport-size photo, white background' }
	];

	function validateStep(step: number): boolean {
		errors = {};

		if (step === 1) {
			if (!form.firstName.trim()) errors['firstName'] = 'First name is required';
			if (!form.lastName.trim()) errors['lastName'] = 'Last name is required';
			if (!form.phone.trim()) errors['phone'] = 'Phone is required';
			else if (!/^(\+977)?[0-9]{10}$/.test(form.phone.replace(/[-\s]/g, ''))) errors['phone'] = 'Enter a valid Nepali phone number';
			if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors['email'] = 'Enter a valid email';
			if (!form.address.trim()) errors['address'] = 'Address is required';
			if (!form.dateOfBirth) errors['dateOfBirth'] = 'Date of birth is required';
		} else if (step === 2) {
			if (!form.vehicleNumber.trim()) errors['vehicleNumber'] = 'Vehicle number is required';
			else if (!/^[A-Za-z]{2}\s?\d\s?[A-Za-z]{2,3}\s?\d{1,4}$/.test(form.vehicleNumber.trim())) errors['vehicleNumber'] = 'Format: Ba 1 Kha 1234';
			if (!form.vehicleYear.trim()) errors['vehicleYear'] = 'Vehicle year is required';
			if (!form.vehicleColor.trim()) errors['vehicleColor'] = 'Color is required';
			if (form.hasInsurance && !form.insuranceExpiry) errors['insuranceExpiry'] = 'Insurance expiry date is required';
		} else if (step === 3) {
			for (const doc of docRequirements) {
				if (doc.required && !form[doc.field]) {
					errors[doc.field] = `${doc.hint} is required`;
				}
			}
		} else if (step === 4) {
			if (!agreeTos) errors['tos'] = 'You must agree to the terms';
		}

		return Object.keys(errors).length === 0;
	}

	function nextStep() {
		if (validateStep(currentStep)) {
			currentStep++;
		}
	}

	function handleFileChange(field: 'license' | 'citizenship' | 'vehicleRegistration' | 'photo', event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const doc = docRequirements.find((d) => d.field === field)!;
		if (file.size > doc.maxSize * 1024 * 1024) {
			errors = { ...errors, [field]: `File must be under ${doc.maxSize}MB` };
			return;
		}

		errors = { ...errors };
		delete errors[field];
		form[field] = file;

		// Generate preview for images
		if (file.type.startsWith('image/')) {
			const reader = new FileReader();
			reader.onload = (e) => {
				previews = { ...previews, [field]: e.target?.result as string };
			};
			reader.readAsDataURL(file);
		} else {
			previews = { ...previews, [field]: '' };
		}
	}

	function removeFile(field: 'license' | 'citizenship' | 'vehicleRegistration' | 'photo') {
		form[field] = null;
		const newPreviews = { ...previews };
		delete newPreviews[field];
		previews = newPreviews;
	}

	function handleSubmit() {
		if (validateStep(4)) {
			submitted = true;
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	const completionPercent = $derived(() => {
		let filled = 0;
		let total = 15;
		if (form.firstName) filled++;
		if (form.lastName) filled++;
		if (form.phone) filled++;
		if (form.address) filled++;
		if (form.dateOfBirth) filled++;
		if (form.vehicleNumber) filled++;
		if (form.vehicleYear) filled++;
		if (form.vehicleColor) filled++;
		if (form.vehicleMake) filled++;
		if (form.license) filled++;
		if (form.citizenship) filled++;
		if (form.vehicleRegistration) filled++;
		if (form.photo) filled++;
		if (form.email) filled++;
		if (form.emergencyContact) filled++;
		return Math.round((filled / total) * 100);
	});
</script>

<svelte:head>
	<title>Driver Registration - MeroAuto</title>
	<meta name="description" content="Join MeroAuto as a driver. Register your auto-rickshaw, upload documents, and start earning in Surkhet." />
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "JobPosting",
			"title": "Auto-Rickshaw Driver",
			"description": "Drive with MeroAuto in Surkhet. Set your own hours, earn fair fares.",
			"hiringOrganization": {
				"@type": "Organization",
				"name": "MeroAuto"
			},
			"jobLocation": {
				"@type": "Place",
				"address": {
					"@type": "PostalAddress",
					"addressLocality": "Surkhet",
					"addressCountry": "NP"
				}
			},
			"employmentType": "CONTRACTOR"
		}
	</script>
</svelte:head>

<section class="bg-gradient-to-b from-brand-50 to-white py-20 dark:from-gray-900 dark:to-gray-900">
	<div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
		<div class="text-center">
			<h1 class="text-4xl font-bold text-gray-900 sm:text-5xl dark:text-white">{$t('register.title')}</h1>
			<p class="mt-3 text-lg text-gray-500 dark:text-gray-400">{$t('register.subtitle')}</p>
		</div>

		<!-- Auth banner -->
		{#if user}
			<div class="mt-6 flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-5 py-3 dark:border-brand-800 dark:bg-brand-900/20">
				<div class="flex items-center gap-3">
					{#if user.profilePictureUrl}
						<img src={user.profilePictureUrl} alt="" class="h-8 w-8 rounded-full" />
					{:else}
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
							{(user.firstName?.[0] || user.email[0]).toUpperCase()}
						</div>
					{/if}
					<div>
						<p class="text-sm font-medium text-gray-900 dark:text-white">{user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.email}</p>
						<p class="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
					</div>
				</div>
				<a href="/auth/logout" class="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
					<LogOut class="h-3 w-3" />
					Sign out
				</a>
			</div>
		{:else}
			<div class="mt-6 rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
				<Shield class="mx-auto mb-3 h-8 w-8 text-brand" />
				<h3 class="text-lg font-semibold text-gray-900 dark:text-white">Sign in to register as a driver</h3>
				<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Create an account or sign in to save your progress and verify your identity.</p>
				<a href="/auth/login?returnTo=/register" class="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/20 transition-all hover:-translate-y-0.5 hover:bg-brand-dark">
					<LogIn class="h-4 w-4" />
					Sign In
				</a>
				<p class="mt-3 text-xs text-gray-400">Or continue without signing in below</p>
			</div>
		{/if}

		{#if submitted}
			<div class="mt-12 rounded-2xl border border-brand-200 bg-brand-50 p-12 text-center dark:border-brand-800 dark:bg-brand-900/20">
				<div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-brand/10">
					<CheckCircle class="h-10 w-10 text-brand" />
				</div>
				<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Application Submitted!</h2>
				<p class="mt-2 text-gray-600 dark:text-gray-300">{$t('register.success')}</p>
				<div class="mt-6 rounded-xl bg-white/60 p-4 dark:bg-gray-800/40">
					<p class="text-sm text-gray-500">Application ID</p>
					<p class="font-mono text-lg font-bold text-brand">MA-DRV-{Math.random().toString(36).substring(2, 8).toUpperCase()}</p>
				</div>
				<div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
					<a href="/" class="inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark">Back to Home</a>
					<a href="/contact" class="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">Contact Support</a>
				</div>
			</div>
		{:else}
			<!-- Progress Bar -->
			<div class="mt-8 rounded-xl bg-gray-100 p-4 dark:bg-gray-800">
				<div class="mb-2 flex items-center justify-between text-sm">
					<span class="font-medium text-gray-700 dark:text-gray-300">Application Progress</span>
					<span class="font-semibold text-brand">{completionPercent()}%</span>
				</div>
				<div class="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
					<div class="h-full rounded-full bg-brand transition-all duration-500" style="width: {completionPercent()}%"></div>
				</div>
			</div>

			<!-- Step Indicator -->
			<div class="mt-6 flex items-center justify-between">
				{#each steps as step, i}
					<div class="flex items-center {i < steps.length - 1 ? 'flex-1' : ''}">
						<button
							onclick={() => { if (step.num < currentStep) currentStep = step.num; }}
							class="flex flex-col items-center {step.num < currentStep ? 'cursor-pointer' : 'cursor-default'}"
						>
							<div class="flex h-10 w-10 items-center justify-center rounded-full transition-all {currentStep > step.num ? 'bg-brand text-white shadow-md shadow-brand/20' : currentStep === step.num ? 'bg-brand text-white ring-4 ring-brand/20' : 'bg-gray-200 text-gray-500 dark:bg-gray-700'}">
								{#if currentStep > step.num}
									<CheckCircle class="h-5 w-5" />
								{:else}
									<step.icon class="h-5 w-5" />
								{/if}
							</div>
							<span class="mt-1 text-xs font-medium {currentStep >= step.num ? 'text-brand' : 'text-gray-400'}">{$t(step.key)}</span>
						</button>
						{#if i < steps.length - 1}
							<div class="mx-2 h-0.5 flex-1 transition-colors {currentStep > step.num ? 'bg-brand' : 'bg-gray-200 dark:bg-gray-700'}"></div>
						{/if}
					</div>
				{/each}
			</div>

			<!-- Form -->
			<div class="mt-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
				{#if currentStep === 1}
					<h3 class="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
						<User class="h-5 w-5 text-brand" /> Personal Information
					</h3>
					<div class="space-y-5">
						<div class="grid gap-4 sm:grid-cols-2">
							<div>
								<Label for="firstName">{$t('register.firstName')} <span class="text-red-500">*</span></Label>
								<Input id="firstName" type="text" bind:value={form.firstName} variant={errors['firstName'] ? 'error' : 'default'} />
								{#if errors['firstName']}<p class="mt-1 flex items-center gap-1 text-xs text-red-500"><AlertCircle class="h-3 w-3" />{errors['firstName']}</p>{/if}
							</div>
							<div>
								<Label for="lastName">{$t('register.lastName')} <span class="text-red-500">*</span></Label>
								<Input id="lastName" type="text" bind:value={form.lastName} variant={errors['lastName'] ? 'error' : 'default'} />
								{#if errors['lastName']}<p class="mt-1 flex items-center gap-1 text-xs text-red-500"><AlertCircle class="h-3 w-3" />{errors['lastName']}</p>{/if}
							</div>
						</div>

						<div>
							<Label for="phone"><span class="flex items-center gap-1"><Phone class="h-3.5 w-3.5" /> {$t('register.phone')} <span class="text-red-500">*</span></span></Label>
							<Input id="phone" type="tel" bind:value={form.phone} placeholder="+977-98XXXXXXXX" variant={errors['phone'] ? 'error' : 'default'} />
							{#if errors['phone']}<p class="mt-1 flex items-center gap-1 text-xs text-red-500"><AlertCircle class="h-3 w-3" />{errors['phone']}</p>{/if}
						</div>

						<div>
							<Label for="registerEmail"><span class="flex items-center gap-1"><Mail class="h-3.5 w-3.5" /> {$t('register.email')}</span></Label>
							<Input id="registerEmail" type="email" bind:value={form.email} variant={errors['email'] ? 'error' : 'default'} />
							{#if errors['email']}<p class="mt-1 flex items-center gap-1 text-xs text-red-500"><AlertCircle class="h-3 w-3" />{errors['email']}</p>{/if}
						</div>

						<div>
							<Label for="dob"><span class="flex items-center gap-1"><Calendar class="h-3.5 w-3.5" /> Date of Birth <span class="text-red-500">*</span></span></Label>
							<Input id="dob" type="date" bind:value={form.dateOfBirth} variant={errors['dateOfBirth'] ? 'error' : 'default'} />
							{#if errors['dateOfBirth']}<p class="mt-1 flex items-center gap-1 text-xs text-red-500"><AlertCircle class="h-3 w-3" />{errors['dateOfBirth']}</p>{/if}
						</div>

						<div>
							<label for="address" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
								<span class="flex items-center gap-1"><MapPin class="h-3.5 w-3.5" /> {$t('register.address')} <span class="text-red-500">*</span></span>
							</label>
							<div class="rounded-xl border overflow-hidden {errors['address'] ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-300 dark:border-gray-600'}" style="height: 180px;">
								<div bind:this={addressMapEl} class="h-full w-full"></div>
							</div>
							<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
								{form.address ? `📍 ${form.address}` : 'Click on map or drag pin to set your address'}
							</p>
							{#if errors['address']}<p class="mt-1 flex items-center gap-1 text-xs text-red-500"><AlertCircle class="h-3 w-3" />{errors['address']}</p>{/if}
						</div>

						<div class="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
							<h4 class="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Emergency Contact</h4>
							<div class="grid gap-4 sm:grid-cols-2">
								<div>
									<Label for="emergencyContact" class="text-xs">Name</Label>
									<Input id="emergencyContact" type="text" bind:value={form.emergencyContact} placeholder="Family member name" class="h-9 text-sm" />
								</div>
								<div>
									<Label for="emergencyPhone" class="text-xs">Phone</Label>
									<Input id="emergencyPhone" type="tel" bind:value={form.emergencyPhone} placeholder="+977-98XXXXXXXX" class="h-9 text-sm" />
								</div>
							</div>
						</div>
					</div>

				{:else if currentStep === 2}
					<h3 class="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
						<Car class="h-5 w-5 text-brand" /> Vehicle Details
					</h3>
					<div class="space-y-5">
						<div class="grid gap-4 sm:grid-cols-2">
							<div>
								<Label for="vehicleType">{$t('register.vehicleType')}</Label>
								<Select id="vehicleType" bind:value={form.vehicleType}>
									<option value="auto-rickshaw">Auto Rickshaw (3-wheeler)</option>
									<option value="e-rickshaw">E-Rickshaw</option>
									<option value="tempo">Tempo</option>
								</Select>
							</div>
							<div>
								<Label for="vehicleMake">Make / Brand</Label>
								<Input id="vehicleMake" type="text" bind:value={form.vehicleMake} placeholder="e.g. Bajaj, Piaggio" />
							</div>
						</div>

						<div>
							<Label for="vehicleNumber">{$t('register.vehicleNumber')} <span class="text-red-500">*</span></Label>
							<Input id="vehicleNumber" type="text" bind:value={form.vehicleNumber} placeholder="Ba 1 Kha 1234" class="font-mono uppercase" variant={errors['vehicleNumber'] ? 'error' : 'default'} />
							{#if errors['vehicleNumber']}<p class="mt-1 flex items-center gap-1 text-xs text-red-500"><AlertCircle class="h-3 w-3" />{errors['vehicleNumber']}</p>{/if}
						</div>

						<div class="grid gap-4 sm:grid-cols-3">
							<div>
								<Label for="vehicleYear">{$t('register.vehicleYear')} <span class="text-red-500">*</span></Label>
								<Input id="vehicleYear" type="text" bind:value={form.vehicleYear} placeholder="2078 BS" variant={errors['vehicleYear'] ? 'error' : 'default'} />
								{#if errors['vehicleYear']}<p class="mt-1 flex items-center gap-1 text-xs text-red-500"><AlertCircle class="h-3 w-3" />{errors['vehicleYear']}</p>{/if}
							</div>
							<div>
								<Label for="vehicleColor"><span class="flex items-center gap-1"><Palette class="h-3.5 w-3.5" /> {$t('register.vehicleColor')} <span class="text-red-500">*</span></span></Label>
								<Input id="vehicleColor" type="text" bind:value={form.vehicleColor} placeholder="Green" variant={errors['vehicleColor'] ? 'error' : 'default'} />
								{#if errors['vehicleColor']}<p class="mt-1 flex items-center gap-1 text-xs text-red-500"><AlertCircle class="h-3 w-3" />{errors['vehicleColor']}</p>{/if}
							</div>
							<div>
								<Label for="vehicleCapacity">Passenger Capacity</Label>
								<Select id="vehicleCapacity" bind:value={form.vehicleCapacity}>
									<option value="3">3 passengers</option>
									<option value="4">4 passengers</option>
									<option value="6">6 passengers</option>
								</Select>
							</div>
						</div>

						<div class="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/50">
							<label class="flex cursor-pointer items-center gap-3">
								<Checkbox bind:checked={form.hasInsurance} />
								<span class="text-sm font-medium text-gray-700 dark:text-gray-300">Vehicle has active insurance</span>
							</label>
							{#if form.hasInsurance}
								<div class="mt-3">
									<Label for="insuranceExpiry" class="text-xs">Insurance Expiry Date</Label>
									<Input id="insuranceExpiry" type="date" bind:value={form.insuranceExpiry} variant={errors['insuranceExpiry'] ? 'error' : 'default'} class="h-9 text-sm" />
									{#if errors['insuranceExpiry']}<p class="mt-1 text-xs text-red-500">{errors['insuranceExpiry']}</p>{/if}
								</div>
							{/if}
						</div>
					</div>

				{:else if currentStep === 3}
					<h3 class="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
						<FileText class="h-5 w-5 text-brand" /> Document Upload
					</h3>
					<p class="mb-6 text-sm text-gray-500 dark:text-gray-400">Upload clear photos or scans of the following documents. All files must be under 5MB.</p>

					<div class="space-y-5">
						{#each docRequirements as doc}
							<div>
								<p class="mb-1 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
									<span>{$t(doc.label)} {#if doc.required}<span class="text-red-500">*</span>{/if}</span>
									<span class="text-xs text-gray-400">Max {doc.maxSize}MB</span>
								</p>

								{#if form[doc.field]}
									<div class="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50/50 p-3 dark:border-brand-800 dark:bg-brand-900/20">
										{#if previews[doc.field]}
											<img src={previews[doc.field]} alt="Preview" class="h-16 w-16 rounded-lg object-cover" />
										{:else}
											<div class="flex h-16 w-16 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/30">
												<FileText class="h-6 w-6 text-brand" />
											</div>
										{/if}
										<div class="flex-1">
											<p class="text-sm font-medium text-gray-700 dark:text-gray-300">{form[doc.field]?.name}</p>
											<p class="text-xs text-gray-400">{formatFileSize(form[doc.field]?.size ?? 0)}</p>
										</div>
										<button onclick={() => removeFile(doc.field)} class="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20" aria-label="Remove file">
											<X class="h-4 w-4" />
										</button>
									</div>
								{:else}
									<label class="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors {errors[doc.field] ? 'border-red-400 bg-red-50/50 dark:border-red-600 dark:bg-red-900/10' : 'border-gray-300 bg-gray-50 hover:border-brand hover:bg-brand-50/30 dark:border-gray-600 dark:bg-gray-700/50 dark:hover:border-brand'}">
										<div class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-600">
											{#if doc.field === 'photo'}
												<Image class="h-6 w-6 text-gray-400" />
											{:else}
												<Upload class="h-6 w-6 text-gray-400" />
											{/if}
										</div>
										<span class="text-sm font-medium text-gray-500 dark:text-gray-400">Click to upload</span>
										<span class="text-xs text-gray-400">{doc.hint}</span>
										<input type="file" accept={doc.accept} class="hidden" onchange={(e) => handleFileChange(doc.field, e)} />
									</label>
								{/if}
								{#if errors[doc.field]}<p class="mt-1 flex items-center gap-1 text-xs text-red-500"><AlertCircle class="h-3 w-3" />{errors[doc.field]}</p>{/if}
							</div>
						{/each}
					</div>

				{:else}
					<h3 class="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
						<CheckCircle class="h-5 w-5 text-brand" /> Review & Submit
					</h3>

					<div class="space-y-4">
						<!-- Personal Info Review -->
						<div class="rounded-xl bg-gray-50 p-5 dark:bg-gray-700/50">
							<div class="mb-3 flex items-center justify-between">
								<h4 class="text-sm font-semibold text-gray-900 dark:text-white">Personal Information</h4>
								<button onclick={() => (currentStep = 1)} class="text-xs font-medium text-brand hover:text-brand-dark">Edit</button>
							</div>
							<div class="grid gap-3 sm:grid-cols-2">
								<div><span class="text-xs text-gray-500">Name</span><p class="font-medium text-gray-900 dark:text-white">{form.firstName} {form.lastName}</p></div>
								<div><span class="text-xs text-gray-500">Phone</span><p class="font-medium text-gray-900 dark:text-white">{form.phone}</p></div>
								<div><span class="text-xs text-gray-500">Email</span><p class="font-medium text-gray-900 dark:text-white">{form.email || '—'}</p></div>
								<div><span class="text-xs text-gray-500">Address</span><p class="font-medium text-gray-900 dark:text-white">{form.address}, {form.city}</p></div>
								<div><span class="text-xs text-gray-500">DOB</span><p class="font-medium text-gray-900 dark:text-white">{form.dateOfBirth}</p></div>
								<div><span class="text-xs text-gray-500">Emergency</span><p class="font-medium text-gray-900 dark:text-white">{form.emergencyContact || '—'} {form.emergencyPhone ? `(${form.emergencyPhone})` : ''}</p></div>
							</div>
						</div>

						<!-- Vehicle Review -->
						<div class="rounded-xl bg-gray-50 p-5 dark:bg-gray-700/50">
							<div class="mb-3 flex items-center justify-between">
								<h4 class="text-sm font-semibold text-gray-900 dark:text-white">Vehicle Details</h4>
								<button onclick={() => (currentStep = 2)} class="text-xs font-medium text-brand hover:text-brand-dark">Edit</button>
							</div>
							<div class="grid gap-3 sm:grid-cols-2">
								<div><span class="text-xs text-gray-500">Type</span><p class="font-medium text-gray-900 dark:text-white">{form.vehicleType}{form.vehicleMake ? ` (${form.vehicleMake})` : ''}</p></div>
								<div><span class="text-xs text-gray-500">Number</span><p class="font-mono font-medium text-gray-900 dark:text-white">{form.vehicleNumber}</p></div>
								<div><span class="text-xs text-gray-500">Year / Color</span><p class="font-medium text-gray-900 dark:text-white">{form.vehicleYear} / {form.vehicleColor}</p></div>
								<div><span class="text-xs text-gray-500">Capacity</span><p class="font-medium text-gray-900 dark:text-white">{form.vehicleCapacity} passengers</p></div>
								<div><span class="text-xs text-gray-500">Insurance</span><p class="font-medium text-gray-900 dark:text-white">{form.hasInsurance ? `Yes (exp: ${form.insuranceExpiry})` : 'No'}</p></div>
							</div>
						</div>

						<!-- Documents Review -->
						<div class="rounded-xl bg-gray-50 p-5 dark:bg-gray-700/50">
							<div class="mb-3 flex items-center justify-between">
								<h4 class="text-sm font-semibold text-gray-900 dark:text-white">Documents</h4>
								<button onclick={() => (currentStep = 3)} class="text-xs font-medium text-brand hover:text-brand-dark">Edit</button>
							</div>
							<div class="flex flex-wrap gap-2">
								{#each docRequirements as doc}
									<span class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium {form[doc.field] ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-light' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'}">
										{#if form[doc.field]}
											<CheckCircle class="h-3 w-3" />
										{:else}
											<AlertCircle class="h-3 w-3" />
										{/if}
										{$t(doc.label)}
									</span>
								{/each}
							</div>
						</div>

						<!-- Terms -->
						<div class="rounded-xl border {errors['tos'] ? 'border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-900/10' : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'} p-4">
							<label class="flex cursor-pointer items-start gap-3">
								<Checkbox bind:checked={agreeTos} class="mt-0.5" />
								<span class="text-sm text-gray-600 dark:text-gray-300">
									I confirm that all information provided is accurate. I agree to MeroAuto's Terms of Service and Privacy Policy, and understand that my application will be reviewed within 48 hours.
								</span>
							</label>
							{#if errors['tos']}<p class="mt-2 flex items-center gap-1 text-xs text-red-500"><AlertCircle class="h-3 w-3" />{errors['tos']}</p>{/if}
						</div>
					</div>
				{/if}

				<!-- Navigation -->
				<div class="mt-8 flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-700">
					{#if currentStep > 1}
						<button onclick={() => currentStep--} class="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
							<ArrowLeft class="h-4 w-4" />
							{$t('register.previous')}
						</button>
					{:else}
						<div></div>
					{/if}

					{#if currentStep < 4}
						<button onclick={nextStep} class="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/20 transition-all hover:-translate-y-0.5 hover:bg-brand-dark">
							{$t('register.next')}
							<ArrowRight class="h-4 w-4" />
						</button>
					{:else}
						<button onclick={handleSubmit} class="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand/20 transition-all hover:-translate-y-0.5 hover:bg-brand-dark">
							<CheckCircle class="h-4 w-4" />
							{$t('register.submit')}
						</button>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</section>
