<script lang="ts">
  import { goto } from "$app/navigation";
  import PageIntro from "$components/layout/PageIntro/index.svelte";
  import Badge from "$components/ui/Badge/index.svelte";
  import Button from "$components/ui/Button/index.svelte";
  import Card from "$components/ui/Card/index.svelte";
  import Field from "$components/ui/Field/index.svelte";
  import SectionHeader from "$components/ui/SectionHeader/index.svelte";
  import Select from "$components/ui/Select/index.svelte";
  import { dictionary, formatMessage } from "$lib/i18n";
  import { archiveRecipe, restoreRecipe } from "$lib/api/recipes";
  import { importRecipeToShoppingList } from "$lib/api/shopping-lists";
  import { formatDate, formatMinutes, formatRecipeStatus } from "$utils/format";
  import styles from "./+page.module.scss";

  export let data: {
    recipe: import("$lib/api/types").Recipe;
    shoppingLists: import("$lib/api/types").ShoppingListSummary[];
  };

  let recipe = data.recipe;
  let selectedListId = data.shoppingLists[0]?.id ?? "";
  let actionMessage = "";
  let isBusy = false;
  let statusVariant: "accent" | "neutral" | "success" | "danger" = "accent";

  function getSelectValue(event: Event): string {
    const target = event.currentTarget;
    return target instanceof HTMLSelectElement ? target.value : "";
  }

  $: statusVariant =
    recipe.status === "published"
      ? "success"
      : recipe.status === "archived"
        ? "danger"
        : recipe.status === "private"
          ? "neutral"
          : "accent";

  $: shoppingListOptions = data.shoppingLists.map((list) => ({
    value: list.id,
    label: list.name
  }));

  async function handleArchiveToggle() {
    isBusy = true;
    actionMessage = "";

    try {
      recipe =
        recipe.status === "archived"
          ? await restoreRecipe(recipe.id)
          : await archiveRecipe(recipe.id);

      actionMessage =
        recipe.status === "archived"
          ? $dictionary.recipes.detail.archivedMessage
          : $dictionary.recipes.detail.restoredMessage;
    } finally {
      isBusy = false;
    }
  }

  async function handleImport() {
    if (!selectedListId) {
      return;
    }

    isBusy = true;
    actionMessage = "";

    try {
      await importRecipeToShoppingList(selectedListId, recipe.id);
      actionMessage = $dictionary.recipes.detail.importMessage;
    } finally {
      isBusy = false;
    }
  }
</script>

<div class={styles.page}>
  <PageIntro
    eyebrow={$dictionary.recipes.detail.eyebrow}
    title={recipe.title}
    description={recipe.description ?? $dictionary.recipes.detail.noDescription}
  >
    {#if recipe.canEdit}
      <div class={styles.headerActions}>
        <Button href={`/recipes/${recipe.id}/edit`}>{$dictionary.recipes.detail.editRecipe}</Button>
        <Button variant="secondary" on:click={handleArchiveToggle} disabled={isBusy}>
          {recipe.status === "archived"
            ? $dictionary.recipes.detail.restoreDraft
            : $dictionary.recipes.detail.archiveRecipe}
        </Button>
      </div>
    {/if}
  </PageIntro>

  {#if actionMessage}
    <div class={styles.message}>{actionMessage}</div>
  {/if}

  <Card>
    <SectionHeader
      title={$dictionary.recipes.detail.overviewTitle}
      subtitle={formatMessage($dictionary.recipes.detail.overviewSubtitle, {
        status: formatRecipeStatus(recipe.status),
        date: formatDate(recipe.updatedAt)
      })}
    >
      <Badge variant={statusVariant}>{formatRecipeStatus(recipe.status)}</Badge>
    </SectionHeader>

    <div class={styles.infoGrid}>
      <div class={styles.infoCard}>
        <span class={styles.infoLabel}>{$dictionary.recipes.detail.category}</span>
        <span class={styles.infoValue}>{recipe.category ?? $dictionary.recipes.detail.uncategorized}</span>
      </div>
      <div class={styles.infoCard}>
        <span class={styles.infoLabel}>{$dictionary.recipes.detail.servings}</span>
        <span class={styles.infoValue}>{recipe.servings}</span>
      </div>
      <div class={styles.infoCard}>
        <span class={styles.infoLabel}>{$dictionary.recipes.detail.prep}</span>
        <span class={styles.infoValue}>{formatMinutes(recipe.prepMinutes)}</span>
      </div>
      <div class={styles.infoCard}>
        <span class={styles.infoLabel}>{$dictionary.recipes.detail.cook}</span>
        <span class={styles.infoValue}>{formatMinutes(recipe.cookMinutes)}</span>
      </div>
      <div class={styles.infoCard}>
        <span class={styles.infoLabel}>{$dictionary.recipes.detail.total}</span>
        <span class={styles.infoValue}>{formatMinutes(recipe.totalMinutes)}</span>
      </div>
    </div>
  </Card>

  {#if data.shoppingLists.length}
    <Card>
      <SectionHeader
        title={$dictionary.recipes.detail.sendToListTitle}
        subtitle={$dictionary.recipes.detail.sendToListSubtitle}
      />
      <div class={styles.inlineGrid}>
        <Field label={$dictionary.recipes.detail.targetList}>
          <Select value={selectedListId} options={shoppingListOptions} on:change={(event) => (selectedListId = getSelectValue(event))} />
        </Field>
        <Button on:click={handleImport} disabled={!selectedListId || isBusy}>{$dictionary.recipes.detail.addIngredients}</Button>
      </div>
    </Card>
  {/if}

  <div class="two-column">
    <Card>
      <SectionHeader
        title={$dictionary.recipes.detail.ingredientsTitle}
        subtitle={formatMessage($dictionary.recipes.detail.ingredientsSubtitle, {
          count: recipe.ingredients.length
        })}
      />
      <ul class={styles.list}>
        {#each recipe.ingredients as ingredient}
          <li class={styles.listItem}>
            {ingredient.amount ? `${ingredient.amount} ` : ""}{ingredient.unit ? `${ingredient.unit} ` : ""}{ingredient.name}
            {#if ingredient.preparationNote}
              · {ingredient.preparationNote}
            {/if}
            {#if ingredient.optional}
              · {$dictionary.recipes.detail.optionalIngredient}
            {/if}
          </li>
        {/each}
      </ul>
    </Card>

    <Card>
      <SectionHeader
        title={$dictionary.recipes.detail.methodTitle}
        subtitle={formatMessage($dictionary.recipes.detail.methodSubtitle, {
          count: recipe.steps.length
        })}
      />
      <ol class={styles.list}>
        {#each recipe.steps as step}
          <li class={styles.listItem}>{step.instruction}</li>
        {/each}
      </ol>
    </Card>
  </div>

  <Card>
    <SectionHeader
      title={$dictionary.recipes.detail.notesTagsTitle}
      subtitle={$dictionary.recipes.detail.notesTagsSubtitle}
    />

    <div class="page-grid">
      <p class={styles.copy}>{recipe.notes ?? $dictionary.recipes.detail.noNotes}</p>

      {#if recipe.tags.length}
        <div class={styles.tags}>
          {#each recipe.tags as tag}
            <Badge>{tag}</Badge>
          {/each}
        </div>
      {/if}
    </div>
  </Card>
</div>
