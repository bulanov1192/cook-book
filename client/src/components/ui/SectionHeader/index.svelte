<script lang="ts">
  import styles from "./index.module.scss";

  export let title = "";
  export let subtitle = "";
</script>

<div class={styles.header}>
  <div class={styles.copy}>
    <h2 class={styles.title}>{title}</h2>
    {#if subtitle}
      <p class={styles.subtitle}>{subtitle}</p>
    {/if}
  </div>

  <slot />
</div>
