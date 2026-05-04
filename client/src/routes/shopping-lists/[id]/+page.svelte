<script lang="ts">
  import PageIntro from "$components/layout/PageIntro/index.svelte";
  import ImportRecipePanel from "$components/shopping-lists/ImportRecipePanel/index.svelte";
  import ShoppingListItemRow from "$components/shopping-lists/ShoppingListItemRow/index.svelte";
  import Badge from "$components/ui/Badge/index.svelte";
  import Button from "$components/ui/Button/index.svelte";
  import Card from "$components/ui/Card/index.svelte";
  import EmptyState from "$components/ui/EmptyState/index.svelte";
  import Field from "$components/ui/Field/index.svelte";
  import Input from "$components/ui/Input/index.svelte";
  import SectionHeader from "$components/ui/SectionHeader/index.svelte";
  import {
    addShoppingListItem,
    deleteShoppingListItem,
    importRecipeToShoppingList,
    updateShoppingListItem
  } from "$lib/api/shopping-lists";
  import type {
    RecipeListItem,
    ShoppingList,
    ShoppingListItemPayload
  } from "$lib/api/types";
  import { formatShoppingListStatus, formatShoppingListVisibility } from "$utils/format";
  import styles from "./+page.module.scss";

  export let data: {
    list: ShoppingList;
    recipes: RecipeListItem[];
  };

  let list = data.list;
  let message = "";
  let errorMessage = "";
  let draftItem: ShoppingListItemPayload = {
    name: "",
    amount: null,
    unit: null,
    note: null,
    checked: false
  };
  let isSubmitting = false;
  let statusVariant: "accent" | "neutral" | "success" | "danger" = "neutral";

  function getInputValue(event: Event): string {
    const target = event.currentTarget;
    return target instanceof HTMLInputElement ? target.value : "";
  }

  $: statusVariant = list.status === "active" ? "success" : "neutral";

  async function handleAddItem() {
    if (!draftItem.name?.trim()) {
      errorMessage = "Item name is required.";
      return;
    }

    errorMessage = "";
    message = "";
    isSubmitting = true;

    try {
      list = await addShoppingListItem(list.id, {
        ...draftItem,
        name: draftItem.name.trim()
      });
      draftItem = {
        name: "",
        amount: null,
        unit: null,
        note: null,
        checked: false
      };
      message = "Item added to the list.";
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Could not add the item.";
    } finally {
      isSubmitting = false;
    }
  }

  async function handleToggleItem(itemId: string, checked: boolean) {
    list = await updateShoppingListItem(list.id, itemId, { checked });
  }

  async function handleDeleteItem(itemId: string) {
    list = await deleteShoppingListItem(list.id, itemId);
  }

  async function handleImportRecipe(recipeId: string) {
    message = "";
    errorMessage = "";
    list = await importRecipeToShoppingList(list.id, recipeId);
    message = "Recipe ingredients imported into the shopping list.";
  }
</script>

<div class={styles.page}>
  <PageIntro
    eyebrow="Shopping list detail"
    title={list.name}
    description={list.canEdit
      ? "A focused ingredient workspace: add items manually, import from recipes, and mark things done as you move through the list."
      : "This list is shared in read-only mode. You can inspect the contents, but only the owner or an admin can edit it."}
  >
    <div class={styles.badges}>
      <Badge variant={statusVariant}>{formatShoppingListStatus(list.status)}</Badge>
      <Badge variant={list.visibility === "public" ? "accent" : "neutral"}>
        {formatShoppingListVisibility(list.visibility)}
      </Badge>
    </div>
  </PageIntro>

  {#if message}
    <div class={styles.message}>{message}</div>
  {/if}

  {#if list.canEdit}
    <Card>
      <div class={styles.addForm}>
        <SectionHeader title="Add an item" subtitle="Useful for extras that do not belong to a recipe yet." />

        <form class={styles.grid} on:submit|preventDefault={handleAddItem}>
          <Field label="Item name">
            <Input value={draftItem.name ?? ""} placeholder="Olive oil" on:input={(event) => (draftItem = { ...draftItem, name: getInputValue(event) })} />
          </Field>

          <Field label="Amount" optional={true}>
            <Input type="number" min={0} step="0.1" value={draftItem.amount ?? ""} placeholder="1" on:input={(event) => (draftItem = { ...draftItem, amount: getInputValue(event) ? Number(getInputValue(event)) : null })} />
          </Field>

          <Field label="Unit" optional={true}>
            <Input value={draftItem.unit ?? ""} placeholder="bottle" on:input={(event) => (draftItem = { ...draftItem, unit: getInputValue(event) || null })} />
          </Field>

          <Field label="Note" optional={true}>
            <Input value={draftItem.note ?? ""} placeholder="extra virgin" on:input={(event) => (draftItem = { ...draftItem, note: getInputValue(event) || null })} />
          </Field>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add item"}
          </Button>
        </form>

        {#if errorMessage}
          <p class={styles.error}>{errorMessage}</p>
        {/if}
      </div>
    </Card>
  {/if}

  {#if list.canEdit && data.recipes.length}
    <ImportRecipePanel recipes={data.recipes} onImport={handleImportRecipe} />
  {/if}

  <Card>
    <SectionHeader title={`Items: ${list.items.length}`} subtitle="Check them off or remove them as the list changes." />

    {#if list.items.length}
      <div class={styles.items}>
        {#each list.items as item}
          <ShoppingListItemRow
            {item}
            readOnly={!list.canEdit}
            onToggle={(checked) => handleToggleItem(item.id, checked)}
            onDelete={() => handleDeleteItem(item.id)}
          />
        {/each}
      </div>
    {:else}
      <EmptyState
        title="This shopping list is empty"
        description="Add a few manual items or import ingredients from a recipe to make the list useful."
      />
    {/if}
  </Card>
</div>
