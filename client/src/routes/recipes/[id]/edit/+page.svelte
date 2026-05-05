<script lang="ts">
  import { goto } from "$app/navigation";
  import PageIntro from "$components/layout/PageIntro/index.svelte";
  import RecipeForm from "$components/recipes/RecipeForm/index.svelte";
  import { updateRecipe } from "$lib/api/recipes";
  import { dictionary, formatMessage } from "$lib/i18n";
  import type { RecipePayload } from "$lib/api/types";
  import styles from "./+page.module.scss";

  export let data: {
    recipe: import("$lib/api/types").Recipe;
  };

  async function handleSubmit(payload: RecipePayload) {
    const recipe = await updateRecipe(data.recipe.id, payload);
    await goto(`/recipes/${recipe.id}`);
  }
</script>

<div class={styles.page}>
  <PageIntro
    eyebrow={$dictionary.recipes.edit.eyebrow}
    title={formatMessage($dictionary.recipes.edit.title, { title: data.recipe.title })}
    description={$dictionary.recipes.edit.description}
  />

  <RecipeForm
    initialRecipe={data.recipe}
    submitLabel={$dictionary.recipes.form.saveChanges}
    cancelHref={`/recipes/${data.recipe.id}`}
    onSubmit={handleSubmit}
  />
</div>
