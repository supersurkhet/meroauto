<script lang="ts">
	import { t } from '$i18n';
	import { Mail, Phone, MapPin, Send } from 'lucide-svelte';

	let name = $state('');
	let email = $state('');
	let message = $state('');
	let submitted = $state(false);

	function handleSubmit(e: Event) {
		e.preventDefault();
		submitted = true;
	}
</script>

<svelte:head>
	<title>Contact - MeroAuto</title>
	<meta name="description" content="Get in touch with MeroAuto. We'd love to hear from you." />
</svelte:head>

<section class="bg-gradient-to-b from-brand-50 to-white py-20 dark:from-gray-900 dark:to-gray-900">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="text-center">
			<h1 class="text-4xl font-bold text-gray-900 sm:text-5xl dark:text-white">{$t('contact.title')}</h1>
			<p class="mt-3 text-lg text-gray-500 dark:text-gray-400">{$t('contact.subtitle')}</p>
		</div>

		<div class="mt-16 grid gap-12 lg:grid-cols-2">
			<!-- Contact Form -->
			<div class="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
				{#if submitted}
					<div class="flex flex-col items-center justify-center py-12 text-center">
						<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
							<Send class="h-8 w-8 text-brand" />
						</div>
						<h3 class="text-xl font-semibold text-gray-900 dark:text-white">Message Sent!</h3>
						<p class="mt-2 text-gray-500 dark:text-gray-400">We'll get back to you within 24 hours.</p>
						<button onclick={() => { submitted = false; name = ''; email = ''; message = ''; }} class="mt-4 text-sm font-medium text-brand hover:text-brand-dark">Send another message</button>
					</div>
				{:else}
					<form onsubmit={handleSubmit} class="space-y-5">
						<div>
							<label for="name" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{$t('contact.name')}</label>
							<input id="name" type="text" bind:value={name} required class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
						</div>
						<div>
							<label for="email" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{$t('contact.email')}</label>
							<input id="email" type="email" bind:value={email} required class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
						</div>
						<div>
							<label for="message" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{$t('contact.message')}</label>
							<textarea id="message" bind:value={message} required rows={5} class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"></textarea>
						</div>
						<button type="submit" class="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-dark">
							<Send class="h-4 w-4" />
							{$t('contact.send')}
						</button>
					</form>
				{/if}
			</div>

			<!-- Contact Info -->
			<div class="space-y-8">
				{#each [
					{ icon: MapPin, title: 'Office Address', value: $t('contact.address'), color: 'bg-brand/10 text-brand' },
					{ icon: Phone, title: 'Phone', value: $t('contact.phone'), color: 'bg-blue-50 text-blue-500 dark:bg-blue-900/20' },
					{ icon: Mail, title: 'Email', value: $t('contact.emailAddr'), color: 'bg-amber-50 text-amber-500 dark:bg-amber-900/20' }
				] as info}
					<div class="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
						<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl {info.color}">
							<info.icon class="h-6 w-6" />
						</div>
						<div>
							<h3 class="font-semibold text-gray-900 dark:text-white">{info.title}</h3>
							<p class="mt-1 text-gray-600 dark:text-gray-300">{info.value}</p>
						</div>
					</div>
				{/each}

				<!-- Map placeholder -->
				<div class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
					<div class="flex h-64 items-center justify-center bg-gray-100 dark:bg-gray-800">
						<div class="text-center">
							<MapPin class="mx-auto mb-2 h-8 w-8 text-brand" />
							<p class="font-medium text-gray-600 dark:text-gray-300">Birendranagar, Surkhet</p>
							<p class="text-sm text-gray-400">28.6083° N, 81.6368° E</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
