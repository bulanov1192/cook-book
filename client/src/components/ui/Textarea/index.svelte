<script lang="ts">
  import styles from "./index.module.scss";

  export let id = "";
  export let name = "";
  export let value = "";
  export let placeholder = "";
  export let rows = 2;
  export let required = false;
  export let disabled = false;
</script>

<textarea
  class={styles.textarea}
  {id}
  {name}
  bind:value
  {placeholder}
  {rows}
  {required}
  {disabled}
  on:input
  on:change
></textarea>
