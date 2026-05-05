<script lang="ts">
  import { browser } from "$app/environment";
  import Button from "$components/ui/Button/index.svelte";
  import Textarea from "$components/ui/Textarea/index.svelte";
  import { SendHorizontal } from "lucide-svelte";
  import type { ComponentType } from "svelte";
  import { createEventDispatcher } from "svelte";
  import styles from "./index.module.scss";

  const dispatch = createEventDispatcher<{
    submit: void;
    cancel: void;
  }>();

  export let value = "";
  export let placeholder = "";
  export let disabled = false;
  export let rows = 2;
  export let submitLabel = "";
  export let submitBusyLabel = "";
  export let submitAriaLabel = "";
  export let submitDisabled = false;
  export let isBusy = false;
  export let compact = false;
  export let iconOnlySubmit = false;
  export let showCancel = false;
  export let cancelLabel = "";

  let showEmojiPicker = false;
  let EmojiPickerComponent: ComponentType | null = null;
  let isLoadingEmojiPicker = false;

  // function appendEmoji(event: CustomEvent<string>) {
  //   value += event.detail;
  //   showEmojiPicker = false;
  // }

  async function toggleEmojiPicker() {
    if (disabled || isBusy) {
      return;
    }

    if (!showEmojiPicker) {
      if (!browser) {
        return;
      }

      if (!EmojiPickerComponent) {
        isLoadingEmojiPicker = true;

        try {
          const module = await import("@shaarugesh/emoji-picker-svelte");
          EmojiPickerComponent = module.default;
        } finally {
          isLoadingEmojiPicker = false;
        }
      }
    }

    showEmojiPicker = !showEmojiPicker;
  }
</script>

<div class={`${styles.composer} ${compact ? styles.compact : ""}`}>
  <Textarea bind:value {placeholder} {disabled} {rows} />

  <!-- TODO - panel is collapsed and emojis picker has no visible styles -->
  <!-- {#if browser && showEmojiPicker && EmojiPickerComponent}
    <div class={styles.emojiPanel}>
      <svelte:component this={EmojiPickerComponent} on:emoji={appendEmoji} />
    </div>
  {/if} -->

  <div class={styles.actions}>
    <div></div>
    <div class={styles.submitRow}>
      {#if showCancel}
        <Button
          variant="ghost"
          size={compact ? "sm" : "md"}
          disabled={disabled || isBusy}
          on:click={() => dispatch("cancel")}
        >
          {cancelLabel}
        </Button>
      {/if}

      {#if iconOnlySubmit}
        <button
          class={`${styles.iconButton} ${styles.submitIconButton}`}
          type="button"
          title={submitAriaLabel}
          aria-label={submitAriaLabel}
          disabled={disabled || submitDisabled || isBusy}
          on:click={() => dispatch("submit")}
        >
          <SendHorizontal size={compact ? 16 : 18} />
        </button>
      {:else}
        <Button
          disabled={disabled || submitDisabled || isBusy}
          on:click={() => dispatch("submit")}
        >
          <SendHorizontal size={18} />
          {isBusy ? submitBusyLabel : submitLabel}
        </Button>
      {/if}
    </div>
  </div>
</div>
