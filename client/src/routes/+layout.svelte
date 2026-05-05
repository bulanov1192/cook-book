<script lang="ts">
  import { browser } from "$app/environment";
  import { locale, syncLocale } from "$lib/i18n";
  import "../app.scss";
  import AppShell from "$components/layout/AppShell/index.svelte";

  export let data: {
    session: import("$lib/api/types").SessionResponse;
  };

  $: syncLocale(data.session);
  $: if (browser) {
    document.documentElement.lang = $locale;
    document.documentElement.dataset.locale = $locale;
  }
</script>

<AppShell session={data.session}>
  <slot />
</AppShell>
