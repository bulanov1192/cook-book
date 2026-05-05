<script lang="ts">
  import Button from "$components/ui/Button/index.svelte";
  import { dictionary } from "$lib/i18n";
  import type { ShoppingListItem } from "$lib/api/types";
  import { formatIngredientLine } from "$utils/format";
  import styles from "./index.module.scss";

  export let item: ShoppingListItem;
  export let readOnly = false;
  export let onToggle: (checked: boolean) => Promise<void>;
  export let onDelete: () => Promise<void>;

  let isBusy = false;

  async function handleToggle() {
    isBusy = true;

    try {
      await onToggle(!item.checked);
    } finally {
      isBusy = false;
    }
  }

  async function handleDelete() {
    isBusy = true;

    try {
      await onDelete();
    } finally {
      isBusy = false;
    }
  }
</script>

<div class={styles.row}>
  <div class={styles.main}>
    <span class={`${styles.title} ${item.checked ? styles.done : ""}`}>
      {formatIngredientLine(item.amount, item.unit, item.name)}
    </span>
    {#if item.note}
      <span class={styles.note}>{item.note}</span>
    {/if}
  </div>

  {#if !readOnly}
    <div class={styles.actions}>
      <Button variant="secondary" size="sm" disabled={isBusy} on:click={handleToggle}>
        {item.checked
          ? $dictionary.shoppingLists.detail.markActive
          : $dictionary.shoppingLists.detail.markDone}
      </Button>
      <Button variant="ghost" size="sm" disabled={isBusy} on:click={handleDelete}>
        {$dictionary.common.remove}
      </Button>
    </div>
  {/if}
</div>
