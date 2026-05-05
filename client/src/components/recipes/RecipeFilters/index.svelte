<script lang="ts">
  import Button from "$components/ui/Button/index.svelte";
  import Card from "$components/ui/Card/index.svelte";
  import Field from "$components/ui/Field/index.svelte";
  import Input from "$components/ui/Input/index.svelte";
  import Select from "$components/ui/Select/index.svelte";
  import { dictionary } from "$lib/i18n";
  import styles from "./index.module.scss";

  export let values: {
    q: string;
    category: string;
    status: string;
    tag: string;
    sort: string;
    order: string;
  };

  export let categories: string[] = [];
  export let tags: string[] = [];

  $: statusOptions = [
    { value: "", label: $dictionary.recipes.filters.allStatuses },
    { value: "draft", label: $dictionary.recipes.status.draft },
    { value: "published", label: $dictionary.recipes.status.published },
    { value: "private", label: $dictionary.recipes.status.private },
    { value: "archived", label: $dictionary.recipes.status.archived }
  ];

  $: sortOptions = [
    { value: "updatedAt", label: $dictionary.recipes.filters.recentlyUpdated },
    { value: "createdAt", label: $dictionary.recipes.filters.recentlyCreated },
    { value: "hotness", label: $dictionary.recipes.filters.hotness },
    { value: "score", label: $dictionary.recipes.filters.score },
    { value: "title", label: $dictionary.recipes.filters.title },
    { value: "totalMinutes", label: $dictionary.recipes.filters.totalTime }
  ];

  $: orderOptions = [
    { value: "desc", label: $dictionary.recipes.filters.descending },
    { value: "asc", label: $dictionary.recipes.filters.ascending }
  ];

  $: categoryOptions = [
    { value: "", label: $dictionary.recipes.filters.allCategories },
    ...categories.map((category) => ({ value: category, label: category }))
  ];
  $: tagOptions = [
    { value: "", label: $dictionary.recipes.filters.allTags },
    ...tags.map((tag) => ({ value: tag, label: tag }))
  ];
</script>

<Card>
  <form class={styles.form} method="GET">
    <div class={styles.grid}>
      <Field label={$dictionary.recipes.filters.search}>
        <Input
          name="q"
          value={values.q}
          placeholder={$dictionary.recipes.filters.searchPlaceholder}
        />
      </Field>

      <Field label={$dictionary.recipes.filters.category}>
        <Select name="category" value={values.category} options={categoryOptions} />
      </Field>

      <Field label={$dictionary.recipes.filters.status}>
        <Select name="status" value={values.status} options={statusOptions} />
      </Field>

      <Field label={$dictionary.recipes.filters.tag}>
        <Select name="tag" value={values.tag} options={tagOptions} />
      </Field>

      <Field label={$dictionary.recipes.filters.sortBy}>
        <Select name="sort" value={values.sort} options={sortOptions} />
      </Field>

      <Field label={$dictionary.recipes.filters.order}>
        <Select name="order" value={values.order} options={orderOptions} />
      </Field>
    </div>

    <div class={styles.actions}>
      <Button type="submit">{$dictionary.recipes.filters.apply}</Button>
      <Button href="/recipes" variant="secondary">{$dictionary.common.clear}</Button>
    </div>
  </form>
</Card>
