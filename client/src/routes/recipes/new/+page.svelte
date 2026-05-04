<script lang="ts">
  import { goto } from "$app/navigation";
  import AuthPanel from "$components/auth/AuthPanel/index.svelte";
  import PageIntro from "$components/layout/PageIntro/index.svelte";
  import RecipeForm from "$components/recipes/RecipeForm/index.svelte";
  import { createRecipe } from "$lib/api/recipes";
  import type { RecipePayload } from "$lib/api/types";
  import styles from "./+page.module.scss";

  export let data: {
    session: import("$lib/api/types").SessionResponse;
  };

  async function handleSubmit(payload: RecipePayload) {
    const recipe = await createRecipe(payload);
    await goto(`/recipes/${recipe.id}`);
  }
</script>

<div class={styles.page}>
  <PageIntro
    eyebrow="Create recipe"
    title="Start simple, then shape the recipe as it gets used."
    description="Drafts are welcome here. Keep the structure clean, then publish the recipe once the ingredient list and method feel solid."
  />

  {#if data.session.isAuthenticated}
    <RecipeForm submitLabel="Save recipe" onSubmit={handleSubmit} />
  {:else}
    <AuthPanel
      title="Sign in before creating a recipe"
      description="Recipe creation is private to your account by default, so this step needs authentication first."
    />
  {/if}
</div>
