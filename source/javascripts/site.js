document.addEventListener('DOMContentLoaded', function() {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const content = document.getElementById('sidebar-content');

  if (sidebarToggle && sidebar && overlay && content) {
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('is-open');
      overlay.classList.toggle('is-open');
      // Optional: Add a class to content to push it, if needed for more complex layouts
      // content.classList.toggle('sidebar-open');
    });

    overlay.addEventListener('click', function() {
      sidebar.classList.remove('is-open');
      overlay.classList.remove('is-open');
      // content.classList.remove('sidebar-open');
    });
  }
});
