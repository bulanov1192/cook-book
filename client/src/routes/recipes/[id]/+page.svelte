<script lang="ts">
  import { goto } from "$app/navigation";
  import PageIntro from "$components/layout/PageIntro/index.svelte";
  import Badge from "$components/ui/Badge/index.svelte";
  import Button from "$components/ui/Button/index.svelte";
  import Card from "$components/ui/Card/index.svelte";
  import Field from "$components/ui/Field/index.svelte";
  import SectionHeader from "$components/ui/SectionHeader/index.svelte";
  import Select from "$components/ui/Select/index.svelte";
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
        recipe.status === "archived" ? "Recipe archived." : "Recipe restored as draft.";
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
      actionMessage = "Ingredients were added to the selected shopping list.";
    } finally {
      isBusy = false;
    }
  }
</script>

<div class={styles.page}>
  <PageIntro
    eyebrow="Recipe detail"
    title={recipe.title}
    description={recipe.description ?? "This recipe currently has no description, but the structured ingredient list and method already make it useful."}
  >
    {#if recipe.canEdit}
      <div class={styles.headerActions}>
        <Button href={`/recipes/${recipe.id}/edit`}>Edit recipe</Button>
        <Button variant="secondary" on:click={handleArchiveToggle} disabled={isBusy}>
          {recipe.status === "archived" ? "Restore draft" : "Archive recipe"}
        </Button>
      </div>
    {/if}
  </PageIntro>

  {#if actionMessage}
    <div class={styles.message}>{actionMessage}</div>
  {/if}

  <Card>
    <SectionHeader title="At a glance" subtitle={`Status: ${formatRecipeStatus(recipe.status)} · Last updated ${formatDate(recipe.updatedAt)}`}>
      <Badge variant={statusVariant}>{formatRecipeStatus(recipe.status)}</Badge>
    </SectionHeader>

    <div class={styles.infoGrid}>
      <div class={styles.infoCard}>
        <span class={styles.infoLabel}>Category</span>
        <span class={styles.infoValue}>{recipe.category ?? "Uncategorized"}</span>
      </div>
      <div class={styles.infoCard}>
        <span class={styles.infoLabel}>Servings</span>
        <span class={styles.infoValue}>{recipe.servings}</span>
      </div>
      <div class={styles.infoCard}>
        <span class={styles.infoLabel}>Prep</span>
        <span class={styles.infoValue}>{formatMinutes(recipe.prepMinutes)}</span>
      </div>
      <div class={styles.infoCard}>
        <span class={styles.infoLabel}>Cook</span>
        <span class={styles.infoValue}>{formatMinutes(recipe.cookMinutes)}</span>
      </div>
      <div class={styles.infoCard}>
        <span class={styles.infoLabel}>Total</span>
        <span class={styles.infoValue}>{formatMinutes(recipe.totalMinutes)}</span>
      </div>
    </div>
  </Card>

  {#if data.shoppingLists.length}
    <Card>
      <SectionHeader title="Send to shopping list" subtitle="Use the API-backed import flow to copy these ingredients into one of your active lists." />
      <div class={styles.inlineGrid}>
        <Field label="Target shopping list">
          <Select value={selectedListId} options={shoppingListOptions} on:change={(event) => (selectedListId = getSelectValue(event))} />
        </Field>
        <Button on:click={handleImport} disabled={!selectedListId || isBusy}>Add ingredients</Button>
      </div>
    </Card>
  {/if}

  <div class="two-column">
    <Card>
      <SectionHeader title="Ingredients" subtitle={`${recipe.ingredients.length} structured ingredient lines`} />
      <ul class={styles.list}>
        {#each recipe.ingredients as ingredient}
          <li class={styles.listItem}>
            {ingredient.amount ? `${ingredient.amount} ` : ""}{ingredient.unit ? `${ingredient.unit} ` : ""}{ingredient.name}
            {#if ingredient.preparationNote}
              · {ingredient.preparationNote}
            {/if}
            {#if ingredient.optional}
              · optional
            {/if}
          </li>
        {/each}
      </ul>
    </Card>

    <Card>
      <SectionHeader title="Method" subtitle={`${recipe.steps.length} cooking steps`} />
      <ol class={styles.list}>
        {#each recipe.steps as step}
          <li class={styles.listItem}>{step.instruction}</li>
        {/each}
      </ol>
    </Card>
  </div>

  <Card>
    <SectionHeader title="Notes and tags" subtitle="Supporting context that helps the recipe stay useful later." />

    <div class="page-grid">
      <p class={styles.copy}>{recipe.notes ?? "No extra notes yet."}</p>

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
