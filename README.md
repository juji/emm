# emm

```ascii
 ______ ______ ______
|      |      |      |
|  ----|  ----|  ----|
|______|______|______| 
```

**emm** (ETL Memory Monitor)  
A cli app to monitor memory.
It should run on nodejs bun and deno and cloudflare

The name was choosen by Github Copilot.
and was re-written by juji.

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
<!-- - Deno >= 1.35  
- Cloudflare Workers (ESM compatible) -->

It is made in TypeScript and compiled into JavaScript that can be used with Node.js, Bun, Deno, and Cloudflare Workers.

## Usage

**Node.js (via npx):**

```bash
npx emm <your-script.js>
```

**Bun (via bunx):**

```bash
bunx emm <your-script.ts>
```

**Deno:**

Deno can run the TypeScript source directly or the published package using `npm:` specifiers.

```bash
# Run from source (assuming you cloned the repo)
deno run --allow-read --allow-run --allow-env src/index.ts <your-script.js>

# Run published package (replace <version> with the actual version)
deno run --allow-read --allow-run --allow-env npm:emm@<version> <your-script.js>
```

### Programmatic API

```ts
import emm, type { EmmOptions } from 'emm';

// what can it do here?

const stats = await emm(file: string, options?: EmmOptions);
```

## License

MIT






