<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import Button from "$components/ui/Button/index.svelte";
  import Card from "$components/ui/Card/index.svelte";
  import Field from "$components/ui/Field/index.svelte";
  import Input from "$components/ui/Input/index.svelte";
  import { signIn, signUp } from "$lib/api/auth";
  import { dictionary } from "$lib/i18n";
  import styles from "./index.module.scss";

  type Mode = "sign-in" | "sign-up";

  export let title = "";
  export let description = "";
  export let onSuccess: (() => Promise<void> | void) | undefined = undefined;

  let mode: Mode = "sign-in";
  let name = "";
  let email = "";
  let password = "";
  let isSubmitting = false;
  let errorMessage = "";

  $: resolvedTitle = title || $dictionary.auth.defaultTitle;
  $: resolvedDescription = description || $dictionary.auth.defaultDescription;

  function getInputValue(event: Event): string {
    const target = event.currentTarget;
    return target instanceof HTMLInputElement ? target.value : "";
  }

  async function handleSubmit() {
    errorMessage = "";
    isSubmitting = true;

    try {
      if (mode === "sign-up") {
        await signUp({
          name: name.trim(),
          email: email.trim(),
          password
        });
      } else {
        await signIn({
          email: email.trim(),
          password
        });
      }

      await invalidateAll();
      await onSuccess?.();
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : $dictionary.auth.authFailed;
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Card>
  <div class={styles.panel}>
    <div class={styles.copy}>
      <h2 class={styles.title}>{resolvedTitle}</h2>
      <p class={styles.description}>{resolvedDescription}</p>
    </div>

    <div class={styles.modeSwitch}>
      <button
        class={`${styles.modeButton} ${mode === "sign-in" ? styles.modeButtonActive : ""}`}
        type="button"
        on:click={() => (mode = "sign-in")}
      >
        {$dictionary.auth.modeSignIn}
      </button>
      <button
        class={`${styles.modeButton} ${mode === "sign-up" ? styles.modeButtonActive : ""}`}
        type="button"
        on:click={() => (mode = "sign-up")}
      >
        {$dictionary.auth.modeSignUp}
      </button>
    </div>

    <form class={styles.form} on:submit|preventDefault={handleSubmit}>
      {#if mode === "sign-up"}
        <Field label={$dictionary.auth.nameLabel}>
          <Input
            value={name}
            placeholder={$dictionary.auth.namePlaceholder}
            on:input={(event) => (name = getInputValue(event))}
          />
        </Field>
      {/if}

      <Field label={$dictionary.auth.emailLabel}>
        <Input
          type="email"
          value={email}
          placeholder={$dictionary.auth.emailPlaceholder}
          on:input={(event) => (email = getInputValue(event))}
        />
      </Field>

      <Field
        label={$dictionary.auth.passwordLabel}
        hint={mode === "sign-up" ? $dictionary.auth.passwordHint : ""}
      >
        <Input
          type="password"
          value={password}
          placeholder="••••••••"
          on:input={(event) => (password = getInputValue(event))}
        />
      </Field>

      {#if errorMessage}
        <p class={styles.error}>{errorMessage}</p>
      {/if}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? mode === "sign-up"
            ? $dictionary.common.creatingAccount
            : $dictionary.auth.signingIn
          : mode === "sign-up"
            ? $dictionary.common.createAccount
            : $dictionary.common.signIn}
      </Button>
    </form>
  </div>
</Card>
