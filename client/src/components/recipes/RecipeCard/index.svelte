<script lang="ts">
  import Badge from "$components/ui/Badge/index.svelte";
  import Button from "$components/ui/Button/index.svelte";
  import Card from "$components/ui/Card/index.svelte";
  import { dictionary, formatMessage } from "$lib/i18n";
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
          {recipe.category ?? $dictionary.recipes.card.uncategorized} ·
          {formatMessage($dictionary.recipes.card.updated, { date: formatDate(recipe.updatedAt) })}
        </p>
      </div>

      <Badge variant={statusVariant}>{formatRecipeStatus(recipe.status)}</Badge>
    </div>

    {#if recipe.description}
      <p class={styles.description}>{recipe.description}</p>
    {/if}

    <div class={styles.ratingStrip}>
      <div class={styles.ratingScore}>
        <span class={styles.ratingLabel}>{$dictionary.recipes.card.rating}</span>
        <span class={styles.ratingValue}>{recipe.vote.score}</span>
      </div>
      <div class={styles.ratingStats}>
        <span>{formatMessage($dictionary.recipes.card.likes, { count: recipe.vote.upvoteCount })}</span>
        <span>{formatMessage($dictionary.recipes.card.dislikes, { count: recipe.vote.downvoteCount })}</span>
        <span>{formatMessage($dictionary.recipes.card.comments, { count: recipe.commentCount })}</span>
      </div>
    </div>

    <div class={styles.facts}>
      <div class={styles.fact}>
        <span class={styles.factLabel}>{$dictionary.recipes.card.total}</span>
        <span class={styles.factValue}>{formatMinutes(recipe.totalMinutes)}</span>
      </div>
      <div class={styles.fact}>
        <span class={styles.factLabel}>{$dictionary.recipes.card.servings}</span>
        <span class={styles.factValue}>{recipe.servings}</span>
      </div>
      <div class={styles.fact}>
        <span class={styles.factLabel}>{$dictionary.recipes.card.ingredients}</span>
        <span class={styles.factValue}>{recipe.ingredientCount}</span>
      </div>
      <div class={styles.fact}>
        <span class={styles.factLabel}>{$dictionary.recipes.card.steps}</span>
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
      <Button href={`/recipes/${recipe.id}`}>{$dictionary.recipes.card.open}</Button>
      {#if recipe.canEdit}
        <Button href={`/recipes/${recipe.id}/edit`} variant="secondary">
          {$dictionary.recipes.card.edit}
        </Button>
      {/if}
    </div>
  </article>
</Card>
