<script lang="ts">
  import { goto } from "$app/navigation";
  import PageIntro from "$components/layout/PageIntro/index.svelte";
  import RecipeForm from "$components/recipes/RecipeForm/index.svelte";
  import { updateRecipe } from "$lib/api/recipes";
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
    eyebrow="Edit recipe"
    title={`Refine ${data.recipe.title}`}
    description="Keep the structure clear and the copy calm. This editor stays intentionally straightforward so the recipe data remains the main thing."
  />

  <RecipeForm
    initialRecipe={data.recipe}
    submitLabel="Save changes"
    cancelHref={`/recipes/${data.recipe.id}`}
    onSubmit={handleSubmit}
  />
</div>
