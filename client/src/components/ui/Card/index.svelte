<script lang="ts">
  import styles from "./index.module.scss";

  export let padding: "md" | "lg" = "lg";
  export let transparent = false;
</script>

<section
  class={`${styles.card} ${transparent ? styles["card--transparent"] : ""} ${styles[padding]}`}
>
  <slot />
</section>
