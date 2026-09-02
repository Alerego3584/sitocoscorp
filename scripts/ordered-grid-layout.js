(function () {
    const DEFAULTS = {
        itemSelector: 'figure',
        imageSelector: 'img',
        gap: 12,
        targetRowHeight: 260,
        maxRowHeight: 380,
        lastRowMinHeight: 160,
        lastRowAlign: 'left',
        layoutStyle: 'justified',
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
        if (imageEl?.naturalWidth && imageEl?.naturalHeight) {
            return imageEl.naturalWidth / imageEl.naturalHeight;
        }

        const ratioFromItem = parseRatio(item?.dataset?.aspectRatio);
        if (ratioFromItem) {
            return ratioFromItem;
        }

        const ratioFromImageDataset = parseRatio(imageEl?.dataset?.aspectRatio);
        if (ratioFromImageDataset) {
            return ratioFromImageDataset;
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
        container.style.display = 'flex';
        container.style.flexWrap = 'wrap';
        container.style.alignItems = 'flex-start';
        container.style.alignContent = 'flex-start';
        container.style.justifyContent = 'flex-start';
        container.style.gap = `${gap}px`;
        container.style.width = '100%';
        container.dataset.layoutMode = 'justified';
    }

    function applyItemStyles(entry, widthPx, heightPx) {
        entry.item.style.flex = `0 0 ${widthPx}px`;
        entry.item.style.width = `${widthPx}px`;
        entry.item.style.height = `${heightPx}px`;
        entry.item.style.maxWidth = 'none';
        entry.item.style.minWidth = '0';
        entry.item.style.margin = '0';
        entry.item.style.gridColumn = '';
        entry.item.style.gridRow = '';
        entry.item.style.aspectRatio = 'auto';

        if (entry.imageEl) {
            entry.imageEl.style.maxWidth = 'none';
            entry.imageEl.style.width = '100%';
            entry.imageEl.style.height = '100%';
            entry.imageEl.style.objectFit = 'cover';
            entry.imageEl.style.aspectRatio = 'auto';
        }
    }

    function layoutRow(row, containerWidth, gap, config) {
        const ratioSum = row.reduce((sum, entry) => sum + entry.ratio, 0);
        const gaps = gap * Math.max(0, row.length - 1);
        const inner = Math.max(1, containerWidth - gaps);
        let height = inner / ratioSum;

        if (!Number.isFinite(height) || height <= 0) {
            height = config.targetRowHeight;
        }

        height = Math.min(height, config.maxRowHeight);
        height = Math.max(height, 120);

        const rowHeight = Math.round(height);
        let remaining = inner;

        row.forEach((entry, index) => {
            const leftover = row.length - index;
            const ideal = Math.round(inner * (entry.ratio / ratioSum));
            const widthPx = leftover === 1 ? Math.max(48, remaining) : Math.min(remaining - 48 * (leftover - 1), Math.max(48, ideal));
            remaining -= widthPx;
            applyItemStyles(entry, widthPx, rowHeight);
        });
    }

    function packJustifiedRows(entries, width, gap, config) {
        const targetH = toResponsiveTarget(config.targetRowHeight, width);
        const rows = [];
        let row = [];
        let ratioSum = 0;

        entries.forEach((entry) => {
            const nextRatio = ratioSum + entry.ratio;
            const nextCount = row.length + 1;
            const nextGaps = gap * Math.max(0, nextCount - 1);
            const nextHeight = (width - nextGaps) / nextRatio;

            if (row.length > 0 && nextHeight < targetH) {
                rows.push(row);
                row = [entry];
                ratioSum = entry.ratio;
                return;
            }

            row.push(entry);
            ratioSum = nextRatio;
        });

        if (row.length) {
            rows.push(row);
        }

        if (rows.length >= 2 && rows[rows.length - 1].length === 1) {
            const orphan = rows.pop()[0];
            rows[rows.length - 1].push(orphan);
        }

        return rows;
    }

    function layoutContainer(container, config) {
        const width = Math.floor(container.getBoundingClientRect().width);
        if (!width) {
            return;
        }

        const gap = config.gap;
        applyContainerStyles(container, gap);

        const entries = collectEntries(container, config);
        if (!entries.length) {
            return;
        }

        const rows = packJustifiedRows(entries, width, gap, config);
        rows.forEach((row) => layoutRow(row, width, gap, config));
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
