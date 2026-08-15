---
title: Roda project / CLI / db
---

## CLI / db

The `db` command group provides database management tools powered by Sequel migrations. It allows you to create, drop, and migrate your database across development, test, and production environments.

### Commands

#### `bin/roda db create`
Creates the database configured in your application settings.
*   **SQLite**: Creates the SQLite database file and necessary parent directories.
*   **PostgreSQL / MySQL**: Executes native database creation utilities using connection info parsed from `Config.get[:db][:url]`.

<pre>
<code class="language-bash">$ bin/roda db create</code>
</pre>

#### `bin/roda db drop`
Drops the application database.
*   **SQLite**: Deletes the target `.sqlite3` database file if it exists.
*   **PostgreSQL / MySQL**: Executes native database drop commands.

<pre>
<code class="language-bash">$ bin/roda db drop</code>
</pre>

#### `bin/roda db migrate`
Runs Sequel schema migrations located in `db/migrations/`.

<pre>
<code class="language-bash">$ bin/roda db migrate [OPTIONS]</code>
</pre>

##### Options

*   **`-t`**, **`--target=N`**: Specifies a target migration version number (e.g. `1` or `003`) to migrate up or down to a specific schema version.

##### Examples

Migrate to the latest version:
<pre>
<code class="language-bash">$ bin/roda db migrate</code>
</pre>

Migrate to target version 1:
<pre>
<code class="language-bash">$ bin/roda db migrate -t 1</code>
</pre>

Migrate test environment database:
<pre>
<code class="language-bash">$ RACK_ENV=test bin/roda db migrate</code>
</pre>
