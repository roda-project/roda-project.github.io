---
title: Roda project / Project Structure / api-fullstack
---

# Project Structure / Fullstack (Inertia.js)

When creating a fullstack project and selecting the Inertia frontend option, the <a href="https://github.com/henrique-ft/roda-inertia-lite" target="_blank">roda-inertia-lite</a> plugin is added, and the `assets` directory has the following structure:

---

###<i class="fa-solid fa-folder-open"></i> Assets

<pre class="dirs">
app/
└── assets/
    └── js/
        ├── inertia/
        │    ├── components/
        │    └── views/
        │        └── foo.jsx
        └── app.js
</pre>

---

###<i class="fa-solid fa-folder-open"></i> Key Components

*   **`app/assets/js/app.js`**: This is where Inertia is initialized.
*   **`app/assets/js/inertia/`**: This directory contains all the files for the Inertia.js application.
*   **`app/assets/js/inertia/view/`**: This is the directory where Inertia looks for pages (or views). In routes, files within this directory are referenced using the `inertia` method, e.g.:

<pre>
<code class="language-ruby"># app/routes/admin.rb
class Awd                   
  hash_branch "admin" do |r|
    r.get "users" do        
      inertia('admin/Users', { users: User.all }) # call app/assets/js/inertia/views/admin/Users.jsx
    end                       
  end                         
end
</code>
</pre>
