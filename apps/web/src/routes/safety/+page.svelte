<script lang="ts">
	import { t } from '$i18n';
	import { ShieldCheck, Eye, Siren, Star, FileCheck, Phone, UserCheck, Bell, ChevronDown, Award, Clock, Camera, Lock } from 'lucide-svelte';

	let openFaq = $state<number | null>(null);

	const safetyTimeline = [
		{ phase: 'Before Ride', items: [
			{ icon: UserCheck, text: 'All drivers verified with license, citizenship & background check' },
			{ icon: FileCheck, text: 'Vehicle inspection certificate required annually' },
			{ icon: Camera, text: 'Driver photo verified against citizenship records' }
		]},
		{ phase: 'During Ride', items: [
			{ icon: Eye, text: 'Real-time GPS tracking shared with your emergency contacts' },
			{ icon: Lock, text: 'Number-masked calls — your phone number stays private' },
			{ icon: Bell, text: 'AI route monitoring alerts for unusual deviations' },
			{ icon: Siren, text: 'One-tap SOS — alerts police, contacts & our safety team' }
		]},
		{ phase: 'After Ride', items: [
			{ icon: Star, text: 'Rate your driver — low-rated drivers are suspended' },
			{ icon: Award, text: 'Trip receipt with route, fare breakdown & driver details' },
			{ icon: Phone, text: '24/7 support for any ride-related concerns' }
		]}
	];

	const safetyStats = [
		{ value: '100%', label: 'Drivers Background Checked', icon: UserCheck },
		{ value: '< 3 sec', label: 'SOS Response Time', icon: Siren },
		{ value: '4.7★', label: 'Average Driver Rating', icon: Star },
		{ value: '24/7', label: 'Safety Team Available', icon: Clock }
	];

	const faqs = [
		{
			q: 'How are drivers verified?',
			a: 'Every driver must submit their citizenship card, valid driving license, and vehicle registration (bluebook). We verify these documents with government records and conduct a background check before approval.'
		},
		{
			q: 'What happens when I press the SOS button?',
			a: 'The SOS button triggers three simultaneous actions: (1) alerts Nepal Police 100, (2) sends your live location to your saved emergency contacts, and (3) notifies our 24/7 safety operations team who will call you immediately.'
		},
		{
			q: 'Can I share my ride with someone?',
			a: 'Yes! Before or during any ride, tap "Share Ride" to send a live tracking link via SMS or WhatsApp. Your contact can see your exact location, driver details, and ETA in real-time.'
		},
		{
			q: 'What if I have a safety concern after the ride?',
			a: 'Go to your ride history, select the ride, and tap "Report Safety Issue." Our team reviews all safety reports within 2 hours. For urgent concerns, call our safety line at +977-83-520001.'
		},
		{
			q: 'Is my personal information safe?',
			a: 'Yes. Your phone number is masked during rides — neither you nor the driver sees each other\'s real number. All personal data is encrypted and stored in compliance with Nepal\'s Privacy Act.'
		},
		{
			q: 'Are rides insured?',
			a: 'All rides on MeroAuto are covered by third-party accident insurance. In case of any incident during a ride, our insurance partner handles medical and property claims.'
		}
	];
</script>

<svelte:head>
	<title>Safety - MeroAuto | Ride With Confidence</title>
	<meta name="description" content="MeroAuto's comprehensive safety features: verified drivers, live tracking, SOS emergency, ride sharing, and 24/7 support. Your safety is our priority." />
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "FAQPage",
			"mainEntity": [
				{
					"@type": "Question",
					"name": "How are MeroAuto drivers verified?",
					"acceptedAnswer": {
						"@type": "Answer",
						"text": "Every driver must submit their citizenship card, valid driving license, and vehicle registration. We verify documents with government records and conduct background checks."
					}
				},
				{
					"@type": "Question",
					"name": "What happens when I press the SOS button?",
					"acceptedAnswer": {
						"@type": "Answer",
						"text": "SOS triggers three simultaneous actions: alerts Nepal Police 100, sends live location to emergency contacts, and notifies our 24/7 safety team."
					}
				},
				{
					"@type": "Question",
					"name": "Can I share my ride with someone?",
					"acceptedAnswer": {
						"@type": "Answer",
						"text": "Yes. Tap Share Ride to send a live tracking link via SMS or WhatsApp. Your contact can see your exact location, driver details, and ETA in real-time."
					}
				}
			]
		}
	</script>
</svelte:head>

<section class="bg-gradient-to-b from-brand-50 to-white dark:from-gray-900 dark:to-gray-900">
	<div class="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="text-center">
			<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10">
				<ShieldCheck class="h-8 w-8 text-brand" />
			</div>
			<h1 class="text-4xl font-bold text-gray-900 sm:text-5xl dark:text-white">{$t('safety.title')}</h1>
			<p class="mt-3 text-lg text-gray-500 dark:text-gray-400">{$t('safety.subtitle')}</p>
		</div>

		<!-- Safety Stats -->
		<div class="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
			{#each safetyStats as stat}
				<div class="rounded-2xl border border-gray-200 bg-white p-5 text-center dark:border-gray-700 dark:bg-gray-800">
					<stat.icon class="mx-auto mb-2 h-6 w-6 text-brand" />
					<p class="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
					<p class="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
				</div>
			{/each}
		</div>

		<!-- Core Safety Features -->
		<div class="mt-16 grid gap-8 md:grid-cols-2">
			{#each [
				{ icon: UserCheck, title: 'safety.feature1Title', desc: 'safety.feature1Desc', color: 'bg-blue-500', detail: 'Government ID verification, criminal background check, driving history review' },
				{ icon: Eye, title: 'safety.feature2Title', desc: 'safety.feature2Desc', color: 'bg-brand', detail: 'Share ride link via SMS/WhatsApp, live map tracking, ETA updates' },
				{ icon: Siren, title: 'safety.feature3Title', desc: 'safety.feature3Desc', color: 'bg-red-500', detail: 'Press & hold 3 seconds: alerts police, contacts, and our safety team simultaneously' },
				{ icon: Star, title: 'safety.feature4Title', desc: 'safety.feature4Desc', color: 'bg-amber-500', detail: 'Drivers below 4.0 rating are suspended. Riders can report safety concerns after any ride' }
			] as feature}
				<div class="group rounded-2xl border border-gray-200 bg-white p-8 transition-all hover:shadow-xl dark:border-gray-700 dark:bg-gray-800">
					<div class="{feature.color} mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg">
						<feature.icon class="h-6 w-6" />
					</div>
					<h3 class="text-xl font-semibold text-gray-900 dark:text-white">{$t(feature.title)}</h3>
					<p class="mt-2 leading-relaxed text-gray-500 dark:text-gray-400">{$t(feature.desc)}</p>
					<p class="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">{feature.detail}</p>
				</div>
			{/each}
		</div>

		<!-- Safety Timeline -->
		<div class="mt-20">
			<h2 class="mb-10 text-center text-2xl font-bold text-gray-900 dark:text-white">Safety at Every Step</h2>
			<div class="grid gap-8 lg:grid-cols-3">
				{#each safetyTimeline as phase, phaseIdx}
					<div class="relative">
						<div class="mb-4 flex items-center gap-3">
							<div class="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{phaseIdx + 1}</div>
							<h3 class="text-lg font-semibold text-gray-900 dark:text-white">{phase.phase}</h3>
						</div>
						<div class="ml-4 space-y-3 border-l-2 border-brand/20 pl-6">
							{#each phase.items as item}
								<div class="flex items-start gap-3">
									<div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10">
										<item.icon class="h-3.5 w-3.5 text-brand" />
									</div>
									<p class="text-sm text-gray-600 dark:text-gray-300">{item.text}</p>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Additional Safety Measures -->
		<div class="mt-20">
			<h2 class="mb-10 text-center text-2xl font-bold text-gray-900 dark:text-white">Additional Safety Measures</h2>
			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
				{#each [
					{ icon: FileCheck, title: 'Document Verification', desc: 'License, citizenship, and bluebook verified with government records' },
					{ icon: Phone, title: 'In-App Calling', desc: 'Number-masked calls — your real phone number stays private' },
					{ icon: Bell, title: 'AI Trip Monitoring', desc: 'Automatic alerts for unusual route deviations or extended stops' },
					{ icon: ShieldCheck, title: 'Insurance Coverage', desc: 'All rides covered by third-party accident insurance' }
				] as item}
					<div class="rounded-xl border border-gray-100 bg-gray-50 p-5 transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-800/50">
						<item.icon class="mb-3 h-6 w-6 text-brand" />
						<h3 class="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
						<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
					</div>
				{/each}
			</div>
		</div>

		<!-- FAQ Accordion -->
		<div class="mt-20">
			<h2 class="mb-8 text-center text-2xl font-bold text-gray-900 dark:text-white">Safety FAQ</h2>
			<div class="mx-auto max-w-3xl space-y-3">
				{#each faqs as faq, i}
					<div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
						<button
							onclick={() => (openFaq = openFaq === i ? null : i)}
							class="flex w-full items-center justify-between px-6 py-4 text-left"
						>
							<span class="pr-4 font-medium text-gray-900 dark:text-white">{faq.q}</span>
							<ChevronDown class="h-5 w-5 shrink-0 text-gray-400 transition-transform {openFaq === i ? 'rotate-180' : ''}" />
						</button>
						{#if openFaq === i}
							<div class="border-t border-gray-100 px-6 py-4 dark:border-gray-700">
								<p class="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{faq.a}</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Emergency CTA -->
		<div class="mt-20 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 p-8 text-center dark:from-red-900/20 dark:to-orange-900/20">
			<Siren class="mx-auto mb-4 h-10 w-10 text-red-500" />
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white">Emergency? Tap SOS</h2>
			<p class="mx-auto mt-2 max-w-md text-gray-600 dark:text-gray-300">
				In the app, press and hold the SOS button for 3 seconds. We'll alert local police, your emergency contacts, and our safety team instantly.
			</p>
			<div class="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
				<div class="rounded-xl bg-white px-6 py-3 dark:bg-gray-800">
					<p class="text-xs text-gray-400">Nepal Emergency</p>
					<p class="text-lg font-bold text-red-600">100</p>
				</div>
				<div class="rounded-xl bg-white px-6 py-3 dark:bg-gray-800">
					<p class="text-xs text-gray-400">MeroAuto Safety</p>
					<p class="text-lg font-bold text-red-600">+977-83-520001</p>
				</div>
				<div class="rounded-xl bg-white px-6 py-3 dark:bg-gray-800">
					<p class="text-xs text-gray-400">Women's Helpline</p>
					<p class="text-lg font-bold text-red-600">1145</p>
				</div>
			</div>
		</div>
	</div>
</section>
