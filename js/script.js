const intro = document.getElementById("intro");
const siteMain = document.getElementById("siteMain");
const typingText = document.getElementById("typingText");
const quickNav = document.querySelector(".quick-nav");
const revealItems = document.querySelectorAll(".reveal");
const navDots = document.querySelectorAll(".quick-nav__dot");
const sections = ["profile", "about", "skills", "works", "contact"]
  .map((id) => document.getElementById(id))
  .filter(Boolean);

const lines = ["기록하고,", "설계하고,", "더 나은 경험으로 완성합니다."];

document.body.classList.add("is-intro");

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function typeIntro() {
  if (!typingText || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    finishIntro();
    return;
  }

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    for (const char of line) {
      typingText.innerHTML += char;
      await sleep(72);
    }
    if (lineIndex < lines.length - 1) {
      typingText.innerHTML += "<br />";
      await sleep(260);
    }
  }

  await sleep(620);
  finishIntro();
}

function finishIntro() {
  if (intro) intro.classList.add("is-hidden");
  if (siteMain) siteMain.classList.add("is-visible");
  if (quickNav) quickNav.classList.add("is-visible");
  document.body.classList.remove("is-intro");
  window.scrollTo({ top: 0, behavior: "instant" });
}

function initReveal() {
  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
  );

  revealItems.forEach((item) => observer.observe(item));
}

function initTabs() {
  const tabs = document.querySelectorAll(".works__tab");
  const cards = document.querySelectorAll(".work-card");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const filter = tab.dataset.filter;

      tabs.forEach((item) => item.classList.remove("is-active"));
      tab.classList.add("is-active");

      cards.forEach((card) => {
        const isMatch = filter === "all" || card.dataset.category === filter;
        card.classList.toggle("is-hidden", !isMatch);
      });
    });
  });
}

function initQuickNav() {
  function setActiveDot() {
    let current = sections[0]?.id;

    sections.forEach((section) => {
      const top = section.getBoundingClientRect().top + window.scrollY;
      if (window.scrollY >= top - 360) current = section.id;
    });

    navDots.forEach((dot) => {
      dot.classList.toggle("is-active", dot.getAttribute("href") === `#${current}`);
    });
  }

  window.addEventListener("scroll", setActiveDot, { passive: true });
  window.addEventListener("resize", setActiveDot);
  setActiveDot();
}

function initProjectModal() {
  const modal = document.getElementById("projectModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalType = document.getElementById("modalType");
  const modalDesc = document.getElementById("modalDesc");
  const modalStack = document.getElementById("modalStack");
  const closeButtons = document.querySelectorAll("[data-close-modal]");
  const triggers = document.querySelectorAll(".work-card__image, .project-open");

  if (!modal || !modalTitle || !modalType || !modalDesc || !modalStack) return;

  function openModal(source) {
    const card = source.closest(".work-card");
    const dataSource = source.classList.contains("work-card__image")
      ? source
      : card?.querySelector(".work-card__image");

    if (!dataSource) return;

    modalTitle.textContent = dataSource.dataset.projectTitle || "Project";
    modalType.textContent = dataSource.dataset.projectType || "";
    modalDesc.textContent = dataSource.dataset.projectDesc || "";
    modalStack.textContent = dataSource.dataset.projectStack || "";
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => openModal(trigger));
  });

  closeButtons.forEach((button) => button.addEventListener("click", closeModal));

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  initReveal();
  initTabs();
  initQuickNav();
  initProjectModal();
  window.setTimeout(typeIntro, 180);
});
