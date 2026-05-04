<script lang="ts">
  import styles from "./index.module.scss";

  export let title = "";
  export let description = "";
</script>

<section class={styles.empty}>
  <h2 class={styles.title}>{title}</h2>
  <p class={styles.description}>{description}</p>
  <slot />
</section>
