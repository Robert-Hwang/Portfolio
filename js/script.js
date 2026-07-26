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

function initArchivePreview() {
  const modal = document.getElementById("archive-modal");
  const previewButtons = document.querySelectorAll("[data-archive-preview]");
  const previewImage = modal?.querySelector(".archive-modal__image");
  const previewTitle = modal?.querySelector("figcaption");

  if (!modal || !previewImage || !previewTitle || previewButtons.length === 0 || typeof modal.showModal !== "function") return;

  previewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const sourceImage = button.querySelector("img");
      if (!sourceImage) return;

      const title = button.dataset.archiveTitle || "Design Archive";
      previewImage.src = sourceImage.currentSrc || sourceImage.src;
      previewImage.alt = title;
      previewTitle.textContent = title;
      modal.showModal();
    });
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.close();
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

window.addEventListener("DOMContentLoaded", () => {
  initArchivePreview();
  initQuickNav();
  window.setTimeout(typeIntro, 180);
});
