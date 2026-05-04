<script lang="ts">
  import Button from "$components/ui/Button/index.svelte";
  import Card from "$components/ui/Card/index.svelte";
  import Field from "$components/ui/Field/index.svelte";
  import Input from "$components/ui/Input/index.svelte";
  import Select from "$components/ui/Select/index.svelte";
  import Textarea from "$components/ui/Textarea/index.svelte";
  import type { Recipe, RecipePayload, RecipeStatus } from "$lib/api/types";
  import IngredientEditor from "../IngredientEditor/index.svelte";
  import StepEditor from "../StepEditor/index.svelte";
  import { createRecipeFormState, toRecipePayload, type RecipeFormState } from "./form";
  import styles from "./index.module.scss";

  export let initialRecipe: Recipe | undefined = undefined;
  export let submitLabel = "Save recipe";
  export let cancelHref = "/recipes";
  export let onSubmit: (payload: RecipePayload) => Promise<void>;

  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "published", label: "Published" },
    { value: "private", label: "Private" },
    { value: "archived", label: "Archived" }
  ];

  let state: RecipeFormState = createRecipeFormState(initialRecipe);
  let isSubmitting = false;
  let formError = "";

  function getInputValue(event: Event): string {
    const target = event.currentTarget;
    return target instanceof HTMLInputElement ? target.value : "";
  }

  function getSelectValue(event: Event): string {
    const target = event.currentTarget;
    return target instanceof HTMLSelectElement ? target.value : "";
  }

  function getTextareaValue(event: Event): string {
    const target = event.currentTarget;
    return target instanceof HTMLTextAreaElement ? target.value : "";
  }

  async function handleSubmit() {
    formError = "";
    isSubmitting = true;

    try {
      await onSubmit(toRecipePayload(state));
    } catch (error) {
      formError = error instanceof Error ? error.message : "Could not save recipe.";
    } finally {
      isSubmitting = false;
    }
  }
</script>

<form class={styles.form} on:submit|preventDefault={handleSubmit}>
  <Card>
    <div class={styles.section}>
      <h2 class={styles.sectionTitle}>Core details</h2>

      <div class={styles.grid}>
        <Field label="Recipe title">
          <Input value={state.title} placeholder="Tomato soup with basil" required={true} on:input={(event) => (state.title = getInputValue(event))} />
        </Field>

        <Field label="Category" optional={true}>
          <Input value={state.category} placeholder="Dinner" on:input={(event) => (state.category = getInputValue(event))} />
        </Field>

        <Field label="Servings">
          <Input type="number" min={1} max={100} value={state.servings} required={true} on:input={(event) => (state.servings = Number(getInputValue(event)) || 1)} />
        </Field>

        <Field label="Status">
          <Select value={state.status} options={statusOptions} on:change={(event) => (state.status = getSelectValue(event) as RecipeStatus)} />
        </Field>
      </div>

      <div class={styles.grid}>
        <Field label="Prep minutes" optional={true}>
          <Input type="number" min={0} value={state.prepMinutes} placeholder="15" on:input={(event) => (state.prepMinutes = getInputValue(event))} />
        </Field>

        <Field label="Cook minutes" optional={true}>
          <Input type="number" min={0} value={state.cookMinutes} placeholder="30" on:input={(event) => (state.cookMinutes = getInputValue(event))} />
        </Field>

        <Field label="Total minutes" optional={true}>
          <Input type="number" min={0} value={state.totalMinutes} placeholder="45" on:input={(event) => (state.totalMinutes = getInputValue(event))} />
        </Field>

        <Field label="Tags" optional={true} hint="Separate tags with commas.">
          <Input value={state.tags} placeholder="quick, dinner, vegetarian" on:input={(event) => (state.tags = getInputValue(event))} />
        </Field>
      </div>

      <Field label="Description" optional={true}>
        <Textarea value={state.description} rows={4} placeholder="A warm, fast dinner with pantry staples." on:input={(event) => (state.description = getTextareaValue(event))} />
      </Field>

      <Field label="Notes" optional={true}>
        <Textarea value={state.notes} rows={4} placeholder="Any serving notes, substitutions or kitchen reminders." on:input={(event) => (state.notes = getTextareaValue(event))} />
      </Field>
    </div>
  </Card>

  <Card>
    <div class={styles.section}>
      <h2 class={styles.sectionTitle}>Ingredients</h2>
      <IngredientEditor ingredients={state.ingredients} onChange={(value) => (state.ingredients = value)} />
    </div>
  </Card>

  <Card>
    <div class={styles.section}>
      <h2 class={styles.sectionTitle}>Method</h2>
      <StepEditor steps={state.steps} onChange={(value) => (state.steps = value)} />
    </div>
  </Card>

  {#if formError}
    <div class={styles.error}>{formError}</div>
  {/if}

  <div class={styles.actions}>
    <Button type="submit" size="lg" disabled={isSubmitting}>
      {isSubmitting ? "Saving..." : submitLabel}
    </Button>
    <Button href={cancelHref} variant="secondary" size="lg">Cancel</Button>
  </div>
</form>
