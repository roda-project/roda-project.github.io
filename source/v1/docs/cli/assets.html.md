---
title: Roda project / CLI / assets
---

## CLI / assets

The `assets` command is used in Fullstack Roda applications to compile and bundle frontend assets (JavaScript, CSS, images) managed via Node.js and `esbuild`.

### Overview

When building a fullstack application, `roda-project` configures `esbuild` for fast asset bundling and compiles your static resources into the `public/` directory. The `bin/roda assets` CLI task wraps asset compilation and watching for a smooth development workflow.

### Usage

<pre>
<code class="language-bash">$ bin/roda assets [OPTIONS]</code>
</pre>

### Options

*   **`-w`**, **`--watch`**: Starts `esbuild` in watch mode and runs `npm run build:watch`. When source files in `app/assets/` are modified, `esbuild` automatically updates the compiled bundles in `public/assets/`.

### Examples

#### Single compilation run
Installs NPM dependencies (if missing) and compiles assets once for deployment or testing:

<pre>
<code class="language-bash">$ bin/roda assets</code>
</pre>

#### Watch mode for local development
Continuously recompiles assets whenever changes are detected:

<pre>
<code class="language-bash">$ bin/roda assets -w</code>
</pre>
