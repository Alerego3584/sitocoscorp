(function () {
    const DEFAULTS = {
        itemSelector: 'figure',
        imageSelector: 'img',
        gap: 16,
        targetRowHeight: 360,
        maxRowHeight: 560,
        lastRowMinHeight: 220,
        lastRowAlign: 'left',
        layoutStyle: 'dynamic-mosaic',
        itemsPerRowMobile: 1,
        itemsPerRowTablet: 2,
        itemsPerRowDesktop: 3
    };

    const ORIENTATION_FALLBACK_RATIOS = {
        landscape: 16 / 10,
        portrait: 3 / 4,
        square: 1
    };

    const layoutStates = new WeakMap();

    function parseRatio(value) {
        if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
            return value;
        }

        if (typeof value !== 'string') {
            return null;
        }

        const normalized = value.trim();
        if (!normalized) {
            return null;
        }

        if (normalized.includes('/')) {
            const [leftRaw, rightRaw] = normalized.split('/').map((segment) => Number(segment.trim()));
            if (Number.isFinite(leftRaw) && Number.isFinite(rightRaw) && rightRaw > 0) {
                return leftRaw / rightRaw;
            }
        }

        const numericValue = Number(normalized);
        if (Number.isFinite(numericValue) && numericValue > 0) {
            return numericValue;
        }

        return null;
    }

    function resolveRatio(item, imageEl) {
        const ratioFromItem = parseRatio(item?.dataset?.aspectRatio);
        if (ratioFromItem) {
            return ratioFromItem;
        }

        const ratioFromImageDataset = parseRatio(imageEl?.dataset?.aspectRatio);
        if (ratioFromImageDataset) {
            return ratioFromImageDataset;
        }

        if (imageEl?.naturalWidth && imageEl?.naturalHeight) {
            return imageEl.naturalWidth / imageEl.naturalHeight;
        }

        const ratioFromItemStyle = parseRatio(item?.style?.aspectRatio || '');
        if (ratioFromItemStyle) {
            return ratioFromItemStyle;
        }

        const ratioFromImageStyle = parseRatio(imageEl?.style?.aspectRatio || '');
        if (ratioFromImageStyle) {
            return ratioFromImageStyle;
        }

        const orientationHint = item?.dataset?.orientation || imageEl?.dataset?.orientation || 'landscape';
        return ORIENTATION_FALLBACK_RATIOS[orientationHint] || ORIENTATION_FALLBACK_RATIOS.landscape;
    }

    function toResponsiveTarget(baseHeight, containerWidth) {
        if (containerWidth < 460) return Math.max(125, Math.round(baseHeight * 0.56));
        if (containerWidth < 640) return Math.max(145, Math.round(baseHeight * 0.64));
        if (containerWidth < 900) return Math.max(175, Math.round(baseHeight * 0.78));
        if (containerWidth < 1180) return Math.max(210, Math.round(baseHeight * 0.88));
        if (containerWidth < 1500) return Math.max(240, Math.round(baseHeight * 0.94));
        return baseHeight;
    }

    function resolveOrientationBucket(ratio) {
        if (!Number.isFinite(ratio)) {
            return 'landscape';
        }

        if (ratio <= 0.92) {
            return 'portrait';
        }

        if (ratio >= 1.18) {
            return 'landscape';
        }

        return 'square';
    }

    function selectRowPatterns(itemsPerRow) {
        if (itemsPerRow <= 1) {
            return [['landscape']];
        }

        if (itemsPerRow === 2) {
            return [
                ['portrait', 'landscape'],
                ['landscape', 'portrait'],
                ['portrait', 'portrait']
            ];
        }

        return [
            ['portrait', 'portrait', 'landscape'],
            ['landscape', 'portrait', 'portrait'],
            ['portrait', 'landscape', 'portrait'],
            ['portrait', 'portrait', 'landscape'],
            ['landscape', 'square', 'portrait']
        ];
    }

    function takeNextByBucket(buckets, bucket) {
        const fromPreferred = buckets[bucket]?.shift();
        if (fromPreferred) {
            return fromPreferred;
        }

        const fromSquare = buckets.square?.shift();
        if (fromSquare) {
            return fromSquare;
        }

        const fromPortrait = buckets.portrait?.shift();
        if (fromPortrait) {
            return fromPortrait;
        }

        const fromLandscape = buckets.landscape?.shift();
        if (fromLandscape) {
            return fromLandscape;
        }

        return null;
    }

    function buildMosaicRows(entries, itemsPerRow) {
        const buckets = {
            portrait: [],
            landscape: [],
            square: []
        };

        entries.forEach((entry) => {
            const bucket = resolveOrientationBucket(entry.ratio);
            buckets[bucket].push(entry);
        });

        const patterns = selectRowPatterns(itemsPerRow);
        const rows = [];
        let rowIndex = 0;

        const hasRemaining = () => buckets.portrait.length || buckets.landscape.length || buckets.square.length;

        while (hasRemaining()) {
            const template = patterns[rowIndex % patterns.length];
            const row = [];

            template.forEach((bucket) => {
                const next = takeNextByBucket(buckets, bucket);
                if (next) {
                    row.push(next);
                }
            });

            if (row.length) {
                rows.push(row);
            }

            rowIndex += 1;
        }

        return rows;
    }

    function collectEntries(container, config) {
        return Array.from(container.querySelectorAll(config.itemSelector))
            .map((item) => {
                const imageEl = item.querySelector(config.imageSelector);
                if (!imageEl) {
                    return null;
                }

                const ratio = resolveRatio(item, imageEl);
                if (!ratio || !Number.isFinite(ratio)) {
                    return null;
                }

                const normalizedRatio = Math.max(0.4, Math.min(3.5, ratio));
                item.dataset.aspectRatio = normalizedRatio.toFixed(6);

                return {
                    item,
                    imageEl,
                    ratio: normalizedRatio
                };
            })
            .filter(Boolean);
    }

    function applyContainerStyles(container, gap) {
        // Neutralized for CSS-columns masonry migration
        // Container should rely on CSS classes, not inline styles
        return;
    }

    function applyItemStyles(entry, rowHeight) {
        // Neutralized for CSS-columns masonry migration
        // Items should rely on CSS classes, not inline styles
        return;
    }

    function layoutContainer(container, config) {
        // Neutralized for CSS-columns masonry migration
        // Layout is now handled entirely by CSS columns
        return;
    }

    function bindPendingImageListeners(container, config, scheduleLayout) {
        const imageSelector = `${config.itemSelector} ${config.imageSelector}`;
        const images = container.querySelectorAll(imageSelector);

        images.forEach((imageEl) => {
            if (imageEl.complete && imageEl.naturalWidth) {
                return;
            }

            if (imageEl.dataset.orderedGridBound === '1') {
                return;
            }

            imageEl.dataset.orderedGridBound = '1';
            imageEl.addEventListener('load', scheduleLayout, { once: true });
            imageEl.addEventListener('error', scheduleLayout, { once: true });
        });
    }

    function ensureLayoutState(container, config) {
        let state = layoutStates.get(container);

        if (!state) {
            state = {
                config,
                frameId: 0,
                scheduleLayout: null,
                onViewportChange: null,
                resizeObserver: null
            };

            state.scheduleLayout = () => {
                if (state.frameId) {
                    return;
                }

                state.frameId = window.requestAnimationFrame(() => {
                    state.frameId = 0;
                    layoutContainer(container, state.config);
                });
            };

            state.onViewportChange = () => state.scheduleLayout();

            window.addEventListener('resize', state.onViewportChange, { passive: true });
            window.addEventListener('orientationchange', state.onViewportChange, { passive: true });

            if (typeof ResizeObserver !== 'undefined') {
                state.resizeObserver = new ResizeObserver(() => state.scheduleLayout());
                state.resizeObserver.observe(container);
            }

            layoutStates.set(container, state);
        } else {
            state.config = config;
        }

        return state;
    }

    function applyOrderedLayout(container, options = {}) {
        if (!(container instanceof HTMLElement)) {
            return;
        }

        const config = {
            ...DEFAULTS,
            ...options
        };

        const state = ensureLayoutState(container, config);
        bindPendingImageListeners(container, state.config, state.scheduleLayout);
        layoutContainer(container, state.config);
        state.scheduleLayout();
    }

    function resetOrderedLayout(container) {
        if (!(container instanceof HTMLElement)) {
            return;
        }

        const state = layoutStates.get(container);
        if (state) {
            window.removeEventListener('resize', state.onViewportChange);
            window.removeEventListener('orientationchange', state.onViewportChange);
            state.resizeObserver?.disconnect();

            if (state.frameId) {
                window.cancelAnimationFrame(state.frameId);
            }

            layoutStates.delete(container);
        }

        container.removeAttribute('data-layout-mode');
        container.style.display = '';
        container.style.flexWrap = '';
        container.style.alignItems = '';
        container.style.alignContent = '';
        container.style.justifyContent = '';
        container.style.gap = '';

        container.querySelectorAll(DEFAULTS.itemSelector).forEach((item) => {
            item.style.flex = '';
            item.style.width = '';
            item.style.height = '';
            item.style.maxWidth = '';
            item.style.margin = '';
            item.style.gridColumn = '';
            item.style.gridRow = '';
        });
    }

    if (typeof window !== 'undefined') {
        window.AleregoGridLayouts = {
            ...(window.AleregoGridLayouts || {}),
            applyOrderedLayout,
            resetOrderedLayout
        };
    }
})();
