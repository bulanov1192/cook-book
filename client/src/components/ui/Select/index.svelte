<script lang="ts">
  import { ChevronDown } from "lucide-svelte";
  import styles from "./index.module.scss";

  type SelectOption = {
    value: string;
    label: string;
  };

  export let id = "";
  export let name = "";
  export let value = "";
  export let options: SelectOption[] = [];
  export let disabled = false;
</script>

<div class={styles.wrapper}>
  <select class={styles.select} {id} {name} bind:value {disabled} on:change>
    {#each options as option}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
  <span class={styles.icon} aria-hidden="true">
    <ChevronDown size={16} strokeWidth={2.2} />
  </span>
</div>
