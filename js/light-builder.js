const ElementTypes = {
    LIGHT_PARALLEL: 'light-parallel',
    LIGHT_POINT: 'light-point',
    CONVEX_LENS: 'convex-lens',
    CONCAVE_LENS: 'concave-lens',
    PLANE_MIRROR: 'plane-mirror',
    CONVEX_MIRROR: 'convex-mirror',
    CONCAVE_MIRROR: 'concave-mirror',
    PRISM: 'prism',
    LIQUID_BOX: 'liquid-box'
};

const MAX_BOUNCES = 20;
const MIN_RAY_INTENSITY = 0.01;

const LightBuilderLab = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    isDark: false,

    state: {
        elements: [],
        selectedId: null,
        activeTool: 'select',
        offsetX: 0,
        offsetY: 0,
        zoom: 1.0,
        isDragging: false,
        dragMode: null,
        dragStartX: 0,
        dragStartY: 0,
        elementStartX: 0,
        elementStartY: 0,
        rays: [],
        raysDirty: true,
        nextId: 1
    },

    guidedSteps: [
        { text: "Välkommen till Ljusbyggarens Verkstad! Här kan du bygga egna optiska experiment genom att placera ljuskällor, linser, speglar och prismor.", concept: "Introduktion" },
        { text: "Välj 'Parallellt ljus' i verktygsfältet till vänster och klicka på canvas för att placera en ljuskälla.", concept: "Ljuskälla" },
        { text: "Välj 'Konvex lins' och placera den i ljusets väg. Se hur strålarna samlas i brännpunkten!", concept: "Samla ljus" },
        { text: "Klicka på ett element för att välja det. Dra för att flytta, eller ändra egenskaper i panelen till höger.", concept: "Redigera" },
        { text: "Prova att bygga ett teleskop med två linser, eller dela upp vitt ljus med ett prisma!", concept: "Experimentera" },
        { text: "Kortkommandon: R = rotera, Del = ta bort, D = duplicera, +/- = zooma. Experimentera fritt!", concept: "Kortkommandon" }
    ],

    defaultProperties: {
        [ElementTypes.LIGHT_PARALLEL]: { rayCount: 5, spreadAngle: 0, wavelength: null, width: 80 },
        [ElementTypes.LIGHT_POINT]: { rayCount: 12, spreadAngle: 120, wavelength: null },
        [ElementTypes.CONVEX_LENS]: { focalLength: 80, height: 120 },
        [ElementTypes.CONCAVE_LENS]: { focalLength: 80, height: 120 },
        [ElementTypes.PLANE_MIRROR]: { height: 120 },
        [ElementTypes.CONVEX_MIRROR]: { focalLength: 80, height: 120 },
        [ElementTypes.CONCAVE_MIRROR]: { focalLength: 80, height: 120 },
        [ElementTypes.PRISM]: { size: 80, apexAngle: 60 },
        [ElementTypes.LIQUID_BOX]: { width: 100, height: 80, refractiveIndex: 1.33 }
    },

    init() {
        this.canvas = document.getElementById('lightBuilderCanvas');
        if (!this.canvas) return;

        this.setupEventListeners();
        this.setupToolbar();
        this.setupKeyboardShortcuts();
        this.resize();
    },

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.onMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.onMouseUp());
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', () => this.onMouseUp());
    },

    setupToolbar() {
        const toolButtons = document.querySelectorAll('.builder-tool-btn');
        toolButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                this.setActiveTool(tool);
            });
        });

        const clearBtn = document.getElementById('builderClearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAll());
        }

        const zoomInBtn = document.getElementById('builderZoomIn');
        const zoomOutBtn = document.getElementById('builderZoomOut');
        const zoomResetBtn = document.getElementById('builderZoomReset');

        if (zoomInBtn) zoomInBtn.addEventListener('click', () => this.zoom(1.2));
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => this.zoom(0.8));
        if (zoomResetBtn) zoomResetBtn.addEventListener('click', () => this.resetView());

        const deleteBtn = document.getElementById('builderDeleteBtn');
        const duplicateBtn = document.getElementById('builderDuplicateBtn');

        if (deleteBtn) deleteBtn.addEventListener('click', () => this.deleteSelected());
        if (duplicateBtn) duplicateBtn.addEventListener('click', () => this.duplicateSelected());

        this.setupPropertySliders();
    },

    setupPropertySliders() {
        const focalLengthSlider = document.getElementById('builderFocalLength');
        const rotationSlider = document.getElementById('builderRotation');
        const rayCountSlider = document.getElementById('builderRayCount');
        const refractiveIndexSlider = document.getElementById('builderRefractiveIndex');
        const heightSlider = document.getElementById('builderHeight');
        const sizeSlider = document.getElementById('builderSize');
        const widthSlider = document.getElementById('builderWidth');

        if (heightSlider) {
            heightSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                document.getElementById('builderHeightValue').textContent = value;
                this.updateSelectedProperty('height', value);
            });
        }

        if (sizeSlider) {
            sizeSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                document.getElementById('builderSizeValue').textContent = value;
                this.updateSelectedProperty('size', value);
            });
        }

        if (widthSlider) {
            widthSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                document.getElementById('builderWidthValue').textContent = value;
                this.updateSelectedProperty('width', value);
            });
        }

        if (focalLengthSlider) {
            focalLengthSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                document.getElementById('builderFocalLengthValue').textContent = value;
                this.updateSelectedProperty('focalLength', value);
            });
        }

        if (rotationSlider) {
            rotationSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                document.getElementById('builderRotationValue').textContent = value;
                this.updateSelectedRotation(value * Math.PI / 180);
            });
        }

        if (rayCountSlider) {
            rayCountSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                document.getElementById('builderRayCountValue').textContent = value;
                this.updateSelectedProperty('rayCount', value);
            });
        }

        if (refractiveIndexSlider) {
            refractiveIndexSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById('builderRefractiveIndexValue').textContent = value.toFixed(2);
                this.updateSelectedProperty('refractiveIndex', value);
            });
        }
    },

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            const activeSection = document.getElementById('light-builder-lab');
            if (!activeSection || !activeSection.classList.contains('active')) return;

            switch (e.key) {
                case 'Delete':
                case 'Backspace':
                    if (this.state.selectedId) {
                        e.preventDefault();
                        this.deleteSelected();
                    }
                    break;
                case 'r':
                case 'R':
                    if (this.state.selectedId) {
                        this.rotateSelected(15 * Math.PI / 180);
                    }
                    break;
                case 'd':
                case 'D':
                    if (this.state.selectedId) {
                        this.duplicateSelected();
                    }
                    break;
                case 'Escape':
                    this.state.selectedId = null;
                    this.setActiveTool('select');
                    this.updatePropertiesPanel();
                    this.draw();
                    break;
                case '+':
                case '=':
                    this.zoom(1.2);
                    break;
                case '-':
                    this.zoom(0.8);
                    break;
                case 'ArrowUp':
                    if (this.state.selectedId) {
                        e.preventDefault();
                        this.nudgeSelected(0, -5);
                    }
                    break;
                case 'ArrowDown':
                    if (this.state.selectedId) {
                        e.preventDefault();
                        this.nudgeSelected(0, 5);
                    }
                    break;
                case 'ArrowLeft':
                    if (this.state.selectedId) {
                        e.preventDefault();
                        this.nudgeSelected(-5, 0);
                    }
                    break;
                case 'ArrowRight':
                    if (this.state.selectedId) {
                        e.preventDefault();
                        this.nudgeSelected(5, 0);
                    }
                    break;
            }
        });
    },

    setActiveTool(tool) {
        this.state.activeTool = tool;
        document.querySelectorAll('.builder-tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });

        if (tool !== 'select') {
            this.state.selectedId = null;
            this.updatePropertiesPanel();
            this.draw();
        }
    },

    getCanvasPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.state.zoom - this.state.offsetX;
        const y = (e.clientY - rect.top) / this.state.zoom - this.state.offsetY;
        return { x, y };
    },

    getTouchPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = (touch.clientX - rect.left) / this.state.zoom - this.state.offsetX;
        const y = (touch.clientY - rect.top) / this.state.zoom - this.state.offsetY;
        return { x, y };
    },

    onMouseDown(e) {
        const pos = this.getCanvasPos(e);
        this.state.dragStartX = pos.x;
        this.state.dragStartY = pos.y;

        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
            this.state.isDragging = true;
            this.state.dragMode = 'pan';
            this.canvas.style.cursor = 'grabbing';
            return;
        }

        if (this.state.activeTool === 'select') {
            const hitElement = this.hitTest(pos.x, pos.y);
            if (hitElement) {
                this.state.selectedId = hitElement.id;
                this.state.isDragging = true;
                this.state.dragMode = 'move';
                this.state.elementStartX = hitElement.x;
                this.state.elementStartY = hitElement.y;
                this.canvas.style.cursor = 'grabbing';
                this.updatePropertiesPanel();
            } else {
                this.state.selectedId = null;
                this.updatePropertiesPanel();
            }
            this.draw();
        } else {
            this.placeElement(this.state.activeTool, pos.x, pos.y);
        }
    },

    onMouseMove(e) {
        const pos = this.getCanvasPos(e);

        if (this.state.isDragging) {
            if (this.state.dragMode === 'pan') {
                const dx = (pos.x - this.state.dragStartX);
                const dy = (pos.y - this.state.dragStartY);
                this.state.offsetX += dx;
                this.state.offsetY += dy;
                this.draw();
            } else if (this.state.dragMode === 'move' && this.state.selectedId) {
                const element = this.getElementById(this.state.selectedId);
                if (element) {
                    element.x = this.state.elementStartX + (pos.x - this.state.dragStartX);
                    element.y = this.state.elementStartY + (pos.y - this.state.dragStartY);
                    this.state.raysDirty = true;
                    this.draw();
                }
            }
        } else {
            const hitElement = this.hitTest(pos.x, pos.y);
            this.canvas.style.cursor = hitElement ? 'pointer' : 'default';
        }
    },

    onMouseUp() {
        this.state.isDragging = false;
        this.state.dragMode = null;
        this.canvas.style.cursor = 'default';
    },

    onTouchStart(e) {
        e.preventDefault();
        const pos = this.getTouchPos(e);
        this.state.dragStartX = pos.x;
        this.state.dragStartY = pos.y;

        if (this.state.activeTool === 'select') {
            const hitElement = this.hitTest(pos.x, pos.y);
            if (hitElement) {
                this.state.selectedId = hitElement.id;
                this.state.isDragging = true;
                this.state.dragMode = 'move';
                this.state.elementStartX = hitElement.x;
                this.state.elementStartY = hitElement.y;
                this.updatePropertiesPanel();
            } else {
                this.state.selectedId = null;
                this.updatePropertiesPanel();
            }
            this.draw();
        } else {
            this.placeElement(this.state.activeTool, pos.x, pos.y);
        }
    },

    onTouchMove(e) {
        e.preventDefault();
        if (!this.state.isDragging || !this.state.selectedId) return;

        const pos = this.getTouchPos(e);
        const element = this.getElementById(this.state.selectedId);
        if (element) {
            element.x = this.state.elementStartX + (pos.x - this.state.dragStartX);
            element.y = this.state.elementStartY + (pos.y - this.state.dragStartY);
            this.state.raysDirty = true;
            this.draw();
        }
    },

    onWheel(e) {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom(factor);
    },

    zoom(factor) {
        this.state.zoom = Math.max(0.25, Math.min(4, this.state.zoom * factor));
        const zoomDisplay = document.getElementById('builderZoomLevel');
        if (zoomDisplay) {
            zoomDisplay.textContent = Math.round(this.state.zoom * 100) + '%';
        }
        this.draw();
    },

    resetView() {
        this.state.zoom = 1.0;
        this.state.offsetX = 0;
        this.state.offsetY = 0;
        const zoomDisplay = document.getElementById('builderZoomLevel');
        if (zoomDisplay) {
            zoomDisplay.textContent = '100%';
        }
        this.draw();
    },

    placeElement(type, x, y) {
        const element = {
            id: 'el-' + this.state.nextId++,
            type: type,
            x: x,
            y: y,
            rotation: 0,
            properties: { ...this.defaultProperties[type] }
        };

        this.state.elements.push(element);
        this.state.selectedId = element.id;
        this.state.raysDirty = true;
        this.setActiveTool('select');
        this.updatePropertiesPanel();
        this.draw();
        this.updateStats();
    },

    getElementById(id) {
        return this.state.elements.find(el => el.id === id);
    },

    hitTest(x, y) {
        for (let i = this.state.elements.length - 1; i >= 0; i--) {
            const el = this.state.elements[i];
            const hitRadius = this.getHitRadius(el);
            const dx = x - el.x;
            const dy = y - el.y;
            if (dx * dx + dy * dy < hitRadius * hitRadius) {
                return el;
            }
        }
        return null;
    },

    getHitRadius(element) {
        switch (element.type) {
            case ElementTypes.LIGHT_PARALLEL:
            case ElementTypes.LIGHT_POINT:
                return 25;
            case ElementTypes.PRISM:
                return element.properties.size / 2 + 10;
            case ElementTypes.LIQUID_BOX:
                return Math.max(element.properties.width, element.properties.height) / 2 + 10;
            default:
                return (element.properties.height || 120) / 2 + 10;
        }
    },

    deleteSelected() {
        if (!this.state.selectedId) return;
        this.state.elements = this.state.elements.filter(el => el.id !== this.state.selectedId);
        this.state.selectedId = null;
        this.state.raysDirty = true;
        this.updatePropertiesPanel();
        this.draw();
        this.updateStats();
    },

    duplicateSelected() {
        if (!this.state.selectedId) return;
        const original = this.getElementById(this.state.selectedId);
        if (!original) return;

        const clone = {
            id: 'el-' + this.state.nextId++,
            type: original.type,
            x: original.x + 30,
            y: original.y + 30,
            rotation: original.rotation,
            properties: { ...original.properties }
        };

        this.state.elements.push(clone);
        this.state.selectedId = clone.id;
        this.state.raysDirty = true;
        this.updatePropertiesPanel();
        this.draw();
        this.updateStats();
    },

    rotateSelected(angle) {
        if (!this.state.selectedId) return;
        const element = this.getElementById(this.state.selectedId);
        if (element) {
            element.rotation = (element.rotation + angle) % (2 * Math.PI);
            this.state.raysDirty = true;
            this.updatePropertiesPanel();
            this.draw();
        }
    },

    nudgeSelected(dx, dy) {
        if (!this.state.selectedId) return;
        const element = this.getElementById(this.state.selectedId);
        if (element) {
            element.x += dx;
            element.y += dy;
            this.state.raysDirty = true;
            this.draw();
        }
    },

    updateSelectedProperty(property, value) {
        if (!this.state.selectedId) return;
        const element = this.getElementById(this.state.selectedId);
        if (element && element.properties.hasOwnProperty(property)) {
            element.properties[property] = value;
            this.state.raysDirty = true;
            this.draw();
        }
    },

    updateSelectedRotation(rotation) {
        if (!this.state.selectedId) return;
        const element = this.getElementById(this.state.selectedId);
        if (element) {
            element.rotation = rotation;
            this.state.raysDirty = true;
            this.draw();
        }
    },

    clearAll() {
        this.state.elements = [];
        this.state.selectedId = null;
        this.state.raysDirty = true;
        this.updatePropertiesPanel();
        this.draw();
        this.updateStats();
    },

    updatePropertiesPanel() {
        const panel = document.getElementById('builderPropertiesContent');
        if (!panel) return;

        const element = this.state.selectedId ? this.getElementById(this.state.selectedId) : null;

        if (!element) {
            panel.innerHTML = `<p class="builder-no-selection">${t('selectElement')}</p>`;
            return;
        }

        let html = `<div class="builder-property-group">
            <span class="builder-property-label">${t('typeLabel')}</span>
            <span class="builder-property-value">${this.getElementTypeName(element.type)}</span>
        </div>`;

        const rotationDeg = Math.round(element.rotation * 180 / Math.PI);
        html += `<div class="builder-property-group">
            <label for="builderRotation">${t('rotation')} <span id="builderRotationValue">${rotationDeg}</span>&deg;</label>
            <input type="range" id="builderRotation" min="0" max="360" value="${rotationDeg}">
        </div>`;

        if (element.properties.height !== undefined) {
            html += `<div class="builder-property-group">
                <label for="builderHeight">${t('sizeLabel')} <span id="builderHeightValue">${element.properties.height}</span>px</label>
                <input type="range" id="builderHeight" min="40" max="250" value="${element.properties.height}">
            </div>`;
        }

        if (element.properties.size !== undefined) {
            html += `<div class="builder-property-group">
                <label for="builderSize">${t('sizeLabel')} <span id="builderSizeValue">${element.properties.size}</span>px</label>
                <input type="range" id="builderSize" min="40" max="200" value="${element.properties.size}">
            </div>`;
        }

        if (element.properties.width !== undefined && element.type === ElementTypes.LIQUID_BOX) {
            html += `<div class="builder-property-group">
                <label for="builderWidth">${t('widthLabel')} <span id="builderWidthValue">${element.properties.width}</span>px</label>
                <input type="range" id="builderWidth" min="40" max="200" value="${element.properties.width}">
            </div>`;
        }

        if (element.properties.focalLength !== undefined) {
            html += `<div class="builder-property-group">
                <label for="builderFocalLength">${t('focalLength')} <span id="builderFocalLengthValue">${element.properties.focalLength}</span>px</label>
                <input type="range" id="builderFocalLength" min="30" max="200" value="${element.properties.focalLength}">
            </div>`;
        }

        if (element.properties.rayCount !== undefined) {
            html += `<div class="builder-property-group">
                <label for="builderRayCount">${t('rayCount')} <span id="builderRayCountValue">${element.properties.rayCount}</span></label>
                <input type="range" id="builderRayCount" min="1" max="20" value="${element.properties.rayCount}">
            </div>`;
        }

        if (element.properties.refractiveIndex !== undefined) {
            html += `<div class="builder-property-group">
                <label for="builderRefractiveIndex">${t('refractiveIndexLabel')} <span id="builderRefractiveIndexValue">${element.properties.refractiveIndex.toFixed(2)}</span></label>
                <input type="range" id="builderRefractiveIndex" min="1.0" max="2.5" step="0.01" value="${element.properties.refractiveIndex}">
            </div>`;
        }

        html += `<div class="builder-property-actions">
            <button class="builder-action-btn" id="builderDuplicateBtn">${t('duplicate')}</button>
            <button class="builder-action-btn builder-delete-btn" id="builderDeleteBtn">${t('delete')}</button>
        </div>`;

        panel.innerHTML = html;
        this.setupPropertySliders();

        const deleteBtn = document.getElementById('builderDeleteBtn');
        const duplicateBtn = document.getElementById('builderDuplicateBtn');
        if (deleteBtn) deleteBtn.addEventListener('click', () => this.deleteSelected());
        if (duplicateBtn) duplicateBtn.addEventListener('click', () => this.duplicateSelected());
    },

    getElementTypeName(type) {
        const names = {
            [ElementTypes.LIGHT_PARALLEL]: t('parallelLight'),
            [ElementTypes.LIGHT_POINT]: t('pointLight'),
            [ElementTypes.CONVEX_LENS]: t('convexLensType'),
            [ElementTypes.CONCAVE_LENS]: t('concaveLensType'),
            [ElementTypes.PLANE_MIRROR]: t('planeMirrorType'),
            [ElementTypes.CONVEX_MIRROR]: t('convexMirrorType'),
            [ElementTypes.CONCAVE_MIRROR]: t('concaveMirrorType'),
            [ElementTypes.PRISM]: t('prismType'),
            [ElementTypes.LIQUID_BOX]: t('liquidBoxType')
        };
        return names[type] || type;
    },

    updateStats() {
        const lightSources = this.state.elements.filter(el =>
            el.type === ElementTypes.LIGHT_PARALLEL || el.type === ElementTypes.LIGHT_POINT
        ).length;
        const opticalElements = this.state.elements.length - lightSources;

        const statsEl = document.getElementById('builderStats');
        if (statsEl) {
            statsEl.textContent = `${t('lightSources')}: ${lightSources} | ${t('elements')}: ${opticalElements} | ${t('rays')}: ${this.state.rays.length}`;
        }
    },

    resize() {
        const container = this.canvas.parentElement;
        const { width, height, ctx } = CanvasUtils.setupCanvas(this.canvas, container);
        this.width = width;
        this.height = height;
        this.ctx = ctx;
        this.state.raysDirty = true;
        this.draw();
    },

    setDarkMode(isDark) {
        this.isDark = isDark;
        this.state.raysDirty = true;
        this.draw();
    },

    draw() {
        const ctx = this.ctx;
        if (!ctx || this.width === 0) return;

        CanvasUtils.clearCanvas(ctx, this.width, this.height, this.isDark);

        ctx.save();
        ctx.scale(this.state.zoom, this.state.zoom);
        ctx.translate(this.state.offsetX, this.state.offsetY);

        this.drawGrid();

        if (this.state.raysDirty) {
            this.state.rays = this.traceAllRays();
            this.state.raysDirty = false;
            this.updateStats();
        }

        this.drawRays();
        this.drawElements();
        this.drawSelection();

        ctx.restore();
    },

    drawGrid() {
        const ctx = this.ctx;
        const gridSize = 50;
        const startX = -this.state.offsetX - 500;
        const startY = -this.state.offsetY - 500;
        const endX = this.width / this.state.zoom - this.state.offsetX + 500;
        const endY = this.height / this.state.zoom - this.state.offsetY + 500;

        ctx.strokeStyle = this.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        for (let x = Math.floor(startX / gridSize) * gridSize; x < endX; x += gridSize) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }
        for (let y = Math.floor(startY / gridSize) * gridSize; y < endY; y += gridSize) {
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
        }
        ctx.stroke();
    },

    drawElements() {
        for (const element of this.state.elements) {
            this.drawElement(element);
        }
    },

    drawElement(element) {
        const ctx = this.ctx;

        ctx.save();
        ctx.translate(element.x, element.y);
        ctx.rotate(element.rotation);

        switch (element.type) {
            case ElementTypes.LIGHT_PARALLEL:
                this.drawLightSource(element, true);
                break;
            case ElementTypes.LIGHT_POINT:
                this.drawLightSource(element, false);
                break;
            case ElementTypes.CONVEX_LENS:
                CanvasUtils.drawConvexLens(ctx, 0, 0, element.properties.height, this.isDark);
                break;
            case ElementTypes.CONCAVE_LENS:
                CanvasUtils.drawConcaveLens(ctx, 0, 0, element.properties.height, this.isDark);
                break;
            case ElementTypes.PLANE_MIRROR:
                CanvasUtils.drawPlaneMirror(ctx, 0, 0, element.properties.height, this.isDark);
                break;
            case ElementTypes.CONVEX_MIRROR:
                CanvasUtils.drawConvexMirror(ctx, 0, 0, element.properties.height, element.properties.focalLength, this.isDark);
                break;
            case ElementTypes.CONCAVE_MIRROR:
                CanvasUtils.drawConcaveMirror(ctx, 0, 0, element.properties.height, element.properties.focalLength, this.isDark);
                break;
            case ElementTypes.PRISM:
                CanvasUtils.drawPrism(ctx, 0, 0, element.properties.size, element.properties.apexAngle, this.isDark);
                break;
            case ElementTypes.LIQUID_BOX:
                this.drawLiquidBox(element);
                break;
        }

        ctx.restore();
    },

    drawLightSource(element, isParallel) {
        const ctx = this.ctx;
        const defaultColor = this.isDark ? '#ffeb3b' : '#ff9800';
        const color = element.properties.wavelength ? this.wavelengthToColor(element.properties.wavelength) : defaultColor;

        ctx.fillStyle = color;
        ctx.strokeStyle = this.isDark ? '#fff' : '#333';
        ctx.lineWidth = 2;

        if (isParallel) {
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const x1 = Math.cos(angle) * 18;
                const y1 = Math.sin(angle) * 18;
                const x2 = Math.cos(angle) * 25;
                const y2 = Math.sin(angle) * 25;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, 28, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    },

    drawLiquidBox(element) {
        const ctx = this.ctx;
        const w = element.properties.width;
        const h = element.properties.height;

        ctx.fillStyle = this.isDark ? 'rgba(100, 200, 255, 0.2)' : 'rgba(100, 200, 255, 0.3)';
        ctx.strokeStyle = this.isDark ? '#64b5f6' : '#1976d2';
        ctx.lineWidth = 2;

        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.strokeRect(-w / 2, -h / 2, w, h);

        ctx.font = '12px -apple-system';
        ctx.fillStyle = this.isDark ? '#90caf9' : '#1565c0';
        ctx.textAlign = 'center';
        ctx.fillText(`n=${element.properties.refractiveIndex.toFixed(2)}`, 0, h / 2 + 15);
    },

    drawSelection() {
        if (!this.state.selectedId) return;
        const element = this.getElementById(this.state.selectedId);
        if (!element) return;

        const ctx = this.ctx;
        const radius = this.getHitRadius(element) + 5;

        ctx.save();
        ctx.translate(element.x, element.y);

        ctx.strokeStyle = '#4a90d9';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
    },

    drawRays() {
        const ctx = this.ctx;

        for (const ray of this.state.rays) {
            if (ray.points.length < 2) continue;

            ctx.strokeStyle = ray.color || '#ffeb3b';
            ctx.lineWidth = 2;
            ctx.globalAlpha = ray.intensity || 1;

            ctx.beginPath();
            ctx.moveTo(ray.points[0].x, ray.points[0].y);
            for (let i = 1; i < ray.points.length; i++) {
                ctx.lineTo(ray.points[i].x, ray.points[i].y);
            }
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
    },

    traceAllRays() {
        const rays = [];
        const lightSources = this.state.elements.filter(el =>
            el.type === ElementTypes.LIGHT_PARALLEL || el.type === ElementTypes.LIGHT_POINT
        );

        for (const source of lightSources) {
            const initialRays = this.generateInitialRays(source);
            for (const ray of initialRays) {
                this.traceRay(ray, rays, 0);
            }
        }

        return rays;
    },

    generateInitialRays(source) {
        const rays = [];
        const count = source.properties.rayCount;
        const wavelength = source.properties.wavelength;
        const defaultColor = this.isDark ? '#ffffff' : '#e53935';
        const color = wavelength === null ? defaultColor : this.wavelengthToColor(wavelength);

        if (source.type === ElementTypes.LIGHT_PARALLEL) {
            const width = source.properties.width || 80;
            const spacing = width / (count + 1);
            const cos = Math.cos(source.rotation);
            const sin = Math.sin(source.rotation);

            for (let i = 1; i <= count; i++) {
                const offset = -width / 2 + i * spacing;
                rays.push({
                    startX: source.x - sin * offset,
                    startY: source.y + cos * offset,
                    dx: cos, dy: sin,
                    wavelength, color, intensity: 1
                });
            }
        } else {
            const spreadAngle = (source.properties.spreadAngle || 120) * Math.PI / 180;
            const startAngle = source.rotation - spreadAngle / 2;
            const angleStep = spreadAngle / (count - 1 || 1);

            for (let i = 0; i < count; i++) {
                const angle = startAngle + i * angleStep;
                rays.push({
                    startX: source.x, startY: source.y,
                    dx: Math.cos(angle), dy: Math.sin(angle),
                    wavelength, color, intensity: 1
                });
            }
        }

        return rays;
    },

    traceRay(ray, outputRays, bounces) {
        if (bounces > MAX_BOUNCES || ray.intensity < MIN_RAY_INTENSITY) return;

        const hit = this.findNearestIntersection(ray);

        if (!hit) {
            const endX = ray.startX + ray.dx * 2000;
            const endY = ray.startY + ray.dy * 2000;
            outputRays.push({
                points: [{ x: ray.startX, y: ray.startY }, { x: endX, y: endY }],
                color: ray.color,
                intensity: ray.intensity
            });
            return;
        }

        outputRays.push({
            points: [{ x: ray.startX, y: ray.startY }, { x: hit.x, y: hit.y }],
            color: ray.color,
            intensity: ray.intensity
        });

        const outgoingRays = this.calculateInteraction(ray, hit);
        for (const outRay of outgoingRays) {
            this.traceRay(outRay, outputRays, bounces + 1);
        }
    },

    findNearestIntersection(ray) {
        let nearestHit = null;
        let nearestDist = Infinity;

        for (const element of this.state.elements) {
            if (element.type === ElementTypes.LIGHT_PARALLEL || element.type === ElementTypes.LIGHT_POINT) {
                continue;
            }

            const hits = this.getElementIntersections(ray, element);
            for (const hit of hits) {
                if (hit.t > 0.1 && hit.t < nearestDist) {
                    nearestDist = hit.t;
                    nearestHit = hit;
                }
            }
        }

        return nearestHit;
    },

    getElementIntersections(ray, element) {
        const hits = [];

        switch (element.type) {
            case ElementTypes.PLANE_MIRROR:
                this.intersectPlaneMirror(ray, element, hits);
                break;
            case ElementTypes.CONVEX_LENS:
            case ElementTypes.CONCAVE_LENS:
                this.intersectLens(ray, element, hits);
                break;
            case ElementTypes.CONVEX_MIRROR:
            case ElementTypes.CONCAVE_MIRROR:
                this.intersectCurvedMirror(ray, element, hits);
                break;
            case ElementTypes.PRISM:
                this.intersectPrism(ray, element, hits);
                break;
            case ElementTypes.LIQUID_BOX:
                this.intersectLiquidBox(ray, element, hits);
                break;
        }

        return hits;
    },

    intersectLinearElement(ray, element, hits, hitType) {
        const halfHeight = (element.properties.height || 120) / 2;
        const cos = Math.cos(element.rotation);
        const sin = Math.sin(element.rotation);

        const p1x = element.x - sin * halfHeight;
        const p1y = element.y + cos * halfHeight;
        const p2x = element.x + sin * halfHeight;
        const p2y = element.y - cos * halfHeight;

        const hit = this.lineLineIntersection(
            ray.startX, ray.startY, ray.dx, ray.dy,
            p1x, p1y, p2x - p1x, p2y - p1y
        );

        if (hit && hit.t > 0 && hit.u >= 0 && hit.u <= 1) {
            hits.push({
                x: ray.startX + ray.dx * hit.t,
                y: ray.startY + ray.dy * hit.t,
                t: hit.t,
                element: element,
                normalX: cos,
                normalY: sin,
                type: hitType
            });
        }
    },

    intersectPlaneMirror(ray, element, hits) {
        this.intersectLinearElement(ray, element, hits, 'mirror');
    },

    intersectLens(ray, element, hits) {
        const hitType = element.type === ElementTypes.CONVEX_LENS ? 'convex-lens' : 'concave-lens';
        this.intersectLinearElement(ray, element, hits, hitType);
    },

    intersectCurvedMirror(ray, element, hits) {
        const halfHeight = (element.properties.height || 120) / 2;
        const cos = Math.cos(element.rotation);
        const sin = Math.sin(element.rotation);

        const p1x = element.x - sin * halfHeight;
        const p1y = element.y + cos * halfHeight;
        const p2x = element.x + sin * halfHeight;
        const p2y = element.y - cos * halfHeight;

        const hit = this.lineLineIntersection(
            ray.startX, ray.startY, ray.dx, ray.dy,
            p1x, p1y, p2x - p1x, p2y - p1y
        );

        if (hit && hit.t > 0 && hit.u >= 0 && hit.u <= 1) {
            const hitX = ray.startX + ray.dx * hit.t;
            const hitY = ray.startY + ray.dy * hit.t;

            const localY = (hit.u - 0.5) * halfHeight * 2;
            const curvatureAngle = localY / element.properties.focalLength * 0.5;

            let normalX, normalY;
            if (element.type === ElementTypes.CONCAVE_MIRROR) {
                normalX = -cos * Math.cos(curvatureAngle) - sin * Math.sin(curvatureAngle);
                normalY = -sin * Math.cos(curvatureAngle) + cos * Math.sin(curvatureAngle);
            } else {
                normalX = cos * Math.cos(curvatureAngle) + sin * Math.sin(curvatureAngle);
                normalY = sin * Math.cos(curvatureAngle) - cos * Math.sin(curvatureAngle);
            }

            hits.push({
                x: hitX, y: hitY,
                t: hit.t,
                element: element,
                normalX, normalY,
                type: 'mirror'
            });
        }
    },

    intersectPrism(ray, element, hits) {
        const size = element.properties.size;
        const apexAngle = element.properties.apexAngle * Math.PI / 180;
        const cos = Math.cos(element.rotation);
        const sin = Math.sin(element.rotation);

        const height = size * Math.sin(apexAngle / 2);
        const baseHalf = size * Math.cos(apexAngle / 2);

        const apex = { x: 0, y: -height / 2 };
        const bottomLeft = { x: -baseHalf, y: height / 2 };
        const bottomRight = { x: baseHalf, y: height / 2 };

        const transform = (p) => ({
            x: element.x + cos * p.x - sin * p.y,
            y: element.y + sin * p.x + cos * p.y
        });

        const tApex = transform(apex);
        const tBottomLeft = transform(bottomLeft);
        const tBottomRight = transform(bottomRight);

        const edges = [
            { p1: tApex, p2: tBottomLeft, name: 'left' },
            { p1: tBottomLeft, p2: tBottomRight, name: 'bottom' },
            { p1: tBottomRight, p2: tApex, name: 'right' }
        ];

        for (const edge of edges) {
            const dx = edge.p2.x - edge.p1.x;
            const dy = edge.p2.y - edge.p1.y;
            const hit = this.lineLineIntersection(
                ray.startX, ray.startY, ray.dx, ray.dy,
                edge.p1.x, edge.p1.y, dx, dy
            );

            if (hit && hit.t > 0.001 && hit.u >= 0 && hit.u <= 1) {
                const len = Math.sqrt(dx * dx + dy * dy);
                let normalX = -dy / len;
                let normalY = dx / len;

                // Make sure normal points outward from prism center
                const hitX = ray.startX + ray.dx * hit.t;
                const hitY = ray.startY + ray.dy * hit.t;
                const toCenterX = element.x - hitX;
                const toCenterY = element.y - hitY;
                if (normalX * toCenterX + normalY * toCenterY > 0) {
                    normalX = -normalX;
                    normalY = -normalY;
                }

                hits.push({
                    x: hitX,
                    y: hitY,
                    t: hit.t,
                    element: element,
                    normalX, normalY,
                    type: 'prism',
                    edgeName: edge.name
                });
            }
        }
    },

    intersectLiquidBox(ray, element, hits) {
        const w = element.properties.width / 2;
        const h = element.properties.height / 2;
        const cos = Math.cos(element.rotation);
        const sin = Math.sin(element.rotation);

        const corners = [
            { x: -w, y: -h },
            { x: w, y: -h },
            { x: w, y: h },
            { x: -w, y: h }
        ];

        const transform = (p) => ({
            x: element.x + cos * p.x - sin * p.y,
            y: element.y + sin * p.x + cos * p.y
        });

        const tCorners = corners.map(transform);

        const edges = [
            { p1: tCorners[0], p2: tCorners[1], normalX: -sin, normalY: -cos },
            { p1: tCorners[1], p2: tCorners[2], normalX: cos, normalY: -sin },
            { p1: tCorners[2], p2: tCorners[3], normalX: sin, normalY: cos },
            { p1: tCorners[3], p2: tCorners[0], normalX: -cos, normalY: sin }
        ];

        for (const edge of edges) {
            const dx = edge.p2.x - edge.p1.x;
            const dy = edge.p2.y - edge.p1.y;
            const hit = this.lineLineIntersection(
                ray.startX, ray.startY, ray.dx, ray.dy,
                edge.p1.x, edge.p1.y, dx, dy
            );

            if (hit && hit.t > 0.1 && hit.u >= 0 && hit.u <= 1) {
                hits.push({
                    x: ray.startX + ray.dx * hit.t,
                    y: ray.startY + ray.dy * hit.t,
                    t: hit.t,
                    element: element,
                    normalX: edge.normalX,
                    normalY: edge.normalY,
                    type: 'liquid-box'
                });
            }
        }
    },

    lineLineIntersection(x1, y1, dx1, dy1, x2, y2, dx2, dy2) {
        const denom = dx1 * dy2 - dy1 * dx2;
        if (Math.abs(denom) < 0.0001) return null;

        const t = ((x2 - x1) * dy2 - (y2 - y1) * dx2) / denom;
        const u = ((x2 - x1) * dy1 - (y2 - y1) * dx1) / denom;

        return { t, u };
    },

    calculateInteraction(ray, hit) {
        const outRays = [];

        switch (hit.type) {
            case 'mirror':
                let normalX = hit.normalX;
                let normalY = hit.normalY;
                const dot = ray.dx * normalX + ray.dy * normalY;
                if (dot > 0) {
                    normalX = -normalX;
                    normalY = -normalY;
                }
                const reflected = this.reflect(ray.dx, ray.dy, normalX, normalY);
                outRays.push({
                    startX: hit.x, startY: hit.y,
                    dx: reflected.dx, dy: reflected.dy,
                    wavelength: ray.wavelength,
                    color: ray.color,
                    intensity: ray.intensity * 0.95
                });
                break;

            case 'convex-lens':
            case 'concave-lens':
                const lensRays = this.refractThroughLens(ray, hit);
                outRays.push(...lensRays);
                break;

            case 'prism':
                const prismRays = this.refractThroughPrism(ray, hit);
                outRays.push(...prismRays);
                break;

            case 'liquid-box':
                const liquidRays = this.refractThroughLiquid(ray, hit);
                outRays.push(...liquidRays);
                break;
        }

        return outRays;
    },

    reflect(dx, dy, normalX, normalY) {
        const dot = dx * normalX + dy * normalY;
        return {
            dx: dx - 2 * dot * normalX,
            dy: dy - 2 * dot * normalY
        };
    },

    refractThroughLens(ray, hit) {
        const element = hit.element;
        const f = element.properties.focalLength;
        const isConvex = element.type === ElementTypes.CONVEX_LENS;

        const relX = hit.x - element.x;
        const relY = hit.y - element.y;
        const cos = Math.cos(element.rotation);
        const sin = Math.sin(element.rotation);

        const hitHeight = -relX * sin + relY * cos;
        const deflectionAngle = isConvex ? -Math.atan(hitHeight / f) : Math.atan(hitHeight / f);
        const outAngle = Math.atan2(ray.dy, ray.dx) + deflectionAngle;

        return [{
            startX: hit.x, startY: hit.y,
            dx: Math.cos(outAngle), dy: Math.sin(outAngle),
            wavelength: ray.wavelength,
            color: ray.color,
            intensity: ray.intensity * 0.95
        }];
    },

    refractThroughPrism(ray, hit) {
        const element = hit.element;
        const baseN = 1.52;

        // Determine if entering or exiting prism based on dot product
        const dot = ray.dx * hit.normalX + ray.dy * hit.normalY;
        const entering = dot < 0;

        // Adjust normal to always point against ray direction
        const normalX = entering ? hit.normalX : -hit.normalX;
        const normalY = entering ? hit.normalY : -hit.normalY;
        const adjustedHit = { ...hit, normalX, normalY };

        if (ray.wavelength === null) {
            const colors = [
                { wavelength: 700, color: '#ff0000', n: 1.513 },
                { wavelength: 620, color: '#ff7f00', n: 1.517 },
                { wavelength: 580, color: '#ffff00', n: 1.519 },
                { wavelength: 530, color: '#00ff00', n: 1.522 },
                { wavelength: 470, color: '#0000ff', n: 1.528 },
                { wavelength: 445, color: '#4b0082', n: 1.531 },
                { wavelength: 400, color: '#9400d3', n: 1.536 }
            ];

            const outRays = [];
            for (const colorData of colors) {
                // When entering: air (1.0) -> glass (n), when exiting: glass (n) -> air (1.0)
                const n1 = entering ? 1.0 : colorData.n;
                const n2 = entering ? colorData.n : 1.0;
                const refracted = this.refractSingle(ray, adjustedHit, n1, n2);
                if (refracted) {
                    outRays.push({
                        ...refracted,
                        wavelength: colorData.wavelength,
                        color: colorData.color,
                        intensity: ray.intensity * 0.9 / colors.length
                    });
                } else {
                    // Total internal reflection
                    const reflected = this.reflect(ray.dx, ray.dy, normalX, normalY);
                    outRays.push({
                        startX: hit.x, startY: hit.y,
                        dx: reflected.dx, dy: reflected.dy,
                        wavelength: colorData.wavelength,
                        color: colorData.color,
                        intensity: ray.intensity * 0.9 / colors.length
                    });
                }
            }
            return outRays;
        } else {
            const n = this.getRefractiveIndex(baseN, ray.wavelength);
            const n1 = entering ? 1.0 : n;
            const n2 = entering ? n : 1.0;
            const refracted = this.refractSingle(ray, adjustedHit, n1, n2);
            if (refracted) {
                return [{ ...refracted, wavelength: ray.wavelength, color: ray.color, intensity: ray.intensity * 0.95 }];
            } else {
                // Total internal reflection
                const reflected = this.reflect(ray.dx, ray.dy, normalX, normalY);
                return [{
                    startX: hit.x, startY: hit.y,
                    dx: reflected.dx, dy: reflected.dy,
                    wavelength: ray.wavelength,
                    color: ray.color,
                    intensity: ray.intensity * 0.95
                }];
            }
        }
    },

    refractThroughLiquid(ray, hit) {
        const element = hit.element;
        const n2 = element.properties.refractiveIndex;
        const n1 = 1.0;

        const dot = ray.dx * hit.normalX + ray.dy * hit.normalY;
        const entering = dot < 0;

        const nFrom = entering ? n1 : n2;
        const nTo = entering ? n2 : n1;
        const normal = entering ? { x: hit.normalX, y: hit.normalY } : { x: -hit.normalX, y: -hit.normalY };

        const refracted = this.refractSingle(ray, { ...hit, normalX: normal.x, normalY: normal.y }, nFrom, nTo);

        if (refracted) {
            return [{
                ...refracted,
                wavelength: ray.wavelength,
                color: ray.color,
                intensity: ray.intensity * 0.95
            }];
        } else {
            const reflected = this.reflect(ray.dx, ray.dy, normal.x, normal.y);
            return [{
                startX: hit.x, startY: hit.y,
                dx: reflected.dx, dy: reflected.dy,
                wavelength: ray.wavelength,
                color: ray.color,
                intensity: ray.intensity * 0.95
            }];
        }
    },

    refractSingle(ray, hit, n1, n2) {
        const cosThetaI = -(ray.dx * hit.normalX + ray.dy * hit.normalY);
        const ratio = n1 / n2;
        const sin2ThetaT = ratio * ratio * (1 - cosThetaI * cosThetaI);

        if (sin2ThetaT > 1) {
            return null;
        }

        const cosThetaT = Math.sqrt(1 - sin2ThetaT);
        const sign = cosThetaI >= 0 ? 1 : -1;

        return {
            startX: hit.x,
            startY: hit.y,
            dx: ratio * ray.dx + (ratio * cosThetaI - sign * cosThetaT) * hit.normalX,
            dy: ratio * ray.dy + (ratio * cosThetaI - sign * cosThetaT) * hit.normalY
        };
    },

    getRefractiveIndex(baseN, wavelength) {
        if (wavelength === null) return baseN;
        return baseN + 0.02 * (700 - wavelength) / 300;
    },

    wavelengthToColor(wavelength) {
        if (wavelength === null) return '#ffffff';

        if (wavelength >= 680) return '#ff0000';
        if (wavelength >= 620) return '#ff7f00';
        if (wavelength >= 570) return '#ffff00';
        if (wavelength >= 495) return '#00ff00';
        if (wavelength >= 450) return '#0000ff';
        if (wavelength >= 420) return '#4b0082';
        return '#9400d3';
    }
};
