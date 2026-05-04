<script lang="ts">
  import Button from "$components/ui/Button/index.svelte";
  import Card from "$components/ui/Card/index.svelte";
  import Field from "$components/ui/Field/index.svelte";
  import Select from "$components/ui/Select/index.svelte";
  import type { RecipeListItem } from "$lib/api/types";
  import styles from "./index.module.scss";

  export let recipes: RecipeListItem[] = [];
  export let onImport: (recipeId: string) => Promise<void>;

  let selectedRecipeId = recipes[0]?.id ?? "";
  let isSubmitting = false;

  function getSelectValue(event: Event): string {
    const target = event.currentTarget;
    return target instanceof HTMLSelectElement ? target.value : "";
  }

  $: recipeOptions = recipes.map((recipe) => ({
    value: recipe.id,
    label: recipe.title
  }));

  $: if (!selectedRecipeId && recipeOptions.length) {
    selectedRecipeId = recipeOptions[0].value;
  }

  async function handleImport() {
    if (!selectedRecipeId) {
      return;
    }

    isSubmitting = true;

    try {
      await onImport(selectedRecipeId);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Card padding="md">
  <div class={styles.panel}>
    <Field label="Import ingredients from a recipe" hint="Pick a recipe and copy all its ingredient lines into this list.">
      <div class={styles.grid}>
        <Select value={selectedRecipeId} options={recipeOptions} on:change={(event) => (selectedRecipeId = getSelectValue(event))} />
        <Button on:click={handleImport} disabled={!selectedRecipeId || isSubmitting}>
          {isSubmitting ? "Importing..." : "Import"}
        </Button>
      </div>
    </Field>
  </div>
</Card>
