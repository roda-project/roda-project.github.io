---
title: Roda project / CLI / dev
---

## CLI / dev

The `dev` command launches your application in development mode with automatic file watching and application reloading using `Guard`.

### Overview

During active application development, `bin/roda dev` sets `RACK_ENV=development` and executes `bundle exec guard`. Guard monitors your project directory for file modifications (such as routes, models, views, or assets) and automatically reloads the server or triggers test suites.

### Usage

<pre>
<code class="language-bash">$ bin/roda dev</code>
</pre>

### What it does

1. Sets `RACK_ENV=development`.
2. Invokes `Guard` via `bundle exec guard`.
3. Monitors project paths specified in your project's `Guardfile`.
4. Automatically updates local development processes without requiring manual application restarts.
