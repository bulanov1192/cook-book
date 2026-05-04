<script lang="ts">
  import styles from "./index.module.scss";

  export let variant: "accent" | "neutral" | "success" | "danger" = "neutral";
</script>

<span class={`${styles.badge} ${styles[variant]}`}>
  <slot />
</span>
