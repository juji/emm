# emm

A placeholder

**emm** (ETL Memory Monitor)  
A cli app to monitor memory.
It should run on nodejs bun and deno and cloudflare

The name was choosen by Github Copilot.

## Installation

```bash
# global
npm install --global emm

# local
npm install emm
```

It will execute the specified file, measure its RAM usage in real time, and output to stdout.
It will read it's environment. if it's a bash, or zsh or windows.
It has the option to write file to, a customizable location.
It has a help option.

## Requirements

Should run on:

- Node.js >= 18  
- Bun >= 1.0  
- Deno >= 1.35  
- Cloudflare Workers (ESM compatible)

It is made in TypeScript and compiled into JavaScript that can be used with Node.js, Bun, Deno, and Cloudflare Workers.

## Usagezq

```bash
npx emm asdf.js
bunx emm asdf.ts
# deno
```

### Programmatic API

```ts
import emm, type { EmmOptions } from 'emm';

// what can it do here?

const stats = await emm(file: string, options?: EmmOptions);
```

## License

MIT






