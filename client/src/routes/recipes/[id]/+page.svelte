<script lang="ts">
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import PageIntro from "$components/layout/PageIntro/index.svelte";
  import Badge from "$components/ui/Badge/index.svelte";
  import Button from "$components/ui/Button/index.svelte";
  import Card from "$components/ui/Card/index.svelte";
  import Field from "$components/ui/Field/index.svelte";
  import SectionHeader from "$components/ui/SectionHeader/index.svelte";
  import Select from "$components/ui/Select/index.svelte";
  import Textarea from "$components/ui/Textarea/index.svelte";
  import { dictionary, formatMessage } from "$lib/i18n";
  import {
    archiveRecipe,
    clearRecipeVote,
    createRecipeComment,
    deleteRecipeComment,
    getRecipeComments,
    restoreRecipe,
    setRecipeVote,
    updateRecipeComment
  } from "$lib/api/recipes";
  import { importRecipeToShoppingList } from "$lib/api/shopping-lists";
  import type { RecipeComment, RecipeVoteValue } from "$lib/api/types";
  import { formatDate, formatMinutes, formatRecipeStatus } from "$utils/format";
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
  let editingCommentId: string | null = null;
  let editingCommentBody = "";
  let deletingCommentId: string | null = null;
  let savingCommentId: string | null = null;
  let isArchiveBusy = false;
  let isImportBusy = false;
  let isVoteBusy = false;
  let isCommentSubmitting = false;
  let isLoadingMoreComments = false;
  let statusVariant: "accent" | "neutral" | "success" | "danger" = "accent";
  let commentsSentinel: HTMLDivElement | null = null;
  let commentsObserver: IntersectionObserver | null = null;

  function getSelectValue(event: Event): string {
    const target = event.currentTarget;
    return target instanceof HTMLSelectElement ? target.value : "";
  }

  function getTextareaValue(event: Event): string {
    const target = event.currentTarget;
    return target instanceof HTMLTextAreaElement ? target.value : "";
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
    label: list.name
  }));

  $: hasMoreComments = comments.length < commentsMeta.total;

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
        error instanceof Error ? error.message : $dictionary.recipes.detail.actionFailed;
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
        error instanceof Error ? error.message : $dictionary.recipes.detail.actionFailed;
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
            : await setRecipeVote(recipe.id, { value: nextVote })
      };
    } catch (error) {
      actionError =
        error instanceof Error ? error.message : $dictionary.recipes.detail.voteFailed;
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
        offset: comments.length
      });

      comments = [...comments, ...nextPage.items];
      commentsMeta = nextPage.meta;
    } catch (error) {
      commentError =
        error instanceof Error ? error.message : $dictionary.recipes.detail.commentsLoadFailed;
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
        rootMargin: "320px 0px"
      }
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

  async function handleCreateComment() {
    if (!data.session.isAuthenticated || isCommentSubmitting || !commentDraft.trim()) {
      return;
    }

    isCommentSubmitting = true;
    commentFeedback = "";
    commentError = "";

    try {
      const createdComment = await createRecipeComment(recipe.id, {
        body: commentDraft.trim()
      });

      comments = [createdComment, ...comments];
      commentsMeta = {
        ...commentsMeta,
        total: commentsMeta.total + 1
      };
      commentDraft = "";
      commentFeedback = $dictionary.recipes.detail.commentCreated;
    } catch (error) {
      commentError =
        error instanceof Error ? error.message : $dictionary.recipes.detail.commentCreateFailed;
    } finally {
      isCommentSubmitting = false;
    }
  }

  function startEditingComment(comment: RecipeComment) {
    editingCommentId = comment.id;
    editingCommentBody = comment.body;
    commentFeedback = "";
    commentError = "";
  }

  function cancelEditingComment() {
    editingCommentId = null;
    editingCommentBody = "";
  }

  async function handleSaveComment(commentId: string) {
    if (!editingCommentBody.trim() || savingCommentId) {
      return;
    }

    savingCommentId = commentId;
    commentFeedback = "";
    commentError = "";

    try {
      const updatedComment = await updateRecipeComment(recipe.id, commentId, {
        body: editingCommentBody.trim()
      });

      comments = comments.map((comment) =>
        comment.id === commentId ? updatedComment : comment
      );
      editingCommentId = null;
      editingCommentBody = "";
      commentFeedback = $dictionary.recipes.detail.commentUpdated;
    } catch (error) {
      commentError =
        error instanceof Error ? error.message : $dictionary.recipes.detail.commentUpdateFailed;
    } finally {
      savingCommentId = null;
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (deletingCommentId) {
      return;
    }

    deletingCommentId = commentId;
    commentFeedback = "";
    commentError = "";

    try {
      await deleteRecipeComment(recipe.id, commentId);
      comments = comments.filter((comment) => comment.id !== commentId);
      commentsMeta = {
        ...commentsMeta,
        total: Math.max(0, commentsMeta.total - 1)
      };
      if (editingCommentId === commentId) {
        cancelEditingComment();
      }
      commentFeedback = $dictionary.recipes.detail.commentDeleted;
    } catch (error) {
      commentError =
        error instanceof Error ? error.message : $dictionary.recipes.detail.commentDeleteFailed;
    } finally {
      deletingCommentId = null;
    }
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
        <Button href={`/recipes/${recipe.id}/edit`}>{$dictionary.recipes.detail.editRecipe}</Button>
        <Button variant="secondary" on:click={handleArchiveToggle} disabled={isArchiveBusy}>
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
        date: formatDate(recipe.updatedAt)
      })}
    >
      <div class={styles.headerMeta}>
        <Button href="#recipe-comments" variant="secondary" size="sm">
          {$dictionary.recipes.detail.jumpToComments}
        </Button>
        <Badge variant={statusVariant}>{formatRecipeStatus(recipe.status)}</Badge>
      </div>
    </SectionHeader>

    <div class={styles.infoGrid}>
      <div class={styles.infoCard}>
        <span class={styles.infoLabel}>{$dictionary.recipes.detail.category}</span>
        <span class={styles.infoValue}>{recipe.category ?? $dictionary.recipes.detail.uncategorized}</span>
      </div>
      <div class={styles.infoCard}>
        <span class={styles.infoLabel}>{$dictionary.recipes.detail.servings}</span>
        <span class={styles.infoValue}>{recipe.servings}</span>
      </div>
      <div class={styles.infoCard}>
        <span class={styles.infoLabel}>{$dictionary.recipes.detail.prep}</span>
        <span class={styles.infoValue}>{formatMinutes(recipe.prepMinutes)}</span>
      </div>
      <div class={styles.infoCard}>
        <span class={styles.infoLabel}>{$dictionary.recipes.detail.cook}</span>
        <span class={styles.infoValue}>{formatMinutes(recipe.cookMinutes)}</span>
      </div>
      <div class={styles.infoCard}>
        <span class={styles.infoLabel}>{$dictionary.recipes.detail.total}</span>
        <span class={styles.infoValue}>{formatMinutes(recipe.totalMinutes)}</span>
      </div>
    </div>

    <div class={styles.socialSummary}>
      <div class={styles.votePanel}>
        <button
          class={`${styles.voteButton} ${recipe.vote.currentUserVote === "up" ? styles.voteButtonActive : ""}`}
          type="button"
          on:click={() => handleVote("up")}
          disabled={!data.session.isAuthenticated || isVoteBusy}
        >
          +1
        </button>
        <div class={styles.voteStats}>
          <span class={styles.voteLabel}>{$dictionary.recipes.detail.recipeScore}</span>
          <strong class={styles.voteScore}>{recipe.vote.score}</strong>
          <span class={styles.voteMeta}>
            {formatMessage($dictionary.recipes.detail.likes, { count: recipe.vote.upvoteCount })}
            ·
            {formatMessage($dictionary.recipes.detail.dislikes, { count: recipe.vote.downvoteCount })}
          </span>
        </div>
        <button
          class={`${styles.voteButton} ${recipe.vote.currentUserVote === "down" ? styles.voteButtonDanger : ""}`}
          type="button"
          on:click={() => handleVote("down")}
          disabled={!data.session.isAuthenticated || isVoteBusy}
        >
          -1
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
      <p class={styles.copy}>{recipe.notes ?? $dictionary.recipes.detail.noNotes}</p>

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
        <Button on:click={handleImport} disabled={!selectedListId || isImportBusy}>
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
        subtitle={formatMessage($dictionary.recipes.detail.ingredientsSubtitle, {
          count: recipe.ingredients.length
        })}
      />
      <ul class={styles.list}>
        {#each recipe.ingredients as ingredient}
          <li class={styles.listItem}>
            {ingredient.amount ? `${ingredient.amount} ` : ""}{ingredient.unit ? `${ingredient.unit} ` : ""}{ingredient.name}
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
          count: recipe.steps.length
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
        subtitle={formatMessage($dictionary.recipes.detail.commentsSubtitle, {
          count: commentsMeta.total
        })}
      />

      {#if data.session.isAuthenticated}
        <div class={styles.commentComposer}>
          <Field label={$dictionary.recipes.detail.commentFieldLabel}>
            <Textarea
              value={commentDraft}
              placeholder={$dictionary.recipes.detail.commentPlaceholder}
              rows={5}
              disabled={isCommentSubmitting}
              on:input={(event) => (commentDraft = getTextareaValue(event))}
            />
          </Field>

          <div class={styles.commentComposerActions}>
            <Button
              on:click={handleCreateComment}
              disabled={isCommentSubmitting || !commentDraft.trim()}
            >
              {#if isCommentSubmitting}
                {$dictionary.recipes.detail.commentSubmitting}
              {:else}
                {$dictionary.recipes.detail.commentSubmit}
              {/if}
            </Button>
          </div>
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
          {#each comments as comment}
            <article class={styles.commentCard}>
              <div class={styles.commentRail}></div>
              <div class={styles.commentBody}>
                <div class={styles.commentHeader}>
                  <div class={styles.commentAuthorBlock}>
                    <strong>{comment.author.name}</strong>
                    <span class={styles.commentMeta}>
                      {formatDate(comment.createdAt)}
                      {#if comment.isEdited}
                        · {$dictionary.recipes.detail.commentEdited}
                      {/if}
                    </span>
                  </div>

                  {#if comment.canEdit || comment.canDelete}
                    <div class={styles.commentActions}>
                      {#if comment.canEdit}
                        <Button
                          variant="ghost"
                          size="sm"
                          on:click={() => startEditingComment(comment)}
                          disabled={Boolean(savingCommentId) || Boolean(deletingCommentId)}
                        >
                          {$dictionary.common.edit}
                        </Button>
                      {/if}

                      {#if comment.canDelete}
                        <Button
                          variant="ghost"
                          size="sm"
                          on:click={() => handleDeleteComment(comment.id)}
                          disabled={Boolean(savingCommentId) || Boolean(deletingCommentId)}
                        >
                          {#if deletingCommentId === comment.id}
                            {$dictionary.recipes.detail.commentDeleting}
                          {:else}
                            {$dictionary.common.remove}
                          {/if}
                        </Button>
                      {/if}
                    </div>
                  {/if}
                </div>

                {#if editingCommentId === comment.id}
                  <div class={styles.commentEditor}>
                    <Textarea
                      value={editingCommentBody}
                      rows={5}
                      disabled={savingCommentId === comment.id}
                      on:input={(event) => (editingCommentBody = getTextareaValue(event))}
                    />
                    <div class={styles.commentEditorActions}>
                      <Button
                        size="sm"
                        on:click={() => handleSaveComment(comment.id)}
                        disabled={savingCommentId === comment.id || !editingCommentBody.trim()}
                      >
                        {#if savingCommentId === comment.id}
                          {$dictionary.recipes.detail.commentSaving}
                        {:else}
                          {$dictionary.common.save}
                        {/if}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        on:click={cancelEditingComment}
                        disabled={savingCommentId === comment.id}
                      >
                        {$dictionary.common.cancel}
                      </Button>
                    </div>
                  </div>
                {:else}
                  <p class={styles.commentText}>{comment.body}</p>
                {/if}
              </div>
            </article>
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
        <p class={styles.commentEmpty}>{$dictionary.recipes.detail.noComments}</p>
      {/if}
    </div>
  </Card>
</div>
