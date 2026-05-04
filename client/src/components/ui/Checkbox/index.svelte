<script lang="ts">
  import styles from "./index.module.scss";

  export let id = "";
  export let name = "";
  export let checked = false;
  export let label = "";
</script>

<label class={styles.wrapper}>
  <input class={styles.input} {id} {name} type="checkbox" bind:checked on:change />
  <span class={styles.label}>{label}</span>
</label>
