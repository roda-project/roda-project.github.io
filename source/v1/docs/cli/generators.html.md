---
title: Roda project / CLI / generators
---

## CLI / generators

The `generate` subcommand group (aliased as `g`) provides code generators to scaffold Sequel database migrations, Sequel ORM models, and Roda hash branch routes with specs and views.

### `bin/roda g routes <branch_name> [route_name:method...]`

Scaffolds a Roda hash branch file in `app/routes/`, matching spec files in `spec/app/routes/`, and ERB views in `app/views/` (for GET routes in fullstack projects).

<pre>
<code class="language-bash">$ bin/roda g routes admin users:get posts:post</code>
</pre>

result:

<pre>
<code class="language-ruby">class Awd                   
  hash_branch "admin" do |r|
    r.get "users" do        
      view('users') # view app/views/admin/users.erb also created         
    end                     
                            
    r.post "posts" do       
    end                     
  end                       
end                         
</code>
</pre>

*   **Route Specifications**: Format routes as `name:method` (e.g., `users:get`, `create:post`). Default method is `get`.
*   **Nested Branches**: Supports nested paths (e.g. `api/v1`). Provides helper reminders for loading nested hash branches with `autoload_hash_branch_dir`.
*   **Options**: Use `--no-views` to skip view template creation.

In some cases, we dont need to name a path inside a hash_branch, so we can explicity generate it with this syntax: 

<pre>
<code class="language-bash">$ bin/roda g routes books :get :post :delete</code>
</pre>

result:

<pre>
<code class="language-ruby">class Awd                   
  hash_branch "books" do |r|
    r.get do                
      view('index') # view app/views/books/index.erb also created         
    end                     
                            
    r.post do               
    end                     
                            
    r.delete do             
    end                     
  end                       
end                         
</code>
</pre>

---

### `bin/roda g model <name> [field:type...]`

Generates a Sequel ORM model class in `app/models/`, a matching model spec in `spec/app/models/`, and a corresponding Sequel migration file in `db/migrations/`.

<pre>
<code class="language-bash">$ bin/roda g model Post title:string body:text published:boolean</code>
</pre>

*   **Namespaced Models**: Supports directory/module namespacing, e.g. `bin/roda g model Admin/User name:string`.
*   **Pluralized Table Names**: Automatically infers table names and sets Sequel model class definitions.

---

### `bin/roda g service <name>`

Generates a service class in `app/services/` and a matching service spec in `spec/app/services/`.

<pre>
<code class="language-bash">$ bin/roda g service my_service</code>
</pre>

*   **Namespaced Models**: Supports directory/module namespacing, e.g. `bin/roda g service user/create`.
*   **Service types**: We can choose if the generated service will be a class or module with `bin/roda g service <type> <name>` (defaults to class). Example:

<pre>
<code class="language-bash">$ bin/roda g service module my_service</code>
</pre>

---

### `bin/roda g migration <name> [field:type...]`

Creates a timestamped Sequel migration file under `db/migrations/`.

<pre>
<code class="language-bash">$ bin/roda g migration add_status_to_users status:string</code>
</pre>

*   **Automatic Action Detection**: Analyzes the migration name (e.g. `add_..._to_...`, `remove_..._from_...`, `create_...`) to construct appropriate migration code blocks automatically (follow the same Rails conventions).
*   **Field Types**: Supports field type specs like `title:string`, `age:integer`, `user:references`, `bio:text`, etc.
