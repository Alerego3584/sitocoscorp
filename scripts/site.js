window.AleregoSite = {
  links: {
    instagram: "https://www.instagram.com/alerego.ph/",
    instagramHandle: "@alerego.ph",
    instagramCosplay: "https://www.instagram.com/alerego.ph/",
    instagramCorporate: "https://www.instagram.com/alerego.ph/",
    linkedin: "https://www.linkedin.com/",
    email: "contact@alerego.dev"
  },

  mediaUrl(path) {
    if (!path) return "";
    return path.startsWith("/media/") || path.startsWith("/images/") ? path : `/media/${path}`;
  },

  collectPaths(sets, type, key, legacyKey) {
    const out = [];
    const seen = new Set();
    (sets || [])
      .filter((item) => item && item.type === type)
      .forEach((item) => {
        const list = [];
        if (Array.isArray(item[key])) list.push(...item[key]);
        if (legacyKey && item[legacyKey]) list.push(item[legacyKey]);
        list.forEach((path) => {
          if (path && !seen.has(path)) {
            seen.add(path);
            out.push(path);
          }
        });
      });
    return out;
  },

  imageExists(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  },

  isLandscapeUrl(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.naturalWidth > img.naturalHeight);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  },

  async firstLandscapePath(paths) {
    for (const path of paths || []) {
      if (await this.isLandscapeUrl(this.mediaUrl(path))) return path;
    }
    return null;
  },

  fillPhotoField(container, paths, options = {}) {
    if (!container) return;
    const limit = options.limit || 4;
    const className = options.className || "field-shot";
    const fallback = options.fallback || [];
    const chosen = (paths && paths.length ? paths : fallback).slice(0, limit);
    container.innerHTML = "";
    chosen.forEach((path, index) => {
      const img = document.createElement("img");
      img.className = `${className} ${className}--${index + 1}`;
      img.src = window.AleregoSite.mediaUrl(path);
      img.alt = "";
      img.decoding = "async";
      container.appendChild(img);
    });
  }
};

(() => {
  const site = window.AleregoSite;
  const links = site.links;
  const t = (key, vars) => window.AleregoI18n ? window.AleregoI18n.t(key, vars) : key;

  const yearNodes = document.querySelectorAll("[data-year]");
  const year = String(new Date().getFullYear());
  yearNodes.forEach((node) => {
    node.textContent = year;
  });

  const nav = document.querySelector(".site-nav");
  const toggle = document.querySelector("[data-nav-toggle]");
  if (nav && toggle) {
    const setNavOpen = (open) => {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? t("nav.closeMenu") : t("nav.menu"));
    };
    toggle.addEventListener("click", () => {
      setNavOpen(!nav.classList.contains("is-open"));
    });
    nav.querySelectorAll(".site-nav__links a").forEach((link) => {
      link.addEventListener("click", () => setNavOpen(false));
    });
  }

  document.querySelectorAll("[data-social]").forEach((node) => {
    const key = node.getAttribute("data-social");
    if (key === "instagramCosplay") node.href = links.instagramCosplay;
    if (key === "instagramCorporate") node.href = links.instagramCorporate;
    if (key === "linkedin") node.href = links.linkedin;
    if (key === "email") node.href = `mailto:${links.email}`;
  });

  const fillContact = () => {
    const title = dialog.querySelector("#contact-title");
    const lead = dialog.querySelector(".contact-dialog__lead");
    const closeBtn = dialog.querySelector(".contact-dialog__close");
    if (title) title.textContent = t("contact.title");
    if (lead) lead.textContent = t("contact.lead");
    if (closeBtn) closeBtn.textContent = t("contact.close");
  };

  const dialog = document.createElement("div");
  dialog.className = "contact-dialog";
  dialog.id = "contact-dialog";
  dialog.innerHTML = `
    <div class="contact-dialog__backdrop" data-contact-close></div>
    <div class="contact-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="contact-title" tabindex="-1">
      <h2 id="contact-title">${t("contact.title")}</h2>
      <p class="contact-dialog__lead">${t("contact.lead")}</p>
      <a class="contact-choice" href="${links.instagram}" target="_blank" rel="noopener">
        <img src="/images/social/instagram.svg" alt="" width="20" height="20">
        <span>
          <span>Instagram</span>
          <strong>${links.instagramHandle}</strong>
        </span>
      </a>
      <a class="contact-choice" href="mailto:${links.email}">
        <img src="/images/social/mail.svg" alt="" width="20" height="20">
        <span>
          <span>Email</span>
          <strong>${links.email}</strong>
        </span>
      </a>
      <button type="button" class="btn btn--ghost contact-dialog__close" data-contact-close>${t("contact.close")}</button>
    </div>
  `;
  document.body.appendChild(dialog);
  fillContact();
  window.addEventListener("alerego:lang", fillContact);

  const panel = dialog.querySelector(".contact-dialog__panel");
  let lastFocus = null;
  let ignoreBackdrop = false;

  const closeContact = () => {
    dialog.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    document.querySelectorAll("[data-contact-open]").forEach((btn) => {
      btn.setAttribute("aria-expanded", "false");
    });
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  };

  const openContact = (from) => {
    lastFocus = from || document.activeElement;
    ignoreBackdrop = true;
    dialog.classList.add("is-open");
    document.body.classList.add("is-locked");
    document.querySelectorAll("[data-contact-open]").forEach((btn) => {
      btn.setAttribute("aria-expanded", "true");
    });
    panel.focus();
    window.setTimeout(() => {
      ignoreBackdrop = false;
    }, 250);
  };

  document.querySelectorAll("[data-contact-open]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      document.querySelector(".site-nav")?.classList.remove("is-open");
      document.querySelector("[data-nav-toggle]")?.setAttribute("aria-expanded", "false");
      document.querySelector("[data-nav-toggle]")?.setAttribute("aria-label", t("nav.menu"));
      if (dialog.classList.contains("is-open")) closeContact();
      else openContact(btn);
    });
  });

  dialog.addEventListener("click", (event) => {
    if (ignoreBackdrop) return;
    if (event.target.closest("[data-contact-close]")) {
      event.preventDefault();
      closeContact();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dialog.classList.contains("is-open")) {
      closeContact();
    }
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  async function loadCollaboratorLogos() {
    try {
      const listed = await fetch("/api/public/collaborators", { cache: "no-store" });
      if (listed.ok) {
        const data = await listed.json();
        if (Array.isArray(data?.logos) && data.logos.length) return data.logos;
      }
    } catch {
      /* use manifest */
    }

    try {
      const response = await fetch(`/images/collaborators/manifest.json?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) return [];
      const list = await response.json();
      if (!Array.isArray(list)) return [];
      return list
        .map((name) => String(name || "").trim())
        .filter(Boolean)
        .map((name) => `/images/collaborators/${name.replace(/^\/+/, "")}`);
    } catch {
      return [];
    }
  }

  function renderMarquee(root, urls) {
    const track = root.querySelector("[data-logo-track]");
    if (!track || !urls.length) return;
    const makeImg = (url, clone) => {
      const img = document.createElement("img");
      img.src = url;
      img.alt = "";
      img.decoding = "async";
      if (clone) img.setAttribute("aria-hidden", "true");
      return img;
    };
    track.innerHTML = "";
    urls.forEach((url) => track.appendChild(makeImg(url, false)));
    if (!reduceMotion && urls.length) {
      urls.forEach((url) => track.appendChild(makeImg(url, true)));
      const seconds = Math.max(28, urls.length * 8);
      track.style.setProperty("--marquee-s", `${seconds}s`);
    }
    root.hidden = false;
  }

  loadCollaboratorLogos().then((urls) => {
    document.querySelectorAll("[data-logo-marquee]").forEach((root) => {
      renderMarquee(root, urls);
    });
  });

  document.querySelectorAll("[data-about-slot]").forEach((slot) => {
    const img = slot.querySelector("img");
    if (!img) return;
    const show = () => slot.classList.add("has-image");
    const hide = () => slot.classList.remove("has-image");
    if (img.complete && img.naturalWidth > 0) show();
    img.addEventListener("load", show);
    img.addEventListener("error", hide);
  });

  const lightbox = document.getElementById("lightbox");
  if (lightbox) {
    let touchX = 0;
    let touchY = 0;
    lightbox.addEventListener("touchstart", (event) => {
      const point = event.changedTouches[0];
      if (!point) return;
      touchX = point.clientX;
      touchY = point.clientY;
    }, { passive: true });
    lightbox.addEventListener("touchend", (event) => {
      if (!lightbox.classList.contains("is-open")) return;
      const point = event.changedTouches[0];
      if (!point) return;
      const dx = point.clientX - touchX;
      const dy = point.clientY - touchY;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.15) return;
      if (dx < 0) lightbox.querySelector("[data-lightbox-next]")?.click();
      else lightbox.querySelector("[data-lightbox-prev]")?.click();
    }, { passive: true });
  }
})();
