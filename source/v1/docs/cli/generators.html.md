---
title: Roda project / CLI / generators
---

## CLI / generators

The `generate` subcommand group (aliased as `g`) provides code generators to scaffold Sequel database migrations, Sequel ORM models, and Roda hash branch routes with specs and views.

### `bin/roda g migration <name> [field:type...]`

Creates a timestamped Sequel migration file under `db/migrations/`.

<pre>
<code class="language-bash">$ bin/roda g migration add_status_to_users status:string</code>
</pre>

*   **Automatic Action Detection**: Analyzes the migration name (e.g. `add_..._to_...`, `remove_..._from_...`, `create_...`) to construct appropriate migration code blocks automatically.
*   **Field Types**: Supports field type specs like `title:string`, `age:integer`, `user:references`, `bio:text`, etc.

---

### `bin/roda g model <name> [field:type...]`

Generates a Sequel ORM model class in `app/models/`, a matching model spec in `spec/app/models/`, and a corresponding Sequel migration file in `db/migrations/`.

<pre>
<code class="language-bash">$ bin/roda g model Post title:string body:text published:boolean</code>
</pre>

*   **Namespaced Models**: Supports directory/module namespacing, e.g. `bin/roda g model Admin/User name:string`.
*   **Pluralized Table Names**: Automatically infers table names and sets Sequel model class definitions.

---

### `bin/roda g routes <branch_name> [route_name:method...]`

Scaffolds a Roda hash branch file in `app/routes/`, matching spec files in `spec/app/routes/`, and ERB views in `app/views/` (for GET routes in fullstack projects).

<pre>
<code class="language-bash">$ bin/roda g routes admin users:get posts:post</code>
</pre>

*   **Route Specifications**: Format routes as `name:method` (e.g., `users:get`, `create:post`). Default method is `get`.
*   **Nested Branches**: Supports nested paths (e.g. `api/v1`). Provides helper reminders for loading nested hash branches with `autoload_hash_branch_dir`.
*   **Options**: Use `--no-views` to skip view template creation.
