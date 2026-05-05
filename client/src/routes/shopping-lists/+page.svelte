<script lang="ts">
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import AuthPanel from "$components/auth/AuthPanel/index.svelte";
  import PageIntro from "$components/layout/PageIntro/index.svelte";
  import ShoppingListCard from "$components/shopping-lists/ShoppingListCard/index.svelte";
  import Button from "$components/ui/Button/index.svelte";
  import Card from "$components/ui/Card/index.svelte";
  import EmptyState from "$components/ui/EmptyState/index.svelte";
  import Field from "$components/ui/Field/index.svelte";
  import Input from "$components/ui/Input/index.svelte";
  import Select from "$components/ui/Select/index.svelte";
  import SectionHeader from "$components/ui/SectionHeader/index.svelte";
  import { createShoppingList, listShoppingLists } from "$lib/api/shopping-lists";
  import { dictionary, formatMessage } from "$lib/i18n";
  import type { ShoppingListSummary, ShoppingListVisibility } from "$lib/api/types";
  import styles from "./+page.module.scss";

  export let data: {
    session: import("$lib/api/types").SessionResponse;
    lists: import("$lib/api/types").ShoppingListListResponse;
  };

  let lists: ShoppingListSummary[] = data.lists.items;
  let meta = data.lists.meta;
  let listName = "";
  let visibility: ShoppingListVisibility = "private";
  let isSubmitting = false;
  let isLoadingMore = false;
  let errorMessage = "";
  let loadMoreError = "";
  let sentinel: HTMLDivElement | null = null;
  let observer: IntersectionObserver | null = null;

  $: hasMore = lists.length < meta.total;

  function getInputValue(event: Event): string {
    const target = event.currentTarget;
    return target instanceof HTMLInputElement ? target.value : "";
  }

  function getSelectValue(event: Event): string {
    const target = event.currentTarget;
    return target instanceof HTMLSelectElement ? target.value : "";
  }

  async function handleCreate() {
    if (!listName.trim()) {
      errorMessage = $dictionary.shoppingLists.nameRequired;
      return;
    }

    errorMessage = "";
    isSubmitting = true;

    try {
      const created = await createShoppingList(listName.trim(), visibility);
      lists = [
        {
          id: created.id,
          name: created.name,
          ownerId: created.ownerId,
          status: created.status,
          visibility: created.visibility,
          isOwner: created.isOwner,
          canEdit: created.canEdit,
          isPublicReadable: created.isPublicReadable,
          itemCount: created.items.length,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt
        },
        ...lists
      ];
      meta = {
        ...meta,
        total: meta.total + 1
      };
      listName = "";
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : $dictionary.shoppingLists.createFailed;
    } finally {
      isSubmitting = false;
    }
  }

  async function loadMoreLists() {
    if (isLoadingMore || !hasMore) {
      return;
    }

    isLoadingMore = true;
    loadMoreError = "";

    try {
      const nextPage = await listShoppingLists(fetch, {
        limit: 50,
        offset: lists.length
      });

      lists = [...lists, ...nextPage.items];
      meta = nextPage.meta;
    } catch (error) {
      loadMoreError =
        error instanceof Error ? error.message : $dictionary.shoppingLists.loadMoreFailed;
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
          void loadMoreLists();
        }
      },
      {
        rootMargin: "320px 0px"
      }
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

<div class={styles.page}>
  <PageIntro
    eyebrow={$dictionary.shoppingLists.pageEyebrow}
    title={$dictionary.shoppingLists.pageTitle}
    description={data.session.isAuthenticated
      ? $dictionary.shoppingLists.pageDescriptionSignedIn
      : $dictionary.shoppingLists.pageDescriptionGuest}
  />

  {#if data.session.isAuthenticated}
    <Card>
      <div class={styles.createForm}>
        <SectionHeader title={$dictionary.shoppingLists.createTitle} subtitle={$dictionary.shoppingLists.createSubtitle} />
        

        <form class={styles.createGrid} on:submit|preventDefault={handleCreate}>
          <Field label={$dictionary.shoppingLists.listName}>
            <Input value={listName} placeholder={$dictionary.shoppingLists.listNamePlaceholder} on:input={(event) => (listName = getInputValue(event))} />
          </Field>
          <Field label={$dictionary.shoppingLists.visibility}>
            <Select
              value={visibility}
              options={[
                { value: "private", label: $dictionary.common.private },
                { value: "public", label: $dictionary.common.public }
              ]}
              on:change={(event) => (visibility = getSelectValue(event) as ShoppingListVisibility)}
            />
          </Field>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? $dictionary.shoppingLists.creating : $dictionary.shoppingLists.create}
          </Button>
        </form>

        {#if errorMessage}
          <p class={styles.error}>{errorMessage}</p>
        {/if}
      </div>
    </Card>
  {/if}

  <section class="page-grid">
    {#if data.session.isAuthenticated}
      <SectionHeader
        title={formatMessage($dictionary.shoppingLists.countTitle, { count: meta.total })}
        subtitle={$dictionary.shoppingLists.countSubtitle}
      />

      {#if lists.length}
        <div class={styles.listGrid}>
          {#each lists as list}
            <ShoppingListCard {list} />
          {/each}
        </div>

        {#if loadMoreError}
          <p class={styles.error}>{loadMoreError}</p>
        {/if}

        {#if hasMore}
          <div class={styles.loadState} bind:this={sentinel}>
            {#if isLoadingMore}
              {$dictionary.shoppingLists.loadingMore}
            {:else}
              {$dictionary.shoppingLists.loadingHint}
            {/if}
          </div>
        {/if}
      {:else}
        <EmptyState
          title={$dictionary.shoppingLists.noListsTitle}
          description={$dictionary.shoppingLists.noListsDescription}
        >
          <Button on:click={handleCreate} disabled={isSubmitting || !listName.trim()}>
            {$dictionary.shoppingLists.quickCreate}
          </Button>
        </EmptyState>
      {/if}
    {:else}
      <AuthPanel
        title={$dictionary.shoppingLists.signInTitle}
        description={$dictionary.shoppingLists.signInDescription}
      />
    {/if}
  </section>
</div>
