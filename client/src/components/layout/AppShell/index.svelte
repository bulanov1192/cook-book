<script lang="ts">
  import { BookOpenText, ChartNoAxesCombined, CookingPot, LogOut, ShoppingBasket } from "lucide-svelte";
  import { goto, invalidateAll } from "$app/navigation";
  import { page } from "$app/stores";
  import { signOut } from "$lib/api/auth";
  import type { SessionResponse } from "$lib/api/types";
  import Badge from "$components/ui/Badge/index.svelte";
  import Button from "$components/ui/Button/index.svelte";
  import styles from "./index.module.scss";

  export let session: SessionResponse;

  const navigation = [
    {
      href: "/",
      label: "Dashboard",
      hint: "Overview and highlights",
      icon: ChartNoAxesCombined
    },
    {
      href: "/recipes",
      label: "Recipes",
      hint: "Catalog and filters",
      icon: CookingPot
    },
    {
      href: "/shopping-lists",
      label: "Shopping Lists",
      hint: "Plan and track ingredients",
      icon: ShoppingBasket
    },
    {
      href: "/recipes/new",
      label: "New Recipe",
      hint: "Add something fresh",
      icon: BookOpenText
    }
  ];

  $: currentPath = $page.url.pathname;
  let isSigningOut = false;

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
</script>

<div class={styles.shell}>
  <aside class={styles.sidebar}>
    <div class={styles.brand}>
      <span class={styles.eyebrow}>Recipe book</span>
      <h1 class={styles.title}>Warm, structured cooking notes for everyday use.</h1>
      <p class={styles.subtitle}>
        A calm kitchen workspace for building your own recipe catalog and turning it into shopping lists.
      </p>
    </div>

    <nav class={styles.nav} aria-label="Main navigation">
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
      <h2 class={styles.ctaTitle}>Keep the flow simple.</h2>
      <p class={styles.ctaCopy}>
        Add recipes in drafts first, publish them when they feel ready, then pull ingredients straight into your list.
      </p>
      <Button href="/recipes/new">Create recipe</Button>
    </section>

    <section class={styles.account}>
      {#if session.isAuthenticated && session.user}
        <div class={styles.accountHeader}>
          <span class={styles.accountEyebrow}>Signed in</span>
          <Badge variant={session.user.role === "admin" ? "danger" : "neutral"}>
            {session.user.role}
          </Badge>
        </div>
        <div class={styles.accountBody}>
          <strong>{session.user.name}</strong>
          <span>{session.user.email}</span>
        </div>
        <Button variant="ghost" size="sm" on:click={handleSignOut} disabled={isSigningOut}>
          <LogOut size={16} />
          {isSigningOut ? "Signing out..." : "Sign out"}
        </Button>
      {:else}
        <div class={styles.accountBody}>
          <strong>Guest mode</strong>
          <span>Public recipes and shared lists stay open. Create and manage your own content after sign in.</span>
        </div>
        <Button href="/" variant="secondary" size="sm">Sign in</Button>
      {/if}
    </section>
  </aside>

  <div class={styles.content}>
    <slot />
  </div>
</div>
