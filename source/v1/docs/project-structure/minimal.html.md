---
title: Roda project / Project Structure / minimal
---

## Project Structure / Minimal

The **Minimal** scaffold option creates a bare-bones, ultra-lightweight Roda application. It is ideal for microservices, tiny APIs, single-file prototypes, or applications where you want complete control without additional directory setup or ORM overhead.

---

### Project Structure Overview

<pre>
├── boot.rb
├── config.ru
├── Gemfile
├── Guardfile
├── Rakefile
├── AGENTS.md
├── app/
│   └── [project_name].rb
├── bin/
│   └── roda
└── spec/
    ├── app/
    │   └── [project_name]_spec.rb
    └── spec_helper.rb
</pre>

---

### Key Components

*   **`boot.rb`**: Initializes Bundler and sets up the minimal Ruby load environment.
*   **`config.ru`**: standard Rack entry point that mounts your Roda app (`run MyApp`).
*   **`app/<project_name>.rb`**: Contains your main Roda application class definition, plugin inclusions, and route tree.
*   **`bin/roda`**: Embedded CLI script with essential commands for development (`bin/roda dev`), testing (`bin/roda test`), code linting (`bin/roda lint`), and server execution (`bin/roda server`).
*   **`spec/`**: Includes lightweight test setup with `spec_helper.rb` and initial RSpec or Minitest specs targeting your Roda app.
*   **`Gemfile`**: Contains only the core gems (`roda`, `puma`, `rack`, test gems, and `standard` for linting).
*   **`AGENTS.md`**: Project guidelines and development rules.
