const hamberbtn = document.querySelector(".navbar__toggleBtn");
const menu = document.querySelector(".navbar__menu");
const icons = document.querySelector(".navbar__icons");

hamberbtn.addEventListener("click", () => {
  menu.classList.toggle('active');
  icons.classList.toggle('active');
});