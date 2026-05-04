<script lang="ts">
  import styles from "./index.module.scss";

  export let padding: "md" | "lg" = "lg";
</script>

<section class={`${styles.card} ${styles[padding]}`}>
  <slot />
</section>
