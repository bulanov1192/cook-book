<script lang="ts">
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
  import { createShoppingList } from "$lib/api/shopping-lists";
  import type { ShoppingListSummary, ShoppingListVisibility } from "$lib/api/types";
  import styles from "./+page.module.scss";

  export let data: {
    session: import("$lib/api/types").SessionResponse;
    lists: import("$lib/api/types").ShoppingListListResponse;
  };

  let lists: ShoppingListSummary[] = data.lists.items;
  let listName = "";
  let visibility: ShoppingListVisibility = "private";
  let isSubmitting = false;
  let errorMessage = "";

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
      errorMessage = "Give the shopping list a name first.";
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
      listName = "";
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Could not create the shopping list.";
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class={styles.page}>
  <PageIntro
    eyebrow="Shopping lists"
    title="Turn recipe ingredients into practical kitchen lists."
    description={data.session.isAuthenticated
      ? "Keep shopping lightweight. Create lists as needed, import from recipes, and mark items off without adding more complexity than the task deserves."
      : "Shared public lists can still be opened by link, but your own planning workspace starts after sign in."}
  />

  {#if data.session.isAuthenticated}
    <Card>
      <div class={styles.createForm}>
        <SectionHeader title="Create a new list" subtitle="Useful for weekly shopping, dinner prep, party planning or ingredient restocks." />

        <form class={styles.createGrid} on:submit|preventDefault={handleCreate}>
          <Field label="List name">
            <Input value={listName} placeholder="Weekly produce run" on:input={(event) => (listName = getInputValue(event))} />
          </Field>
          <Field label="Visibility">
            <Select
              value={visibility}
              options={[
                { value: "private", label: "Private" },
                { value: "public", label: "Public" }
              ]}
              on:change={(event) => (visibility = getSelectValue(event) as ShoppingListVisibility)}
            />
          </Field>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create list"}
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
      <SectionHeader title={`Lists: ${lists.length}`} subtitle="Each list remains a focused workspace instead of a giant pile of ingredients." />

      {#if lists.length}
        <div class={styles.listGrid}>
          {#each lists as list}
            <ShoppingListCard {list} />
          {/each}
        </div>
      {:else}
        <EmptyState
          title="No shopping lists yet"
          description="Create one list and the rest of the flow becomes immediately clearer when you import ingredients from recipes."
        >
          <Button on:click={handleCreate} disabled={isSubmitting || !listName.trim()}>
            Quick create
          </Button>
        </EmptyState>
      {/if}
    {:else}
      <AuthPanel
        title="Sign in to manage shopping lists"
        description="Public shared lists remain accessible by direct link, but creating and editing lists belongs to signed-in users."
      />
    {/if}
  </section>
</div>
