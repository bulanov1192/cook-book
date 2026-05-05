<script lang="ts">
  import Button from "$components/ui/Button/index.svelte";
  import Card from "$components/ui/Card/index.svelte";
  import Field from "$components/ui/Field/index.svelte";
  import Textarea from "$components/ui/Textarea/index.svelte";
  import { dictionary, formatMessage } from "$lib/i18n";
  import type { StepDraft } from "../RecipeForm/form";
  import { createEmptyStep } from "../RecipeForm/form";
  import styles from "./index.module.scss";

  export let steps: StepDraft[] = [];
  export let onChange: (nextValue: StepDraft[]) => void = () => {};

  function getTextareaValue(event: Event): string {
    const target = event.currentTarget;
    return target instanceof HTMLTextAreaElement ? target.value : "";
  }

  function updateStep(index: number, instruction: string) {
    onChange(
      steps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, instruction } : step,
      ),
    );
  }

  function addStep() {
    onChange([...steps, createEmptyStep()]);
  }

  function removeStep(index: number) {
    onChange(steps.filter((_step, stepIndex) => stepIndex !== index));
  }
</script>

<div class={styles.stack}>
  {#each steps as step, index}
    <Card transparent padding="md">
      <div class={styles.item}>
        <div class={styles.header}>
          <h3 class={styles.title}>
            {formatMessage($dictionary.recipes.stepsEditor.itemTitle, {
              index: index + 1,
            })}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            on:click={() => removeStep(index)}
            disabled={steps.length === 1}
          >
            {$dictionary.common.remove}
          </Button>
        </div>

        <Field label={$dictionary.recipes.stepsEditor.instruction}>
          <Textarea
            value={step.instruction}
            rows={4}
            placeholder={$dictionary.recipes.stepsEditor.instructionPlaceholder}
            on:input={(event) => updateStep(index, getTextareaValue(event))}
          />
        </Field>
      </div>
    </Card>
  {/each}

  <Button variant="secondary" on:click={addStep}
    >{$dictionary.recipes.stepsEditor.add}</Button
  >
</div>
