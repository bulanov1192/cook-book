<script lang="ts">
  import Button from "$components/ui/Button/index.svelte";
  import Card from "$components/ui/Card/index.svelte";
  import Checkbox from "$components/ui/Checkbox/index.svelte";
  import Field from "$components/ui/Field/index.svelte";
  import Input from "$components/ui/Input/index.svelte";
  import { dictionary, formatMessage } from "$lib/i18n";
  import type { IngredientDraft } from "../RecipeForm/form";
  import { createEmptyIngredient } from "../RecipeForm/form";
  import styles from "./index.module.scss";

  export let ingredients: IngredientDraft[] = [];
  export let onChange: (nextValue: IngredientDraft[]) => void = () => {};

  function getInputValue(event: Event): string {
    const target = event.currentTarget;
    return target instanceof HTMLInputElement ? target.value : "";
  }

  function getCheckedValue(event: Event): boolean {
    const target = event.currentTarget;
    return target instanceof HTMLInputElement ? target.checked : false;
  }

  function updateIngredient(index: number, patch: Partial<IngredientDraft>) {
    const nextValue = ingredients.map((ingredient, ingredientIndex) =>
      ingredientIndex === index ? { ...ingredient, ...patch } : ingredient,
    );

    onChange(nextValue);
  }

  function addIngredient() {
    onChange([...ingredients, createEmptyIngredient()]);
  }

  function removeIngredient(index: number) {
    onChange(
      ingredients.filter(
        (_ingredient, ingredientIndex) => ingredientIndex !== index,
      ),
    );
  }
</script>

<div class={styles.stack}>
  {#each ingredients as ingredient, index}
    <Card transparent padding="md">
      <div class={styles.card}>
        <div class={styles.header}>
          <h3 class={styles.title}>
            {formatMessage($dictionary.recipes.ingredientsEditor.itemTitle, {
              index: index + 1,
            })}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            on:click={() => removeIngredient(index)}
            disabled={ingredients.length === 1}
          >
            {$dictionary.common.remove}
          </Button>
        </div>

        <div class={styles.grid}>
          <Field label={$dictionary.recipes.ingredientsEditor.name}>
            <Input
              value={ingredient.name}
              placeholder={$dictionary.recipes.ingredientsEditor
                .namePlaceholder}
              on:input={(event) =>
                updateIngredient(index, { name: getInputValue(event) })}
            />
          </Field>

          <Field
            label={$dictionary.recipes.ingredientsEditor.amount}
            optional={true}
          >
            <Input
              type="number"
              min={0}
              step="0.1"
              value={ingredient.amount}
              placeholder={$dictionary.recipes.ingredientsEditor
                .amountPlaceholder}
              on:input={(event) =>
                updateIngredient(index, { amount: getInputValue(event) })}
            />
          </Field>

          <Field
            label={$dictionary.recipes.ingredientsEditor.unit}
            optional={true}
          >
            <Input
              value={ingredient.unit}
              placeholder={$dictionary.recipes.ingredientsEditor
                .unitPlaceholder}
              on:input={(event) =>
                updateIngredient(index, { unit: getInputValue(event) })}
            />
          </Field>

          <Field
            label={$dictionary.recipes.ingredientsEditor.prepNote}
            optional={true}
          >
            <Input
              value={ingredient.preparationNote}
              placeholder={$dictionary.recipes.ingredientsEditor
                .prepPlaceholder}
              on:input={(event) =>
                updateIngredient(index, {
                  preparationNote: getInputValue(event),
                })}
            />
          </Field>
        </div>

        <Checkbox
          checked={ingredient.optional}
          label={$dictionary.recipes.ingredientsEditor.optional}
          on:change={(event) =>
            updateIngredient(index, { optional: getCheckedValue(event) })}
        />
      </div>
    </Card>
  {/each}

  <Button variant="secondary" on:click={addIngredient}>
    {$dictionary.recipes.ingredientsEditor.add}
  </Button>
</div>
