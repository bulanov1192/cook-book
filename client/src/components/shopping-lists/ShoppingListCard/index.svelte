<script lang="ts">
  import Badge from "$components/ui/Badge/index.svelte";
  import Button from "$components/ui/Button/index.svelte";
  import Card from "$components/ui/Card/index.svelte";
  import { dictionary, formatMessage } from "$lib/i18n";
  import type { ShoppingListSummary } from "$lib/api/types";
  import { formatDate, formatShoppingListStatus, formatShoppingListVisibility } from "$utils/format";
  import styles from "./index.module.scss";

  export let list: ShoppingListSummary;

  let statusVariant: "accent" | "neutral" | "success" | "danger" = "neutral";

  $: statusVariant = list.status === "active" ? "success" : "neutral";
</script>

<Card>
  <article class={styles.card}>
    <div class={styles.top}>
      <div>
        <h3 class={styles.title}>{list.name}</h3>
        <p class={styles.meta}>
          {formatMessage($dictionary.shoppingLists.card.updated, {
            date: formatDate(list.updatedAt),
            count: list.itemCount,
            visibility: formatShoppingListVisibility(list.visibility)
          })}
        </p>
      </div>

      <Badge variant={statusVariant}>{formatShoppingListStatus(list.status)}</Badge>
    </div>

    <div class={styles.actions}>
      <Button href={`/shopping-lists/${list.id}`}>{$dictionary.shoppingLists.card.open}</Button>
    </div>
  </article>
</Card>
