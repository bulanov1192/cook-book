<script lang="ts">
  import styles from "./index.module.scss";

  export let id = "";
  export let name = "";
  export let type = "text";
  export let value: string | number = "";
  export let placeholder = "";
  export let min: number | undefined = undefined;
  export let max: number | undefined = undefined;
  export let step: number | string | undefined = undefined;
  export let required = false;
  export let disabled = false;
</script>

<input
  class={styles.input}
  {id}
  {name}
  {type}
  bind:value
  {placeholder}
  {min}
  {max}
  {step}
  {required}
  {disabled}
  on:input
  on:change
/>
