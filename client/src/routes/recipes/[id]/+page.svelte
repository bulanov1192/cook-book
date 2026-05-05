<script lang="ts">
  import { browser } from "$app/environment";
  import PageIntro from "$components/layout/PageIntro/index.svelte";
  import CommentComposer from "$components/recipes/CommentComposer/index.svelte";
  import RecipeCommentThread from "$components/recipes/RecipeCommentThread/index.svelte";
  import Badge from "$components/ui/Badge/index.svelte";
  import Button from "$components/ui/Button/index.svelte";
  import Card from "$components/ui/Card/index.svelte";
  import Field from "$components/ui/Field/index.svelte";
  import SectionHeader from "$components/ui/SectionHeader/index.svelte";
  import Select from "$components/ui/Select/index.svelte";
  import {
    archiveRecipe,
    clearRecipeVote,
    createRecipeComment,
    deleteRecipeComment,
    getRecipeCommentReplies,
    getRecipeComments,
    restoreRecipe,
    setRecipeVote,
    updateRecipeComment,
  } from "$lib/api/recipes";
  import { importRecipeToShoppingList } from "$lib/api/shopping-lists";
  import type { RecipeComment, RecipeVoteValue } from "$lib/api/types";
  import { dictionary, formatMessage } from "$lib/i18n";
  import { formatDate, formatMinutes, formatRecipeStatus } from "$utils/format";
  import { ArrowBigDown, ArrowBigUp } from "lucide-svelte";
  import { onMount } from "svelte";
  import styles from "./+page.module.scss";

  export let data: {
    recipe: import("$lib/api/types").Recipe;
    comments: import("$lib/api/types").RecipeCommentListResponse;
    session: import("$lib/api/types").SessionResponse;
    shoppingLists: import("$lib/api/types").ShoppingListSummary[];
  };

  let recipe = data.recipe;
  let comments: RecipeComment[] = data.comments.items;
  let commentsMeta = data.comments.meta;
  let selectedListId = data.shoppingLists[0]?.id ?? "";
  let actionMessage = "";
  let actionError = "";
  let commentDraft = "";
  let commentFeedback = "";
  let commentError = "";
  let isArchiveBusy = false;
  let isImportBusy = false;
  let isVoteBusy = false;
  let isCommentSubmitting = false;
  let isLoadingMoreComments = false;
  let statusVariant: "accent" | "neutral" | "success" | "danger" = "accent";
  let commentsSentinel: HTMLDivElement | null = null;
  let commentsObserver: IntersectionObserver | null = null;
  let serverLoadedRootCount = data.comments.items.length;

  function getSelectValue(event: Event): string {
    const target = event.currentTarget;
    return target instanceof HTMLSelectElement ? target.value : "";
  }

  function sortCommentsChronologically(items: RecipeComment[]) {
    return [...items].sort(
      (left, right) =>
        new Date(left.createdAt).getTime() -
        new Date(right.createdAt).getTime(),
    );
  }

  function mergeCommentsChronologically(
    existing: RecipeComment[],
    incoming: RecipeComment[],
  ) {
    const byId = new Map(existing.map((comment) => [comment.id, comment]));

    for (const comment of incoming) {
      byId.set(comment.id, comment);
    }

    return sortCommentsChronologically([...byId.values()]);
  }

  function updateCommentTree(
    items: RecipeComment[],
    targetId: string,
    updater: (comment: RecipeComment) => RecipeComment,
  ): RecipeComment[] {
    return items.map((comment) => {
      if (comment.id === targetId) {
        return updater(comment);
      }

      if (!comment.previewReplies.length) {
        return comment;
      }

      return {
        ...comment,
        previewReplies: updateCommentTree(
          comment.previewReplies,
          targetId,
          updater,
        ),
      };
    });
  }

  function replaceCommentInTree(
    items: RecipeComment[],
    replacement: RecipeComment,
  ) {
    return updateCommentTree(items, replacement.id, () => replacement);
  }

  function appendReplyInTree(
    items: RecipeComment[],
    parentId: string,
    reply: RecipeComment,
  ) {
    return updateCommentTree(items, parentId, (comment) => {
      const mergedReplies = mergeCommentsChronologically(
        comment.previewReplies,
        [reply],
      );
      const nextReplyCount = comment.replyCount + 1;
      const nextLoadedReplyCount =
        comment.replyCount === comment.previewReplies.length
          ? comment.loadedReplyCount + 1
          : comment.loadedReplyCount;

      return {
        ...comment,
        replyCount: nextReplyCount,
        previewReplies: mergedReplies,
        loadedReplyCount: nextLoadedReplyCount,
        hasMoreReplies: nextReplyCount > mergedReplies.length,
      };
    });
  }

  function mergeReplyPageInTree(
    items: RecipeComment[],
    parentId: string,
    replyPage: import("$lib/api/types").RecipeCommentListResponse,
    offset: number,
  ) {
    return updateCommentTree(items, parentId, (comment) => {
      const mergedReplies = mergeCommentsChronologically(
        comment.previewReplies,
        replyPage.items,
      );

      return {
        ...comment,
        replyCount: Math.max(comment.replyCount, replyPage.meta.total),
        previewReplies: mergedReplies,
        loadedReplyCount: Math.max(
          comment.loadedReplyCount,
          offset + replyPage.items.length,
        ),
        hasMoreReplies: replyPage.meta.total > mergedReplies.length,
      };
    });
  }

  $: statusVariant =
    recipe.status === "published"
      ? "success"
      : recipe.status === "archived"
        ? "danger"
        : recipe.status === "private"
          ? "neutral"
          : "accent";

  $: shoppingListOptions = data.shoppingLists.map((list) => ({
    value: list.id,
    label: list.name,
  }));

  $: hasMoreComments = serverLoadedRootCount < commentsMeta.total;

  async function handleArchiveToggle() {
    isArchiveBusy = true;
    actionMessage = "";
    actionError = "";

    try {
      recipe =
        recipe.status === "archived"
          ? await restoreRecipe(recipe.id)
          : await archiveRecipe(recipe.id);

      actionMessage =
        recipe.status === "archived"
          ? $dictionary.recipes.detail.archivedMessage
          : $dictionary.recipes.detail.restoredMessage;
    } catch (error) {
      actionError =
        error instanceof Error
          ? error.message
          : $dictionary.recipes.detail.actionFailed;
    } finally {
      isArchiveBusy = false;
    }
  }

  async function handleImport() {
    if (!selectedListId) {
      return;
    }

    isImportBusy = true;
    actionMessage = "";
    actionError = "";

    try {
      await importRecipeToShoppingList(selectedListId, recipe.id);
      actionMessage = $dictionary.recipes.detail.importMessage;
    } catch (error) {
      actionError =
        error instanceof Error
          ? error.message
          : $dictionary.recipes.detail.actionFailed;
    } finally {
      isImportBusy = false;
    }
  }

  async function handleVote(nextVote: RecipeVoteValue) {
    if (!data.session.isAuthenticated || isVoteBusy) {
      return;
    }

    isVoteBusy = true;
    actionError = "";

    try {
      recipe = {
        ...recipe,
        vote:
          recipe.vote.currentUserVote === nextVote
            ? await clearRecipeVote(recipe.id)
            : await setRecipeVote(recipe.id, { value: nextVote }),
      };
    } catch (error) {
      actionError =
        error instanceof Error
          ? error.message
          : $dictionary.recipes.detail.voteFailed;
    } finally {
      isVoteBusy = false;
    }
  }

  async function loadMoreComments() {
    if (isLoadingMoreComments || !hasMoreComments) {
      return;
    }

    isLoadingMoreComments = true;
    commentError = "";

    try {
      const nextPage = await getRecipeComments(fetch, recipe.id, {
        limit: 50,
        offset: serverLoadedRootCount,
      });

      serverLoadedRootCount += nextPage.items.length;
      comments = mergeCommentsChronologically(comments, nextPage.items);
      commentsMeta = nextPage.meta;
    } catch (error) {
      commentError =
        error instanceof Error
          ? error.message
          : $dictionary.recipes.detail.commentsLoadFailed;
    } finally {
      isLoadingMoreComments = false;
    }
  }

  function setupCommentsObserver() {
    commentsObserver?.disconnect();

    if (!browser || !commentsSentinel) {
      return;
    }

    commentsObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (entry?.isIntersecting) {
          void loadMoreComments();
        }
      },
      {
        rootMargin: "320px 0px",
      },
    );

    commentsObserver.observe(commentsSentinel);
  }

  onMount(() => {
    setupCommentsObserver();

    return () => {
      commentsObserver?.disconnect();
    };
  });

  $: if (browser) {
    setupCommentsObserver();
  }

  async function handleCreateRootComment() {
    if (
      !data.session.isAuthenticated ||
      isCommentSubmitting ||
      !commentDraft.trim()
    ) {
      return;
    }

    isCommentSubmitting = true;
    commentFeedback = "";
    commentError = "";

    try {
      const createdComment = await createRecipeComment(recipe.id, {
        body: commentDraft.trim(),
      });

      comments = mergeCommentsChronologically(comments, [createdComment]);
      commentsMeta = {
        ...commentsMeta,
        total: commentsMeta.total + 1,
      };
      commentDraft = "";
      commentFeedback = $dictionary.recipes.detail.commentCreated;
    } catch (error) {
      commentError =
        error instanceof Error
          ? error.message
          : $dictionary.recipes.detail.commentCreateFailed;
    } finally {
      isCommentSubmitting = false;
    }
  }

  async function handleCreateReply(parentCommentId: string, body: string) {
    const createdComment = await createRecipeComment(recipe.id, {
      body,
      parentCommentId,
    });

    comments = appendReplyInTree(comments, parentCommentId, createdComment);
  }

  async function handleUpdateComment(commentId: string, body: string) {
    const updatedComment = await updateRecipeComment(recipe.id, commentId, {
      body,
    });
    comments = replaceCommentInTree(comments, updatedComment);
  }

  async function handleDeleteComment(commentId: string) {
    const deletedComment = await deleteRecipeComment(recipe.id, commentId);
    comments = replaceCommentInTree(comments, deletedComment);
  }

  async function handleLoadMoreReplies(commentId: string, offset: number) {
    const replyPage = await getRecipeCommentReplies(
      fetch,
      recipe.id,
      commentId,
      {
        limit: 10,
        offset,
      },
    );

    comments = mergeReplyPageInTree(comments, commentId, replyPage, offset);
    return replyPage.items.length;
  }
</script>

<div class={styles.page}>
  <PageIntro
    eyebrow={$dictionary.recipes.detail.eyebrow}
    title={recipe.title}
    description={recipe.description ?? $dictionary.recipes.detail.noDescription}
  >
    {#if recipe.canEdit}
      <div class={styles.headerActions}>
        <Button href={`/recipes/${recipe.id}/edit`}
          >{$dictionary.recipes.detail.editRecipe}</Button
        >
        <Button
          variant="secondary"
          on:click={handleArchiveToggle}
          disabled={isArchiveBusy}
        >
          {recipe.status === "archived"
            ? $dictionary.recipes.detail.restoreDraft
            : $dictionary.recipes.detail.archiveRecipe}
        </Button>
      </div>
    {/if}
  </PageIntro>

  {#if actionMessage}
    <div class={styles.message}>{actionMessage}</div>
  {/if}

  {#if actionError}
    <div class={styles.errorMessage}>{actionError}</div>
  {/if}

  <Card>
    <SectionHeader
      title={$dictionary.recipes.detail.overviewTitle}
      subtitle={formatMessage($dictionary.recipes.detail.overviewSubtitle, {
        status: formatRecipeStatus(recipe.status),
        date: formatDate(recipe.updatedAt),
      })}
    >
      <div class={styles.headerMeta}>
        <Button href="#recipe-comments" variant="secondary" size="sm">
          {$dictionary.recipes.detail.jumpToComments}
        </Button>
        <Badge variant={statusVariant}
          >{formatRecipeStatus(recipe.status)}</Badge
        >
      </div>
    </SectionHeader>

    <div class={styles.infoGrid}>
      <div class={styles.infoCard}>
        <span class={styles.infoLabel}
          >{$dictionary.recipes.detail.category}</span
        >
        <span class={styles.infoValue}
          >{recipe.category ?? $dictionary.recipes.detail.uncategorized}</span
        >
      </div>
      <div class={styles.infoCard}>
        <span class={styles.infoLabel}
          >{$dictionary.recipes.detail.servings}</span
        >
        <span class={styles.infoValue}>{recipe.servings}</span>
      </div>
      <div class={styles.infoCard}>
        <span class={styles.infoLabel}>{$dictionary.recipes.detail.prep}</span>
        <span class={styles.infoValue}>{formatMinutes(recipe.prepMinutes)}</span
        >
      </div>
      <div class={styles.infoCard}>
        <span class={styles.infoLabel}>{$dictionary.recipes.detail.cook}</span>
        <span class={styles.infoValue}>{formatMinutes(recipe.cookMinutes)}</span
        >
      </div>
      <div class={styles.infoCard}>
        <span class={styles.infoLabel}>{$dictionary.recipes.detail.total}</span>
        <span class={styles.infoValue}
          >{formatMinutes(recipe.totalMinutes)}</span
        >
      </div>
    </div>

    <div class={styles.socialSummary}>
      <div class={styles.votePanel}>
        <button
          class={`${styles.voteButton} ${recipe.vote.currentUserVote === "up" ? styles.voteButtonActive : ""}`}
          type="button"
          aria-label={$dictionary.recipes.detail.likes.replace(
            "{count}",
            String(recipe.vote.upvoteCount),
          )}
          on:click={() => handleVote("up")}
          disabled={!data.session.isAuthenticated || isVoteBusy}
        >
          <ArrowBigUp size={28} />
        </button>

        <div class={styles.voteStats}>
          <span class={styles.voteLabel}
            >{$dictionary.recipes.detail.recipeScore}</span
          >
          <strong class={styles.voteScore}>{recipe.vote.score}</strong>
          <span class={styles.voteMeta}>
            {formatMessage($dictionary.recipes.detail.likes, {
              count: recipe.vote.upvoteCount,
            })}
            ·
            {formatMessage($dictionary.recipes.detail.dislikes, {
              count: recipe.vote.downvoteCount,
            })}
          </span>
        </div>

        <button
          class={`${styles.voteButton} ${recipe.vote.currentUserVote === "down" ? styles.voteButtonDanger : ""}`}
          type="button"
          aria-label={$dictionary.recipes.detail.dislikes.replace(
            "{count}",
            String(recipe.vote.downvoteCount),
          )}
          on:click={() => handleVote("down")}
          disabled={!data.session.isAuthenticated || isVoteBusy}
        >
          <ArrowBigDown size={28} />
        </button>
      </div>

      <p class={styles.voteHint}>
        {data.session.isAuthenticated
          ? $dictionary.recipes.detail.voteHintSignedIn
          : $dictionary.recipes.detail.voteHintGuest}
      </p>
    </div>
  </Card>

  <Card>
    <SectionHeader
      title={$dictionary.recipes.detail.notesTagsTitle}
      subtitle={$dictionary.recipes.detail.notesTagsSubtitle}
    />

    <div class="page-grid">
      <p class={styles.copy}>
        {recipe.notes ?? $dictionary.recipes.detail.noNotes}
      </p>

      {#if recipe.tags.length}
        <div class={styles.tags}>
          {#each recipe.tags as tag}
            <Badge>{tag}</Badge>
          {/each}
        </div>
      {/if}
    </div>
  </Card>

  {#if data.shoppingLists.length}
    <Card>
      <SectionHeader
        title={$dictionary.recipes.detail.sendToListTitle}
        subtitle={$dictionary.recipes.detail.sendToListSubtitle}
      />
      <div class={styles.inlineGrid}>
        <Field label={$dictionary.recipes.detail.targetList}>
          <Select
            value={selectedListId}
            options={shoppingListOptions}
            disabled={isImportBusy}
            on:change={(event) => (selectedListId = getSelectValue(event))}
          />
        </Field>
        <Button
          on:click={handleImport}
          disabled={!selectedListId || isImportBusy}
        >
          {#if isImportBusy}
            {$dictionary.recipes.detail.importing}
          {:else}
            {$dictionary.recipes.detail.addIngredients}
          {/if}
        </Button>
      </div>
    </Card>
  {/if}

  <div class="two-column">
    <Card>
      <SectionHeader
        title={$dictionary.recipes.detail.ingredientsTitle}
        subtitle={formatMessage(
          $dictionary.recipes.detail.ingredientsSubtitle,
          {
            count: recipe.ingredients.length,
          },
        )}
      />
      <ul class={styles.list}>
        {#each recipe.ingredients as ingredient}
          <li class={styles.listItem}>
            {ingredient.amount ? `${ingredient.amount} ` : ""}{ingredient.unit
              ? `${ingredient.unit} `
              : ""}{ingredient.name}
            {#if ingredient.preparationNote}
              · {ingredient.preparationNote}
            {/if}
            {#if ingredient.optional}
              · {$dictionary.recipes.detail.optionalIngredient}
            {/if}
          </li>
        {/each}
      </ul>
    </Card>

    <Card>
      <SectionHeader
        title={$dictionary.recipes.detail.methodTitle}
        subtitle={formatMessage($dictionary.recipes.detail.methodSubtitle, {
          count: recipe.steps.length,
        })}
      />
      <ol class={styles.list}>
        {#each recipe.steps as step}
          <li class={styles.listItem}>{step.instruction}</li>
        {/each}
      </ol>
    </Card>
  </div>

  <Card>
    <div id="recipe-comments" class={styles.commentsSection}>
      <SectionHeader
        title={$dictionary.recipes.detail.commentsTitle}
        subtitle={$dictionary.recipes.detail.commentsSubtitle}
      />

      {#if data.session.isAuthenticated}
        <div class={styles.commentComposer}>
          <Field label={$dictionary.recipes.detail.commentFieldLabel}>
            <CommentComposer
              bind:value={commentDraft}
              placeholder={$dictionary.recipes.detail.commentPlaceholder}
              rows={2}
              submitLabel={$dictionary.recipes.detail.commentSubmit}
              submitBusyLabel={$dictionary.recipes.detail.commentSubmitting}
              submitAriaLabel={$dictionary.recipes.detail.commentSubmit}
              submitDisabled={!commentDraft.trim()}
              isBusy={isCommentSubmitting}
              on:submit={handleCreateRootComment}
            />
          </Field>
        </div>
      {:else}
        <p class={styles.commentGuestNote}>
          {$dictionary.recipes.detail.commentGuestNote}
        </p>
      {/if}

      {#if commentFeedback}
        <p class={styles.message}>{commentFeedback}</p>
      {/if}

      {#if commentError}
        <p class={styles.errorMessage}>{commentError}</p>
      {/if}

      {#if comments.length}
        <div class={styles.commentList}>
          {#each comments as comment (comment.id)}
            <RecipeCommentThread
              {comment}
              session={data.session}
              onCreateReply={handleCreateReply}
              onUpdateComment={handleUpdateComment}
              onDeleteComment={handleDeleteComment}
              onLoadMoreReplies={handleLoadMoreReplies}
            />
          {/each}
        </div>

        {#if hasMoreComments}
          <div class={styles.commentLoadState} bind:this={commentsSentinel}>
            {#if isLoadingMoreComments}
              {$dictionary.recipes.detail.commentsLoadingMore}
            {:else}
              {$dictionary.recipes.detail.commentsLoadingHint}
            {/if}
          </div>
        {/if}
      {:else}
        <p class={styles.commentEmpty}>
          {$dictionary.recipes.detail.noComments}
        </p>
      {/if}
    </div>
  </Card>
</div>
