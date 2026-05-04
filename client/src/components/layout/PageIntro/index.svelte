<script lang="ts">
  import styles from "./index.module.scss";

  export let eyebrow = "";
  export let title = "";
  export let description = "";
</script>

<section class={styles.intro}>
  {#if eyebrow}
    <span class={styles.eyebrow}>{eyebrow}</span>
  {/if}

  <h1 class={styles.title}>{title}</h1>
  <p class={styles.description}>{description}</p>

  <div class={styles.footer}>
    <slot />
  </div>
</section>
