<script lang="ts">
  import { dictionary } from "$lib/i18n";
  import styles from "./index.module.scss";

  export let label = "";
  export let hint = "";
  export let error = "";
  export let optional = false;
</script>

<label class={styles.field}>
  {#if label}
    <span class={styles.labelRow}>
      <span class={styles.label}>{label}</span>
      {#if optional}
        <span class={styles.optional}>{$dictionary.common.optional}</span>
      {/if}
    </span>
  {/if}

  <slot />

  {#if hint}
    <span class={styles.hint}>{hint}</span>
  {/if}

  {#if error}
    <span class={styles.error}>{error}</span>
  {/if}
</label>
