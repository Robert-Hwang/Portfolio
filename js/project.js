const projectRevealItems = document.querySelectorAll(".project-reveal");
const reduceProjectMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initProjectReveal() {
  projectRevealItems.forEach((item, index) => {
    item.style.setProperty("--project-delay", `${Math.min(index % 4, 3) * 90}ms`);
  });

  if (reduceProjectMotion || !("IntersectionObserver" in window)) {
    projectRevealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -7% 0px" },
  );

  projectRevealItems.forEach((item) => observer.observe(item));
}

window.addEventListener("DOMContentLoaded", initProjectReveal);
