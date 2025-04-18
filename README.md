# emm - ETL Memory Monitor

[![NPM version](https://img.shields.io/npm/v/emm.svg)](https://npmjs.org/package/emm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

```ascii
 ______ ______ ______
|      |      |      |
|  ----|  ----|  ----|
|______|______|______|
```

**emm** is a command-line utility designed to execute a specified script and monitor its memory usage over time. It's built to be compatible with popular JavaScript runtimes like Node.js, Bun, and Deno.

## Requirements

`emm` aims to run on the following environments:

*   **Node.js:** >= v18.0.0
*   **Bun:** >= v1.0.0
*   **Deno:** >= v1.35.0 (Requires `--allow-read`, `--allow-run`, `--allow-env` permissions)
*   _(Cloudflare Workers support is experimental or planned)_

It is developed in TypeScript and distributed as JavaScript.

## Installation

You can install `emm` globally or use it directly with `npx`, `bunx`, or `deno run`.

**Global Installation:**

```bash
npm install --global emm
# or
bun install --global emm
```

**Local Installation (in your project):**

```bash
npm install emm
# or
bun add emm
```

## Usage

Execute your script using `emm` followed by the path to the file.

**Using `npx` (Node.js):**

```bash
npx emm <your-script.js> [options]
```

**Using `bunx` (Bun):**

```bash
bunx emm <your-script.ts> [options]
```

**Using `deno run` (Deno):**

```bash
# Run published package from npm (replace <version> if needed)
deno run --allow-read --allow-run --allow-env npm:emm <your-script.js> [options]

# Run from local source (if cloned)
# deno run --allow-read --allow-run --allow-env src/index.ts <your-script.js> [options]
```

**Using Global Install:**

```bash
emm <your-script.js> [options]
```

### Options

*   `<file>`: (Required) The path to the script file you want to execute and monitor.
*   `-i, --interval <milliseconds>`: The interval (in milliseconds) at which memory usage should be checked. (Default: `1000`)
*   `-h, --help`: Show the help message.
*   `-v, --version`: Show the version number.

**Example with options:**

```bash
npx emm ./my-heavy-script.js --interval 500
```

## Programmatic API

_(Note: The programmatic API is currently under development or may have limited functionality.)_

```typescript
import emm, { type EmmOptions } from 'emm';

// Example placeholder - actual usage might differ
// const stats = await emm('path/to/script.js', { interval: 500 });
// console.log(stats);
```

Refer to the source code for potential future programmatic usage details.

## License

[MIT](./LICENSE)






