<script lang="ts">
  import styles from "./index.module.scss";

  export let label = "";
  export let value = "";
  export let hint = "";
</script>

<article class={styles.stat}>
  <span class={styles.label}>{label}</span>
  <h3 class={styles.value}>{value}</h3>
  {#if hint}
    <p class={styles.hint}>{hint}</p>
  {/if}
</article>
