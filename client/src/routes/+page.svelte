<script lang="ts">
  import AuthPanel from "$components/auth/AuthPanel/index.svelte";
  import PageIntro from "$components/layout/PageIntro/index.svelte";
  import RecipeCard from "$components/recipes/RecipeCard/index.svelte";
  import ShoppingListCard from "$components/shopping-lists/ShoppingListCard/index.svelte";
  import Button from "$components/ui/Button/index.svelte";
  import EmptyState from "$components/ui/EmptyState/index.svelte";
  import SectionHeader from "$components/ui/SectionHeader/index.svelte";
  import StatCard from "$components/ui/StatCard/index.svelte";
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

<div class={styles.page}>
  <PageIntro
    eyebrow="Kitchen overview"
    title="Your recipes, shopping plans and next cooking moves."
    description={data.session.isAuthenticated
      ? "This dashboard keeps the important things close: fresh recipes, active lists and just enough product structure to feel useful from day one."
      : "Public recipes stay visible in guest mode. Sign in when you want drafts, private recipes and your own shopping workflows."}
  >
    {#if data.session.isAuthenticated}
      <Button href="/recipes/new">Add a recipe</Button>
      <Button href="/shopping-lists" variant="secondary">Open shopping lists</Button>
    {:else}
      <Button href="/recipes">Browse public recipes</Button>
    {/if}
  </PageIntro>

  <section class={styles.stats}>
    <StatCard label="Recipes" value={String(data.recipeCount)} hint="Everything currently stored in the catalog" />
    <StatCard label="Published" value={String(data.publishedRecipeCount)} hint="Ready-to-use recipes" />
    <StatCard label="Shopping lists" value={String(data.shoppingListCount)} hint="Ingredient plans in motion" />
  </section>

  <section class="page-grid">
    <SectionHeader
      title="Recent recipes"
      subtitle="A quick glance at the items you touched most recently."
    >
      <Button href="/recipes" variant="secondary">View all recipes</Button>
    </SectionHeader>

    {#if data.recentRecipes.length}
      <div class={styles.grid}>
        {#each data.recentRecipes as recipe}
          <RecipeCard {recipe} />
        {/each}
      </div>
    {:else}
      <EmptyState
        title="No recipes yet"
        description="The first useful step is simply getting one draft into the system. From there the whole flow starts making sense."
      >
        <Button href="/recipes/new">Create the first recipe</Button>
      </EmptyState>
    {/if}
  </section>

  <section class="page-grid">
    {#if data.session.isAuthenticated}
      <SectionHeader
        title="Shopping lists"
        subtitle="Ingredient planning stays lightweight: create a list, import ingredients, and check them off as you go."
      >
        <Button href="/shopping-lists" variant="secondary">View all lists</Button>
      </SectionHeader>

      {#if data.shoppingLists.length}
        <div class={styles.grid}>
          {#each data.shoppingLists as list}
            <ShoppingListCard {list} />
          {/each}
        </div>
      {:else}
        <EmptyState
          title="No shopping lists yet"
          description="Shopping lists become useful once you start turning recipe ingredients into a real plan."
        >
          <Button href="/shopping-lists">Create a shopping list</Button>
        </EmptyState>
      {/if}
    {:else}
      <AuthPanel
        title="Sign in for your own kitchen workspace"
        description="Guest mode is great for browsing. Authentication unlocks private drafts, editable recipes and shopping lists that belong only to you."
      />
    {/if}
  </section>
</div>
