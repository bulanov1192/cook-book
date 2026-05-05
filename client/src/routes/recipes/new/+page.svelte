<script lang="ts">
  import { goto } from "$app/navigation";
  import AuthPanel from "$components/auth/AuthPanel/index.svelte";
  import PageIntro from "$components/layout/PageIntro/index.svelte";
  import RecipeForm from "$components/recipes/RecipeForm/index.svelte";
  import { createRecipe } from "$lib/api/recipes";
  import type { RecipePayload } from "$lib/api/types";
  import { dictionary } from "$lib/i18n";
  import styles from "./+page.module.scss";

  export let data: {
    session: import("$lib/api/types").SessionResponse;
  };

  async function handleSubmit(payload: RecipePayload) {
    const recipe = await createRecipe(payload);
    await goto(`/recipes/${recipe.id}`);
  }
</script>

<svelte:head>
  <title>{$dictionary.meta.newRecipeTitle}</title>
  <meta name="description" content={$dictionary.meta.newRecipeDescription} />
</svelte:head>

<div class={styles.page}>
  <PageIntro
    eyebrow={$dictionary.recipes.create.eyebrow}
    title={$dictionary.recipes.create.title}
    description={$dictionary.recipes.create.description}
  />

  {#if data.session.isAuthenticated}
    <RecipeForm
      submitLabel={$dictionary.recipes.form.saveRecipe}
      onSubmit={handleSubmit}
    />
  {:else}
    <AuthPanel
      title={$dictionary.recipes.create.authTitle}
      description={$dictionary.recipes.create.authDescription}
    />
  {/if}
</div>
