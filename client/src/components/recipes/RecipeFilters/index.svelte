<script lang="ts">
  import Button from "$components/ui/Button/index.svelte";
  import Card from "$components/ui/Card/index.svelte";
  import Field from "$components/ui/Field/index.svelte";
  import Input from "$components/ui/Input/index.svelte";
  import Select from "$components/ui/Select/index.svelte";
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

  const statusOptions = [
    { value: "", label: "All statuses" },
    { value: "draft", label: "Draft" },
    { value: "published", label: "Published" },
    { value: "archived", label: "Archived" }
  ];

  const sortOptions = [
    { value: "updatedAt", label: "Recently updated" },
    { value: "createdAt", label: "Recently created" },
    { value: "title", label: "Title" },
    { value: "totalMinutes", label: "Total time" }
  ];

  const orderOptions = [
    { value: "desc", label: "Descending" },
    { value: "asc", label: "Ascending" }
  ];

  $: categoryOptions = [{ value: "", label: "All categories" }, ...categories.map((category) => ({ value: category, label: category }))];
  $: tagOptions = [{ value: "", label: "All tags" }, ...tags.map((tag) => ({ value: tag, label: tag }))];
</script>

<Card>
  <form class={styles.form} method="GET">
    <div class={styles.grid}>
      <Field label="Search">
        <Input name="q" value={values.q} placeholder="Search titles, tags, ingredients..." />
      </Field>

      <Field label="Category">
        <Select name="category" value={values.category} options={categoryOptions} />
      </Field>

      <Field label="Status">
        <Select name="status" value={values.status} options={statusOptions} />
      </Field>

      <Field label="Tag">
        <Select name="tag" value={values.tag} options={tagOptions} />
      </Field>

      <Field label="Sort by">
        <Select name="sort" value={values.sort} options={sortOptions} />
      </Field>

      <Field label="Order">
        <Select name="order" value={values.order} options={orderOptions} />
      </Field>
    </div>

    <div class={styles.actions}>
      <Button type="submit">Apply filters</Button>
      <Button href="/recipes" variant="secondary">Clear</Button>
    </div>
  </form>
</Card>
