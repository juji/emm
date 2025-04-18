-- not done --

emm - Your Friendly ETL Memory Monitor

# emm - Your Friendly ETL Memory Monitor

[![NPM version](https://img.shields.io/npm/v/emm.svg)](https://npmjs.org/package/emm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

```ascii
 ______ ______ ______
|      |      |      |
|  ----|  ----|  ----|
|______|______|______|
```

Hey there! Welcome to **emm**, your go-to tool for keeping an eye on memory usage while running scripts. Whether you're using Node.js, Bun, or Deno, we've got you covered. Oh, and by the way, that cool ASCII art up there? Totally made by GitHub Copilot. 😎

## What is emm?

Think of **emm** as your script's personal trainer. It runs your script and keeps track of how much memory it's using over time. Perfect for debugging, optimizing, or just satisfying your curiosity.

<!-- Also emm is the name git choose -->

## What Do You Need?

To use **emm**, make sure you're running one of these:

- **Node.js:** v18.0.0 or higher
- **Bun:** v1.0.0 or higher
- **Deno:** v1.35.0 or higher (you'll need `--allow-read`, `--allow-run`, and `--allow-env` permissions)

Cloudflare Workers support? It's in the works (pun intended).

## How to Install

You can install **emm** globally or just use it on the fly. Here's how:

### Global Installation

```bash
npm install --global emm
# or
bun install --global emm
```

### Local Installation (for your project)

```bash
npm install emm
# or
bun add emm
```

### No Installation? No Problem!

Use it directly with `npx`, `bunx`, or `deno run`.

## How to Use It

Running **emm** is super simple. Just point it to your script and let it do its thing.

### Node.js (with `npx`):

```bash
npx emm <your-script.js> [options]
```

### Bun (with `bunx`):

```bash
bunx emm <your-script.ts> [options]
```

### Deno:

```bash
deno run --allow-read --allow-run --allow-env npm:emm <your-script.js> [options]
```

### Installed Globally:

```bash
emm <your-script.js> [options]
```

## Options You Can Use

- `<file>`: (Required) Path to the script you want to monitor.
- `-i, --interval <milliseconds>`: How often to check memory usage (default: 1000ms).
- `-h, --help`: Show help.
- `-v, --version`: Show version.

### Example:

```bash
npx emm ./my-heavy-script.js --interval 500
```

## Running Tests

To run all TypeScript tests:

```
npm test
```

## Programmatic API (Coming Soon)

Want to use **emm** in your code? We're working on it! Here's a sneak peek:

```typescript
import emm, { type EmmOptions } from 'emm';

// Example placeholder - actual usage might differ
// const stats = await emm('path/to/script.js', { interval: 500 });
// console.log(stats);
```

Stay tuned for updates!

---

If you have suggestions, improvements, or spot something that could be better, feel free to open a pull request! We love contributions and friendly feedback. 😊

## License

MIT License.

---





