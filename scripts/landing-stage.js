(() => {
  const intro = document.getElementById("intro-hero");
  const worlds = document.getElementById("worlds");
  const site = window.AleregoSite;

  fetch("/api/public/sets", { cache: "no-store" })
    .then((response) => (response.ok ? response.json() : null))
    .then(async (data) => {
      if (!site) return;
      const sets = Array.isArray(data?.sets) ? data.sets : [];

      const homeCosplay = site.collectPaths(sets, "cosplay", "homeSelectorImages");
      const homeCorporate = site.collectPaths(sets, "corporate", "homeSelectorImages");
      const fallbackCosplay = site.collectPaths(sets, "cosplay", "images");
      const fallbackCorporate = site.collectPaths(sets, "corporate", "images");

      const worldCosplay = (await site.firstLandscapePath(homeCosplay))
        || (await site.firstLandscapePath(fallbackCosplay));
      const worldCorporate = (await site.firstLandscapePath(homeCorporate))
        || (await site.firstLandscapePath(fallbackCorporate));

      site.fillPhotoField(document.querySelector("[data-world-photos='cosplay']"), worldCosplay ? [worldCosplay] : [], {
        className: "world__shot",
        limit: 1,
        fallback: []
      });
      site.fillPhotoField(document.querySelector("[data-world-photos='corporate']"), worldCorporate ? [worldCorporate] : [], {
        className: "world__shot",
        limit: 1,
        fallback: []
      });

      const introSeen = new Set();
      const introPaths = [];
      ["cosplay", "corporate"].forEach((type) => {
        site.collectPaths(sets, type, "landingIntroImages").forEach((path) => {
          if (path && !introSeen.has(path)) {
            introSeen.add(path);
            introPaths.push(path);
          }
        });
      });

      const introField = document.querySelector(".intro-field");
      if (introField) {
        introField.innerHTML = "";
        const grain = document.createElement("div");
        grain.className = "field-grain";
        grain.setAttribute("aria-hidden", "true");

        if (introPaths.length) {
          const measured = [];
          for (const path of introPaths.slice(0, 3)) {
            const url = site.mediaUrl(path);
            measured.push({
              path,
              url,
              landscape: await site.isLandscapeUrl(url)
            });
          }
          const portraits = measured.filter((item) => !item.landscape);
          const lands = measured.filter((item) => item.landscape);
          const used = new Set();
          const slots = [];
          const take = (item) => {
            if (!item || used.has(item.path) || slots.length >= 3) return;
            used.add(item.path);
            slots.push(item);
          };
          take(portraits[0]);
          take(portraits[1]);
          take(lands[0]);
          measured.forEach(take);

          slots.forEach((item, index) => {
            const img = document.createElement("img");
            img.className = `field-shot field-shot--${index + 1} ${item.landscape ? "is-landscape" : "is-portrait"}`;
            img.src = item.url;
            img.alt = "";
            img.decoding = "async";
            introField.appendChild(img);
          });
        }

        introField.appendChild(grain);
      }
    })
    .catch(() => {});

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  if (intro) {
    let frame = 0;
    let px = 0.5;
    let py = 0.5;
    const apply = () => {
      frame = 0;
      intro.style.setProperty("--px", px.toFixed(4));
      intro.style.setProperty("--py", py.toFixed(4));
    };
    intro.addEventListener("pointermove", (event) => {
      const box = intro.getBoundingClientRect();
      if (!box.width || !box.height) return;
      px = (event.clientX - box.left) / box.width;
      py = (event.clientY - box.top) / box.height;
      if (!frame) frame = requestAnimationFrame(apply);
    }, { passive: true });
  }

  if (!worlds) return;

  worlds.querySelectorAll(".world").forEach((panel) => {
    panel.addEventListener("pointerenter", () => {
      worlds.dataset.hot = panel.getAttribute("href")?.includes("corporate") ? "corporate" : "cosplay";
    });
  });
  worlds.addEventListener("pointerleave", () => {
    delete worlds.dataset.hot;
  });
})();
