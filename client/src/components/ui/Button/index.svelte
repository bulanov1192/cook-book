<script lang="ts">
  import styles from "./index.module.scss";

  export let href: string | undefined = undefined;
  export let type: "button" | "submit" | "reset" = "button";
  export let variant: "primary" | "secondary" | "ghost" | "danger" = "primary";
  export let size: "sm" | "md" | "lg" = "md";
  export let disabled = false;
  export let target: string | undefined = undefined;
  export let rel: string | undefined = undefined;
  export let fullWidth = false;

  $: className = `${styles.button} ${styles[variant]} ${styles[size]} ${fullWidth ? styles.fullWidth : ""}`;
</script>

{#if href}
  <a class={className} {href} {target} {rel} on:click>
    <slot />
  </a>
{:else}
  <button class={className} {type} {disabled} on:click>
    <slot />
  </button>
{/if}
