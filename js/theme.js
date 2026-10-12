// js/theme.js
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("theme-toggle");
  const htmlElement = document.documentElement;
  
  // Load saved themes
  const savedTheme = localStorage.getItem("expense-tracker-theme") || "light";
  htmlElement.setAttribute("data-theme", savedTheme);
  updateButtonText(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = htmlElement.getAttribute("data-theme");
      const newTheme = currentTheme === "light" ? "dark" : "light";
      
      htmlElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("expense-tracker-theme", newTheme);
      updateButtonText(newTheme);
    });
  }

  function updateButtonText(theme) {
    if (themeToggle) {
      themeToggle.textContent = theme === "light" ? "Dark Theme" : "Light Theme";
    }
  }
});
