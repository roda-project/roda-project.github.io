---
title: Roda project - Project Structure
---

The CLI generates a well-organized project structure designed for Roda applications, emphasizing modularity, and ease of development. Below is a breakdown of the key directories and their intended contents:

#### Top-Level Files

*   **`boot.rb`**: This is the application's boot-up file. It handles RubyGems bundling, Zeitwerk auto-loading for application code, and initializes essential service providers like database connections, mailers, and loggers.
*   **`config.ru`**: The Rack configuration file. It defines the Rack application stack, including middleware (e.g., `Rack::LiveReload` for development) and mounts the main Roda application (`MyApp`).
*   **`esbuild.js`**: Configuration for `esbuild`, a fast JavaScript bundler. It defines how frontend assets (JavaScript and CSS) are processed, bundled, and outputted to the `public` directory. It supports watch mode for development.
*   **`Gemfile`**: Lists all Ruby gem dependencies for the project, categorized by environment (e.g., `development`, `test`).
*   **`Guardfile`**: Configuration for `Guard`, a tool that watches for file changes and automatically runs tasks (e.g., restarting Puma, triggering LiveReload).
*   **`package.json`**: Manages Node.js dependencies, primarily for frontend tooling like `esbuild` and JavaScript libraries (e.g., `@hotwired/turbo`).
*   **`Rakefile`**: Defines various Rake tasks for common development and deployment operations, such as database migrations, running tests, linting, starting development/production servers, and generating new migrations or routes.
*   **`AGENTS.md`**: Contains project-specific guidelines and conventions, often detailing testing requirements, code style, and other development practices.

#### **app/** Directory

This directory houses the core application logic and components.

*   **`app/my_app.rb`**: The main Roda application class. It defines Roda plugins and global configurations.
*   **`app/assets/`**: Contains uncompiled source assets for the frontend.
*   **`app/config/`**: Application-specific configuration and service providers.
    *   **`app/config/config.rb`**: Defines application-wide settings such as secrets, environment variables, internationalization paths, and database connection details.
    *   **`app/config/locales/`**: Stores YAML files for internationalization (i18n). Each file corresponds to a language (e.g., `en.yml`, `pt-br.yml`) and can be organized into subdirectories for modularity (e.g., `foo/en.yml`).
    *   **`app/config/providers/`**: Contains classes responsible for initializing and providing access to external services or shared resources.
        *   **`app/config/providers/db/conn.rb`**: Establishes and manages the database connection using Sequel.
        *   **`app/config/providers/logger.rb`**: Configures and provides a logger instance.
        *   **`app/config/providers/mailer.rb`**: Configures the mail delivery method.
*   **`app/models/`**: Contains Sequel ORM models, representing the application's database entities (e.g., `account.rb`).
*   **`app/routes/`**: Houses Roda's hash branches, which define specific routing logic for different parts of the application (e.g., `foo.rb` for routes under `/foo`).
*   **`app/views/`**: Stores application templates and view-related components.
    *   **`.erb` files**: Embedded Ruby templates (e.g., `index.erb`, `layout.erb`, `foo/bar.erb`). These define the HTML structure and presentation logic.
    *   **`html.rb`**: Ruby classes that encapsulate reusable HTML components or view helpers, often using libraries like `HtmlSlice` for building HTML fragments programmatically (e.g., `Views::Html`, `Views::Foo::Html`).

#### **db/** Directory

Dedicated to database management.

*   **`db/migrations/`**: Contains Sequel migration files (e.g., `001_add_rodauth.rb`). These files define schema changes for the database, allowing for version control of the database structure.
*   **`db/seeds.rb`**: A script for populating the database with initial data, useful for development or testing environments.

#### **public/** Directory

This directory serves static assets directly to the client. These files are typically the output of frontend build processes.

*   **`public/css/`**: Compiled CSS files (e.g., `app.css`).
*   **`public/images/`**: Static image assets (e.g., `roda-project.png`).
*   **`public/js/`**: Compiled JavaScript files (e.g., `app.js`).
*   **`public/exception_page.css`**: Custom CSS for the Roda exception page, providing a styled error display in development.

#### **spec/** Directory

Contains all RSpec or Minitest tests for the application.

*   **`spec/spec_helper.rb`**: The main RSpec configuration file. It sets up the test environment, includes testing utilities (like `rack-test`), and configures database transaction rollbacks for isolated tests.
*   **`spec/app/`**: Tests specifically for the application's core logic.
