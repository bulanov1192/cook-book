import { browser } from "$app/environment";
import type { SessionResponse, Locale } from "$lib/api/types";
import { derived, get, writable } from "svelte/store";

const STORAGE_KEY = "recipe-book-locale";

const messages = {
  en: {
    common: {
      language: "Language",
      guestMode: "Guest mode",
      signedIn: "Signed in",
      userRole: "Member",
      adminRole: "Admin",
      signIn: "Sign in",
      signOut: "Sign out",
      signingOut: "Signing out...",
      createAccount: "Create account",
      creatingAccount: "Creating account...",
      save: "Save",
      cancel: "Cancel",
      clear: "Clear",
      remove: "Remove",
      optional: "Optional",
      public: "Public",
      private: "Private",
      active: "Active",
      archived: "Archived",
      loading: "Loading...",
      notSet: "Not set"
    },
    nav: {
      mainNavigation: "Main navigation",
      dashboard: "Dashboard",
      dashboardHint: "Overview and highlights",
      recipes: "Recipes",
      recipesHint: "Catalog and filters",
      shoppingLists: "Shopping Lists",
      shoppingListsHint: "Plan and track ingredients",
      newRecipe: "New Recipe",
      newRecipeHint: "Add something fresh"
    },
    shell: {
      eyebrow: "Recipe book",
      title: "A thoughtful home for the recipes you actually live with.",
      subtitle:
        "Keep dishes, notes and shopping plans together in one place, so everyday cooking feels a little more grounded.",
      ctaTitle: "Cook once, keep it for good.",
      ctaCopy:
        "Start with a rough version, polish it when the details settle, and turn the ingredient list into a real shopping plan when it is time to cook.",
      guestCopy:
        "Public recipes and shared lists stay open. Sign in when you want a private space for your own kitchen memory."
    },
    auth: {
      defaultTitle: "Sign in to continue",
      defaultDescription:
        "Save recipes to your own collection, keep drafts private, and turn plans into shopping lists that stay with you.",
      modeSignIn: "Sign in",
      modeSignUp: "Create account",
      signingIn: "Signing in...",
      nameLabel: "Name",
      emailLabel: "Email",
      passwordLabel: "Password",
      namePlaceholder: "Kitchen owner",
      emailPlaceholder: "chef@example.com",
      passwordHint: "Use at least 8 characters.",
      authFailed: "Authentication failed."
    },
    dashboard: {
      eyebrow: "Kitchen overview",
      title: "Your recipes, shopping plans and next cooking moves.",
      descriptionSignedIn:
        "A steady view of the kitchen as it stands today: what you cooked recently, what is ready to reuse, and what still needs a place on the shopping list.",
      descriptionGuest:
        "Browse the public side of the collection first. Sign in when you want a private home for drafts, personal recipes and your own planning rhythm.",
      browsePublicRecipes: "Browse public recipes",
      addRecipe: "Add a recipe",
      openShoppingLists: "Open shopping lists",
      recipesHint: "Everything currently kept in your collection",
      publishedHint: "Recipes ready to cook again and again",
      listsHint: "Plans already turned into ingredients",
      recentRecipesTitle: "Recent recipes",
      recentRecipesSubtitle: "The dishes and notes you were shaping most recently.",
      noRecipesTitle: "No recipes yet",
      noRecipesDescription:
        "Start with one recipe you actually return to. Once it lives here, the rest of the collection tends to grow naturally around it.",
      shoppingListsTitle: "Shopping lists",
      shoppingListsSubtitle:
        "A light, practical place to gather ingredients before they become dinner.",
      noListsTitle: "No shopping lists yet",
      noListsDescription:
        "The first list usually appears the moment a recipe turns into an actual meal plan.",
      signInTitle: "Sign in for your own kitchen workspace",
      signInDescription:
        "Public recipes are open for browsing. Signing in turns the app into your own kitchen notebook, with private drafts, editable recipes and lists that stay yours."
    },
    recipes: {
      pageEyebrow: "Recipe catalog",
      pageTitle: "A warm catalog with enough structure to stay useful.",
      pageDescription:
        "A place for the recipes you trust, the drafts still finding their shape, and the small details that make something worth cooking again.",
      createRecipe: "Create recipe",
      foundTitle: "Recipes found: {count}",
      foundSubtitle:
        "A living shelf of recipes you can sort, revisit and keep refining over time.",
      noMatchTitle: "No recipes match these filters",
      noMatchDescription:
        "Try opening the filters back up, or add a new recipe so this part of the collection has something to hold onto.",
      filters: {
        search: "Search",
        searchPlaceholder: "Search titles, tags, ingredients...",
        category: "Category",
        status: "Status",
        tag: "Tag",
        sortBy: "Sort by",
        order: "Order",
        apply: "Apply filters",
        allStatuses: "All statuses",
        allCategories: "All categories",
        allTags: "All tags",
        recentlyUpdated: "Recently updated",
        recentlyCreated: "Recently created",
        title: "Title",
        totalTime: "Total time",
        descending: "Descending",
        ascending: "Ascending"
      },
      status: {
        draft: "Draft",
        published: "Published",
        private: "Private",
        archived: "Archived"
      },
      form: {
        coreDetails: "Core details",
        recipeTitle: "Recipe title",
        recipeTitlePlaceholder: "Tomato soup with basil",
        category: "Category",
        categoryPlaceholder: "Dinner",
        servings: "Servings",
        status: "Status",
        prepMinutes: "Prep minutes",
        cookMinutes: "Cook minutes",
        totalMinutes: "Total minutes",
        tags: "Tags",
        tagsHint: "Separate tags with commas.",
        tagsPlaceholder: "quick, dinner, vegetarian",
        description: "Description",
        descriptionPlaceholder: "A warm, fast dinner with pantry staples.",
        notes: "Notes",
        notesPlaceholder: "Any serving notes, substitutions or kitchen reminders.",
        ingredients: "Ingredients",
        method: "Method",
        saveRecipe: "Save recipe",
        saveChanges: "Save changes",
        saving: "Saving...",
        cancel: "Cancel",
        couldNotSave: "Could not save recipe."
      },
      create: {
        eyebrow: "Create recipe",
        title: "Start simple, then shape the recipe as it gets used.",
        description:
          "Capture the version you cook today. You can always come back later to clarify the method, tighten the ingredients and turn it into something you trust.",
        authTitle: "Sign in before creating a recipe",
        authDescription:
          "New recipes begin in your own space, so this step needs a signed-in account before anything is saved."
      },
      edit: {
        eyebrow: "Edit recipe",
        title: "Refine {title}",
        description:
          "Tighten the details, add what was missing, and leave the recipe in a better state than the last time you cooked it."
      },
      detail: {
        eyebrow: "Recipe detail",
        noDescription:
          "This recipe does not have a written introduction yet, but the ingredients and method already give it a solid place in the collection.",
        editRecipe: "Edit recipe",
        archiveRecipe: "Archive recipe",
        restoreDraft: "Restore draft",
        archivedMessage: "Recipe archived.",
        restoredMessage: "Recipe restored as draft.",
        importMessage: "Ingredients were added to the selected shopping list.",
        overviewTitle: "At a glance",
        overviewSubtitle: "Status: {status} · Last updated {date}",
        uncategorized: "Uncategorized",
        category: "Category",
        servings: "Servings",
        prep: "Prep",
        cook: "Cook",
        total: "Total",
        sendToListTitle: "Send to shopping list",
        sendToListSubtitle:
          "Move the ingredient list into a plan you can actually take to the store.",
        targetList: "Target shopping list",
        addIngredients: "Add ingredients",
        ingredientsTitle: "Ingredients",
        ingredientsSubtitle: "{count} ingredients to gather before you begin",
        methodTitle: "Method",
        methodSubtitle: "{count} steps from prep to plate",
        notesTagsTitle: "Notes and tags",
        notesTagsSubtitle:
          "Small details that make the recipe easier to return to later.",
        noNotes:
          "No extra notes yet, but there is room here for serving ideas, substitutions and the little things worth remembering.",
        optionalIngredient: "optional"
      },
      ingredientsEditor: {
        itemTitle: "Ingredient {index}",
        add: "Add ingredient",
        name: "Name",
        amount: "Amount",
        unit: "Unit",
        prepNote: "Prep note",
        optional: "Optional ingredient",
        namePlaceholder: "Tomatoes",
        amountPlaceholder: "400",
        unitPlaceholder: "g",
        prepPlaceholder: "chopped"
      },
      stepsEditor: {
        itemTitle: "Step {index}",
        instruction: "Instruction",
        instructionPlaceholder: "Describe the action clearly",
        add: "Add step"
      },
      card: {
        updated: "Updated {date}",
        uncategorized: "Uncategorized",
        total: "Total",
        servings: "Servings",
        ingredients: "Ingredients",
        steps: "Steps",
        open: "Open recipe",
        edit: "Edit"
      }
    },
    shoppingLists: {
      pageEyebrow: "Shopping lists",
      pageTitle: "Turn recipe ingredients into practical kitchen lists.",
      pageDescriptionSignedIn:
        "Keep planning simple: gather what you need, bring in ingredients from recipes, and keep each list focused on a real meal or errand.",
      pageDescriptionGuest:
        "Shared public lists can still be opened by link. Sign in when you want a planning space that belongs to your own kitchen.",
      createTitle: "Create a new list",
      createSubtitle:
        "Useful for weekly shopping, dinner prep, party planning or ingredient restocks.",
      listName: "List name",
      visibility: "Visibility",
      listNamePlaceholder: "Weekly produce run",
      create: "Create list",
      creating: "Creating...",
      quickCreate: "Quick create",
      countTitle: "Lists: {count}",
      countSubtitle:
        "Each one is a small plan with a clear purpose, not just a loose pile of ingredients.",
      noListsTitle: "No shopping lists yet",
      noListsDescription:
        "Create the first list for a dinner, a weekend cook or the next grocery run, and the rest of the workflow starts to feel natural.",
      signInTitle: "Sign in to manage shopping lists",
      signInDescription:
        "Public shared lists remain visible by direct link. Creating and editing your own lists starts once you sign in.",
      nameRequired: "Give the shopping list a name first.",
      createFailed: "Could not create the shopping list.",
      detail: {
        eyebrow: "Shopping list detail",
        descriptionEditable:
          "A clear place to gather what the kitchen needs next, whether it comes from a recipe or from the small extras you do not want to forget.",
        descriptionReadOnly:
          "This list has been shared in read-only mode. You can look through it freely, while editing stays with the person who owns it.",
        itemAdded: "Item added to the list.",
        itemNameRequired: "Item name is required.",
        itemAddFailed: "Could not add the item.",
        importMessage: "Recipe ingredients imported into the shopping list.",
        addItemTitle: "Add an item",
        addItemSubtitle:
          "For pantry restocks, last-minute extras and everything that lives outside a recipe.",
        itemName: "Item name",
        amount: "Amount",
        unit: "Unit",
        note: "Note",
        itemNamePlaceholder: "Olive oil",
        amountPlaceholder: "1",
        unitPlaceholder: "bottle",
        notePlaceholder: "extra virgin",
        addItem: "Add item",
        adding: "Adding...",
        itemsTitle: "Items: {count}",
        itemsSubtitle: "Mark things off as you shop, or trim the list as plans change.",
        emptyTitle: "This shopping list is empty",
        emptyDescription:
          "Add a few essentials by hand, or pull ingredients in from a recipe to give this list a real purpose.",
        markActive: "Mark active",
        markDone: "Mark done"
      },
      importPanel: {
        label: "Import ingredients from a recipe",
        hint: "Pick a recipe and copy all its ingredient lines into this list.",
        import: "Import",
        importing: "Importing..."
      },
      card: {
        updated: "Updated {date} · {count} items · {visibility}",
        open: "Open list"
      }
    }
  },
  ru: {
    common: {
      language: "Язык",
      guestMode: "Гостевой режим",
      signedIn: "Вы вошли",
      userRole: "Пользователь",
      adminRole: "Админ",
      signIn: "Войти",
      signOut: "Выйти",
      signingOut: "Выходим...",
      createAccount: "Создать аккаунт",
      creatingAccount: "Создаем аккаунт...",
      save: "Сохранить",
      cancel: "Отмена",
      clear: "Сбросить",
      remove: "Удалить",
      optional: "Необязательно",
      public: "Публичный",
      private: "Приватный",
      active: "Активный",
      archived: "В архиве",
      loading: "Загрузка...",
      notSet: "Не указано"
    },
    nav: {
      mainNavigation: "Главная навигация",
      dashboard: "Главная",
      dashboardHint: "Обзор и главное",
      recipes: "Рецепты",
      recipesHint: "Каталог и фильтры",
      shoppingLists: "Списки покупок",
      shoppingListsHint: "Планирование ингредиентов",
      newRecipe: "Новый рецепт",
      newRecipeHint: "Добавить что-то новое"
    },
    shell: {
      eyebrow: "Книга рецептов",
      title: "Место для рецептов, к которым ты правда возвращаешься.",
      subtitle:
        "Рецепты, заметки и списки покупок рядом, чтобы готовить было проще, спокойнее и без лишней суеты.",
      ctaTitle: "Приготовил однажды — сохранил.",
      ctaCopy:
        "Запиши рецепт как есть, потом уточни детали и в нужный момент преврати ингредиенты в готовый список покупок.",
      guestCopy:
        "Публичные рецепты и общие списки открыты всем. Войди, если хочешь личное пространство для своей кухни."
    },
    auth: {
      defaultTitle: "Войдите, чтобы продолжить",
      defaultDescription:
        "Сохраняй рецепты в свою коллекцию, держи черновики при себе и собирай списки покупок в одном месте.",
      modeSignIn: "Войти",
      modeSignUp: "Создать аккаунт",
      signingIn: "Входим...",
      nameLabel: "Имя",
      emailLabel: "Email",
      passwordLabel: "Пароль",
      namePlaceholder: "Хозяин кухни",
      emailPlaceholder: "chef@example.com",
      passwordHint: "Используй минимум 8 символов.",
      authFailed: "Не удалось выполнить вход."
    },
    dashboard: {
      eyebrow: "Кухонный обзор",
      title: "Твои рецепты, покупки и идеи на ближайшее.",
      descriptionSignedIn:
        "Все важное на сегодня: к чему ты возвращался недавно, что уже готово к повтору и что еще нужно докупить.",
      descriptionGuest:
        "Сначала можно посмотреть публичную часть коллекции. Войди, когда захочешь свое место для рецептов, черновиков и планов.",
      browsePublicRecipes: "Смотреть публичные рецепты",
      addRecipe: "Добавить рецепт",
      openShoppingLists: "Открыть списки",
      recipesHint: "Все, что сейчас хранится в твоей коллекции",
      publishedHint: "Рецепты, к которым легко вернуться снова",
      listsHint: "Планы, уже превращенные в ингредиенты",
      recentRecipesTitle: "Недавние рецепты",
      recentRecipesSubtitle: "То, к чему ты возвращался в последнее время.",
      noRecipesTitle: "Рецептов пока нет",
      noRecipesDescription:
        "Начни с одного проверенного рецепта. Дальше коллекция обычно складывается сама.",
      shoppingListsTitle: "Списки покупок",
      shoppingListsSubtitle: "Простое место, где ингредиенты превращаются в понятный план.",
      noListsTitle: "Списков покупок пока нет",
      noListsDescription:
        "Обычно первый список появляется сам, когда рецепт превращается в реальный ужин.",
      signInTitle: "Войди в свое кухонное пространство",
      signInDescription:
        "Публичные рецепты можно смотреть и без входа. После входа приложение становится твоей личной кулинарной тетрадью."
    },
    recipes: {
      pageEyebrow: "Каталог рецептов",
      pageTitle: "Каталог, к которому удобно возвращаться.",
      pageDescription:
        "Здесь живут любимые рецепты, рабочие черновики и те самые детали, ради которых хочется готовить снова.",
      createRecipe: "Создать рецепт",
      foundTitle: "Найдено рецептов: {count}",
      foundSubtitle:
        "Живая коллекция рецептов, которую удобно пересматривать, сортировать и понемногу доводить до ума.",
      noMatchTitle: "По этим фильтрам ничего не найдено",
      noMatchDescription:
        "Попробуй ослабить фильтры или добавь новый рецепт, чтобы коллекция здесь не пустовала.",
      filters: {
        search: "Поиск",
        searchPlaceholder: "Искать по названиям, тегам, ингредиентам...",
        category: "Категория",
        status: "Статус",
        tag: "Тег",
        sortBy: "Сортировка",
        order: "Порядок",
        apply: "Применить фильтры",
        allStatuses: "Все статусы",
        allCategories: "Все категории",
        allTags: "Все теги",
        recentlyUpdated: "Недавно обновленные",
        recentlyCreated: "Недавно созданные",
        title: "Название",
        totalTime: "Общее время",
        descending: "По убыванию",
        ascending: "По возрастанию"
      },
      status: {
        draft: "Черновик",
        published: "Опубликован",
        private: "Приватный",
        archived: "В архиве"
      },
      form: {
        coreDetails: "Основные детали",
        recipeTitle: "Название рецепта",
        recipeTitlePlaceholder: "Томатный суп с базиликом",
        category: "Категория",
        categoryPlaceholder: "Ужин",
        servings: "Порции",
        status: "Статус",
        prepMinutes: "Подготовка, мин",
        cookMinutes: "Готовка, мин",
        totalMinutes: "Всего, мин",
        tags: "Теги",
        tagsHint: "Разделяй теги запятыми.",
        tagsPlaceholder: "быстро, ужин, вегетарианское",
        description: "Описание",
        descriptionPlaceholder: "Теплый быстрый ужин из простых ингредиентов.",
        notes: "Заметки",
        notesPlaceholder: "Подача, замены ингредиентов или кухонные напоминания.",
        ingredients: "Ингредиенты",
        method: "Способ приготовления",
        saveRecipe: "Сохранить рецепт",
        saveChanges: "Сохранить изменения",
        saving: "Сохраняем...",
        cancel: "Отмена",
        couldNotSave: "Не удалось сохранить рецепт."
      },
      create: {
        eyebrow: "Создание рецепта",
        title: "Начни с черновика, а форму рецепт найдет по ходу.",
        description:
          "Запиши ту версию, которую готовишь сегодня. Позже всегда можно вернуться, уточнить шаги и довести рецепт до уверенного состояния.",
        authTitle: "Войди перед созданием рецепта",
        authDescription:
          "Новые рецепты сохраняются в твоем личном пространстве, поэтому сначала нужно войти."
      },
      edit: {
        eyebrow: "Редактирование рецепта",
        title: "Доработать {title}",
        description:
          "Подправь детали, добавь недостающее и оставь рецепт лучше, чем он был до этого."
      },
      detail: {
        eyebrow: "Рецепт",
        noDescription:
          "У рецепта пока нет вступления, но ингредиенты и шаги уже на месте.",
        editRecipe: "Редактировать рецепт",
        archiveRecipe: "Убрать в архив",
        restoreDraft: "Вернуть в черновик",
        archivedMessage: "Рецепт отправлен в архив.",
        restoredMessage: "Рецепт снова стал черновиком.",
        importMessage: "Ингредиенты добавлены в выбранный список покупок.",
        overviewTitle: "Кратко",
        overviewSubtitle: "Статус: {status} · Обновлен {date}",
        uncategorized: "Без категории",
        category: "Категория",
        servings: "Порции",
        prep: "Подготовка",
        cook: "Готовка",
        total: "Всего",
        sendToListTitle: "Отправить в список покупок",
        sendToListSubtitle:
          "Перенеси ингредиенты в список, с которым уже можно идти в магазин.",
        targetList: "Список покупок",
        addIngredients: "Добавить ингредиенты",
        ingredientsTitle: "Ингредиенты",
        ingredientsSubtitle: "{count} ингредиентов, которые стоит собрать заранее",
        methodTitle: "Способ приготовления",
        methodSubtitle: "{count} шагов от подготовки до подачи",
        notesTagsTitle: "Заметки и теги",
        notesTagsSubtitle:
          "Мелочи, которые помогают быстрее вернуться к рецепту позже.",
        noNotes:
          "Заметок пока нет, но сюда удобно складывать идеи по подаче, замены и мелочи, которые хочется не забыть.",
        optionalIngredient: "необязательно"
      },
      ingredientsEditor: {
        itemTitle: "Ингредиент {index}",
        add: "Добавить ингредиент",
        name: "Название",
        amount: "Количество",
        unit: "Ед. изм.",
        prepNote: "Подготовка",
        optional: "Необязательный ингредиент",
        namePlaceholder: "Томаты",
        amountPlaceholder: "400",
        unitPlaceholder: "г",
        prepPlaceholder: "нарезать"
      },
      stepsEditor: {
        itemTitle: "Шаг {index}",
        instruction: "Инструкция",
        instructionPlaceholder: "Опиши действие понятно и спокойно",
        add: "Добавить шаг"
      },
      card: {
        updated: "Обновлен {date}",
        uncategorized: "Без категории",
        total: "Всего",
        servings: "Порции",
        ingredients: "Ингредиенты",
        steps: "Шаги",
        open: "Открыть рецепт",
        edit: "Редактировать"
      }
    },
    shoppingLists: {
      pageEyebrow: "Списки покупок",
      pageTitle: "Превращай ингредиенты в понятные списки.",
      pageDescriptionSignedIn:
        "Собирай нужное, подтягивай ингредиенты из рецептов и держи каждый список привязанным к реальной задаче.",
      pageDescriptionGuest:
        "Публичные списки по ссылке можно открыть и без входа. Войди, если хочешь свое пространство для планирования.",
      createTitle: "Создать новый список",
      createSubtitle:
        "Подходит для еженедельных покупок, ужинов и пополнения запасов.",
      listName: "Название списка",
      visibility: "Видимость",
      listNamePlaceholder: "Покупки на неделю",
      create: "Создать список",
      creating: "Создаем...",
      quickCreate: "Быстро создать",
      countTitle: "Списков: {count}",
      countSubtitle:
        "Каждый список — это маленький план, а не просто набор ингредиентов.",
      noListsTitle: "Списков покупок пока нет",
      noListsDescription:
        "Создай первый список для ужина или ближайшего похода в магазин, и дальше все быстро встанет на свои места.",
      signInTitle: "Войди, чтобы управлять списками покупок",
      signInDescription:
        "Публичные списки по ссылке остаются доступными. Свои списки можно создавать и редактировать после входа.",
      nameRequired: "Сначала дай списку название.",
      createFailed: "Не удалось создать список покупок.",
      detail: {
        eyebrow: "Список покупок",
        descriptionEditable:
          "Собери здесь все, что понадобится дальше: и из рецептов, и из мелочей, которые легко забыть.",
        descriptionReadOnly:
          "Этот список открыт только для чтения. Смотреть можно свободно, а редактирование остается у владельца.",
        itemAdded: "Пункт добавлен в список.",
        itemNameRequired: "Нужно указать название пункта.",
        itemAddFailed: "Не удалось добавить пункт.",
        importMessage: "Ингредиенты из рецепта добавлены в список покупок.",
        addItemTitle: "Добавить пункт",
        addItemSubtitle:
          "Для запасов, спонтанных покупок и всего, что не привязано к конкретному рецепту.",
        itemName: "Название",
        amount: "Количество",
        unit: "Ед. изм.",
        note: "Заметка",
        itemNamePlaceholder: "Оливковое масло",
        amountPlaceholder: "1",
        unitPlaceholder: "бутылка",
        notePlaceholder: "extra virgin",
        addItem: "Добавить пункт",
        adding: "Добавляем...",
        itemsTitle: "Пунктов: {count}",
        itemsSubtitle: "Отмечай купленное и держи список в порядке по мере изменений.",
        emptyTitle: "Этот список пока пуст",
        emptyDescription:
          "Добавь несколько позиций вручную или подтяни ингредиенты из рецепта, чтобы список сразу ожил.",
        markActive: "Сделать активным",
        markDone: "Отметить как купленное"
      },
      importPanel: {
        label: "Импортировать ингредиенты из рецепта",
        hint: "Выбери рецепт и добавь все его ингредиенты в этот список.",
        import: "Импортировать",
        importing: "Импортируем..."
      },
      card: {
        updated: "Обновлен {date} · {count} поз. · {visibility}",
        open: "Открыть список"
      }
    }
  }
} as const;

export type TranslationDictionary = (typeof messages)[keyof typeof messages];

export const locale = writable<Locale>("en");
export const dictionary = derived(locale, ($locale) => messages[$locale]);

function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "ru";
}

export function formatMessage(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_match, key) => String(values[key] ?? ""));
}

export function getDictionary(): TranslationDictionary {
  return get(dictionary);
}

export function getCurrentLocale(): Locale {
  return get(locale);
}

export function syncLocale(session: SessionResponse) {
  if (!browser) {
    return;
  }

  if (session.user?.locale && isLocale(session.user.locale)) {
    locale.set(session.user.locale);
    localStorage.setItem(STORAGE_KEY, session.user.locale);
    return;
  }

  const storedLocale = localStorage.getItem(STORAGE_KEY);

  if (isLocale(storedLocale)) {
    locale.set(storedLocale);
    return;
  }

  locale.set("en");
}

export function persistLocale(nextLocale: Locale) {
  locale.set(nextLocale);

  if (browser) {
    localStorage.setItem(STORAGE_KEY, nextLocale);
  }
}
