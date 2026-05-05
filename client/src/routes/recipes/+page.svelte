<script lang="ts">
  import { browser } from "$app/environment";
  import PageIntro from "$components/layout/PageIntro/index.svelte";
  import RecipeCard from "$components/recipes/RecipeCard/index.svelte";
  import RecipeFilters from "$components/recipes/RecipeFilters/index.svelte";
  import Button from "$components/ui/Button/index.svelte";
  import EmptyState from "$components/ui/EmptyState/index.svelte";
  import SectionHeader from "$components/ui/SectionHeader/index.svelte";
  import { listRecipes } from "$lib/api/recipes";
  import { dictionary, formatMessage } from "$lib/i18n";
  import { onMount } from "svelte";
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

  let recipes = data.recipes.items;
  let meta = data.recipes.meta;
  let isLoadingMore = false;
  let loadMoreError = "";
  let sentinel: HTMLDivElement | null = null;
  let observer: IntersectionObserver | null = null;

  $: if (data.recipes) {
    recipes = data.recipes.items;
    meta = data.recipes.meta;
  }

  $: hasMore = recipes.length < meta.total;

  async function loadMoreRecipes() {
    if (isLoadingMore || !hasMore) {
      return;
    }

    isLoadingMore = true;
    loadMoreError = "";

    try {
      const nextPage = await listRecipes(fetch, {
        ...data.filters,
        limit: 50,
        offset: recipes.length,
      });

      recipes = [...recipes, ...nextPage.items];
      meta = nextPage.meta;
    } catch (error) {
      loadMoreError =
        error instanceof Error
          ? error.message
          : $dictionary.recipes.loadMoreFailed;
    } finally {
      isLoadingMore = false;
    }
  }

  function setupObserver() {
    observer?.disconnect();

    if (!browser || !sentinel) {
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (entry?.isIntersecting) {
          void loadMoreRecipes();
        }
      },
      {
        rootMargin: "320px 0px",
      },
    );

    observer.observe(sentinel);
  }

  onMount(() => {
    setupObserver();

    return () => {
      observer?.disconnect();
    };
  });

  $: if (browser) {
    setupObserver();
  }
</script>

<svelte:head>
  <title>{$dictionary.meta.recipesListTitle}</title>
  <meta name="description" content={$dictionary.meta.recipesListDescription} />
  <meta property="og:title" content={$dictionary.meta.recipesListTitle} />
  <meta
    property="og:description"
    content={$dictionary.meta.recipesListDescription}
  />
</svelte:head>

<div class={styles.page}>
  <PageIntro
    eyebrow={$dictionary.recipes.pageEyebrow}
    title={$dictionary.recipes.pageTitle}
    description={$dictionary.recipes.pageDescription}
  >
    <Button href="/recipes/new">{$dictionary.recipes.createRecipe}</Button>
  </PageIntro>

  <RecipeFilters
    values={data.filters}
    categories={data.categories}
    tags={data.tags}
  />

  <section class="page-grid">
    <SectionHeader
      title={formatMessage($dictionary.recipes.foundTitle, {
        count: meta.total,
      })}
      subtitle={$dictionary.recipes.foundSubtitle}
    />

    {#if recipes.length}
      <div class={styles.grid}>
        {#each recipes as recipe}
          <RecipeCard {recipe} />
        {/each}
      </div>

      {#if loadMoreError}
        <p class={styles.loadStateError}>{loadMoreError}</p>
      {/if}

      {#if hasMore}
        <div class={styles.loadState} bind:this={sentinel}>
          {#if isLoadingMore}
            {$dictionary.recipes.loadingMore}
          {:else}
            {$dictionary.recipes.loadingHint}
          {/if}
        </div>
      {/if}
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
