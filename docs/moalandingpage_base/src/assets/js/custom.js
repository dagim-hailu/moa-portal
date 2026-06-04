


import "./glight.js"



  // Smooth Scroll
  document.querySelectorAll('.nav-link[href^="#"]').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();

      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        window.scrollTo({
          top: target.offsetTop - 80, // adjust for sticky navbar height
          behavior: "smooth"
        });
      }
    });
  });

  // Active link on scroll
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  window.addEventListener("scroll", () => {
    let scrollPos = window.scrollY + 100; // offset

    sections.forEach(sec => {
      if (scrollPos >= sec.offsetTop && scrollPos < sec.offsetTop + sec.offsetHeight) {
        navLinks.forEach(link => {
          link.classList.remove("active");
          if (link.getAttribute("href") === `#${sec.id}`) {
            link.classList.add("active");
          }
        });
      }
    });
  });
