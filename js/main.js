
/* =====================================
   NESEMBA E-SPORTS 2026
   MAIN JAVASCRIPT
===================================== */

document.addEventListener("DOMContentLoaded", function () {

    // LOADING SCREEN
    const loader = document.querySelector(".loader");

    window.addEventListener("load", function () {
        if (loader) {
            loader.classList.add("loader-hidden");

            setTimeout(function () {
                loader.style.display = "none";
            }, 600);
        }
    });

    // MOBILE NAVIGATION
    const menuButton = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (menuButton && navLinks) {
        menuButton.addEventListener("click", function () {
            navLinks.classList.toggle("active");
            menuButton.classList.toggle("active");
        });

        navLinks.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                navLinks.classList.remove("active");
                menuButton.classList.remove("active");
            });
        });
    }

    // NAVBAR SCROLL EFFECT
    const navbar = document.querySelector(".navbar");

    window.addEventListener("scroll", function () {
        if (navbar) {
            navbar.classList.toggle("scrolled", window.scrollY > 50);
        }
    });

    // AUTOMATIC FOOTER YEAR
    const yearElement = document.querySelector("#current-year");

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // SMOOTH SCROLL
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener("click", function (event) {
            const target = document.querySelector(
                this.getAttribute("href")
            );

            if (target) {
                event.preventDefault();

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });
    });

    console.log("NESEMBA E-SPORTS: SYSTEM ONLINE");
});
