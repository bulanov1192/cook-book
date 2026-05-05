<script lang="ts">
  import CommentComposer from "$components/recipes/CommentComposer/index.svelte";
  import type { RecipeComment, SessionResponse } from "$lib/api/types";
  import { dictionary, formatMessage } from "$lib/i18n";
  import { formatDate } from "$utils/format";
  import { ChevronDown, Pencil, Reply, Trash2 } from "lucide-svelte";
  import styles from "./index.module.scss";

  export let comment: RecipeComment;
  export let session: SessionResponse;
  export let onCreateReply: (
    parentCommentId: string,
    body: string,
  ) => Promise<void>;
  export let onUpdateComment: (
    commentId: string,
    body: string,
  ) => Promise<void>;
  export let onDeleteComment: (commentId: string) => Promise<void>;
  export let onLoadMoreReplies: (
    commentId: string,
    offset: number,
  ) => Promise<number>;

  let isReplying = false;
  let replyDraft = "";
  let replyError = "";
  let isSubmittingReply = false;

  let isEditing = false;
  let editDraft = comment.body ?? "";
  let editError = "";
  let isSavingEdit = false;

  let isDeleting = false;
  let deleteError = "";

  let isLoadingReplies = false;
  let repliesError = "";
  let serverLoadedRepliesCount = comment.loadedReplyCount;

  $: if (comment.loadedReplyCount > serverLoadedRepliesCount) {
    serverLoadedRepliesCount = comment.loadedReplyCount;
  }

  $: visualDepth = Math.min(comment.depth, 5);
  $: commentOpacity =
    comment.score < 0 ? Math.max(0.05, 1 - Math.abs(comment.score) * 0.01) : 1;
  $: hasMoreReplies = comment.replyCount > comment.previewReplies.length;

  function toggleReplyComposer() {
    isReplying = !isReplying;
    replyError = "";
  }

  function startEditing() {
    editDraft = comment.body ?? "";
    editError = "";
    isEditing = true;
  }

  function cancelEditing() {
    isEditing = false;
    editDraft = comment.body ?? "";
    editError = "";
  }

  async function handleReplySubmit() {
    if (isSubmittingReply || !replyDraft.trim()) {
      return;
    }

    isSubmittingReply = true;
    replyError = "";

    try {
      await onCreateReply(comment.id, replyDraft.trim());
      replyDraft = "";
      isReplying = false;
    } catch (error) {
      replyError =
        error instanceof Error
          ? error.message
          : $dictionary.recipes.detail.commentCreateFailed;
    } finally {
      isSubmittingReply = false;
    }
  }

  async function handleEditSubmit() {
    if (isSavingEdit || !editDraft.trim()) {
      return;
    }

    isSavingEdit = true;
    editError = "";

    try {
      await onUpdateComment(comment.id, editDraft.trim());
      isEditing = false;
    } catch (error) {
      editError =
        error instanceof Error
          ? error.message
          : $dictionary.recipes.detail.commentUpdateFailed;
    } finally {
      isSavingEdit = false;
    }
  }

  async function handleDelete() {
    if (isDeleting) {
      return;
    }

    isDeleting = true;
    deleteError = "";

    try {
      await onDeleteComment(comment.id);
      isEditing = false;
      isReplying = false;
    } catch (error) {
      deleteError =
        error instanceof Error
          ? error.message
          : $dictionary.recipes.detail.commentDeleteFailed;
    } finally {
      isDeleting = false;
    }
  }

  async function handleLoadMoreReplies() {
    if (isLoadingReplies || !hasMoreReplies) {
      return;
    }

    isLoadingReplies = true;
    repliesError = "";

    try {
      const addedCount = await onLoadMoreReplies(
        comment.id,
        serverLoadedRepliesCount,
      );
      serverLoadedRepliesCount += addedCount;
    } catch (error) {
      repliesError =
        error instanceof Error
          ? error.message
          : $dictionary.recipes.detail.commentsLoadFailed;
    } finally {
      isLoadingReplies = false;
    }
  }
</script>

<article
  class={`${styles.commentCard} ${comment.isDeleted ? styles.commentDeleted : ""}`}
  style={`--thread-depth:${visualDepth}; --comment-opacity:${commentOpacity};`}
>
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
          {#if comment.score !== 0}
            · {comment.score > 0 ? `+${comment.score}` : comment.score}
          {/if}
        </span>
      </div>
    </div>

    {#if isEditing}
      <div class={styles.commentEditor}>
        <CommentComposer
          bind:value={editDraft}
          rows={2}
          compact={true}
          placeholder={$dictionary.recipes.detail.commentPlaceholder}
          submitLabel={$dictionary.common.save}
          submitBusyLabel={$dictionary.recipes.detail.commentSaving}
          submitAriaLabel={$dictionary.common.save}
          submitDisabled={!editDraft.trim()}
          isBusy={isSavingEdit}
          iconOnlySubmit={true}
          showCancel={true}
          cancelLabel={$dictionary.common.cancel}
          on:submit={handleEditSubmit}
          on:cancel={cancelEditing}
        />

        {#if editError}
          <p class={styles.errorMessage}>{editError}</p>
        {/if}
      </div>
    {:else}
      <p class={styles.commentText}>
        {comment.body ?? $dictionary.recipes.detail.deletedComment}
      </p>
    {/if}

    {#if deleteError}
      <p class={styles.errorMessage}>{deleteError}</p>
    {/if}

    <div class={styles.commentActions}>
      {#if session.isAuthenticated && !comment.isDeleted}
        <button
          class={styles.iconAction}
          type="button"
          title={$dictionary.recipes.detail.replyAction}
          aria-label={$dictionary.recipes.detail.replyAction}
          disabled={isSubmittingReply || isSavingEdit || isDeleting}
          on:click={toggleReplyComposer}
        >
          <Reply size={16} />
        </button>
      {/if}

      {#if comment.canEdit}
        <button
          class={styles.iconAction}
          type="button"
          title={$dictionary.common.edit}
          aria-label={$dictionary.common.edit}
          disabled={isSubmittingReply || isSavingEdit || isDeleting}
          on:click={startEditing}
        >
          <Pencil size={16} />
        </button>
      {/if}

      {#if comment.canDelete}
        <button
          class={`${styles.iconAction} ${styles.iconActionDanger}`}
          type="button"
          title={$dictionary.common.remove}
          aria-label={$dictionary.common.remove}
          disabled={isSubmittingReply || isSavingEdit || isDeleting}
          on:click={handleDelete}
        >
          <Trash2 size={16} />
        </button>
      {/if}
    </div>

    {#if isReplying}
      <div class={styles.replyComposer}>
        <CommentComposer
          bind:value={replyDraft}
          rows={2}
          compact={true}
          placeholder={$dictionary.recipes.detail.replyPlaceholder}
          submitLabel={$dictionary.recipes.detail.replyAction}
          submitBusyLabel={$dictionary.recipes.detail.replySubmitting}
          submitAriaLabel={$dictionary.recipes.detail.replyAction}
          submitDisabled={!replyDraft.trim()}
          isBusy={isSubmittingReply}
          iconOnlySubmit={true}
          showCancel={true}
          cancelLabel={$dictionary.common.cancel}
          on:submit={handleReplySubmit}
          on:cancel={toggleReplyComposer}
        />

        {#if replyError}
          <p class={styles.errorMessage}>{replyError}</p>
        {/if}
      </div>
    {/if}

    {#if comment.previewReplies.length}
      <div class={styles.replyList}>
        {#each comment.previewReplies as reply (reply.id)}
          <svelte:self
            comment={reply}
            {session}
            {onCreateReply}
            {onUpdateComment}
            {onDeleteComment}
            {onLoadMoreReplies}
          />
        {/each}
      </div>
    {/if}

    {#if comment.replyCount > 0}
      <div class={styles.replyMeta}>
        {#if hasMoreReplies}
          <button
            class={styles.loadRepliesButton}
            type="button"
            disabled={isLoadingReplies}
            on:click={handleLoadMoreReplies}
          >
            <ChevronDown size={15} />
            {#if comment.previewReplies.length === 0}
              {formatMessage($dictionary.recipes.detail.loadReplies, {
                count: comment.replyCount,
              })}
            {:else if isLoadingReplies}
              {$dictionary.recipes.detail.repliesLoading}
            {:else}
              {$dictionary.recipes.detail.loadMoreReplies}
            {/if}
          </button>
        {/if}

        {#if repliesError}
          <p class={styles.errorMessage}>{repliesError}</p>
        {/if}
      </div>
    {/if}
  </div>
</article>
