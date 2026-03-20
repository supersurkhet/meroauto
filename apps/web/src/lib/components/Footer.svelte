<script lang="ts">
	import { t } from '$i18n';
</script>

<footer class="border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 gap-8 md:grid-cols-4">
			<div class="col-span-1 md:col-span-1">
				<div class="flex items-center gap-2">
					<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand font-bold text-white">म</div>
					<span class="text-xl font-bold text-gray-900 dark:text-white">MeroAuto</span>
				</div>
				<p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{$t('footer.tagline')}</p>
			</div>

			<div>
				<h3 class="text-sm font-semibold text-gray-900 dark:text-white">{$t('footer.quickLinks')}</h3>
				<ul class="mt-3 space-y-2">
					<li><a href="/pricing" class="text-sm text-gray-500 hover:text-brand dark:text-gray-400">{$t('nav.pricing')}</a></li>
					<li><a href="/safety" class="text-sm text-gray-500 hover:text-brand dark:text-gray-400">{$t('nav.safety')}</a></li>
					<li><a href="/coverage" class="text-sm text-gray-500 hover:text-brand dark:text-gray-400">{$t('nav.coverage')}</a></li>
					<li><a href="/about" class="text-sm text-gray-500 hover:text-brand dark:text-gray-400">{$t('nav.about')}</a></li>
				</ul>
			</div>

			<div>
				<h3 class="text-sm font-semibold text-gray-900 dark:text-white">{$t('footer.support')}</h3>
				<ul class="mt-3 space-y-2">
					<li><a href="/contact" class="text-sm text-gray-500 hover:text-brand dark:text-gray-400">{$t('nav.contact')}</a></li>
					<li><a href="/register" class="text-sm text-gray-500 hover:text-brand dark:text-gray-400">{$t('nav.register')}</a></li>
					<li><span class="text-sm text-gray-500 dark:text-gray-400">{$t('footer.helpCenter')}</span></li>
					<li><span class="text-sm text-gray-500 dark:text-gray-400">{$t('footer.faq')}</span></li>
				</ul>
			</div>

			<div>
				<h3 class="text-sm font-semibold text-gray-900 dark:text-white">{$t('footer.legal')}</h3>
				<ul class="mt-3 space-y-2">
					<li><span class="text-sm text-gray-500 dark:text-gray-400">{$t('footer.privacy')}</span></li>
					<li><span class="text-sm text-gray-500 dark:text-gray-400">{$t('footer.terms')}</span></li>
				</ul>
			</div>
		</div>

		<div class="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-200 pt-8 sm:flex-row dark:border-gray-800">
			<p class="text-sm text-gray-400">{$t('footer.copyright')}</p>
			<p class="text-sm text-gray-400">{$t('footer.madeIn')}</p>
		</div>
	</div>
</footer>
