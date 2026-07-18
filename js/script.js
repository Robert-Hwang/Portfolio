const intro = document.getElementById("intro");
const siteMain = document.getElementById("siteMain");
const typingText = document.getElementById("typingText");
const quickNav = document.querySelector(".quick-nav");
const revealItems = document.querySelectorAll(".reveal");
const navDots = document.querySelectorAll(".quick-nav__dot");
const worksSection = document.getElementById("works");
const sections = ["profile", "about", "skills", "works", "contact"]
  .map((id) => document.getElementById(id))
  .filter(Boolean);

const lines = ["기록하고,", "설계하고,", "더 나은 경험으로 완성합니다."];

document.body.classList.add("is-intro");

let revealInitialized = false;
let isFiltering = false;

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function typeIntro() {
  if (!typingText) {
    finishIntro();
    return;
  }

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    for (const char of line) {
      typingText.innerHTML += char;
      await sleep(80);
    }
    if (lineIndex < lines.length - 1) {
      typingText.innerHTML += "<br />";
      await sleep(300);
    }
  }

  await sleep(800);
  finishIntro();
}

function finishIntro() {
  if (siteMain) siteMain.classList.add("is-visible");
  document.body.classList.remove("is-intro");
  window.scrollTo({ top: 0, behavior: "auto" });

  window.requestAnimationFrame(() => {
    initReveal();
    if (intro) intro.classList.add("is-leaving");
  });

  window.setTimeout(() => {
    if (quickNav) quickNav.classList.add("is-visible");
  }, 1000);

  window.setTimeout(() => {
    if (intro) intro.classList.add("is-hidden");
  }, 1520);
}

function initReveal() {
  if (revealInitialized) return;
  revealInitialized = true;

  revealItems.forEach((item) => {
    const section = item.closest(".section");
    const sectionItems = section ? [...section.querySelectorAll(".reveal")] : [];
    const itemIndex = Math.max(0, sectionItems.indexOf(item));
    item.style.setProperty("--reveal-delay", `${Math.min(itemIndex, 4) * 160}ms`);
  });

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

  async function animateCards(cardList, keyframes, timing) {
    if (!("animate" in Element.prototype) || cardList.length === 0) return;

    const { stagger = 0, delay = 0, ...animationTiming } = timing;

    const animations = cardList.map((card, index) =>
      card.animate(keyframes, {
        ...animationTiming,
        delay: delay + index * stagger,
      }),
    );

    await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
    animations.forEach((animation) => animation.cancel());
  }

  tabs.forEach((tab) => {
    tab.setAttribute("aria-pressed", String(tab.classList.contains("is-active")));

    tab.addEventListener("click", async () => {
      if (isFiltering || tab.classList.contains("is-active")) return;

      const filter = tab.dataset.filter;
      const visibleCards = [...cards].filter((card) => !card.classList.contains("is-hidden"));

      isFiltering = true;
      if (worksSection) worksSection.classList.add("is-filtering");

      try {
        tabs.forEach((item) => {
          item.classList.remove("is-active");
          item.setAttribute("aria-pressed", "false");
        });
        tab.classList.add("is-active");
        tab.setAttribute("aria-pressed", "true");

        await animateCards(
          visibleCards,
          [
            { opacity: 1, filter: "blur(0px)", transform: "translate3d(0, 0, 0) scale(1)" },
            { opacity: 0, filter: "blur(8px)", transform: "translate3d(0, 44px, 0) scale(0.98)" },
          ],
          { duration: 420, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards", stagger: 60 },
        );

        cards.forEach((card) => {
          const isMatch = filter === "all" || card.dataset.category === filter;
          card.classList.toggle("is-hidden", !isMatch);
        });

        const nextCards = [...cards].filter((card) => !card.classList.contains("is-hidden"));
        nextCards.forEach((card) => card.classList.add("is-visible"));

        await animateCards(
          nextCards,
          [
            { opacity: 0, filter: "blur(10px)", transform: "translate3d(0, 70px, 0) scale(0.975)" },
            { opacity: 1, filter: "blur(0px)", transform: "translate3d(0, 0, 0) scale(1)" },
          ],
          { duration: 950, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "both", stagger: 140 },
        );
      } finally {
        if (worksSection) worksSection.classList.remove("is-filtering");
        isFiltering = false;
      }
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
  initTabs();
  initQuickNav();
  initProjectModal();
  window.setTimeout(typeIntro, 180);
});
