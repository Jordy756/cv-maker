## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Code Style

- Never write comments in any file. No inline comments, no block comments, no documentation comments. The code must speak for itself.
- Always use arrow functions for TypeScript and JavaScript. Do not use the `function` keyword for function declarations. The only exception is when a function needs to be hoisted or requires the `function` keyword to work, such as a function expression assigned to a variable that needs its own name for recursion, or a generator. In those cases, use a named function expression.
- Prefer Tailwind CSS v4 utilities over custom CSS. Use `@theme` for design tokens and `@utility` for custom utilities.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
