<script lang="ts">
  import "../app.scss";
  import AppShell from "$components/layout/AppShell/index.svelte";

  export let data: {
    session: import("$lib/api/types").SessionResponse;
  };
</script>

<AppShell session={data.session}>
  <slot />
</AppShell>
