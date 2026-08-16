---
title: Roda project - Getting Started
---

<h1 class="visually-hidden"> Roda Project </h1>

## Getting Started

[![Gem Version](https://badge.fury.io/rb/roda-project.svg)](https://badge.fury.io/rb/roda-project)
[![CI](https://github.com/roda-project/roda-project/actions/workflows/main.yml/badge.svg)](https://github.com/roda-project/roda-project/actions/workflows/main.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**`roda-project`** is a command-line interface (CLI) tool designed to quickly scaffold scalable, modern <a href="https://roda.jeremyevans.net/" target="_blank">Roda</a> web applications and APIs.

#### ✨ Benefits
- Code autoloading (Zeitwerk)
- Built in generators (bin/roda)
- Useful development tasks (console, db, dev, assets) (bin/roda)
- Faster setup following your preferences (database, project type, test framework)
- Modern front-end setup built in for full-stack projects (with esbuild)
- Hot reload
- Optionated project structure: more maintenable and friendly for AI's (But easy to change if needed)
- i18n and many others necessary plugins pre-configured
- Get the job done, keeping good performance (Roda, even with many plugins, is 4x faster than Rails and 2x from Hanami using less memory than both)
- Production ready

---

### Step 1: Installation

Install the `roda-project` gem globally via RubyGems:

<pre>
<code class="language-bash">$ gem install roda-project</code>
</pre>

---

### Step 2: Scaffold Your Application

Run `roda-project` in your terminal to start the interactive application wizard:

<pre>
<code class="language-bash">$ roda-project</code>
</pre>

The CLI will prompt you to select your application options:

1. **Project Name**: Enter the directory and app name (e.g. `my_app`).
2. **Architecture**:
   * **Fullstack**: Includes views (ERB), asset pipeline (`esbuild`), and full web frontend setup.
   * **API**: Lightweight JSON-focused structure.
   * **Minimal**: Bare-bones single-file Roda application.
3. **Testing Framework**: Choose between **RSpec** or **Minitest**.
4. **Database** *(Fullstack & API)*: Choose **SQLite**, **PostgreSQL**, or **MySQL**.
5. **Authentication** *(Fullstack & API with Database)*: Optionally include **Rodauth** authentication templates.

---

### Step 3: Install Dependencies

Navigate into your generated project directory and bundle Ruby dependencies:

<pre>
<code class="language-bash">$ cd my_app && bundle install</code>
</pre>

If you created a **Fullstack** application, Node.js dependencies will also be installed when compiling assets:

<pre>
<code class="language-bash">$ bin/roda assets</code>
</pre>

---

### Step 4: Setup the Database (If applicable)

If your project includes a database (PostgreSQL, MySQL, or SQLite):

1. For PostgreSQL/MySQL, configure your database credentials in `app/config/config.rb` or set your `DATABASE_URL`.
2. Create the database:

<pre>
<code class="language-bash">$ bin/roda db create</code>
</pre>

3. Run initial Sequel schema migrations:

<pre>
<code class="language-bash">$ bin/roda db migrate</code>
</pre>

---

### Step 5: Start Development Mode with `bin/roda dev`

To start local development with continuous watching and automatic reloads:

<pre>
<code class="language-bash">$ bin/roda dev</code>
</pre>

* Executes Puma server and `Guard` to watch for file changes in routes, models, views, and assets.
* Open your browser at `http://localhost:4000`.

For **Fullstack** apps, compile static frontend assets in watch mode concurrently:

<pre>
<code class="language-bash">$ bin/roda assets -w</code>
</pre>
