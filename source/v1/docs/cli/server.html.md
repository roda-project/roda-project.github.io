---
title: Roda project / CLI / server
---

## CLI / server

The `server` command (aliased as `s`) boots the Puma web server to run your Roda application in either development or production environments.

### Overview

`bin/roda server` serves as the primary entry point for launching the web server on port 4000. It checks required environment configuration before booting.

### Usage

<pre>
<code class="language-bash">$ bin/roda server</code>
</pre>

### Environment Modes

#### Development Mode (Default)
When `RACK_ENV` is not set to `production`, `bin/roda server` starts Puma in development mode:

<pre>
<code class="language-bash">$ bin/roda server</code>
</pre>

#### Production Mode
When `RACK_ENV=production`, `bin/roda server` enforces environment checks and enables YJIT performance optimizations:

<pre>
<code class="language-bash">$ RACK_ENV=production SESSION_SECRET="your_secret" DATABASE_URL="postgres://..." bin/roda server</code>
</pre>

*   **Session Secret Check**: Ensures `SESSION_SECRET` environment variable is defined.
*   **Database Check**: Ensures `DATABASE_URL` environment variable is defined (if database is enabled).
*   **YJIT Acceleration**: Launches Ruby with YJIT flags enabled (`RUBYOPT=--yjit RUBY_YJIT_ENABLE=1`) for optimal production execution speed.
