(function () {
  const STORAGE_KEY = "alerego-lang";

  const dict = {
    en: {
      "meta.home.title": "Alerego · Photographer",
      "meta.home.desc": "Alerego photographs cosplay and companies. Studio, conventions, offices, and events.",
      "meta.home.og": "Photographer and videographer. Cosplay and corporate work.",
      "meta.about.title": "Alerego · About",
      "meta.about.desc": "Who is Alerego. A photographer and videographer splitting time between cosplay worlds and corporate commissions.",
      "meta.about.og": "The person behind the frame. Cosplay direction, brand stories, post production.",
      "meta.cosplay.title": "Alerego · Cosplay",
      "meta.cosplay.desc": "Cosplay photography by Alerego. Cinematic portraits from studio sessions, conventions, and original collaborations.",
      "meta.cosplay.og": "Cosplay photography by Alerego. Characters recast as living portraits.",
      "meta.corporate.title": "Alerego · Corporate",
      "meta.corporate.desc": "Corporate photography by Alerego. Product launches, leadership portraits, and event narratives for brands and teams.",
      "meta.corporate.og": "Corporate photography by Alerego. Brands held in a cinematic frame.",
      "meta.sets.title": "Alerego · Featured Sets",
      "meta.sets.desc": "Featured photography sets by Alerego, spanning cosplay portraiture and corporate storytelling.",
      "meta.sets.og": "Signature sets from the Alerego archive.",
      "meta.set.title": "Gallery Set · Alerego",
      "meta.set.desc": "A photography set from the Alerego archive.",
      "meta.404.title": "Page Not Found · Alerego",
      "meta.404.desc": "This page is not in the Alerego archive. Return home to browse the portfolio.",
      "nav.skip": "Skip to content",
      "nav.menu": "Menu",
      "nav.closeMenu": "Close menu",
      "nav.language": "Language",
      "nav.home": "Home",
      "nav.about": "About",
      "nav.contact": "Contact",
      "home.role": "Photographer and videographer",
      "home.title": "I shoot cosplay and companies",
      "home.lead": "Same camera. Different lights. Armor one week, a keynote the next.",
      "home.aboutBtn": "About me",
      "home.practice": "About me",
      "home.bio": "I am a photographer and videographer. I started with cosplay, then brought the same lighting into offices, stages, and brand events. I still shoot and grade every job myself.",
      "home.craft.1": "Cosplay direction",
      "home.craft.2": "Events and brands",
      "home.craft.3": "Post production",
      "home.worked": "Worked with",
      "home.recent": "Recent frames",
      "home.worlds": "Portfolios",
      "home.hint.cosplay": "Characters, conventions, studio",
      "home.hint.corporate": "Offices, stages, teams",
      "about.h1": "Hi. I am Alerego.",
      "about.lede": "Photographer and videographer. Cosplay one week, a company event the next. I light the set and I grade the files.",
      "about.cap.camera": "On a job, behind the camera.",
      "about.alt.camera": "Alerego with a camera",
      "about.stat.years": "Years behind the lens",
      "about.stat.countries": "Countries in the kit",
      "about.stat.projects": "Projects delivered",
      "about.cap.video": "Motion work, same lighting brain.",
      "about.alt.video": "Videomaking on a shoot",
      "about.cap.set": "Studio, convention floor, or a hall.",
      "about.alt.set": "On set during a shoot",
      "about.story.h": "How I got here",
      "about.story.p1": "I started by photographing people in costume. Conventions, original collabs, long nights grading a character until the armor looked like metal instead of foam.",
      "about.story.p2": "Brands started asking for the same control in offices and on stage. The kit did not change much. The brief did. I still run both, because the craft is the same: light, timing, and a file that matches what we agreed on set.",
      "about.story.p3": "Progress for me is quieter than a reel. Better light. Faster setups. Cleaner grades. More jobs where I stay on the file from the first frame to delivery.",
      "about.skills.h": "What I bring",
      "about.skill.dir": "Direction",
      "about.skill.dirBody": "Posing, blocking, and a clear look before we roll.",
      "about.skill.light": "Lighting",
      "about.skill.lightBody": "Studio, mixed venue light, and small kits that still hold a mood.",
      "about.skill.motion": "Motion",
      "about.skill.motionBody": "Short video next to stills when the job needs both.",
      "about.skill.post": "Post",
      "about.skill.postBody": "Color and delivery handled here, not sent out.",
      "about.ig.cosplay": "Cosplay Instagram",
      "about.ig.corporate": "Corporate Instagram",
      "about.email": "Email",
      "about.dual.cosplay": "Cosplay work",
      "about.dual.corporate": "Corporate work",
      "about.dual.open": "Open the gallery",
      "cosplay.lead": "Studio, conventions, and collabs. Click a frame for the set.",
      "corporate.lead": "Launches, portraits, events. Click a frame for the set.",
      "section.photos": "Photos",
      "section.sets": "Sets",
      "sets.lead": "Open a cover to enter the album.",
      "set.loadingTitle": "Loading gallery",
      "set.loadingDesc": "Loading description",
      "set.category": "Gallery set",
      "set.prev": "Previous",
      "set.next": "Next",
      "lightbox.photo": "Photo",
      "lightbox.close": "Close",
      "lightbox.prev": "Previous",
      "lightbox.next": "Next",
      "lightbox.cosplay": "Cosplay full view",
      "lightbox.corporate": "Corporate full view",
      "lightbox.set": "Set full view",
      "lightbox.gallery": "Gallery image",
      "nf.title": "Frame missing",
      "nf.body": "This URL is not in the archive. The portfolio is still on the home page.",
      "nf.back": "Back Home",
      "contact.title": "Contact",
      "contact.lead": "Pick a way to reach me.",
      "contact.close": "Close",
      "gallery.photo": "Portfolio image",
      "gallery.openSet": "open collection",
      "gallery.viewFull": "view full size",
      "gallery.emptyTitle": "Gallery coming soon",
      "gallery.emptyBody": "No sets are published yet. Add work in /admin when you are ready.",
      "gallery.emptySetsTitle": "Sets coming soon",
      "gallery.emptySetsBody": "Create a new set in /admin and add photos.",
      "gallery.emptyPhotosTitle": "Photos coming soon",
      "gallery.emptyPhotosBody": "Star photos in /admin to show them here.",
      "gallery.emptyHomeTitle": "Photos coming soon",
      "gallery.emptyHomeBody": "Publish sets from /admin to fill this grid.",
      "gallery.loadingPhotos": "Loading photos",
      "gallery.loadingPhotosHint": "Reading published sets.",
      "gallery.loadingHighlights": "Loading highlights",
      "gallery.loadingHighlightsCosplay": "Fetching starred cosplay photos.",
      "gallery.loadingHighlightsCorporate": "Fetching starred event photos.",
      "gallery.loadingSets": "Loading signature collections…",
      "set.page": "Page {current} of {total}",
      "set.count": "{n} images",
      "set.countOne": "{n} image",
      "set.emptyTitle": "No images in this set yet",
      "set.emptyBody": "Add photos in /admin and refresh.",
      "set.missing": "Set not found",
      "set.missingBody": "Select a featured collection from the Cosplay or Corporate page to continue.",
      "set.goBack": "Go Back",
      "set.feature.cosplay": "Cosplay feature",
      "set.feature.corporate": "Corporate feature",
      "admin.meta.title": "Gallery Admin · Alerego",
      "admin.login.title": "Gallery Admin",
      "admin.login.lead": "Enter master password to continue",
      "admin.login.label": "Master password",
      "admin.login.placeholder": "Enter password…",
      "admin.login.submit": "Sign In",
      "admin.cms": "Gallery CMS",
      "admin.save": "Save Changes",
      "admin.saving": "Saving...",
      "admin.saved": "Saved!",
      "admin.saveError": "Save Error",
      "admin.signOut": "Sign out",
      "admin.manage": "Manage Sets",
      "admin.manageLead": "Drag and drop sets to change the order they appear on your site.",
      "admin.create": "+ Create New Set",
      "admin.editHeading": "Edit Set Properties",
      "admin.createHeading": "Create New Set",
      "admin.type": "Type",
      "admin.slug": "Slug (URL)",
      "admin.title": "Title",
      "admin.desc": "Description",
      "admin.saveFirst": "Save the set first to enable photo uploads. You will be able to upload photos by clicking the edit icon on the saved set.",
      "admin.upload": "Upload Photo to this Set",
      "admin.uploadClick": "Click to upload",
      "admin.uploadOr": " or drag and drop",
      "admin.uploadTypes": "PNG, JPG or WEBP",
      "admin.photos": "Photos in this set",
      "admin.photosHelp": "Cover: click the photo. Grid: category galleries. Home: one horizontal photo for that category tile on the landing page.",
      "admin.delete": "Delete",
      "admin.done": "Done",
      "admin.loading": "Loading your sets...",
      "admin.empty": "No sets found yet.",
      "admin.edit": "Edit",
      "admin.order": "Order: {n}",
      "admin.noDesc": "No description",
      "admin.images": "{n} images",
      "admin.cover": "Cover",
      "admin.grid": "Grid",
      "admin.home": "Home",
      "admin.landing": "Landing",
      "admin.coverTitle": "Set as cover",
      "admin.gridTitle": "Featured in category grid",
      "admin.homeTitle": "One horizontal photo for the home Cosplay or Corporate tile",
      "admin.landingTitle": "Landing page intro photos (3 site-wide, any orientation)",
      "admin.homeNeedsLandscape": "Home tile needs a horizontal photo",
      "admin.badPassword": "Invalid password",
      "admin.offline": "API not reachable. Run npm run dev and open that URL (not a static file server).",
      "admin.confirmDelete": "Are you sure you want to remove this set?",
      "admin.needTitleSlug": "Title and Slug required",
      "admin.heroLimit": "You can pick up to {n} background photos for this category.",
      "admin.landingLimit": "You can pick at most {n} landing intro photos across all sets.",
      "admin.homeLandscape": "Home tiles only accept a horizontal photo.",
      "admin.readFail": "Could not read that photo. Try another file.",
      "admin.processing": "Processing image {i} of {n} ({name})...",
      "admin.uploading": "Uploading {i} of {n}...",
      "admin.uploadErr": "Error on {name}: {error}",
      "admin.uploaded": "Saved {n} image(s) to the database."
    },
    it: {
      "meta.home.title": "Alerego · Fotografo",
      "meta.home.desc": "Alerego fotografa cosplay e aziende. Studio, convention, uffici ed eventi.",
      "meta.home.og": "Fotografo e videomaker. Lavoro cosplay e corporate.",
      "meta.about.title": "Alerego · Chi sono",
      "meta.about.desc": "Chi è Alerego. Fotografo e videomaker tra mondi cosplay e commissioni aziendali.",
      "meta.about.og": "La persona dietro l’inquadratura. Direzione cosplay, storie di brand, post produzione.",
      "meta.cosplay.title": "Alerego · Cosplay",
      "meta.cosplay.desc": "Fotografia cosplay di Alerego. Ritratti cinematografici da studio, convention e collaborazioni.",
      "meta.cosplay.og": "Fotografia cosplay di Alerego. Personaggi come ritratti vivi.",
      "meta.corporate.title": "Alerego · Corporate",
      "meta.corporate.desc": "Fotografia corporate di Alerego. Lancio prodotti, ritratti di leadership e eventi per brand e team.",
      "meta.corporate.og": "Fotografia corporate di Alerego. Brand in un frame cinematografico.",
      "meta.sets.title": "Alerego · Set in evidenza",
      "meta.sets.desc": "Set fotografici di Alerego, tra ritratti cosplay e storytelling aziendale.",
      "meta.sets.og": "Set in evidenza dall’archivio Alerego.",
      "meta.set.title": "Set · Alerego",
      "meta.set.desc": "Un set fotografico dall’archivio Alerego.",
      "meta.404.title": "Pagina non trovata · Alerego",
      "meta.404.desc": "Questa pagina non è nell’archivio Alerego. Torna alla home per il portfolio.",
      "nav.skip": "Vai al contenuto",
      "nav.menu": "Menu",
      "nav.closeMenu": "Chiudi menu",
      "nav.language": "Lingua",
      "nav.home": "Home",
      "nav.about": "Chi sono",
      "nav.contact": "Contatti",
      "home.role": "Fotografo e videomaker",
      "home.title": "Fotografo cosplay e aziende",
      "home.lead": "La stessa macchina. Luci diverse. Un’armatura una settimana, un keynote quella dopo.",
      "home.aboutBtn": "Chi sono",
      "home.practice": "Chi sono",
      "home.bio": "Sono fotografo e videomaker. Ho iniziato con il cosplay, poi ho portato le stesse luci in uffici, palchi ed eventi di brand. Scatto e sviluppo ancora ogni lavoro io.",
      "home.craft.1": "Direzione cosplay",
      "home.craft.2": "Eventi e brand",
      "home.craft.3": "Post produzione",
      "home.worked": "Hanno lavorato con me",
      "home.recent": "Scatti recenti",
      "home.worlds": "Portfolio",
      "home.hint.cosplay": "Personaggi, convention, studio",
      "home.hint.corporate": "Uffici, palchi, team",
      "about.h1": "Ciao. Sono Alerego.",
      "about.lede": "Fotografo e videomaker. Cosplay una settimana, un evento aziendale quella dopo. Accendo il set e sviluppo i file.",
      "about.cap.camera": "In un lavoro, dietro la macchina.",
      "about.alt.camera": "Alerego con una fotocamera",
      "about.stat.years": "Anni dietro l’obiettivo",
      "about.stat.countries": "Paesi nel kit",
      "about.stat.projects": "Progetti consegnati",
      "about.cap.video": "Video, stessa testa per la luce.",
      "about.alt.video": "Videomaking sul set",
      "about.cap.set": "Studio, convention o una hall.",
      "about.alt.set": "Sul set durante uno shooting",
      "about.story.h": "Come ci sono arrivato",
      "about.story.p1": "Ho iniziato fotografando persone in costume. Convention, collab originali, notti a sviluppare un personaggio finché l’armatura sembrava metallo e non foam.",
      "about.story.p2": "I brand hanno chiesto lo stesso controllo in ufficio e sul palco. Il kit è cambiato poco. Il brief sì. Continuo a fare entrambi: luce, timing, e un file che corrisponde a ciò che abbiamo deciso sul set.",
      "about.story.p3": "I progressi per me sono più silenziosi di un reel. Luce migliore. Setup più veloci. Sviluppi più puliti. Più lavori in cui resto sul file dal primo scatto alla consegna.",
      "about.skills.h": "Cosa porto",
      "about.skill.dir": "Direzione",
      "about.skill.dirBody": "Posing, blocking e un look chiaro prima di partire.",
      "about.skill.light": "Luce",
      "about.skill.lightBody": "Studio, luce mista di location e kit piccoli che tengono comunque un mood.",
      "about.skill.motion": "Motion",
      "about.skill.motionBody": "Video brevi accanto agli still quando il lavoro chiede entrambi.",
      "about.skill.post": "Post",
      "about.skill.postBody": "Colore e consegna gestiti qui, non in outsourcing.",
      "about.ig.cosplay": "Instagram Cosplay",
      "about.ig.corporate": "Instagram Corporate",
      "about.email": "Email",
      "about.dual.cosplay": "Lavoro cosplay",
      "about.dual.corporate": "Lavoro corporate",
      "about.dual.open": "Apri la gallery",
      "cosplay.lead": "Studio, convention e collab. Tocca uno scatto per il set.",
      "corporate.lead": "Lanci, ritratti, eventi. Tocca uno scatto per il set.",
      "section.photos": "Foto",
      "section.sets": "Set",
      "sets.lead": "Apri una copertina per entrare nell’album.",
      "set.loadingTitle": "Caricamento gallery",
      "set.loadingDesc": "Caricamento descrizione",
      "set.category": "Set fotografico",
      "set.prev": "Indietro",
      "set.next": "Avanti",
      "lightbox.photo": "Foto",
      "lightbox.close": "Chiudi",
      "lightbox.prev": "Precedente",
      "lightbox.next": "Successiva",
      "lightbox.cosplay": "Cosplay a schermo intero",
      "lightbox.corporate": "Corporate a schermo intero",
      "lightbox.set": "Set a schermo intero",
      "lightbox.gallery": "Immagine del set",
      "nf.title": "Frame mancante",
      "nf.body": "Questo URL non è nell’archivio. Il portfolio è ancora in home.",
      "nf.back": "Torna alla home",
      "contact.title": "Contatti",
      "contact.lead": "Scegli come raggiungermi.",
      "contact.close": "Chiudi",
      "gallery.photo": "Foto del portfolio",
      "gallery.openSet": "apri la raccolta",
      "gallery.viewFull": "vedi a schermo intero",
      "gallery.emptyTitle": "Gallery in arrivo",
      "gallery.emptyBody": "Nessun set pubblicato. Aggiungi il lavoro da /admin quando sei pronto.",
      "gallery.emptySetsTitle": "Set in arrivo",
      "gallery.emptySetsBody": "Crea un set da /admin e aggiungi le foto.",
      "gallery.emptyPhotosTitle": "Foto in arrivo",
      "gallery.emptyPhotosBody": "Metti in evidenza le foto da /admin per mostrarle qui.",
      "gallery.emptyHomeTitle": "Foto in arrivo",
      "gallery.emptyHomeBody": "Pubblica i set da /admin per riempire questa griglia.",
      "gallery.loadingPhotos": "Caricamento foto",
      "gallery.loadingPhotosHint": "Lettura dei set pubblicati.",
      "gallery.loadingHighlights": "Caricamento highlight",
      "gallery.loadingHighlightsCosplay": "Caricamento foto cosplay in evidenza.",
      "gallery.loadingHighlightsCorporate": "Caricamento foto evento in evidenza.",
      "gallery.loadingSets": "Caricamento delle raccolte…",
      "set.page": "Pagina {current} di {total}",
      "set.count": "{n} immagini",
      "set.countOne": "{n} immagine",
      "set.emptyTitle": "Ancora nessuna foto in questo set",
      "set.emptyBody": "Aggiungi le foto da /admin e aggiorna.",
      "set.missing": "Set non trovato",
      "set.missingBody": "Scegli una raccolta dalla pagina Cosplay o Corporate.",
      "set.goBack": "Indietro",
      "set.feature.cosplay": "Feature cosplay",
      "set.feature.corporate": "Feature corporate",
      "admin.meta.title": "Admin gallery · Alerego",
      "admin.login.title": "Admin gallery",
      "admin.login.lead": "Inserisci la password master per continuare",
      "admin.login.label": "Password master",
      "admin.login.placeholder": "Inserisci la password…",
      "admin.login.submit": "Entra",
      "admin.cms": "CMS gallery",
      "admin.save": "Salva modifiche",
      "admin.saving": "Salvataggio...",
      "admin.saved": "Salvato!",
      "admin.saveError": "Errore salvataggio",
      "admin.signOut": "Esci",
      "admin.manage": "Gestisci i set",
      "admin.manageLead": "Trascina i set per cambiare l’ordine sul sito.",
      "admin.create": "+ Crea nuovo set",
      "admin.editHeading": "Proprietà del set",
      "admin.createHeading": "Crea nuovo set",
      "admin.type": "Tipo",
      "admin.slug": "Slug (URL)",
      "admin.title": "Titolo",
      "admin.desc": "Descrizione",
      "admin.saveFirst": "Salva prima il set per caricare le foto. Potrai caricarle dall’icona di modifica sul set salvato.",
      "admin.upload": "Carica foto in questo set",
      "admin.uploadClick": "Clicca per caricare",
      "admin.uploadOr": " oppure trascina i file",
      "admin.uploadTypes": "PNG, JPG o WEBP",
      "admin.photos": "Foto in questo set",
      "admin.photosHelp": "Copertina: tocca la foto. Griglia: gallery di categoria. Home: una foto orizzontale per il riquadro Cosplay o Corporate in home.",
      "admin.delete": "Elimina",
      "admin.done": "Fatto",
      "admin.loading": "Caricamento set...",
      "admin.empty": "Nessun set ancora.",
      "admin.edit": "Modifica",
      "admin.order": "Ordine: {n}",
      "admin.noDesc": "Nessuna descrizione",
      "admin.images": "{n} immagini",
      "admin.cover": "Copertina",
      "admin.grid": "Griglia",
      "admin.home": "Home",
      "admin.landing": "Landing",
      "admin.coverTitle": "Imposta come copertina",
      "admin.gridTitle": "In evidenza nella griglia di categoria",
      "admin.homeTitle": "Una foto orizzontale per il riquadro Cosplay o Corporate in home",
      "admin.landingTitle": "Foto intro della landing (3 in tutto il sito, qualsiasi orientamento)",
      "admin.homeNeedsLandscape": "Il riquadro home richiede una foto orizzontale",
      "admin.badPassword": "Password non valida",
      "admin.offline": "API non raggiungibile. Avvia npm run dev e apri quell’URL (non un server statico).",
      "admin.confirmDelete": "Vuoi davvero rimuovere questo set?",
      "admin.needTitleSlug": "Titolo e slug obbligatori",
      "admin.heroLimit": "Puoi scegliere al massimo {n} foto di sfondo per questa categoria.",
      "admin.landingLimit": "Puoi scegliere al massimo {n} foto per l’intro della landing, in tutti i set.",
      "admin.homeLandscape": "I riquadri home accettano solo foto orizzontali.",
      "admin.readFail": "Impossibile leggere quella foto. Prova un altro file.",
      "admin.processing": "Elaborazione immagine {i} di {n} ({name})...",
      "admin.uploading": "Caricamento {i} di {n}...",
      "admin.uploadErr": "Errore su {name}: {error}",
      "admin.uploaded": "Salvate {n} immagini nel database."
    }
  };

  function detectLang() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "it" || stored === "en") return stored;
    } catch {
      /* ignore */
    }
    const nav = String(navigator.language || "").toLowerCase();
    return nav.startsWith("it") ? "it" : "en";
  }

  let lang = detectLang();

  function interpolate(str, vars) {
    if (!vars) return str;
    return String(str).replace(/\{(\w+)\}/g, (_, key) => (
      vars[key] == null ? `{${key}}` : String(vars[key])
    ));
  }

  function t(key, vars) {
    const table = dict[lang] || dict.en;
    const value = table[key] || dict.en[key] || key;
    return interpolate(value, vars);
  }

  function apply(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    scope.querySelectorAll("[data-i18n-content]").forEach((el) => {
      el.setAttribute("content", t(el.getAttribute("data-i18n-content")));
    });
    scope.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      el.getAttribute("data-i18n-attr").split(",").forEach((pair) => {
        const [attr, key] = pair.split(":").map((part) => part.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-set-lang]").forEach((btn) => {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-set-lang") === lang ? "true" : "false");
    });
    const toggle = document.querySelector("[data-nav-toggle]");
    if (toggle) {
      const open = document.querySelector(".site-nav")?.classList.contains("is-open");
      toggle.setAttribute("aria-label", open ? t("nav.closeMenu") : t("nav.menu"));
    }
  }

  function setLang(next) {
    if (next !== "it" && next !== "en") return;
    lang = next;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
    apply();
    window.dispatchEvent(new CustomEvent("alerego:lang", { detail: { lang } }));
  }

  window.AleregoI18n = {
    t,
    apply,
    setLang,
    getLang() {
      return lang;
    }
  };

  document.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-set-lang]");
    if (!btn) return;
    event.preventDefault();
    setLang(btn.getAttribute("data-set-lang"));
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => apply());
  } else {
    apply();
  }
})();
