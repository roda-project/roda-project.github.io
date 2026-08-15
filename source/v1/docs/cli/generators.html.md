---
title: Roda project / CLI / generators
---

## CLI / generators

To get a quick overview of all available tasks, simply run `rake` or `rake -T` in your project's root directory.

#### General Tasks

These tasks provide general utilities for interacting with your application and managing its codebase.

*   **`$ rake`** (or `rake default`)
    This command serves as a convenient way to list all available Rake tasks along with their brief descriptions.

*   **`$ rake console`** (alias: `rake c`)
    This task opens an `irb` console, pre-loading your application's environment. This allows you to directly interact with your models, configurations, and other application components for debugging or quick data manipulation.

*   **`$ rake lint`**
    To maintain code quality and consistency, this task runs `standardrb` to check your Ruby code for style and potential quality issues.

*   **`$ rake lint:fix`**
    If `standardrb` identifies any style issues, this task will attempt to automatically fix them, helping you adhere to the project's coding standards effortlessly.

*   **`$ rake test`**
    This task executes your application's RSpec test suite. It's important to note that it sets the `RACK_ENV` to `test` before running the tests, ensuring a consistent testing environment.

#### Database Tasks

These tasks are essential for managing your application's database schema.

*   **`$ rake db:migrate`**
    This command is used to migrate your database schema to its latest version. You also have the flexibility to specify a target version if you need to roll back or forward to a particular database state.
    *   To migrate to the latest version: `rake db:migrate`
        To migrate to a specific version (e.g., version 123): `rake db:migrate[123]`

#### Server Tasks

These tasks help you run your Roda application in different environments.

*   **`$ rake dev`**
    This task starts the Puma web server in development mode on port 4000, making your application accessible for local development.

*   **`$ rake dev:watch`**
    For a more dynamic development experience, this task starts the Puma web server in development mode and utilizes `guard` to watch for file changes. This setup automatically reloads the application or triggers other development tasks, such as LiveReload, as you make changes to your code.

*   **`$ rake prod`**
    When you're ready to deploy, this task starts the Puma web server in production mode on port 4000. It's crucial to set the `DATABASE_URL` and `SESSION_SECRET` environment variables before running this task. Additionally, it leverages Ruby's YJIT for enhanced performance in production.
    *   **Usage**: `DATABASE_URL="postgres://user:pass@host:port/db" SESSION_SECRET="your_secret_key" rake prod`

#### Asset Compilation Tasks

These tasks are dedicated to managing your frontend assets.

*   **`$ rake assets`**
    This command first installs any necessary Node.js dependencies (if they aren't already present) and then compiles your frontend assets, including JavaScript and CSS, using `esbuild`.

*   **`$ rake assets:watch`**
    For continuous frontend development, this task installs Node.js dependencies and then starts `esbuild` in watch mode. This means your frontend assets will be automatically recompiled whenever changes are detected in your source files.

#### Generation Tasks

These tasks provide convenient ways to scaffold new components for your application.

*   **`$ rake g:migration[migration_name]`**
    This task generates a new, empty Sequel migration file within the `db/migrations/` directory. The file will be prefixed with a timestamp and named according to the `migration_name` you provide.
    *   **Arguments**: `migration_name` (e.g., `add_posts_table`) - A descriptive name for the migration.
    *   **Usage**: `rake g:migration[add_posts_table]`


*   **`$ rake g:routes[branch_name,route1,method:route2,...]`**
    This powerful task generates a new Roda hash branch file in `app/routes/`, along with corresponding RSpec tests in `spec/app/routes/`. Optionally, it can also generate view files in `app/views/` for `GET` routes.
    *   **Arguments**:
        *   `branch_name` (e.g., `admin`, `api/v1`): This defines the name of the Roda branch and influences the generated file name and directory structure.
        *   `route1, method:route2,...`: A comma-separated list of routes. Routes can be simple names (which default to `GET`, e.g., `users`) or explicitly specified with an HTTP method (e.g., `posts:post`, `items:put`).
    *   **Usage**:
        To generate a branch `foo` with a `GET /foo/bar` route: `rake g:routes[foo,bar]`
        To generate a branch `admin` with `GET /admin/users` and `POST /admin/products` routes: `rake g:routes[admin,users,products:post]`
