<script lang="ts">
  import { BookOpenText, ChartNoAxesCombined, CookingPot, LogOut, ShoppingBasket } from "lucide-svelte";
  import { goto, invalidateAll } from "$app/navigation";
  import { page } from "$app/stores";
  import { signOut, updatePreferences } from "$lib/api/auth";
  import { dictionary, formatMessage, locale, persistLocale } from "$lib/i18n";
  import type { Locale, SessionResponse } from "$lib/api/types";
  import Badge from "$components/ui/Badge/index.svelte";
  import Button from "$components/ui/Button/index.svelte";
  import Field from "$components/ui/Field/index.svelte";
  import Select from "$components/ui/Select/index.svelte";
  import styles from "./index.module.scss";

  export let session: SessionResponse;

  $: currentPath = $page.url.pathname;
  let isSigningOut = false;
  let isUpdatingLocale = false;
  let selectedLocale: Locale = "en";

  $: selectedLocale = $locale;
  $: navigation = [
    {
      href: "/",
      label: $dictionary.nav.dashboard,
      hint: $dictionary.nav.dashboardHint,
      icon: ChartNoAxesCombined
    },
    {
      href: "/recipes",
      label: $dictionary.nav.recipes,
      hint: $dictionary.nav.recipesHint,
      icon: CookingPot
    },
    {
      href: "/shopping-lists",
      label: $dictionary.nav.shoppingLists,
      hint: $dictionary.nav.shoppingListsHint,
      icon: ShoppingBasket
    },
    {
      href: "/recipes/new",
      label: $dictionary.nav.newRecipe,
      hint: $dictionary.nav.newRecipeHint,
      icon: BookOpenText
    }
  ];

  const languageOptions = [
    { value: "en", label: "🇬🇧 EN" },
    { value: "ru", label: "🇷🇺 RU" }
  ];

  $: roleLabel =
    session.user?.role === "admin" ? $dictionary.common.adminRole : $dictionary.common.userRole;

  function isNavActive(href: string, pathname: string): boolean {
    if (href === "/") {
      return pathname === "/";
    }

    if (href === "/recipes/new") {
      return pathname === "/recipes/new";
    }

    if (href === "/recipes") {
      return pathname === "/recipes" || /^\/recipes\/(?!new(?:\/|$))[^/]+(?:\/edit)?$/.test(pathname);
    }

    if (href === "/shopping-lists") {
      return pathname === "/shopping-lists" || /^\/shopping-lists\/[^/]+$/.test(pathname);
    }

    return pathname === href;
  }

  async function handleSignOut() {
    isSigningOut = true;

    try {
      await signOut();
      await invalidateAll();
      await goto("/");
    } finally {
      isSigningOut = false;
    }
  }

  async function handleLocaleChange(event: Event) {
    const target = event.currentTarget;

    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    const nextLocale = target.value as Locale;

    if (nextLocale === $locale) {
      return;
    }

    isUpdatingLocale = true;

    try {
      if (session.isAuthenticated) {
        await updatePreferences({
          locale: nextLocale
        });
      }

      persistLocale(nextLocale);
    } finally {
      isUpdatingLocale = false;
    }
  }
</script>

<div class={styles.shell}>
  <aside class={styles.sidebar}>
    <div class={styles.brand}>
      <span class={styles.eyebrow}>{$dictionary.shell.eyebrow}</span>
      <h1 class={styles.title}>{$dictionary.shell.title}</h1>
      <p class={styles.subtitle}>
        {$dictionary.shell.subtitle}
      </p>
    </div>

    <nav class={styles.nav} aria-label={$dictionary.nav.mainNavigation}>
      {#each navigation as item}
        <a
          class={`${styles.navLink} ${isNavActive(item.href, currentPath) ? styles.navLinkActive : ""}`}
          href={item.href}
        >
          <svelte:component this={item.icon} size={18} strokeWidth={2.2} />
          <span class={styles.navText}>
            <span class={styles.navLabel}>{item.label}</span>
            <span class={styles.navHint}>{item.hint}</span>
          </span>
        </a>
      {/each}
    </nav>

    <section class={styles.cta}>
      <h2 class={styles.ctaTitle}>{$dictionary.shell.ctaTitle}</h2>
      <p class={styles.ctaCopy}>
        {$dictionary.shell.ctaCopy}
      </p>
      <Button href="/recipes/new">{$dictionary.recipes.createRecipe}</Button>
    </section>

    <section class={styles.account}>
      <Field label={$dictionary.common.language}>
        <Select
          value={selectedLocale}
          options={languageOptions}
          disabled={isUpdatingLocale}
          on:change={handleLocaleChange}
        />
      </Field>

      {#if session.isAuthenticated && session.user}
        <div class={styles.accountHeader}>
          <span class={styles.accountEyebrow}>{$dictionary.common.signedIn}</span>
          <Badge variant={session.user.role === "admin" ? "danger" : "neutral"}>
            {roleLabel}
          </Badge>
        </div>
        <div class={styles.accountBody}>
          <strong>{session.user.name}</strong>
          <span>{session.user.email}</span>
        </div>
        <Button variant="ghost" size="sm" on:click={handleSignOut} disabled={isSigningOut}>
          <LogOut size={16} />
          {isSigningOut ? $dictionary.common.signingOut : $dictionary.common.signOut}
        </Button>
      {:else}
        <div class={styles.accountBody}>
          <strong>{$dictionary.common.guestMode}</strong>
          <span>{$dictionary.shell.guestCopy}</span>
        </div>
        <Button href="/" variant="secondary" size="sm">{$dictionary.common.signIn}</Button>
      {/if}
    </section>
  </aside>

  <div class={styles.content}>
    <slot />
  </div>
</div>
