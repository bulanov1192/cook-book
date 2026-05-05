<script lang="ts">
  import AuthPanel from "$components/auth/AuthPanel/index.svelte";
  import PageIntro from "$components/layout/PageIntro/index.svelte";
  import RecipeCard from "$components/recipes/RecipeCard/index.svelte";
  import ShoppingListCard from "$components/shopping-lists/ShoppingListCard/index.svelte";
  import Button from "$components/ui/Button/index.svelte";
  import EmptyState from "$components/ui/EmptyState/index.svelte";
  import SectionHeader from "$components/ui/SectionHeader/index.svelte";
  import StatCard from "$components/ui/StatCard/index.svelte";
  import { dictionary } from "$lib/i18n";
  import styles from "./+page.module.scss";

  export let data: {
    session: import("$lib/api/types").SessionResponse;
    recentRecipes: import("$lib/api/types").RecipeListItem[];
    shoppingLists: import("$lib/api/types").ShoppingListSummary[];
    recipeCount: number;
    publishedRecipeCount: number;
    shoppingListCount: number;
  };
</script>

<svelte:head>
  <title>{$dictionary.meta.cookbookTitle}</title>
  <meta name="description" content={$dictionary.meta.cookbookDescription} />
</svelte:head>

<div class={styles.page}>
  <PageIntro
    eyebrow={$dictionary.dashboard.eyebrow}
    title={$dictionary.dashboard.title}
    description={data.session.isAuthenticated
      ? $dictionary.dashboard.descriptionSignedIn
      : $dictionary.dashboard.descriptionGuest}
  >
    {#if data.session.isAuthenticated}
      <Button href="/recipes/new">{$dictionary.dashboard.addRecipe}</Button>
      <Button href="/shopping-lists" variant="secondary"
        >{$dictionary.dashboard.openShoppingLists}</Button
      >
    {:else}
      <Button href="/recipes"
        >{$dictionary.dashboard.browsePublicRecipes}</Button
      >
    {/if}
  </PageIntro>

  <section class={styles.stats}>
    <StatCard
      label={$dictionary.nav.recipes}
      value={String(data.recipeCount)}
      hint={$dictionary.dashboard.recipesHint}
    />
    <StatCard
      label={$dictionary.recipes.status.published}
      value={String(data.publishedRecipeCount)}
      hint={$dictionary.dashboard.publishedHint}
    />
    <StatCard
      label={$dictionary.nav.shoppingLists}
      value={String(data.shoppingListCount)}
      hint={$dictionary.dashboard.listsHint}
    />
  </section>

  <section class="page-grid">
    <SectionHeader
      title={$dictionary.dashboard.recentRecipesTitle}
      subtitle={$dictionary.dashboard.recentRecipesSubtitle}
    >
      <Button href="/recipes" variant="secondary"
        >{$dictionary.nav.recipes}</Button
      >
    </SectionHeader>

    {#if data.recentRecipes.length}
      <div class={styles.grid}>
        {#each data.recentRecipes as recipe}
          <RecipeCard {recipe} />
        {/each}
      </div>
    {:else}
      <EmptyState
        title={$dictionary.dashboard.noRecipesTitle}
        description={$dictionary.dashboard.noRecipesDescription}
      >
        <Button href="/recipes/new">{$dictionary.recipes.createRecipe}</Button>
      </EmptyState>
    {/if}
  </section>

  <section class="page-grid">
    {#if data.session.isAuthenticated}
      <SectionHeader
        title={$dictionary.dashboard.shoppingListsTitle}
        subtitle={$dictionary.dashboard.shoppingListsSubtitle}
      >
        <Button href="/shopping-lists" variant="secondary"
          >{$dictionary.nav.shoppingLists}</Button
        >
      </SectionHeader>

      {#if data.shoppingLists.length}
        <div class={styles.grid}>
          {#each data.shoppingLists as list}
            <ShoppingListCard {list} />
          {/each}
        </div>
      {:else}
        <EmptyState
          title={$dictionary.dashboard.noListsTitle}
          description={$dictionary.dashboard.noListsDescription}
        >
          <Button href="/shopping-lists"
            >{$dictionary.shoppingLists.create}</Button
          >
        </EmptyState>
      {/if}
    {:else}
      <AuthPanel
        title={$dictionary.dashboard.signInTitle}
        description={$dictionary.dashboard.signInDescription}
      />
    {/if}
  </section>
</div>
