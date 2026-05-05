<script lang="ts">
  import Button from "$components/ui/Button/index.svelte";
  import Card from "$components/ui/Card/index.svelte";
  import Field from "$components/ui/Field/index.svelte";
  import Input from "$components/ui/Input/index.svelte";
  import Select from "$components/ui/Select/index.svelte";
  import Textarea from "$components/ui/Textarea/index.svelte";
  import type { Recipe, RecipePayload, RecipeStatus } from "$lib/api/types";
  import { dictionary } from "$lib/i18n";
  import IngredientEditor from "../IngredientEditor/index.svelte";
  import StepEditor from "../StepEditor/index.svelte";
  import { createRecipeFormState, toRecipePayload, type RecipeFormState } from "./form";
  import styles from "./index.module.scss";

  export let initialRecipe: Recipe | undefined = undefined;
  export let submitLabel = "";
  export let cancelHref = "/recipes";
  export let onSubmit: (payload: RecipePayload) => Promise<void>;

  let state: RecipeFormState = createRecipeFormState(initialRecipe);
  let isSubmitting = false;
  let formError = "";

  $: resolvedSubmitLabel = submitLabel || $dictionary.recipes.form.saveRecipe;
  $: statusOptions = [
    { value: "draft", label: $dictionary.recipes.status.draft },
    { value: "published", label: $dictionary.recipes.status.published },
    { value: "private", label: $dictionary.recipes.status.private },
    { value: "archived", label: $dictionary.recipes.status.archived }
  ];

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
      formError = error instanceof Error ? error.message : $dictionary.recipes.form.couldNotSave;
    } finally {
      isSubmitting = false;
    }
  }
</script>

<form class={styles.form} on:submit|preventDefault={handleSubmit}>
  <Card>
    <div class={styles.section}>
      <h2 class={styles.sectionTitle}>{$dictionary.recipes.form.coreDetails}</h2>

      <div class={styles.grid}>
        <Field label={$dictionary.recipes.form.recipeTitle}>
          <Input
            value={state.title}
            placeholder={$dictionary.recipes.form.recipeTitlePlaceholder}
            required={true}
            on:input={(event) => (state.title = getInputValue(event))}
          />
        </Field>

        <Field label={$dictionary.recipes.form.category} optional={true}>
          <Input
            value={state.category}
            placeholder={$dictionary.recipes.form.categoryPlaceholder}
            on:input={(event) => (state.category = getInputValue(event))}
          />
        </Field>

        <Field label={$dictionary.recipes.form.servings}>
          <Input
            type="number"
            min={1}
            max={100}
            value={state.servings}
            required={true}
            on:input={(event) => (state.servings = Number(getInputValue(event)) || 1)}
          />
        </Field>

        <Field label={$dictionary.recipes.form.status}>
          <Select
            value={state.status}
            options={statusOptions}
            on:change={(event) => (state.status = getSelectValue(event) as RecipeStatus)}
          />
        </Field>
      </div>

      <div class={styles.grid}>
        <Field label={$dictionary.recipes.form.prepMinutes} optional={true}>
          <Input
            type="number"
            min={0}
            value={state.prepMinutes}
            placeholder="15"
            on:input={(event) => (state.prepMinutes = getInputValue(event))}
          />
        </Field>

        <Field label={$dictionary.recipes.form.cookMinutes} optional={true}>
          <Input
            type="number"
            min={0}
            value={state.cookMinutes}
            placeholder="30"
            on:input={(event) => (state.cookMinutes = getInputValue(event))}
          />
        </Field>

        <Field label={$dictionary.recipes.form.totalMinutes} optional={true}>
          <Input
            type="number"
            min={0}
            value={state.totalMinutes}
            placeholder="45"
            on:input={(event) => (state.totalMinutes = getInputValue(event))}
          />
        </Field>

        <Field
          label={$dictionary.recipes.form.tags}
          optional={true}
          hint={$dictionary.recipes.form.tagsHint}
        >
          <Input
            value={state.tags}
            placeholder={$dictionary.recipes.form.tagsPlaceholder}
            on:input={(event) => (state.tags = getInputValue(event))}
          />
        </Field>
      </div>

      <Field label={$dictionary.recipes.form.description} optional={true}>
        <Textarea
          value={state.description}
          rows={4}
          placeholder={$dictionary.recipes.form.descriptionPlaceholder}
          on:input={(event) => (state.description = getTextareaValue(event))}
        />
      </Field>

      <Field label={$dictionary.recipes.form.notes} optional={true}>
        <Textarea
          value={state.notes}
          rows={4}
          placeholder={$dictionary.recipes.form.notesPlaceholder}
          on:input={(event) => (state.notes = getTextareaValue(event))}
        />
      </Field>
    </div>
  </Card>

  <Card>
    <div class={styles.section}>
      <h2 class={styles.sectionTitle}>{$dictionary.recipes.form.ingredients}</h2>
      <IngredientEditor ingredients={state.ingredients} onChange={(value) => (state.ingredients = value)} />
    </div>
  </Card>

  <Card>
    <div class={styles.section}>
      <h2 class={styles.sectionTitle}>{$dictionary.recipes.form.method}</h2>
      <StepEditor steps={state.steps} onChange={(value) => (state.steps = value)} />
    </div>
  </Card>

  {#if formError}
    <div class={styles.error}>{formError}</div>
  {/if}

  <div class={styles.actions}>
    <Button type="submit" size="lg" disabled={isSubmitting}>
      {isSubmitting ? $dictionary.recipes.form.saving : resolvedSubmitLabel}
    </Button>
    <Button href={cancelHref} variant="secondary" size="lg">{$dictionary.common.cancel}</Button>
  </div>
</form>
