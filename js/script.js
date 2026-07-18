const intro = document.getElementById("intro");
const siteMain = document.getElementById("siteMain");
const typingText = document.getElementById("typingText");
const quickNav = document.querySelector(".quick-nav");
const revealItems = document.querySelectorAll(".reveal");
const navDots = document.querySelectorAll(".quick-nav__dot");
const sections = ["profile", "about", "skills", "works", "contact"]
  .map((id) => document.getElementById(id))
  .filter(Boolean);

const lines = ["브랜드를 이해하고,", "웹과 컨텐츠를 설계하며,", "더 나은 디자인으로 완성합니다."];

document.body.classList.add("is-intro");

let revealInitialized = false;
let isArchiveFiltering = false;

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
    document.body.classList.remove("is-intro");
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

async function animateElements(elementList, keyframes, timing) {
  if (!("animate" in Element.prototype) || elementList.length === 0) return;

  const { stagger = 0, delay = 0, ...animationTiming } = timing;
  const animations = elementList.map((element, index) =>
    element.animate(keyframes, {
      ...animationTiming,
      delay: delay + index * stagger,
    }),
  );

  await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
  animations.forEach((animation) => animation.cancel());
}

function initArchiveFilters() {
  const archive = document.getElementById("archive");
  const filters = document.querySelectorAll(".archive__filter");
  const items = document.querySelectorAll(".archive-card");

  if (!archive || filters.length === 0 || items.length === 0) return;

  filters.forEach((filterButton) => {
    filterButton.addEventListener("click", async () => {
      if (isArchiveFiltering || filterButton.classList.contains("is-active")) return;

      const filter = filterButton.dataset.archiveFilter;
      const visibleItems = [...items].filter((item) => !item.classList.contains("is-hidden"));

      isArchiveFiltering = true;
      archive.classList.add("is-filtering");

      try {
        filters.forEach((item) => {
          item.classList.remove("is-active");
          item.setAttribute("aria-pressed", "false");
        });
        filterButton.classList.add("is-active");
        filterButton.setAttribute("aria-pressed", "true");

        await animateElements(
          visibleItems,
          [
            { opacity: 1, filter: "blur(0px)", transform: "translate3d(0, 0, 0) scale(1)" },
            { opacity: 0, filter: "blur(7px)", transform: "translate3d(0, 24px, 0) scale(0.98)" },
          ],
          { duration: 300, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards", stagger: 24 },
        );

        items.forEach((item) => {
          const isMatch = filter === "all" || item.dataset.archiveCategory === filter;
          item.classList.toggle("is-hidden", !isMatch);
        });

        const nextItems = [...items].filter((item) => !item.classList.contains("is-hidden"));
        nextItems.forEach((item) => item.classList.add("is-visible"));

        await animateElements(
          nextItems,
          [
            { opacity: 0, filter: "blur(8px)", transform: "translate3d(0, 42px, 0) scale(0.975)" },
            { opacity: 1, filter: "blur(0px)", transform: "translate3d(0, 0, 0) scale(1)" },
          ],
          { duration: 760, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "both", stagger: 75 },
        );
      } finally {
        archive.classList.remove("is-filtering");
        isArchiveFiltering = false;
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
  const modalPanel = modal?.querySelector(".project-modal__panel");
  const modalMedia = document.getElementById("modalMedia");
  const modalImage = document.getElementById("modalImage");
  const modalTitle = document.getElementById("modalTitle");
  const modalType = document.getElementById("modalType");
  const modalMeta = document.getElementById("modalMeta");
  const modalDesc = document.getElementById("modalDesc");
  const modalScope = document.getElementById("modalScope");
  const closeButtons = document.querySelectorAll("[data-close-modal]");
  const triggers = document.querySelectorAll(".modal-open");
  let lastFocusedElement = null;

  if (!modal || !modalPanel || !modalMedia || !modalImage || !modalTitle || !modalType || !modalMeta || !modalDesc || !modalScope) return;

  function openModal(source) {
    const dataSource = source.closest("[data-modal-item]");

    if (!dataSource) return;

    const imagePath = dataSource.dataset.modalImage || "";
    const title = dataSource.dataset.modalTitle || "Project";

    lastFocusedElement = source;
    modalTitle.textContent = title;
    modalType.textContent = dataSource.dataset.modalType || "";
    modalMeta.textContent = dataSource.dataset.modalMeta || "";
    modalDesc.textContent = dataSource.dataset.modalDesc || "";
    modalScope.textContent = dataSource.dataset.modalScope || "";
    modalMedia.hidden = !imagePath;
    modalImage.src = imagePath;
    modalImage.alt = imagePath ? `${title} preview` : "";
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    modalPanel.scrollTop = 0;
    modal.querySelector(".project-modal__close")?.focus();
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lastFocusedElement?.focus();
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
  initArchiveFilters();
  initQuickNav();
  initProjectModal();
  window.setTimeout(typeIntro, 180);
});
