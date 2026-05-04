<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import Button from "$components/ui/Button/index.svelte";
  import Card from "$components/ui/Card/index.svelte";
  import Field from "$components/ui/Field/index.svelte";
  import Input from "$components/ui/Input/index.svelte";
  import { signIn, signUp } from "$lib/api/auth";
  import styles from "./index.module.scss";

  type Mode = "sign-in" | "sign-up";

  export let title = "Sign in to continue";
  export let description =
    "Authentication unlocks private drafts, your own shopping lists and editing tools across the app.";
  export let onSuccess: (() => Promise<void> | void) | undefined = undefined;

  let mode: Mode = "sign-in";
  let name = "";
  let email = "";
  let password = "";
  let isSubmitting = false;
  let errorMessage = "";

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
      errorMessage = error instanceof Error ? error.message : "Authentication failed.";
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Card>
  <div class={styles.panel}>
    <div class={styles.copy}>
      <h2 class={styles.title}>{title}</h2>
      <p class={styles.description}>{description}</p>
    </div>

    <div class={styles.modeSwitch}>
      <button
        class={`${styles.modeButton} ${mode === "sign-in" ? styles.modeButtonActive : ""}`}
        type="button"
        on:click={() => (mode = "sign-in")}
      >
        Sign in
      </button>
      <button
        class={`${styles.modeButton} ${mode === "sign-up" ? styles.modeButtonActive : ""}`}
        type="button"
        on:click={() => (mode = "sign-up")}
      >
        Create account
      </button>
    </div>

    <form class={styles.form} on:submit|preventDefault={handleSubmit}>
      {#if mode === "sign-up"}
        <Field label="Name">
          <Input
            value={name}
            placeholder="Kitchen owner"
            on:input={(event) => (name = getInputValue(event))}
          />
        </Field>
      {/if}

      <Field label="Email">
        <Input
          type="email"
          value={email}
          placeholder="chef@example.com"
          on:input={(event) => (email = getInputValue(event))}
        />
      </Field>

      <Field label="Password" hint={mode === "sign-up" ? "Use at least 8 characters." : ""}>
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
            ? "Creating account..."
            : "Signing in..."
          : mode === "sign-up"
            ? "Create account"
            : "Sign in"}
      </Button>
    </form>
  </div>
</Card>
