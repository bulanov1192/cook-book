declare module "@shaarugesh/emoji-picker-svelte" {
  import type { SvelteComponentTyped } from "svelte";

  export default class EmojiPicker extends SvelteComponentTyped<
    Record<string, never>,
    {
      emoji: CustomEvent<string>;
    }
  > {}
}
