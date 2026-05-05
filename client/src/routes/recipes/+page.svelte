<script lang="ts">
  import PageIntro from "$components/layout/PageIntro/index.svelte";
  import RecipeCard from "$components/recipes/RecipeCard/index.svelte";
  import RecipeFilters from "$components/recipes/RecipeFilters/index.svelte";
  import Button from "$components/ui/Button/index.svelte";
  import EmptyState from "$components/ui/EmptyState/index.svelte";
  import SectionHeader from "$components/ui/SectionHeader/index.svelte";
  import { dictionary, formatMessage } from "$lib/i18n";
  import styles from "./+page.module.scss";

  export let data: {
    recipes: import("$lib/api/types").RecipeListResponse;
    filters: {
      q: string;
      category: string;
      status: string;
      tag: string;
      sort: string;
      order: string;
    };
    categories: string[];
    tags: string[];
  };
</script>

<div class={styles.page}>
  <PageIntro
    eyebrow={$dictionary.recipes.pageEyebrow}
    title={$dictionary.recipes.pageTitle}
    description={$dictionary.recipes.pageDescription}
  >
    <Button href="/recipes/new">{$dictionary.recipes.createRecipe}</Button>
  </PageIntro>

  <RecipeFilters values={data.filters} categories={data.categories} tags={data.tags} />

  <section class="page-grid">
    <SectionHeader
      title={formatMessage($dictionary.recipes.foundTitle, { count: data.recipes.meta.total })}
      subtitle={$dictionary.recipes.foundSubtitle}
    />

    {#if data.recipes.items.length}
      <div class={styles.grid}>
        {#each data.recipes.items as recipe}
          <RecipeCard {recipe} />
        {/each}
      </div>
    {:else}
      <EmptyState
        title={$dictionary.recipes.noMatchTitle}
        description={$dictionary.recipes.noMatchDescription}
      >
        <Button href="/recipes/new">{$dictionary.recipes.createRecipe}</Button>
      </EmptyState>
    {/if}
  </section>
</div>
