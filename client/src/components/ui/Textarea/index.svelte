<script lang="ts">
  import styles from "./index.module.scss";

  export let id = "";
  export let name = "";
  export let value = "";
  export let placeholder = "";
  export let rows = 5;
  export let required = false;
</script>

<textarea
  class={styles.textarea}
  {id}
  {name}
  bind:value
  {placeholder}
  {rows}
  {required}
  on:input
  on:change
></textarea>
