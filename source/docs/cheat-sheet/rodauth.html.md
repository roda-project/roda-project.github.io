---
title: Roda project / Cheat sheet / Rodauth
---

## Rodauth Cheat Sheet

> A quick-reference guide to Rodauth's architecture, internals, customization, and minimal setup.

---

### Table of Contents

<div data-turbo="false">
  <ul>
    <li><a href="#how-rodauth-interacts-with-roda" data-turbo="false">How Rodauth Interacts with Roda</a></li>
    <li><a href="#rodauth-architecture" data-turbo="false">Rodauth Architecture</a></li>
    <li><a href="#customizing-rodauth-views" data-turbo="false">Customizing Rodauth Views</a></li>
    <li><a href="#how-features-work-internally" data-turbo="false">How Features Work Internally</a></li>
    <li><a href="#database-migrations" data-turbo="false">Database Migrations</a></li>
    <li><a href="#minimal-working-implementation" data-turbo="false">Minimal Working Implementation</a></li>
    <li><a href="#quick-reference" data-turbo="false">Quick Reference</a></li>
    <li><a href="#architecture-summary" data-turbo="false">Architecture Summary</a></li>
  </ul>
</div>

---

<h2 id="how-rodauth-interacts-with-roda">How Rodauth Interacts with Roda</h2>

#### The Plugin Hook

  Rodauth is a **Roda plugin**. Loading it is one line:

  <pre>
  <code class="language-ruby">plugin :rodauth do
# configuration...
  end
  </code>
  </pre>

  Under the hood, <code>Roda::RodaPlugins.register_plugin(:rodauth, Rodauth)</code> makes Roda recognize the <code>:rodauth</code> plugin name. Roda then calls <code>Rodauth.configure</code> and mixes in three modules:

  <table>
    <thead>
      <tr>
        <th>Module</th>
        <th>What it adds</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>ClassMethods</code></td>
        <td><code>.rodauth</code>, <code>.precompile_rodauth_templates</code></td>
      </tr>
      <tr>
        <td><code>InstanceMethods</code></td>
        <td><code>#rodauth</code> — access the auth instance</td>
      </tr>
      <tr>
        <td><code>RequestMethods</code></td>
        <td><code>#rodauth</code> inside <code>route</code> blocks (dispatcher)</td>
      </tr>
    </tbody>
  </table>

#### The Route Dispatch Flow

  <ol>
    <li>Browser request</li>
    <li><code>Roda#route</code> block</li>
    <li><code>r.rodauth</code> — calls <code>Rodauth::RequestMethods#rodauth</code></li>
    <li><code>Rodauth::Auth#route!</code></li>
    <li>Looks up path in <code>route_hash</code> (O(1) lookup)</li>
    <li>Finds <code>handle_&lt;feature&gt;_route</code> method</li>
    <li><code>request.is("/login") do</code> — Roda's path matcher</li>
  </ol>

  <pre>
  <code class="language-ruby">request.is("/login") do
  check_csrf               # CSRF protection
  _around_rodauth do       # wraps hooks
    before_rodauth         # global before hook
    send(_handle_login)    # the actual GET/POST handler
  end
end
  </code>
  </pre>

  **Key insight:** <code>route_hash</code> is a frozen <code>Hash</code> mapping URL paths (e.g., <code>"/login"</code>) to handler methods (e.g., <code>:handle_login</code>). It's built once during <code>post_configure</code>, so dispatch is a simple hash lookup.

#### Automatic Dependencies

  When <code>plugin :rodauth</code> loads, it automatically requires Roda plugins you likely need:

  <ul>
    <li><code>:json</code> + <code>:json_parser</code> — if JSON API is enabled</li>
    <li><code>:render</code> — for templates (can be disabled)</li>
    <li><code>:route_csrf</code> or <code>:csrf</code> — CSRF protection</li>
    <li><code>:flash</code> — flash messages</li>
    <li><code>:h</code> — HTML escaping helper</li>
  </ul>

  ---

<h2 id="rodauth-architecture">Rodauth Architecture</h2>

#### Layer Diagram

  <table>
    <thead>
      <tr>
        <th>Layer</th>
        <th>Contents</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Your Roda App</strong></td>
        <td>
          <p><code>plugin :rodauth do ... end</code></p>
          <p><code>route do |r| ... end</code></p>
          <p><code>r.rodauth</code> — dispatches to Rodauth</p>
          <p><code>r.get 'dashboard' { ... }</code></p>
        </td>
      </tr>
      <tr>
        <td><strong>Rodauth::Auth</strong> (your subclass)</td>
        <td>
          <p>Includes: Base + Login + Logout + OTP + ...</p>
          <p>Has: <code>route_hash</code>, features list, configuration</p>
        </td>
      </tr>
      <tr>
        <td><strong>Feature Modules</strong> (mixin)</td>
        <td>
          <ul>
            <li><code>Rodauth::Base</code> — core (always loaded)</li>
            <li><code>Rodauth::Login</code> — login/logout routes</li>
            <li><code>Rodauth::Otp</code> — TOTP two-factor</li>
            <li><code>Rodauth::Remember</code> — remember me cookies</li>
            <li>... 50+ more features</li>
          </ul>
        </td>
      </tr>
      <tr>
        <td><strong>Your Database</strong> (Sequel)</td>
        <td>
          <p><code>accounts</code>, <code>account_password_reset_keys</code>,</p>
          <p><code>account_otp_keys</code>, <code>account_remember_keys</code>, ...</p>
        </td>
      </tr>
    </tbody>
  </table>

#### The Configuration DSL

  <pre>
  <code class="language-ruby">plugin :rodauth do
# 1. Set up features (order doesn't matter — deps auto-load)
  enable :login, :logout, :reset_password, :otp

# 2. Configure database
  db DB
  accounts_table :users
  password_hash_column :ph

# 3. Set redirects
  login_redirect { '/home' }
  logout_redirect { '/goodbye' }

# 4. Set params
  login_param :email
  password_param :pass

# 5. Customize behavior with blocks
  already_logged_in { redirect '/' }
  set_session_value { |k,v| session[k] = v }  # custom session store

# 6. Override any auth method
  login_view do
    view('login', 'Sign In')  # custom title
  end
end
  </code>
  </pre>

  **The three method categories:**

  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th>What they are</th>
        <th>Example</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>auth_value_methods</code></td>
        <td>Configuration values (setters/getters)</td>
        <td><code>login_redirect</code>, <code>db</code></td>
      </tr>
      <tr>
        <td><code>auth_methods</code></td>
        <td>Public runtime methods</td>
        <td><code>login</code>, <code>logged_in?</code></td>
      </tr>
      <tr>
        <td><code>auth_private_methods</code></td>
        <td>Private runtime methods</td>
        <td><code>_set_password</code></td>
      </tr>
    </tbody>
  </table>

  All three can be **overridden** in the configuration block.

#### Feature Dependencies

  Features declare dependencies with <code>depends</code>:

  <pre>
  <code class="language-ruby"># otp.rb
depends :two_factor_base, :require_domain, :require_hmac_secret
  </code>
  </pre>

  When you <code>enable :otp</code>, Rodauth automatically loads <code>:two_factor_base</code> first, then <code>:otp</code>. You never need to manually list dependencies.

#### The Auth Instance Lifecycle

  <ol>
    <li>Request comes in</li>
    <li><code>Roda scope#rodauth(name=nil)</code></li>
  </ol>

  <ul>
    <li>If <code>name</code> is nil: <code>@_rodauth ||= Auth.new(scope)</code></li>
    <li>If <code>name</code> is provided: <code>(@_rodauths ||= {})[name] ||= Auth.new(scope)</code></li>
  </ul>

  <p>The Auth instance holds:</p>
  <ul>
    <li><code>@scope</code> (the Roda instance)</li>
    <li><code>@features</code> (included modules)</li>
    <li><code>@routes</code> (flat list of all routes)</li>
    <li><code>@route_hash</code> (path to method mapping)</li>
  </ul>

  <p>Methods called on the auth instance:</p>
  <ul>
    <li><code>r.rodauth</code> → <code>route!</code> → dispatches to feature handler</li>
    <li><code>auth.logged_in?</code> → checks session</li>
    <li><code>auth.login('password')</code> → creates session</li>
  </ul>

#### Session Architecture

  <table>
    <thead>
      <tr>
        <th>Session (server-side)</th>
        <th>Cookies (client-side)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <ul>
            <li><code>account_id</code> → <code>42</code></li>
            <li><code>authenticated_by</code> → <code>['pw']</code></li>
            <li><code>two_factor_setup</code> → <code>true</code></li>
            <li><code>otp_auth</code> → <code>true</code></li>
          </ul>
        </td>
        <td>
          <ul>
            <li><code>rack.session</code> → encrypted</li>
            <li><code>remember</code> → <code>"42_hmac_key"</code></li>
          </ul>
        </td>
      </tr>
    </tbody>
  </table>

  <ul>
    <li><strong>Login</strong> — sets <code>account_id</code> in session</li>
    <li><strong>2FA</strong> — appends to <code>authenticated_by</code> array</li>
    <li><strong>Logout</strong> — <code>clear_session</code></li>
    <li><strong>Remember</strong> — sets a signed cookie, auto-login on next visit</li>
  </ul>

  ---

<h2 id="customizing-rodauth-views">Customizing Rodauth Views</h2>

#### Template Resolution Priority

  <ol>
    <li><strong>Roda render plugin</strong> — looks in your <code>views/</code> directory (e.g., <code>views/login.str</code>)</li>
    <li><strong>Rodauth built-in templates</strong> — fallback to <code>templates/login.str</code></li>
  </ol>

  <p><strong>To override a template:</strong> create a file with the same name in your Roda views directory.</p>

#### Template Composition Pattern

  Templates are **composable** — they call sub-templates via the <code>rodauth</code> local:

  <pre>
  <code class="language-erb">&lt;!-- templates/login.str --&gt;
#{rodauth.login_form_header}
#{rodauth.render('login-form')}
#{rodauth.login_form_footer}

&lt;!-- templates/login-form.str --&gt;
&lt;form method="post" class="rodauth" role="form"&gt;
#{rodauth.csrf_tag}
#{rodauth.render('login-field')}
#{rodauth.render('password-field')}
#{rodauth.button(rodauth.login_button)}
&lt;/form&gt;

&lt;!-- templates/login-field.str --&gt;
&lt;div class="form-group"&gt;
#{rodauth.render('login-field-label')}
#{rodauth.render('login-field-input')}
&lt;/div&gt;
  </code>
  </pre>

  This means you can override just the input field without touching the form.

#### Method 1: Override Template Files

  <pre>
  <code class="language-ruby"># In your Roda app setup
plugin :render, views: 'app/views', engine: 'str'

# Then create:
#   app/views/login.str          ← overrides login page
#   app/views/password-field.str ← overrides password input
#   app/views/button.str         ← overrides ALL buttons
  </code>
  </pre>

#### Method 2: Override View Methods in Config

  <pre>
  <code class="language-ruby">plugin :rodauth do
# Change the login page title
  login_view do
    view('login', 'Welcome Back!')
  end

# Add extra HTML to login form
  login_additional_form_tags do
    "&lt;input type='hidden' name='source' value='web' /&gt;"
  end
end
  </code>
  </pre>

#### Method 3: Override Field Rendering

  <pre>
  <code class="language-ruby">plugin :rodauth do
# Custom HTML attributes for all fields
  field_attributes do |field|
    'data-custom="value"'
  end

# Custom attributes for fields with errors
  field_error_attributes do |field|
    ' aria-invalid="true" class="error"'
  end

# Custom error message format
  formatted_field_error do |field, error|
    "&lt;span class='error-msg'&gt;#{error}&lt;/span&gt;"
  end

# Suffix all labels (e.g., add a colon)
  input_field_label_suffix ':'
end
  </code>
  </pre>

#### Method 4: Template Options

  <pre>
  <code class="language-ruby">plugin :rodauth do
# Pass custom locals to all templates
  template_opts locals: { app_name: 'MyApp' }

# Custom layout
  template_opts layout_opts: { path: 'app/views/layout.str' }
end
  </code>
  </pre>

#### All Built-in Templates

  <table>
    <thead>
      <tr>
        <th>Template</th>
        <th>Used By</th>
      </tr>
    </thead>
    <tbody>
      <tr><td><code>login</code></td><td>Login page</td></tr>
      <tr><td><code>login-form</code></td><td>Login form partial</td></tr>
      <tr><td><code>login-field</code></td><td>Login input field</td></tr>
      <tr><td><code>password-field</code></td><td>Password input field</td></tr>
      <tr><td><code>button</code></td><td>Submit button</td></tr>
      <tr><td><code>logout</code></td><td>Logout confirmation</td></tr>
      <tr><td><code>reset-password-request</code></td><td>Request password reset</td></tr>
      <tr><td><code>reset-password</code></td><td>New password form</td></tr>
      <tr><td><code>remember</code></td><td>Remember me settings</td></tr>
      <tr><td><code>otp-setup</code></td><td>TOTP enrollment</td></tr>
      <tr><td><code>otp-auth</code></td><td>TOTP code entry</td></tr>
      <tr><td><code>otp-disable</code></td><td>TOTP removal</td></tr>
      <tr><td><code>two-factor-manage</code></td><td>2FA method management</td></tr>
      <tr><td><code>two-factor-auth</code></td><td>2FA verification</td></tr>
      <tr><td><code>change-password</code></td><td>Password change form</td></tr>
      <tr><td><code>create-account</code></td><td>Account creation form</td></tr>
      <tr><td><code>verify-account</code></td><td>Account verification</td></tr>
      <tr><td><code>lockout</code></td><td>Locked account message</td></tr>
    </tbody>
  </table>

  ---

<h2 id="how-features-work-internally">How Features Work Internally</h2>

#### Anatomy of a Feature

  Every feature follows this pattern:

  <pre>
  <code class="language-ruby">module Rodauth
  Feature.define(:login) do
# ── Routes ──
    route do
# GET /login  → show form
# POST /login → process login
    end

# ── Views ──
    view('login', 'Login')

# ── Redirects ──
    redirect('/login') { request.referer || '/' }

# ── Auth Value Methods (configuration) ──
    auth_value_methods :login_redirect, :login_param

# ── Auth Methods (runtime) ──
    auth_methods :login, :logged_in?

# ── Auth Private Methods ──
    auth_private_methods :_login_from_session

# ── Dependencies ──
    depends :base

# ── Email ──
    email(:login_notice, 'Login Notice')

# ── Session/Flash Keys ──
    session_key :login_redirect_key, :login_redirect
    flash_key :login_flash_key, :login_notice

# ── Before/After Hooks ──
    before :login_route
    after :login

# ── Button Text ──
    button 'Login', :login_button

# ── Loaded Templates ──
    loaded_templates %w[login login-form login-field password-field button]
  end
end
  </code>
  </pre>

#### The Request Lifecycle (Inside a Route)

  <ol>
    <li><code>r.rodauth</code> called</li>
    <li><code>Auth#route!</code> looks up path in <code>route_hash</code></li>
    <li><code>handle_login_route</code> runs:
      <ul>
        <li><code>request.is("/login") do</code>
          <ul>
            <li><code>check_csrf!</code> (CSRF token verification)</li>
            <li><code>_around_rodauth do</code>
              <ul>
                <li><code>before_rodauth</code> (global before hook)</li>
                <li><code>before_login_route</code> (feature before hook)</li>
                <li><code>_handle_login(request) do</code>
                  <ul>
                    <li><code>check_already_logged_in</code> (skip if logged in)</li>
                    <li><code>r.get?</code> → <code>login_view</code> (show form)</li>
                    <li><code>r.post?</code> → <code>_login</code> (process credentials)</li>
                  </ul>
                </li>
                <li><code>after_login_route</code> (feature after hook)</li>
                <li><code>after_rodauth</code> (global after hook)</li>
              </ul>
            </li>
          </ul>
        </li>
        <li><code>nil</code> — Roda continues routing if no match</li>
      </ul>
    </li>
  </ol>

#### Login Feature Internals

  <p><strong>POST /login</strong></p>
  <ol>
    <li>Find account by login param
      <ul><li>Not found → set error flash, redirect to <code>/login</code></li></ul>
    </li>
    <li>Check account status
      <ul><li>Unverified → redirect to <code>/verify-account</code></li></ul>
    </li>
    <li>Verify password (BCrypt)
      <ul><li>Invalid → increment <code>invalid_logins</code>, redirect to <code>/login</code></li></ul>
    </li>
    <li>Call <code>login('password')</code>:
      <ol>
        <li>Save redirect location (session)</li>
        <li>Run <code>before_login</code> hook</li>
        <li><code>login_session('password')</code>:
          <ul>
            <li><code>session[:account_id] = account.id</code></li>
            <li><code>session[:authenticated_by] = ['password']</code></li>
          </ul>
        </li>
        <li>Run <code>after_login</code> hook</li>
        <li>Response: redirect with notice flash</li>
      </ol>
    </li>
  </ol>

#### Two-Factor Authentication Internals

  <p><strong>Normal Login</strong></p>
  <p><code>session[authenticated_by] = ['password']</code></p>

  <p>Check: <code>authenticated_by.length &gt;= 2?</code></p>
  <table>
    <thead>
      <tr>
        <th>Yes</th>
        <th>No</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Full Access</strong></td>
        <td><strong>2FA Required</strong></td>
      </tr>
    </tbody>
  </table>

  <p><strong>GET /multifactor-auth</strong></p>
  <table>
    <thead>
      <tr>
        <th>TOTP Code</th>
        <th>Recovery Code</th>
        <th>SMS Code</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td colspan="3" style="text-align: center"><code>two_factor_authenticate('totp')</code></td>
      </tr>
      <tr>
        <td colspan="3" style="text-align: center"><code>session[:authenticated_by] &lt;&lt; 'totp'</code></td>
      </tr>
      <tr>
        <td colspan="3" style="text-align: center"><strong>Full Access</strong> (length &gt;= 2)</td>
      </tr>
    </tbody>
  </table>

  <p><strong>Key session keys for 2FA:</strong></p>
  <table>
    <thead>
      <tr>
        <th>Session Key</th>
        <th>Purpose</th>
      </tr>
    </thead>
    <tbody>
      <tr><td><code>authenticated_by</code></td><td>Array of auth methods used</td></tr>
      <tr><td><code>two_factor_setup</code></td><td>Whether 2FA was fully set up</td></tr>
      <tr><td><code>two_factor_auth_failures</code></td><td>Failed 2FA attempt counter</td></tr>
      <tr><td><code>otp_auth</code></td><td>Whether TOTP was verified</td></tr>
      <tr><td><code>otp_setup</code></td><td>Whether TOTP key was stored</td></tr>
    </tbody>
  </table>

#### Remember Me Internals

  <p><strong>Login with "Remember Me" checked</strong></p>
  <ol>
    <li>Generate <code>remember_key</code> (random token)</li>
    <li>Store in DB: <code>account_remember_keys</code></li>
    <li>Set cookie: <code>"account_id_hmac(signed_key)"</code></li>
  </ol>

  <p><strong>Next visit (not logged in)</strong></p>
  <ol>
    <li><code>rodauth.load_memory</code> (in route block)</li>
    <li>Parse cookie → extract <code>account_id</code> + key</li>
    <li>Verify HMAC signature</li>
    <li>Look up key in DB</li>
  </ol>

  <table>
    <thead>
      <tr>
        <th>Valid</th>
        <th>Invalid</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Auto-login, delete old key, set new key</td>
        <td>Ignore cookie</td>
      </tr>
    </tbody>
  </table>

#### Password Reset Internals

  <ol>
    <li><strong>GET /reset-password-request</strong> — User enters login</li>
    <li><strong>POST /reset-password-request</strong>
      <ul>
        <li>Find account</li>
        <li>Generate <code>reset_key</code> (random)</li>
        <li>Store in DB: <code>account_password_reset_keys</code>
          <ul>
            <li><code>key</code>: <code>hmac_signed(reset_key)</code></li>
            <li><code>deadline</code>: now + 1 day</li>
          </ul>
        </li>
        <li>Send email with link: <code>/reset-password?key=account_id_hmac(signed_key)</code></li>
      </ul>
    </li>
    <li><strong>GET /reset-password?key=...</strong>
      <ul>
        <li>Store key in session (security: don't expose in URL)</li>
        <li>Redirect to <code>/reset-password</code></li>
      </ul>
    </li>
    <li><strong>GET /reset-password</strong>
      <ul>
        <li>Look up key in session</li>
        <li>Validate key exists in DB, not expired</li>
        <li>Show new password form</li>
      </ul>
    </li>
    <li><strong>POST /reset-password</strong>
      <ul>
        <li>Validate key still valid</li>
        <li>Check password requirements</li>
        <li>Update password hash in DB</li>
        <li>Delete reset key (single-use)</li>
        <li>Redirect to login with success flash</li>
      </ul>
    </li>
  </ol>

#### Hook System

  Every feature supports <code>before</code> and <code>after</code> hooks at two levels:

  <table>
    <thead>
      <tr>
        <th>Level</th>
        <th>Hooks</th>
        <th>Scope</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Global</strong> (from base)</td>
        <td><code>before_rodauth</code> / <code>after_rodauth</code></td>
        <td>Runs for ALL routes</td>
      </tr>
      <tr>
        <td><strong>Feature</strong> (per-route)</td>
        <td><code>before_login_route</code> / <code>after_login_route</code>, <code>before_login</code> / <code>after_login</code></td>
        <td>Runs for specific routes</td>
      </tr>
    </tbody>
  </table>

  Override in config:

  <pre>
  <code class="language-ruby">plugin :rodauth do
  before :login_route do
# runs before GET/POST /login
    audit_log_attempt(request.params)
  end

  after :login do
# runs after successful login
    update_last_login_date(account_id)
  end
end
  </code>
  </pre>

  ---

<h2 id="database-migrations">Database Migrations</h2>

#### Minimal Schema (Login + Logout Only)

  <pre>
  <code class="language-ruby"># db/migrations/001_create_rodauth_tables.rb
  require 'sequel'

  Sequel.migration do
    change do
# ── Accounts table ──
      create_table(:accounts) do
        primary_key :id
        String :email, null: false, unique: true
        Integer :status_id, null: false, default: 2  # 2 = verified/open
        String :ph  # password hash (BCrypt)
        DateTime :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
        DateTime :updated_at
      end

# ── Password hashes (separate table for security) ──
      create_table(:account_password_hashes) do
        primary_key :id
        foreign_key :account_id, :accounts, null: false
        String :password_hash, null: false
        DateTime :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      end
      add_index :account_password_hashes, :account_id, unique: true
    end
  end
  </code>
  </pre>

#### Common Feature Tables

  <pre>
  <code class="language-ruby"># db/migrations/002_create_rodauth_feature_tables.rb
  Sequel.migration do
    change do
# ── Remember Me ──
      create_table(:account_remember_keys) do
        primary_key :id
        foreign_key :account_id, :accounts, null: false
        String :key, null: false
        DateTime :deadline, null: false
        DateTime :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      end
      add_index :account_remember_keys, :account_id, unique: true

# ── Reset Password ──
      create_table(:account_password_reset_keys) do
        primary_key :id
        foreign_key :account_id, :accounts, null: false
        String :key, null: false
        DateTime :deadline, null: false
        DateTime :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      end
      add_index :account_password_reset_keys, :account_id, unique: true

# ── Verify Account ──
      create_table(:account_verification_keys) do
        primary_key :id
        foreign_key :account_id, :accounts, null: false
        String :key, null: false
        DateTime :deadline, null: false
        DateTime :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      end
      add_index :account_verification_keys, :account_id, unique: true

# ── OTP (TOTP) ──
      create_table(:account_otp_keys) do
        primary_key :id
        foreign_key :account_id, :accounts, null: false
        String :key, null: false
        DateTime :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
        DateTime :last_use
        Integer :num_failures, default: 0
      end
      add_index :account_otp_keys, :account_id, unique: true

# ── Recovery Codes ──
      create_table(:account_recovery_codes) do
        primary_key :id
        foreign_key :account_id, :accounts, null: false
        String :code, null: false
        DateTime :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      end
      add_index :account_recovery_codes, [:account_id, :code], unique: true

# ── SMS Codes ──
      create_table(:account_sms_codes) do
        primary_key :id
        foreign_key :account_id, :accounts, null: false
        String :code, null: false
        String :phone_number, null: false
        DateTime :deadline, null: false
        DateTime :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      end

# ── Account Lockout ──
      create_table(:account_login_failures) do
        primary_key :id
        foreign_key :account_id, :accounts, null: false
        Integer :number, null: false, default: 1
        DateTime :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      end
      add_index :account_login_failures, :account_id, unique: true

      create_table(:account_lockouts) do
        primary_key :id
        foreign_key :account_id, :accounts, null: false
        String :key, null: false
        DateTime :deadline, null: false
        DateTime :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      end
      add_index :account_lockouts, :account_id, unique: true

# ── Active Sessions ──
      create_table(:account_active_session_keys) do
        primary_key :id
        foreign_key :account_id, :accounts, null: false
        String :key, null: false
        DateTime :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
        DateTime :last_use
      end
      add_index :account_active_session_keys, :account_id, unique: true

# ── Single Session ──
      create_table(:account_session_keys) do
        primary_key :id
        foreign_key :account_id, :accounts, null: false
        String :key, null: false
        DateTime :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      end
      add_index :account_session_keys, :account_id, unique: true

# ── Password Expiration ──
      create_table(:account_password_change_times) do
        primary_key :id
        foreign_key :account_id, :accounts, null: false
        DateTime :changed_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      end
      add_index :account_password_change_times, :account_id, unique: true

# ── Disallow Password Reuse ──
      create_table(:account_previous_password_hashes) do
        primary_key :id
        foreign_key :account_id, :accounts, null: false
        String :password_hash, null: false
        DateTime :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      end

# ── Verify Login Change ──
      create_table(:account_login_change_keys) do
        primary_key :id
        foreign_key :account_id, :accounts, null: false
        String :key, null: false
        String :login, null: false
        DateTime :deadline, null: false
        DateTime :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      end
      add_index :account_login_change_keys, :account_id, unique: true

# ── Email Auth ──
      create_table(:account_email_auth_keys) do
        primary_key :id
        foreign_key :account_id, :accounts, null: false
        String :key, null: false
        DateTime :deadline, null: false
        DateTime :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      end
      add_index :account_email_auth_keys, :account_id, unique: true

# ── Audit Logging ──
      create_table(:account_authentication_audit_logs) do
        primary_key :id
        foreign_key :account_id, :accounts, null: false
        String :action, null: false
        String :ip_address
        DateTime :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      end

# ── JWT Refresh Tokens ──
      create_table(:account_jwt_refresh_keys) do
        primary_key :id
        foreign_key :account_id, :accounts, null: false
        String :key, null: false
        DateTime :deadline, null: false
        DateTime :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      end
      add_index :account_jwt_refresh_keys, :account_id, unique: true

# ── WebAuthn ──
      create_table(:account_webauthn_keys) do
        primary_key :id
        foreign_key :account_id, :accounts, null: false
        String :webauthn_id, null: false
        String :public_key, null: false
        Integer :sign_count, default: 0
        DateTime :last_use
        DateTime :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      end

      create_table(:account_webauthn_user_ids) do
        primary_key :id
        foreign_key :account_id, :accounts, null: false
        String :webauthn_user_id, null: false, unique: true
        DateTime :created_at, null: false, default: Sequel::CURRENT_TIMESTAMP
      end

# ── Account Expiration ──
      create_table(:account_activity_times) do
        primary_key :id
        foreign_key :account_id, :accounts, null: false
        DateTime :last_activity_at
        DateTime :last_login_at
        DateTime :expired_at
      end
      add_index :account_activity_times, :account_id, unique: true
    end
  end
  </code>
  </pre>

#### Feature-to-Table Mapping

  <table>
    <thead>
      <tr>
        <th>Feature(s)</th>
        <th>Table(s) Created</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>*(always)*</td><td><code>accounts</code>, <code>account_password_hashes</code></td></tr>
      <tr><td><code>remember</code></td><td><code>account_remember_keys</code></td></tr>
      <tr><td><code>reset_password</code></td><td><code>account_password_reset_keys</code></td></tr>
      <tr><td><code>verify_account</code></td><td><code>account_verification_keys</code></td></tr>
      <tr><td><code>otp</code></td><td><code>account_otp_keys</code></td></tr>
      <tr><td><code>recovery_codes</code></td><td><code>account_recovery_codes</code></td></tr>
      <tr><td><code>sms_codes</code></td><td><code>account_sms_codes</code></td></tr>
      <tr><td><code>lockout</code></td><td><code>account_login_failures</code>, <code>account_lockouts</code></td></tr>
      <tr><td><code>active_sessions</code></td><td><code>account_active_session_keys</code></td></tr>
      <tr><td><code>single_session</code></td><td><code>account_session_keys</code></td></tr>
      <tr><td><code>password_expiration</code></td><td><code>account_password_change_times</code></td></tr>
      <tr><td><code>disallow_password_reuse</code></td><td><code>account_previous_password_hashes</code></td></tr>
      <tr><td><code>verify_login_change</code></td><td><code>account_login_change_keys</code></td></tr>
      <tr><td><code>email_auth</code></td><td><code>account_email_auth_keys</code></td></tr>
      <tr><td><code>audit_logging</code></td><td><code>account_authentication_audit_logs</code></td></tr>
      <tr><td><code>jwt</code> (with refresh)</td><td><code>account_jwt_refresh_keys</code></td></tr>
      <tr><td><code>webauthn</code></td><td><code>account_webauthn_keys</code>, <code>account_webauthn_user_ids</code></td></tr>
      <tr><td><code>account_expiration</code></td><td><code>account_activity_times</code></td></tr>
    </tbody>
  </table>

#### Running Migrations

  <pre>
  <code class="language-bash"># Run all pending migrations
ruby -e "require 'sequel'; DB = Sequel.connect(ENV['DATABASE_URL']); Sequel.extension :migration; Sequel::Migrator.run(DB, 'db/migrations')"

# Or use the Sequel CLI
sequel -m db/migrations sqlite://db/development.sqlite3
  </code>
  </pre>

#### Quick Test Data (for development)

  <pre>
  <code class="language-ruby"># Insert a test account (password: "password123")
  require 'bcrypt'
  hash = BCrypt::Password.create('password123')

  DB[:accounts].insert(
    email: 'test@example.com',
    status_id: 2,  # verified
    ph: hash,
    created_at: Sequel::CURRENT_TIMESTAMP
  )
  </code>
  </pre>

  ---

<h2 id="minimal-working-implementation">Minimal Working Implementation</h2>

#### Gemfile

  <pre>
  <code class="language-ruby">source 'https://rubygems.org'

  gem 'roda'
  gem 'rodauth'
  gem 'sequel'
  gem 'sqlite3'       # or 'pg', 'mysql2'
  gem 'bcrypt'
  gem 'rackup'
  </code>
  </pre>

#### Directory Structure

  <ul>
    <li><code>my_app/</code>
      <ul>
        <li><code>config.ru</code></li>
        <li><code>app.rb</code></li>
        <li><code>views/</code>
          <ul>
            <li><code>layout.str</code></li>
          </ul>
        </li>
      </ul>
    </li>
  </ul>

#### config.ru

  <pre>
  <code class="language-ruby">require './app'
  run App.freeze.app
  </code>
  </pre>

#### app.rb — The Complete Minimal Example

  <pre>
  <code class="language-ruby">require 'roda'
  require 'sequel'
  require 'rodauth'

  DB = Sequel.sqlite # Use your real database in production

# ── Create the accounts table ──
  DB.create_table?(:accounts) do
    primary_key :id
    String :email, null: false, unique: true
    Integer :status_id, default: 2  # 2 = verified/unlocked
    String :ph  # password hash (BCrypt)
  end

  class App < Roda
# ── Plugins ──
    plugin :render, views: 'views', engine: 'str'
    plugin :flash
    plugin :route_csrf
    plugin :sessions, secret: ENV.fetch('SESSION_SECRET') { 'change-me' * 6 }, key: 'myapp.session'

# ── Rodauth Configuration ──
    plugin :rodauth do
# Database
      db DB
      accounts_table :accounts
      password_hash_column :ph

# Enable features
      enable :login, :logout, :create_account, :reset_password

# Redirects
      login_redirect  { '/dashboard' }
      logout_redirect { '/' }

# Params
      login_param    :email
      password_param :password

# Session keys
      session_key :account_id_key, :account_id
      session_key :authenticated_by_key, :authenticated_by

# Set page title for views
      title_instance_variable :@page_title
    end

# ── Routing ──
    route do |r|
# CSRF check for non-GET requests
      check_csrf! unless r.get?

# Auto-login via remember cookie
      rodauth.load_memory

# This dispatches all Rodauth routes (login, logout, etc.)
      r.rodauth

# Your app routes
      r.root do
# Require authentication
        rodauth.require_login
        view 'dashboard'
      end

      r.get 'dashboard' do
        rodauth.require_login
        "Welcome, #{rodauth.account[:email]}!"
      end
    end
  end
  </code>
  </pre>

#### views/layout.str

  <pre>
  <code class="language-erb">&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
  &lt;title&gt;&lt;%= @page_title || 'My App' %&gt;&lt;/title&gt;
  &lt;style&gt;
    .flash-notice { color: green; }
    .flash-error  { color: red; }
    .rodauth label { display: block; margin-top: 10px; }
    .rodauth input { display: block; padding: 5px; }
  &lt;/style&gt;
&lt;/head&gt;
&lt;body&gt;
  &lt;% if flash[:notice] %&gt;
    &lt;div class="flash-notice"&gt;&lt;%= flash[:notice] %&gt;&lt;/div&gt;
  &lt;% end %&gt;
  &lt;% if flash[:error] %&gt;
    &lt;div class="flash-error"&gt;&lt;%= flash[:error] %&gt;&lt;/div&gt;
  &lt;% end %&gt;

  &lt;%= yield %&gt;
&lt;/body&gt;
&lt;/html&gt;
  </code>
  </pre>

#### Running the App

  <pre>
  <code class="language-bash">bundle install
  bundle exec rackup -p 9292
  </code>
  </pre>

  Then visit <code>http://localhost:9292/</code> — you'll be redirected to <code>/login</code>.

#### Testing with curl

  <pre>
  <code class="language-bash"># Create an account (POST /create-account)
curl -X POST http://localhost:9292/create-account \
       -d "email=test@example.com&amp;password=secret123&amp;password-confirm=secret123" \
       -c cookies.txt

# Login (POST /login)
curl -X POST http://localhost:9292/login \
      -d "email=test@example.com&amp;password=secret123" \
      -c cookies.txt -b cookies.txt

# Access dashboard (GET /dashboard)
curl http://localhost:9292/dashboard \
      -b cookies.txt

# Logout (POST /logout)
curl -X POST http://localhost:9292/logout \
      -c cookies.txt -b cookies.txt
  </code>
  </pre>

#### The Bare Minimum (No Views)

  If you want to use Rodauth **without any views** (pure API/JSON):

  <pre>
  <code class="language-ruby">plugin :rodauth, json: true, csrf: false do
  db DB
  enable :login, :logout, :create_account
  login_redirect { '/' }
  logout_redirect { '/' }
end

route do |r|
  r.rodauth  # handles /login, /logout, etc. as JSON
end
  </code>
  </pre>

  With <code>json: true</code>, all responses are JSON:

  <pre>
  <code class="language-json">// POST /login — success
{ "status": "success", "redirect": "/dashboard" }

// POST /login — failure
{ "status": "error", "error": "invalid_login", "message": "Invalid login or password" }
  </code>
  </pre>

---

<h2 id="quick-reference">Quick Reference</h2>

#### Configuration Options Cheat Sheet

  <pre>
  <code class="language-ruby">plugin :rodauth do
# ── Core ──
  db DB                                    # Sequel database connection
  accounts_table :users                    # Table name for accounts
  password_hash_column :ph                # Column for BCrypt hash
  status_column :status_id                # Column for account status

# ── Features ──
  enable :login, :logout, :create_account, :reset_password, :otp, :remember

# ── Routes ──
  login_redirect  { '/home' }
  logout_redirect { '/' }
  require_login_redirect { '/login' }

# ── Params ──
  login_param    :email
  password_param :password

# ── Security ──
  bcrypt_cost 10                           # BCrypt cost (default: 12)
  require_login_confirmation false          # Skip confirmation field
  allow_password_change_with_old_password true

# ── Two-Factor ──
  two_factor_auth_type 'totp'              # Default 2FA method
  otp_drift 30                             # TOTP time drift tolerance
  max_otp_failures 5                       # Lockout after N failures

# ── Views ──
  title_instance_variable :@page_title      # Set page title
  template_opts locals: { app_name: 'My' } # Custom locals
  view('login', 'Sign In')                 # Override page title

# ── Session ──
  session_key :account_id_key, :account_id
  session_key :authenticated_by_key, :authenticated_by
  session_expiration_warning 3600          # Warn before session expires

# ── Hooks ──
  before :login_route { audit(request) }
  after  :login       { notify(account) }

# ── Emails ──
  email_from 'no-reply@example.com'
  send_email do |email|
    # Your email sending logic
  end

# ── Customization ──
  field_attributes { |f| 'data-field="custom"' }
  formatted_field_error { |f, e| "&lt;em&gt;#{e}&lt;/em&gt;" }
  login_additional_form_tags { '&lt;input type="hidden" name="ref" value="web" /&gt;' }

# ── Account Status ──
  # status_id: 1 = unverified, 2 = verified, 3 = locked
  unverified_account_redirect { '/verify' }
  locked_account_redirect { '/locked' }

# ── Already Logged In ──
  already_logged_in { redirect '/' }
end
  </code>
  </pre>

#### Feature Enable Cheat Sheet

  <table>
    <thead>
      <tr>
        <th>Feature</th>
        <th>What it adds</th>
        <th>Routes</th>
      </tr>
    </thead>
    <tbody>
      <tr><td><code>login</code></td><td>User login</td><td>GET/POST <code>/login</code></td></tr>
      <tr><td><code>logout</code></td><td>User logout</td><td>GET/POST <code>/logout</code></td></tr>
      <tr><td><code>create_account</code></td><td>Self-registration</td><td>GET/POST <code>/create-account</code></td></tr>
      <tr><td><code>reset_password</code></td><td>Password reset via email</td><td>GET/POST <code>/reset-password*</code></td></tr>
      <tr><td><code>change_password</code></td><td>Change own password</td><td>GET/POST <code>/change-password</code></td></tr>
      <tr><td><code>change_login</code></td><td>Change email/login</td><td>GET/POST <code>/change-login</code></td></tr>
      <tr><td><code>verify_account</code></td><td>Verify account via email</td><td>GET/POST <code>/verify-account</code></td></tr>
      <tr><td><code>verify_login_change</code></td><td>Verify login change via email</td><td>GET/POST <code>/verify-login-change</code></td></tr>
      <tr><td><code>close_account</code></td><td>Delete own account</td><td>GET/POST <code>/close-account</code></td></tr>
      <tr><td><code>remember</code></td><td>Remember me cookies</td><td>GET/POST <code>/remember</code></td></tr>
      <tr><td><code>otp</code> / <code>two_factor_base</code></td><td>TOTP two-factor auth</td><td>GET/POST <code>/otp-*</code></td></tr>
      <tr><td><code>recovery_codes</code></td><td>Backup recovery codes</td><td>GET/POST <code>/recovery-codes</code></td></tr>
      <tr><td><code>sms_codes</code></td><td>SMS two-factor codes</td><td>GET/POST <code>*sms-codes*</code></td></tr>
      <tr><td><code>email_auth</code></td><td>Email-based magic links</td><td>GET/POST <code>/email-auth</code></td></tr>
      <tr><td><code>lockout</code></td><td>Account lockout on failures</td><td>GET <code>/lockout</code></td></tr>
      <tr><td><code>active_sessions</code></td><td>Invalidate old sessions</td><td>(none, internal)</td></tr>
      <tr><td><code>single_session</code></td><td>One session per account</td><td>(none, internal)</td></tr>
      <tr><td><code>session_expiration</code></td><td>Auto-expire inactive sessions</td><td>(none, internal)</td></tr>
      <tr><td><code>audit_logging</code></td><td>Log security events</td><td>(none, internal)</td></tr>
      <tr><td><code>internal_request</code></td><td>Programmatic API (no HTTP)</td><td>(none, internal)</td></tr>
      <tr><td><code>json</code></td><td>JSON API responses</td><td>(modifier, no routes)</td></tr>
      <tr><td><code>jwt</code></td><td>JWT token responses</td><td>(modifier, no routes)</td></tr>
    </tbody>
  </table>

---

<h2 id="architecture-summary">Architecture Summary</h2>

  <p><strong>Request flow:</strong></p>
  <p><code>Request → Roda route block → r.rodauth → Auth#route! → route_hash lookup → handle_feature_route</code></p>

  <table>
    <thead>
      <tr>
        <th>GET path</th>
        <th>POST path</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Show form</td>
        <td>Process action</td>
      </tr>
      <tr>
        <td>Render template</td>
        <td>Redirect + flash</td>
      </tr>
    </tbody>
  </table>

  <p><strong>Key design principles:</strong></p>
  <ol>
    <li><strong>Plugin-based</strong> — Rodauth is a Roda plugin, not a framework</li>
    <li><strong>Feature-composed</strong> — Each feature is a mixin module, loaded on demand</li>
    <li><strong>Route-hash dispatch</strong> — O(1) path-to-handler lookup, no regex scanning</li>
    <li><strong>Template composition</strong> — Views are built from small partials you can override individually</li>
    <li><strong>Hook-based extensibility</strong> — <code>before</code>/<code>after</code> hooks let you customize without overriding</li>
    <li><strong>Convention over configuration</strong> — Sensible defaults, minimal config needed</li>
    <li><strong>Database agnostic</strong> — Works with any Sequel-supported database</li>
  </ol>
