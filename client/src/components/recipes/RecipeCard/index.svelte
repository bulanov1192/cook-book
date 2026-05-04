<script lang="ts">
  import Badge from "$components/ui/Badge/index.svelte";
  import Button from "$components/ui/Button/index.svelte";
  import Card from "$components/ui/Card/index.svelte";
  import type { RecipeListItem } from "$lib/api/types";
  import { formatDate, formatMinutes, formatRecipeStatus } from "$utils/format";
  import styles from "./index.module.scss";

  export let recipe: RecipeListItem;

  let statusVariant: "accent" | "neutral" | "success" | "danger" = "accent";

  $: statusVariant =
    recipe.status === "published"
      ? "success"
      : recipe.status === "archived"
        ? "danger"
        : recipe.status === "private"
          ? "neutral"
          : "accent";
</script>

<Card>
  <article class={styles.card}>
    <div class={styles.header}>
      <div class={styles.titleBlock}>
        <h3 class={styles.title}>{recipe.title}</h3>
        <p class={styles.meta}>
          {recipe.category ?? "Uncategorized"} · Updated {formatDate(recipe.updatedAt)}
        </p>
      </div>

      <Badge variant={statusVariant}>{formatRecipeStatus(recipe.status)}</Badge>
    </div>

    {#if recipe.description}
      <p class={styles.description}>{recipe.description}</p>
    {/if}

    <div class={styles.facts}>
      <div class={styles.fact}>
        <span class={styles.factLabel}>Total</span>
        <span class={styles.factValue}>{formatMinutes(recipe.totalMinutes)}</span>
      </div>
      <div class={styles.fact}>
        <span class={styles.factLabel}>Servings</span>
        <span class={styles.factValue}>{recipe.servings}</span>
      </div>
      <div class={styles.fact}>
        <span class={styles.factLabel}>Ingredients</span>
        <span class={styles.factValue}>{recipe.ingredientCount}</span>
      </div>
      <div class={styles.fact}>
        <span class={styles.factLabel}>Steps</span>
        <span class={styles.factValue}>{recipe.stepCount}</span>
      </div>
    </div>

    {#if recipe.tags.length}
      <div class={styles.tags}>
        {#each recipe.tags as tag}
          <Badge>{tag}</Badge>
        {/each}
      </div>
    {/if}

    <div class={styles.actions}>
      <Button href={`/recipes/${recipe.id}`}>Open recipe</Button>
      {#if recipe.canEdit}
        <Button href={`/recipes/${recipe.id}/edit`} variant="secondary">Edit</Button>
      {/if}
    </div>
  </article>
</Card>
