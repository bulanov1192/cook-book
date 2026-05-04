<script lang="ts">
  import PageIntro from "$components/layout/PageIntro/index.svelte";
  import RecipeCard from "$components/recipes/RecipeCard/index.svelte";
  import RecipeFilters from "$components/recipes/RecipeFilters/index.svelte";
  import Button from "$components/ui/Button/index.svelte";
  import EmptyState from "$components/ui/EmptyState/index.svelte";
  import SectionHeader from "$components/ui/SectionHeader/index.svelte";
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
    eyebrow="Recipe catalog"
    title="A warm catalog with enough structure to stay useful."
    description="Filter by category, status and tags, keep drafts close while they are evolving, and publish recipes once they feel ready for repeat use."
  >
    <Button href="/recipes/new">Create recipe</Button>
  </PageIntro>

  <RecipeFilters values={data.filters} categories={data.categories} tags={data.tags} />

  <section class="page-grid">
    <SectionHeader
      title={`Recipes found: ${data.recipes.meta.total}`}
      subtitle="The list below comes straight from your API filters, so this page stays aligned with the backend contract."
    />

    {#if data.recipes.items.length}
      <div class={styles.grid}>
        {#each data.recipes.items as recipe}
          <RecipeCard {recipe} />
        {/each}
      </div>
    {:else}
      <EmptyState
        title="No recipes match these filters"
        description="Try widening the filters or create a new draft recipe to give the catalog something to work with."
      >
        <Button href="/recipes/new">Create recipe</Button>
      </EmptyState>
    {/if}
  </section>
</div>
