// Base class for mirror/lens simulations
class OpticsLab {
    constructor(config) {
        this.canvasId = config.canvasId;
        this.prefix = config.prefix;
        this.type = config.type;
        this.guidedSteps = config.guidedSteps || [];

        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        this.isDark = false;

        this.objectX = 0;
        this.objectHeight = 60;
        this.focalLength = 100;
        this.axisY = 0;
        this.opticsX = 0;

        this.isDragging = false;
        this.dragOffsetX = 0;
    }

    init() {
        this.canvas = document.getElementById(this.canvasId);
        if (!this.canvas) return;
        this.setupEventListeners();
        this.resize();
    }

    setupEventListeners() {
        const focalInput = document.getElementById(`${this.prefix}FocalLength`);
        if (focalInput) {
            focalInput.addEventListener('input', (e) => {
                this.focalLength = parseInt(e.target.value);
                document.getElementById(`${this.prefix}FocalValue`).textContent = this.focalLength;
                this.draw();
            });
        }

        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.onMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.onMouseUp());

        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', () => this.onMouseUp());
    }

    resize() {
        const container = this.canvas.parentElement;
        const { width, height, ctx } = CanvasUtils.setupCanvas(this.canvas, container);
        this.width = width;
        this.height = height;
        this.ctx = ctx;
        this.axisY = height / 2;
        this.opticsX = this.type.includes('lens') ? width / 2 : width * 0.7;

        if (this.objectX === 0) {
            this.objectX = this.opticsX - this.focalLength * 1.5;
        }

        this.draw();
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    getTouchPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }

    isNearObject(x, y) {
        const objectTop = this.axisY - this.objectHeight;
        return Math.abs(x - this.objectX) < 30 && y >= objectTop - 20 && y <= this.axisY + 10;
    }

    onMouseDown(e) {
        const pos = this.getMousePos(e);
        if (this.isNearObject(pos.x, pos.y)) {
            this.isDragging = true;
            this.dragOffsetX = pos.x - this.objectX;
            this.canvas.style.cursor = 'grabbing';
        }
    }

    onMouseMove(e) {
        const pos = this.getMousePos(e);
        if (this.isDragging) {
            const minX = 50;
            const maxX = this.opticsX - 30;
            this.objectX = Math.max(minX, Math.min(maxX, pos.x - this.dragOffsetX));
            this.draw();
        } else {
            this.canvas.style.cursor = this.isNearObject(pos.x, pos.y) ? 'grab' : 'default';
        }
    }

    onMouseUp() {
        this.isDragging = false;
        this.canvas.style.cursor = 'default';
    }

    onTouchStart(e) {
        e.preventDefault();
        const pos = this.getTouchPos(e);
        if (this.isNearObject(pos.x, pos.y)) {
            this.isDragging = true;
            this.dragOffsetX = pos.x - this.objectX;
        }
    }

    onTouchMove(e) {
        if (this.isDragging) {
            e.preventDefault();
            const pos = this.getTouchPos(e);
            const minX = 50;
            const maxX = this.opticsX - 30;
            this.objectX = Math.max(minX, Math.min(maxX, pos.x - this.dragOffsetX));
            this.draw();
        }
    }

    setDarkMode(isDark) {
        this.isDark = isDark;
        this.draw();
    }

    updateInfoPanel(imageData) {
        const prefix = this.prefix;
        if (imageData.atInfinity) {
            document.getElementById(`${prefix}ImageType`).textContent = t('atInfinity');
            document.getElementById(`${prefix}ImageOrientation`).textContent = '-';
            document.getElementById(`${prefix}ImageSize`).textContent = '-';
            document.getElementById(`${prefix}Magnification`).textContent = '∞';
            return;
        }

        document.getElementById(`${prefix}ImageType`).textContent = imageData.isReal ? t('real') : t('virtual');
        document.getElementById(`${prefix}ImageOrientation`).textContent = imageData.isInverted ? t('inverted') : t('upright');

        const sizeRatio = Math.abs(imageData.magnification);
        let sizeText = t('sameSize');
        if (Math.abs(sizeRatio - 1) >= 0.05) {
            sizeText = sizeRatio > 1 ? t('enlarged') : t('reduced');
        }
        document.getElementById(`${prefix}ImageSize`).textContent = sizeText;
        document.getElementById(`${prefix}Magnification`).textContent = imageData.magnification.toFixed(2) + 'x';
    }

    draw() {}
}

// Plane Mirror Lab
const PlaneMirrorLab = {
    canvas: null, ctx: null, width: 0, height: 0, isDark: false,
    mirrorX: 0, axisY: 0, objectX: 0, objectHeight: 60,
    isDragging: false, dragStartX: 0, objectStartX: 0,

    guidedSteps: [
        { text: "Välkommen till laborationen om plana speglar! Den grå linjen till höger är en vanlig flat spegel, som den du har hemma i badrummet.", concept: "Plan spegel" },
        { text: "Den blå pilen är ett FÖREMÅL som står framför spegeln. Titta på de röda strålarna - de visar hur ljuset färdas från föremålet till spegeln.", concept: "Föremål och ljusstrålar" },
        { text: "NORMALEN är den streckade linjen som står VINKELRÄT mot spegeln. Alla vinklar mäts från normalen!", concept: "Normalen" },
        { text: "REFLEKTIONSLAGEN: Infallsvinkeln (θi) är ALLTID lika stor som reflektionsvinkeln (θr). Dra i canvas för att flytta föremålet!", concept: "Reflektionslagen" },
        { text: "Den orangea pilen är BILDEN. I en plan spegel är bilden alltid: VIRTUELL (bakom spegeln), UPPRÄTT och LIKA STOR som föremålet. Experimentera fritt!", concept: "Spegelbilden" }
    ],

    init() {
        this.canvas = document.getElementById('planeMirrorCanvas');
        if (!this.canvas) return;

        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            const rect = this.canvas.getBoundingClientRect();
            this.dragStartX = (e.clientX - rect.left) * (this.width / rect.width);
            this.objectStartX = this.objectX;
        });
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const rect = this.canvas.getBoundingClientRect();
                const currentX = (e.clientX - rect.left) * (this.width / rect.width);
                const deltaX = currentX - this.dragStartX;
                this.objectX = Math.max(50, Math.min(this.mirrorX - 30, this.objectStartX + deltaX));
                this.draw();
            }
        });
        this.canvas.addEventListener('mouseup', () => { this.isDragging = false; });
        this.canvas.addEventListener('mouseleave', () => { this.isDragging = false; });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isDragging = true;
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.dragStartX = (touch.clientX - rect.left) * (this.width / rect.width);
            this.objectStartX = this.objectX;
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isDragging) {
                const rect = this.canvas.getBoundingClientRect();
                const touch = e.touches[0];
                const currentX = (touch.clientX - rect.left) * (this.width / rect.width);
                const deltaX = currentX - this.dragStartX;
                this.objectX = Math.max(50, Math.min(this.mirrorX - 30, this.objectStartX + deltaX));
                this.draw();
            }
        }, { passive: false });
        this.canvas.addEventListener('touchend', () => { this.isDragging = false; });

        this.resize();
    },

    resize() {
        const container = this.canvas.parentElement;
        const { width, height, ctx } = CanvasUtils.setupCanvas(this.canvas, container);
        this.width = width; this.height = height; this.ctx = ctx;
        this.mirrorX = width * 0.7; this.axisY = height / 2;
        if (this.objectX <= 0 || this.objectX >= this.mirrorX) {
            this.objectX = this.mirrorX - 150;
        }
        this.draw();
    },

    setDarkMode(isDark) { this.isDark = isDark; this.draw(); },

    draw() {
        const ctx = this.ctx;
        if (!ctx || this.width === 0) return; // Guard against uninitialized canvas
        CanvasUtils.clearCanvas(ctx, this.width, this.height, this.isDark);
        CanvasUtils.drawOpticalAxis(ctx, this.width, this.height, this.isDark);
        CanvasUtils.drawPlaneMirror(ctx, this.mirrorX, this.axisY, 200, this.isDark);

        // Draw object
        CanvasUtils.drawObject(ctx, this.objectX, this.axisY, this.objectHeight, CanvasUtils.colors.object);

        // Draw instruction
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = this.isDark ? '#6699cc' : '#4477aa';
        ctx.textAlign = 'center';
        ctx.fillText(t('dragToMove'), this.width / 2, 25);

        CanvasUtils.drawLabel(ctx, t('objectLabel'), this.objectX, this.axisY + 25, this.isDark);

        const objectDistance = this.mirrorX - this.objectX;
        const imageX = this.mirrorX + objectDistance;
        CanvasUtils.drawImage(ctx, imageX, this.axisY, this.objectHeight, false, false);
        CanvasUtils.drawLabel(ctx, t('imageLabel'), imageX, this.axisY + 25, this.isDark);

        const objectTop = { x: this.objectX, y: this.axisY - this.objectHeight };
        CanvasUtils.drawRay(ctx, [objectTop, { x: this.mirrorX, y: objectTop.y }], CanvasUtils.colors.rayParallel, false, 2);
        CanvasUtils.drawRay(ctx, [{ x: this.mirrorX, y: objectTop.y }, { x: 0, y: objectTop.y }], CanvasUtils.colors.rayParallel, false, 2);
        CanvasUtils.drawRay(ctx, [{ x: this.mirrorX, y: objectTop.y }, { x: imageX, y: objectTop.y }], CanvasUtils.colors.rayParallel, true, 1);

        const hitY = this.axisY - this.objectHeight * 0.4;
        CanvasUtils.drawRay(ctx, [objectTop, { x: this.mirrorX, y: hitY }], CanvasUtils.colors.rayFocal, false, 2);
        const angle = Math.atan2(hitY - objectTop.y, this.mirrorX - objectTop.x);
        const reflectEndY = hitY + (this.mirrorX) * Math.tan(Math.PI - angle);
        CanvasUtils.drawRay(ctx, [{ x: this.mirrorX, y: hitY }, { x: 0, y: reflectEndY }], CanvasUtils.colors.rayFocal, false, 2);
        CanvasUtils.drawRay(ctx, [{ x: this.mirrorX, y: hitY }, { x: imageX, y: this.axisY - this.objectHeight }], CanvasUtils.colors.rayFocal, true, 1);

        // Draw normal and angles
        ctx.strokeStyle = this.isDark ? '#555566' : '#999999';
        ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(this.mirrorX, hitY - 50); ctx.lineTo(this.mirrorX - 80, hitY - 50); ctx.stroke();
        ctx.setLineDash([]);
        CanvasUtils.drawLabel(ctx, 'Normal', this.mirrorX - 50, hitY - 60, this.isDark);

        const angleFromNormal = Math.abs(Math.atan2(objectTop.x - this.mirrorX, objectTop.y - hitY));
        const angleDeg = Math.round(CanvasUtils.radToDeg(angleFromNormal));
        CanvasUtils.drawLabel(ctx, `θi = ${angleDeg}°`, this.mirrorX - 55, hitY - 30, this.isDark);
        CanvasUtils.drawLabel(ctx, `θr = ${angleDeg}°`, this.mirrorX - 55, hitY - 10, this.isDark);

        document.getElementById('planeMirrorImageType').textContent = t('virtual');
        document.getElementById('planeMirrorImageOrientation').textContent = t('upright');
        document.getElementById('planeMirrorImageSize').textContent = t('sameSize');
        document.getElementById('planeMirrorMagnification').textContent = '1.00x';
    }
};

// Concave Mirror Lab
const ConcaveMirrorLab = {
    canvas: null, ctx: null, width: 0, height: 0, isDark: false,
    mirrorX: 0, axisY: 0, objectX: 0, objectHeight: 60, focalLength: 100,
    isDragging: false, dragStartX: 0, objectStartX: 0,

    guidedSteps: [
        { text: "Nu ska vi studera KONKAVA speglar (hålspeglar). De är ihåliga och SAMLAR ljusstrålar.", concept: "Konkav spegel" },
        { text: "F markerar BRÄNNPUNKTEN (fokus) - där parallella ljusstrålar samlas. C är KRÖKNINGSCENTRUM - mittpunkten för spegelns krökning.", concept: "Brännpunkt & krökningscentrum" },
        { text: "BRÄNNVIDDEN (f) är avståndet från spegeln till brännpunkten. Krökningsradien är 2f.", concept: "Brännvidd" },
        { text: "Dra föremålet BORTOM C. Bilden blir verklig, omvänd och FÖRMINSKAD. Så fungerar teleskopspeglar!", concept: "Föremål bortom C" },
        { text: "Dra föremålet MELLAN F och C. Bilden blir verklig, omvänd och FÖRSTORAD. Används i sminkspeglar!", concept: "Föremål mellan F och C" },
        { text: "Dra föremålet INNANFÖR F. Bilden blir virtuell, upprätt och förstorad - som en förstoringsspegel! Experimentera fritt!", concept: "Föremål innanför F" }
    ],

    init() {
        this.canvas = document.getElementById('concaveMirrorCanvas');
        if (!this.canvas) return;
        document.getElementById('concaveMirrorFocalLength').addEventListener('input', (e) => {
            this.focalLength = parseInt(e.target.value);
            document.getElementById('concaveMirrorFocalValue').textContent = this.focalLength;
            this.draw();
        });

        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            const rect = this.canvas.getBoundingClientRect();
            this.dragStartX = (e.clientX - rect.left) * (this.width / rect.width);
            this.objectStartX = this.objectX;
        });
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const rect = this.canvas.getBoundingClientRect();
                const currentX = (e.clientX - rect.left) * (this.width / rect.width);
                const deltaX = currentX - this.dragStartX;
                this.objectX = Math.max(50, Math.min(this.mirrorX - 30, this.objectStartX + deltaX));
                this.draw();
            }
        });
        this.canvas.addEventListener('mouseup', () => { this.isDragging = false; });
        this.canvas.addEventListener('mouseleave', () => { this.isDragging = false; });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isDragging = true;
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.dragStartX = (touch.clientX - rect.left) * (this.width / rect.width);
            this.objectStartX = this.objectX;
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isDragging) {
                const rect = this.canvas.getBoundingClientRect();
                const touch = e.touches[0];
                const currentX = (touch.clientX - rect.left) * (this.width / rect.width);
                const deltaX = currentX - this.dragStartX;
                this.objectX = Math.max(50, Math.min(this.mirrorX - 30, this.objectStartX + deltaX));
                this.draw();
            }
        }, { passive: false });
        this.canvas.addEventListener('touchend', () => { this.isDragging = false; });

        this.resize();
    },

    resize() {
        const container = this.canvas.parentElement;
        const { width, height, ctx } = CanvasUtils.setupCanvas(this.canvas, container);
        this.width = width; this.height = height; this.ctx = ctx;
        this.mirrorX = width * 0.75; this.axisY = height / 2;
        if (this.objectX <= 0 || this.objectX >= this.mirrorX) {
            this.objectX = this.mirrorX - this.focalLength * 1.5;
        }
        this.draw();
    },

    setDarkMode(isDark) { this.isDark = isDark; this.draw(); },

    calculateImage() {
        const objectDistance = this.mirrorX - this.objectX;
        const f = this.focalLength;
        if (Math.abs(objectDistance - f) < 1) return { atInfinity: true };
        const imageDistance = (objectDistance * f) / (objectDistance - f);
        const magnification = -imageDistance / objectDistance;
        return { imageDistance, magnification, imageHeight: this.objectHeight * Math.abs(magnification) * (magnification < 0 ? -1 : 1), isReal: imageDistance > 0, isInverted: magnification < 0, imageX: this.mirrorX - imageDistance, atInfinity: false };
    },

    draw() {
        const ctx = this.ctx;
        if (!ctx || this.width === 0) return;
        CanvasUtils.clearCanvas(ctx, this.width, this.height, this.isDark);
        CanvasUtils.drawOpticalAxis(ctx, this.width, this.height, this.isDark);
        CanvasUtils.drawConcaveMirror(ctx, this.mirrorX, this.axisY, 200, this.focalLength, this.isDark);
        CanvasUtils.drawFocalPoint(ctx, this.mirrorX - this.focalLength, this.axisY, 'F', this.isDark);
        CanvasUtils.drawFocalPoint(ctx, this.mirrorX - this.focalLength * 2, this.axisY, 'C', this.isDark);

        // Draw instruction
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = this.isDark ? '#6699cc' : '#4477aa';
        ctx.textAlign = 'center';
        ctx.fillText(t('dragToMove'), this.width / 2, 25);

        CanvasUtils.drawObject(ctx, this.objectX, this.axisY, this.objectHeight, CanvasUtils.colors.object);
        CanvasUtils.drawLabel(ctx, t('objectLabel'), this.objectX, this.axisY + 25, this.isDark);

        const imageData = this.calculateImage();
        if (!imageData.atInfinity) {
            const displayHeight = Math.min(Math.abs(imageData.imageHeight), 150);
            CanvasUtils.drawImage(ctx, Math.max(20, Math.min(this.width - 20, imageData.imageX)), this.axisY, displayHeight * Math.sign(imageData.imageHeight), imageData.isReal, imageData.isInverted);
            CanvasUtils.drawLabel(ctx, t('imageLabel'), imageData.imageX, this.axisY + (imageData.isInverted ? displayHeight + 25 : 25), this.isDark);
        }

        this.drawRays(imageData);
        this.updateInfoPanel(imageData);
    },

    drawRays(imageData) {
        const ctx = this.ctx;
        const objectTop = { x: this.objectX, y: this.axisY - this.objectHeight };
        const f = this.focalLength;
        const focalPoint = { x: this.mirrorX - f, y: this.axisY };

        CanvasUtils.drawRay(ctx, [objectTop, { x: this.mirrorX, y: objectTop.y }], CanvasUtils.colors.rayParallel, false, 2);
        if (imageData.isReal) {
            const slope = (focalPoint.y - objectTop.y) / (focalPoint.x - this.mirrorX);
            CanvasUtils.drawRay(ctx, [{ x: this.mirrorX, y: objectTop.y }, { x: 0, y: objectTop.y + slope * (0 - this.mirrorX) }], CanvasUtils.colors.rayParallel, false, 2);
        } else {
            const slope = (objectTop.y - focalPoint.y) / (this.mirrorX - focalPoint.x);
            CanvasUtils.drawRay(ctx, [{ x: this.mirrorX, y: objectTop.y }, { x: 0, y: objectTop.y - slope * this.mirrorX }], CanvasUtils.colors.rayParallel, false, 2);
            CanvasUtils.drawRay(ctx, [{ x: this.mirrorX, y: objectTop.y }, { x: this.width, y: objectTop.y + slope * (this.width - this.mirrorX) }], CanvasUtils.colors.rayParallel, true, 1);
        }

        const slopeToFocal = (focalPoint.y - objectTop.y) / (focalPoint.x - objectTop.x);
        const mirrorY = objectTop.y + slopeToFocal * (this.mirrorX - objectTop.x);
        CanvasUtils.drawRay(ctx, [objectTop, { x: this.mirrorX, y: mirrorY }], CanvasUtils.colors.rayFocal, false, 2);
        CanvasUtils.drawRay(ctx, [{ x: this.mirrorX, y: mirrorY }, { x: 0, y: mirrorY }], CanvasUtils.colors.rayFocal, false, 2);
        if (!imageData.isReal) CanvasUtils.drawRay(ctx, [{ x: this.mirrorX, y: mirrorY }, { x: this.width, y: mirrorY }], CanvasUtils.colors.rayFocal, true, 1);

        const center = { x: this.mirrorX - f * 2, y: this.axisY };
        const slopeToCenter = (center.y - objectTop.y) / (center.x - objectTop.x);
        const mirrorY2 = objectTop.y + slopeToCenter * (this.mirrorX - objectTop.x);
        CanvasUtils.drawRay(ctx, [objectTop, { x: this.mirrorX, y: mirrorY2 }], CanvasUtils.colors.rayCenter, false, 2);
        CanvasUtils.drawRay(ctx, [{ x: this.mirrorX, y: mirrorY2 }, { x: 0, y: mirrorY2 - slopeToCenter * this.mirrorX }], CanvasUtils.colors.rayCenter, false, 2);
        if (!imageData.isReal) CanvasUtils.drawRay(ctx, [{ x: this.mirrorX, y: mirrorY2 }, { x: this.width, y: mirrorY2 + slopeToCenter * (this.width - this.mirrorX) }], CanvasUtils.colors.rayCenter, true, 1);
    },

    updateInfoPanel(imageData) {
        if (imageData.atInfinity) {
            document.getElementById('concaveMirrorImageType').textContent = t('atInfinity');
            document.getElementById('concaveMirrorImageOrientation').textContent = '-';
            document.getElementById('concaveMirrorImageSize').textContent = '-';
            document.getElementById('concaveMirrorMagnification').textContent = '∞';
            return;
        }
        document.getElementById('concaveMirrorImageType').textContent = imageData.isReal ? t('real') : t('virtual');
        document.getElementById('concaveMirrorImageOrientation').textContent = imageData.isInverted ? t('inverted') : t('upright');
        const sizeRatio = Math.abs(imageData.magnification);
        document.getElementById('concaveMirrorImageSize').textContent = Math.abs(sizeRatio - 1) < 0.05 ? t('sameSize') : (sizeRatio > 1 ? t('enlarged') : t('reduced'));
        document.getElementById('concaveMirrorMagnification').textContent = imageData.magnification.toFixed(2) + 'x';
    }
};

// Convex Mirror Lab
const ConvexMirrorLab = {
    canvas: null, ctx: null, width: 0, height: 0, isDark: false,
    mirrorX: 0, axisY: 0, objectX: 0, objectHeight: 60, focalLength: 100,
    isDragging: false, dragStartX: 0, objectStartX: 0,

    guidedSteps: [
        { text: "Nu ska vi studera KONVEXA speglar (kupiga speglar). De buktar UTÅT och SPRIDER ljusstrålar.", concept: "Konvex spegel" },
        { text: "Brännpunkten F och krökningscentrum C ligger BAKOM spegeln (virtuella punkter). Strålarna ser ut att komma från F.", concept: "Virtuell brännpunkt" },
        { text: "En konvex spegel ger ALLTID samma typ av bild: virtuell, upprätt och förminskad - oavsett var föremålet står!", concept: "Konvex spegelbild" },
        { text: "Backspeglar på bilar är konvexa! De ger ett BREDARE synfält men föremål ser mindre ut. Därför står det 'Objects may be closer'. Experimentera fritt!", concept: "Tillämpning: Backspeglar" }
    ],

    init() {
        this.canvas = document.getElementById('convexMirrorCanvas');
        if (!this.canvas) return;
        document.getElementById('convexMirrorFocalLength').addEventListener('input', (e) => {
            this.focalLength = parseInt(e.target.value);
            document.getElementById('convexMirrorFocalValue').textContent = this.focalLength;
            this.draw();
        });

        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            const rect = this.canvas.getBoundingClientRect();
            this.dragStartX = (e.clientX - rect.left) * (this.width / rect.width);
            this.objectStartX = this.objectX;
        });
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const rect = this.canvas.getBoundingClientRect();
                const currentX = (e.clientX - rect.left) * (this.width / rect.width);
                const deltaX = currentX - this.dragStartX;
                this.objectX = Math.max(50, Math.min(this.mirrorX - 30, this.objectStartX + deltaX));
                this.draw();
            }
        });
        this.canvas.addEventListener('mouseup', () => { this.isDragging = false; });
        this.canvas.addEventListener('mouseleave', () => { this.isDragging = false; });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isDragging = true;
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.dragStartX = (touch.clientX - rect.left) * (this.width / rect.width);
            this.objectStartX = this.objectX;
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isDragging) {
                const rect = this.canvas.getBoundingClientRect();
                const touch = e.touches[0];
                const currentX = (touch.clientX - rect.left) * (this.width / rect.width);
                const deltaX = currentX - this.dragStartX;
                this.objectX = Math.max(50, Math.min(this.mirrorX - 30, this.objectStartX + deltaX));
                this.draw();
            }
        }, { passive: false });
        this.canvas.addEventListener('touchend', () => { this.isDragging = false; });

        this.resize();
    },

    resize() {
        const container = this.canvas.parentElement;
        const { width, height, ctx } = CanvasUtils.setupCanvas(this.canvas, container);
        this.width = width; this.height = height; this.ctx = ctx;
        this.mirrorX = width * 0.65; this.axisY = height / 2;
        if (this.objectX <= 0 || this.objectX >= this.mirrorX) {
            this.objectX = this.mirrorX - this.focalLength * 1.5;
        }
        this.draw();
    },

    setDarkMode(isDark) { this.isDark = isDark; this.draw(); },

    calculateImage() {
        const objectDistance = this.mirrorX - this.objectX;
        const f = -this.focalLength;
        const imageDistance = (objectDistance * f) / (objectDistance - f);
        const magnification = -imageDistance / objectDistance;
        return { imageDistance, magnification, imageHeight: this.objectHeight * Math.abs(magnification), isReal: false, isInverted: false, imageX: this.mirrorX - imageDistance, atInfinity: false };
    },

    draw() {
        const ctx = this.ctx;
        if (!ctx || this.width === 0) return;
        CanvasUtils.clearCanvas(ctx, this.width, this.height, this.isDark);
        CanvasUtils.drawOpticalAxis(ctx, this.width, this.height, this.isDark);
        CanvasUtils.drawConvexMirror(ctx, this.mirrorX, this.axisY, 200, this.focalLength, this.isDark);
        CanvasUtils.drawFocalPoint(ctx, this.mirrorX + this.focalLength, this.axisY, 'F', this.isDark);
        CanvasUtils.drawFocalPoint(ctx, this.mirrorX + this.focalLength * 2, this.axisY, 'C', this.isDark);

        // Draw instruction
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = this.isDark ? '#6699cc' : '#4477aa';
        ctx.textAlign = 'center';
        ctx.fillText(t('dragToMove'), this.width / 2, 25);

        CanvasUtils.drawObject(ctx, this.objectX, this.axisY, this.objectHeight, CanvasUtils.colors.object);
        CanvasUtils.drawLabel(ctx, t('objectLabel'), this.objectX, this.axisY + 25, this.isDark);

        const imageData = this.calculateImage();
        CanvasUtils.drawImage(ctx, imageData.imageX, this.axisY, imageData.imageHeight, false, false);
        CanvasUtils.drawLabel(ctx, t('imageLabel'), imageData.imageX, this.axisY + 25, this.isDark);

        this.drawRays(imageData);
        this.updateInfoPanel(imageData);
    },

    drawRays(imageData) {
        const ctx = this.ctx;
        const objectTop = { x: this.objectX, y: this.axisY - this.objectHeight };
        const virtualFocal = { x: this.mirrorX + this.focalLength, y: this.axisY };

        CanvasUtils.drawRay(ctx, [objectTop, { x: this.mirrorX, y: objectTop.y }], CanvasUtils.colors.rayParallel, false, 2);
        const slope = (objectTop.y - virtualFocal.y) / (this.mirrorX - virtualFocal.x);
        CanvasUtils.drawRay(ctx, [{ x: this.mirrorX, y: objectTop.y }, { x: 0, y: objectTop.y - slope * this.mirrorX }], CanvasUtils.colors.rayParallel, false, 2);
        CanvasUtils.drawRay(ctx, [{ x: this.mirrorX, y: objectTop.y }, virtualFocal], CanvasUtils.colors.rayParallel, true, 1);

        const slopeToFocal = (virtualFocal.y - objectTop.y) / (virtualFocal.x - objectTop.x);
        const mirrorY = objectTop.y + slopeToFocal * (this.mirrorX - objectTop.x);
        CanvasUtils.drawRay(ctx, [objectTop, { x: this.mirrorX, y: mirrorY }], CanvasUtils.colors.rayFocal, false, 2);
        CanvasUtils.drawRay(ctx, [{ x: this.mirrorX, y: mirrorY }, { x: 0, y: mirrorY }], CanvasUtils.colors.rayFocal, false, 2);
        CanvasUtils.drawRay(ctx, [{ x: this.mirrorX, y: mirrorY }, { x: this.width, y: mirrorY }], CanvasUtils.colors.rayFocal, true, 1);
    },

    updateInfoPanel(imageData) {
        document.getElementById('convexMirrorImageType').textContent = t('virtual');
        document.getElementById('convexMirrorImageOrientation').textContent = t('upright');
        const sizeRatio = Math.abs(imageData.magnification);
        document.getElementById('convexMirrorImageSize').textContent = sizeRatio > 1 ? t('enlarged') : t('reduced');
        document.getElementById('convexMirrorMagnification').textContent = imageData.magnification.toFixed(2) + 'x';
    }
};

// Convex Lens Lab
const ConvexLensLab = {
    canvas: null, ctx: null, width: 0, height: 0, isDark: false,
    lensX: 0, axisY: 0, objectX: 0, objectHeight: 60, focalLength: 100,
    isDragging: false, dragStartX: 0, objectStartX: 0,

    guidedSteps: [
        { text: "Nu ska vi studera KONVEXA linser (samlande linser). De är tjockare i mitten och SAMLAR ljusstrålar.", concept: "Konvex lins" },
        { text: "F markerar BRÄNNPUNKTEN på varje sida om linsen. 2F är dubbla brännvidden. BRÄNNVIDDEN (f) beror på linsens krökning.", concept: "Brännpunkt & 2F" },
        { text: "Tre principalstrålar: RÖD går parallellt och bryts genom F'. GRÖN går genom F och blir parallell. BLÅ går genom mitten obruten.", concept: "Principalstrålar" },
        { text: "Dra föremålet BORTOM 2F. Bilden blir verklig, omvänd och förminskad. Så fungerar ÖGAT!", concept: "Bortom 2F (Ögat)" },
        { text: "Dra föremålet MELLAN F och 2F. Bilden blir verklig, omvänd och FÖRSTORAD. Så fungerar PROJEKTORER!", concept: "Mellan F och 2F (Projektor)" },
        { text: "Dra föremålet INNANFÖR F. Bilden blir virtuell, upprätt och förstorad. Så fungerar ett FÖRSTORINGSGLAS!", concept: "Innanför F (Förstoringsglas)" },
        { text: "Konvexa linser korrigerar ÖVERSYNTHET - när ögats lins är för svag. Experimentera fritt!", concept: "Synkorrigering" }
    ],

    init() {
        this.canvas = document.getElementById('convexLensCanvas');
        if (!this.canvas) return;
        document.getElementById('convexLensFocalLength').addEventListener('input', (e) => {
            this.focalLength = parseInt(e.target.value);
            document.getElementById('convexLensFocalValue').textContent = this.focalLength;
            this.draw();
        });

        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            const rect = this.canvas.getBoundingClientRect();
            this.dragStartX = (e.clientX - rect.left) * (this.width / rect.width);
            this.objectStartX = this.objectX;
        });
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const rect = this.canvas.getBoundingClientRect();
                const currentX = (e.clientX - rect.left) * (this.width / rect.width);
                const deltaX = currentX - this.dragStartX;
                this.objectX = Math.max(50, Math.min(this.lensX - 20, this.objectStartX + deltaX));
                this.draw();
            }
        });
        this.canvas.addEventListener('mouseup', () => { this.isDragging = false; });
        this.canvas.addEventListener('mouseleave', () => { this.isDragging = false; });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isDragging = true;
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.dragStartX = (touch.clientX - rect.left) * (this.width / rect.width);
            this.objectStartX = this.objectX;
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isDragging) {
                const rect = this.canvas.getBoundingClientRect();
                const touch = e.touches[0];
                const currentX = (touch.clientX - rect.left) * (this.width / rect.width);
                const deltaX = currentX - this.dragStartX;
                this.objectX = Math.max(50, Math.min(this.lensX - 20, this.objectStartX + deltaX));
                this.draw();
            }
        }, { passive: false });
        this.canvas.addEventListener('touchend', () => { this.isDragging = false; });

        this.resize();
    },

    resize() {
        const container = this.canvas.parentElement;
        const { width, height, ctx } = CanvasUtils.setupCanvas(this.canvas, container);
        this.width = width; this.height = height; this.ctx = ctx;
        this.lensX = width / 2; this.axisY = height / 2;
        if (this.objectX <= 0 || this.objectX >= this.lensX) {
            this.objectX = this.lensX - this.focalLength * 1.5;
        }
        this.draw();
    },

    setDarkMode(isDark) { this.isDark = isDark; this.draw(); },

    calculateImage() {
        const objectDistance = this.lensX - this.objectX;
        const f = this.focalLength;
        if (Math.abs(objectDistance - f) < 1) return { atInfinity: true };
        const imageDistance = (objectDistance * f) / (objectDistance - f);
        const magnification = -imageDistance / objectDistance;
        return { imageDistance, magnification, imageHeight: this.objectHeight * magnification, isReal: imageDistance > 0, isInverted: magnification < 0, imageX: this.lensX + imageDistance, atInfinity: false };
    },

    draw() {
        const ctx = this.ctx;
        if (!ctx || this.width === 0) return;
        CanvasUtils.clearCanvas(ctx, this.width, this.height, this.isDark);
        CanvasUtils.drawOpticalAxis(ctx, this.width, this.height, this.isDark);
        CanvasUtils.drawConvexLens(ctx, this.lensX, this.axisY, 200, this.isDark);
        CanvasUtils.drawFocalPoint(ctx, this.lensX - this.focalLength, this.axisY, 'F', this.isDark);
        CanvasUtils.drawFocalPoint(ctx, this.lensX + this.focalLength, this.axisY, "F'", this.isDark);
        CanvasUtils.drawFocalPoint(ctx, this.lensX - this.focalLength * 2, this.axisY, '2F', this.isDark);
        CanvasUtils.drawFocalPoint(ctx, this.lensX + this.focalLength * 2, this.axisY, "2F'", this.isDark);

        // Draw instruction
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = this.isDark ? '#6699cc' : '#4477aa';
        ctx.textAlign = 'center';
        ctx.fillText(t('dragToMove'), this.width / 2, 25);

        CanvasUtils.drawObject(ctx, this.objectX, this.axisY, this.objectHeight, CanvasUtils.colors.object);
        CanvasUtils.drawLabel(ctx, t('objectLabel'), this.objectX, this.axisY + 25, this.isDark);

        const imageData = this.calculateImage();
        if (!imageData.atInfinity) {
            const displayHeight = Math.min(Math.abs(imageData.imageHeight), 150);
            CanvasUtils.drawImage(ctx, Math.max(20, Math.min(this.width - 20, imageData.imageX)), this.axisY, displayHeight * Math.sign(imageData.imageHeight), imageData.isReal, imageData.isInverted);
            CanvasUtils.drawLabel(ctx, t('imageLabel'), imageData.imageX, this.axisY + (imageData.isInverted ? displayHeight + 25 : 25), this.isDark);
        }

        this.drawRays(imageData);
        this.updateInfoPanel(imageData);
    },

    drawRays(imageData) {
        const ctx = this.ctx;
        const objectTop = { x: this.objectX, y: this.axisY - this.objectHeight };
        const lensTop = { x: this.lensX, y: objectTop.y };
        const focalPoint = { x: this.lensX + this.focalLength, y: this.axisY };

        CanvasUtils.drawRay(ctx, [objectTop, lensTop], CanvasUtils.colors.rayParallel, false, 2);
        if (imageData.atInfinity) {
            CanvasUtils.drawRay(ctx, [lensTop, { x: this.width, y: this.axisY }], CanvasUtils.colors.rayParallel, false, 2);
        } else if (imageData.isReal) {
            const slope = (focalPoint.y - lensTop.y) / (focalPoint.x - this.lensX);
            CanvasUtils.drawRay(ctx, [lensTop, { x: this.width, y: lensTop.y + slope * (this.width - this.lensX) }], CanvasUtils.colors.rayParallel, false, 2);
        } else {
            const slope = (focalPoint.y - lensTop.y) / (focalPoint.x - this.lensX);
            CanvasUtils.drawRay(ctx, [{ x: 0, y: lensTop.y - slope * this.lensX }, lensTop], CanvasUtils.colors.rayParallel, true, 1);
            CanvasUtils.drawRay(ctx, [lensTop, { x: this.width, y: lensTop.y + slope * (this.width - this.lensX) }], CanvasUtils.colors.rayParallel, false, 2);
        }

        const focalLeft = { x: this.lensX - this.focalLength, y: this.axisY };
        const slopeToFocal = (focalLeft.y - objectTop.y) / (focalLeft.x - objectTop.x);
        const lensY = objectTop.y + slopeToFocal * (this.lensX - objectTop.x);
        CanvasUtils.drawRay(ctx, [objectTop, { x: this.lensX, y: lensY }], CanvasUtils.colors.rayFocal, false, 2);
        CanvasUtils.drawRay(ctx, [{ x: this.lensX, y: lensY }, { x: this.width, y: lensY }], CanvasUtils.colors.rayFocal, false, 2);

        const slopeCenter = (this.axisY - objectTop.y) / (this.lensX - objectTop.x);
        CanvasUtils.drawRay(ctx, [objectTop, { x: this.width, y: objectTop.y + slopeCenter * (this.width - objectTop.x) }], CanvasUtils.colors.rayCenter, false, 2);
        if (!imageData.isReal && !imageData.atInfinity) CanvasUtils.drawRay(ctx, [{ x: 0, y: objectTop.y - slopeCenter * objectTop.x }, objectTop], CanvasUtils.colors.rayCenter, true, 1);
    },

    updateInfoPanel(imageData) {
        if (imageData.atInfinity) {
            document.getElementById('convexLensImageType').textContent = t('atInfinity');
            document.getElementById('convexLensImageOrientation').textContent = '-';
            document.getElementById('convexLensImageSize').textContent = '-';
            document.getElementById('convexLensMagnification').textContent = '∞';
            return;
        }
        document.getElementById('convexLensImageType').textContent = imageData.isReal ? t('real') : t('virtual');
        document.getElementById('convexLensImageOrientation').textContent = imageData.isInverted ? t('inverted') : t('upright');
        const sizeRatio = Math.abs(imageData.magnification);
        document.getElementById('convexLensImageSize').textContent = Math.abs(sizeRatio - 1) < 0.05 ? t('sameSize') : (sizeRatio > 1 ? t('enlarged') : t('reduced'));
        document.getElementById('convexLensMagnification').textContent = imageData.magnification.toFixed(2) + 'x';
    }
};

// Concave Lens Lab
const ConcaveLensLab = {
    canvas: null, ctx: null, width: 0, height: 0, isDark: false,
    lensX: 0, axisY: 0, objectX: 0, objectHeight: 60, focalLength: 100,
    isDragging: false, dragStartX: 0, objectStartX: 0,

    guidedSteps: [
        { text: "Nu ska vi studera KONKAVA linser (spridande linser). De är tunnare i mitten och SPRIDER ljusstrålar.", concept: "Konkav lins" },
        { text: "Brännpunkterna är VIRTUELLA - på samma sida som föremålet. Strålarna ser ut att komma FRÅN brännpunkten.", concept: "Virtuell brännpunkt" },
        { text: "En konkav lins ger ALLTID samma typ av bild: virtuell, upprätt och förminskad - oavsett var föremålet står!", concept: "Konkav linsbild" },
        { text: "Dra för att flytta föremålet. Bilden är alltid på samma sida, upprätt och mindre. Streckade linjer visar virtuella strålar.", concept: "Experimentera" },
        { text: "Konkava linser korrigerar NÄRSYNTHET - när ögats lins är för stark och fokuserar framför näthinnan. Experimentera fritt!", concept: "Synkorrigering" }
    ],

    init() {
        this.canvas = document.getElementById('concaveLensCanvas');
        if (!this.canvas) return;
        document.getElementById('concaveLensFocalLength').addEventListener('input', (e) => {
            this.focalLength = parseInt(e.target.value);
            document.getElementById('concaveLensFocalValue').textContent = this.focalLength;
            this.draw();
        });

        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            const rect = this.canvas.getBoundingClientRect();
            this.dragStartX = (e.clientX - rect.left) * (this.width / rect.width);
            this.objectStartX = this.objectX;
        });
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const rect = this.canvas.getBoundingClientRect();
                const currentX = (e.clientX - rect.left) * (this.width / rect.width);
                const deltaX = currentX - this.dragStartX;
                this.objectX = Math.max(50, Math.min(this.lensX - 20, this.objectStartX + deltaX));
                this.draw();
            }
        });
        this.canvas.addEventListener('mouseup', () => { this.isDragging = false; });
        this.canvas.addEventListener('mouseleave', () => { this.isDragging = false; });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isDragging = true;
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.dragStartX = (touch.clientX - rect.left) * (this.width / rect.width);
            this.objectStartX = this.objectX;
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isDragging) {
                const rect = this.canvas.getBoundingClientRect();
                const touch = e.touches[0];
                const currentX = (touch.clientX - rect.left) * (this.width / rect.width);
                const deltaX = currentX - this.dragStartX;
                this.objectX = Math.max(50, Math.min(this.lensX - 20, this.objectStartX + deltaX));
                this.draw();
            }
        }, { passive: false });
        this.canvas.addEventListener('touchend', () => { this.isDragging = false; });

        this.resize();
    },

    resize() {
        const container = this.canvas.parentElement;
        const { width, height, ctx } = CanvasUtils.setupCanvas(this.canvas, container);
        this.width = width; this.height = height; this.ctx = ctx;
        this.lensX = width / 2; this.axisY = height / 2;
        if (this.objectX <= 0 || this.objectX >= this.lensX) {
            this.objectX = this.lensX - this.focalLength * 1.5;
        }
        this.draw();
    },

    setDarkMode(isDark) { this.isDark = isDark; this.draw(); },

    calculateImage() {
        const objectDistance = this.lensX - this.objectX;
        const f = -this.focalLength;
        const imageDistance = (objectDistance * f) / (objectDistance - f);
        const magnification = -imageDistance / objectDistance;
        return { imageDistance, magnification, imageHeight: this.objectHeight * magnification, isReal: false, isInverted: false, imageX: this.lensX + imageDistance, atInfinity: false };
    },

    draw() {
        const ctx = this.ctx;
        if (!ctx || this.width === 0) return;
        CanvasUtils.clearCanvas(ctx, this.width, this.height, this.isDark);
        CanvasUtils.drawOpticalAxis(ctx, this.width, this.height, this.isDark);
        CanvasUtils.drawConcaveLens(ctx, this.lensX, this.axisY, 200, this.isDark);
        CanvasUtils.drawFocalPoint(ctx, this.lensX - this.focalLength, this.axisY, 'F', this.isDark);
        CanvasUtils.drawFocalPoint(ctx, this.lensX + this.focalLength, this.axisY, "F'", this.isDark);

        // Draw instruction
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = this.isDark ? '#6699cc' : '#4477aa';
        ctx.textAlign = 'center';
        ctx.fillText(t('dragToMove'), this.width / 2, 25);

        CanvasUtils.drawObject(ctx, this.objectX, this.axisY, this.objectHeight, CanvasUtils.colors.object);
        CanvasUtils.drawLabel(ctx, t('objectLabel'), this.objectX, this.axisY + 25, this.isDark);

        const imageData = this.calculateImage();
        const displayHeight = Math.min(Math.abs(imageData.imageHeight), 150);
        CanvasUtils.drawImage(ctx, imageData.imageX, this.axisY, displayHeight, false, false);
        CanvasUtils.drawLabel(ctx, t('imageLabel'), imageData.imageX, this.axisY + 25, this.isDark);

        this.drawRays(imageData);
        this.updateInfoPanel(imageData);
    },

    drawRays(imageData) {
        const ctx = this.ctx;
        const objectTop = { x: this.objectX, y: this.axisY - this.objectHeight };
        const lensTop = { x: this.lensX, y: objectTop.y };
        const virtualFocal = { x: this.lensX - this.focalLength, y: this.axisY };

        CanvasUtils.drawRay(ctx, [objectTop, lensTop], CanvasUtils.colors.rayParallel, false, 2);
        const slope = (lensTop.y - virtualFocal.y) / (this.lensX - virtualFocal.x);
        CanvasUtils.drawRay(ctx, [lensTop, { x: this.width, y: lensTop.y + slope * (this.width - this.lensX) }], CanvasUtils.colors.rayParallel, false, 2);
        CanvasUtils.drawRay(ctx, [{ x: 0, y: lensTop.y - slope * this.lensX }, lensTop], CanvasUtils.colors.rayParallel, true, 1);

        const focalRight = { x: this.lensX + this.focalLength, y: this.axisY };
        const slopeToFocal = (focalRight.y - objectTop.y) / (focalRight.x - objectTop.x);
        const lensY = objectTop.y + slopeToFocal * (this.lensX - objectTop.x);
        CanvasUtils.drawRay(ctx, [objectTop, { x: this.lensX, y: lensY }], CanvasUtils.colors.rayFocal, false, 2);
        CanvasUtils.drawRay(ctx, [{ x: this.lensX, y: lensY }, { x: this.width, y: lensY + (this.axisY - lensY) / this.focalLength * (this.width - this.lensX) }], CanvasUtils.colors.rayFocal, false, 2);
        CanvasUtils.drawRay(ctx, [{ x: 0, y: lensY - (this.axisY - lensY) / this.focalLength * this.lensX }, { x: this.lensX, y: lensY }], CanvasUtils.colors.rayFocal, true, 1);

        const slopeCenter = (this.axisY - objectTop.y) / (this.lensX - objectTop.x);
        CanvasUtils.drawRay(ctx, [objectTop, { x: this.width, y: objectTop.y + slopeCenter * (this.width - objectTop.x) }], CanvasUtils.colors.rayCenter, false, 2);
        CanvasUtils.drawRay(ctx, [{ x: 0, y: objectTop.y - slopeCenter * objectTop.x }, objectTop], CanvasUtils.colors.rayCenter, true, 1);
    },

    updateInfoPanel(imageData) {
        document.getElementById('concaveLensImageType').textContent = t('virtual');
        document.getElementById('concaveLensImageOrientation').textContent = t('upright');
        document.getElementById('concaveLensImageSize').textContent = t('reduced');
        document.getElementById('concaveLensMagnification').textContent = imageData.magnification.toFixed(2) + 'x';
    }
};

// Refraction Lab
const RefractionLab = {
    canvas: null, ctx: null, width: 0, height: 0, isDark: false,
    incidentAngle: 30, mode: 'airToGlass',
    isDragging: false, dragStartX: 0, angleStartValue: 0,
    materials: { air: { n: 1.0, name: 'Luft' }, glass: { n: 1.52, name: 'Glas' }, water: { n: 1.33, name: 'Vatten' } },

    guidedSteps: [
        { text: "Nu ska vi studera LJUSETS BRYTNING - hur ljus ändrar riktning när det går mellan olika material.", concept: "Introduktion" },
        { text: "Ljuset går från LUFT (optiskt tunnare, n=1.0) till GLAS (optiskt tätare, n=1.52). NORMALEN är vinkelrät mot ytan.", concept: "Optiskt tätare/tunnare" },
        { text: "SNELLS LAG: n₁·sin(θ₁) = n₂·sin(θ₂). När ljus går IN i ett tätare material bryts det MOT normalen!", concept: "Snells lag" },
        { text: "Dra i canvas för att ändra infallsvinkeln. Se hur brytningsvinkeln ändras!", concept: "Experimentera" },
        { text: "Byt till 'Glas → Luft'. Nu går ljuset UT ur det tätare materialet och bryts FRÅN normalen!", concept: "Ut ur tätare" },
        { text: "Öka infallsvinkeln tills du når den KRITISKA VINKELN. Då sker TOTALREFLEKTION - allt ljus reflekteras!", concept: "Totalreflektion" },
        { text: "Fiber-optik använder totalreflektion! Ljuset studsar fram och tillbaka i glasfibern.", concept: "Fiberoptik" },
        { text: "Prova 'Luft → Vatten' också. Vatten (n=1.33) bryter ljus mindre än glas. Experimentera fritt!", concept: "Vatten" }
    ],

    init() {
        this.canvas = document.getElementById('refractionCanvas');
        if (!this.canvas) return;
        document.getElementById('refractionMode').addEventListener('change', (e) => { this.mode = e.target.value; this.draw(); });
        document.getElementById('refractionAngle').addEventListener('input', (e) => {
            this.incidentAngle = parseInt(e.target.value);
            document.getElementById('refractionAngleValue').textContent = this.incidentAngle;
            this.draw();
        });

        // Add drag support for angle control
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            const rect = this.canvas.getBoundingClientRect();
            this.dragStartX = (e.clientX - rect.left) * (this.width / rect.width);
            this.angleStartValue = this.incidentAngle;
        });
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const rect = this.canvas.getBoundingClientRect();
                const currentX = (e.clientX - rect.left) * (this.width / rect.width);
                const deltaX = currentX - this.dragStartX;
                // Convert horizontal drag to angle change (100px = 30 degrees)
                const deltaAngle = Math.round(deltaX / 3);
                this.incidentAngle = Math.max(0, Math.min(89, this.angleStartValue + deltaAngle));
                document.getElementById('refractionAngle').value = this.incidentAngle;
                document.getElementById('refractionAngleValue').textContent = this.incidentAngle;
                this.draw();
            }
        });
        this.canvas.addEventListener('mouseup', () => { this.isDragging = false; });
        this.canvas.addEventListener('mouseleave', () => { this.isDragging = false; });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isDragging = true;
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.dragStartX = (touch.clientX - rect.left) * (this.width / rect.width);
            this.angleStartValue = this.incidentAngle;
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isDragging) {
                const rect = this.canvas.getBoundingClientRect();
                const touch = e.touches[0];
                const currentX = (touch.clientX - rect.left) * (this.width / rect.width);
                const deltaX = currentX - this.dragStartX;
                const deltaAngle = Math.round(deltaX / 3);
                this.incidentAngle = Math.max(0, Math.min(89, this.angleStartValue + deltaAngle));
                document.getElementById('refractionAngle').value = this.incidentAngle;
                document.getElementById('refractionAngleValue').textContent = this.incidentAngle;
                this.draw();
            }
        }, { passive: false });
        this.canvas.addEventListener('touchend', () => { this.isDragging = false; });

        this.resize();
    },

    resize() {
        const container = this.canvas.parentElement;
        const { width, height, ctx } = CanvasUtils.setupCanvas(this.canvas, container);
        this.width = width; this.height = height; this.ctx = ctx;
        this.draw();
    },

    setDarkMode(isDark) { this.isDark = isDark; this.draw(); },

    getMaterials() {
        switch (this.mode) {
            case 'airToGlass': return { top: this.materials.air, bottom: this.materials.glass, fromDenser: false };
            case 'glassToAir': return { top: this.materials.air, bottom: this.materials.glass, fromDenser: true };
            case 'airToWater': return { top: this.materials.air, bottom: this.materials.water, fromDenser: false };
            default: return { top: this.materials.air, bottom: this.materials.glass, fromDenser: false };
        }
    },

    draw() {
        const ctx = this.ctx;
        const { top, bottom, fromDenser } = this.getMaterials();
        CanvasUtils.clearCanvas(ctx, this.width, this.height, this.isDark);

        // Draw instruction
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = this.isDark ? '#6699cc' : '#4477aa';
        ctx.textAlign = 'center';
        ctx.fillText(t('dragToChangeAngle'), this.width / 2, 25);

        const interfaceY = this.height / 2;
        const centerX = this.width / 2;

        ctx.fillStyle = this.isDark ? 'rgba(100, 200, 255, 0.05)' : 'rgba(200, 230, 255, 0.1)';
        ctx.fillRect(0, 0, this.width, interfaceY);
        ctx.fillStyle = this.isDark ? 'rgba(100, 200, 255, 0.15)' : 'rgba(100, 200, 255, 0.25)';
        ctx.fillRect(0, interfaceY, this.width, this.height - interfaceY);

        ctx.strokeStyle = this.isDark ? '#64b5f6' : '#1976d2';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, interfaceY); ctx.lineTo(this.width, interfaceY); ctx.stroke();

        ctx.strokeStyle = this.isDark ? '#555566' : '#999999';
        ctx.setLineDash([5, 5]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(centerX, interfaceY - 150); ctx.lineTo(centerX, interfaceY + 150); ctx.stroke();
        ctx.setLineDash([]);
        CanvasUtils.drawLabel(ctx, 'Normal', centerX + 15, interfaceY - 130, this.isDark, 'left');

        const n1 = fromDenser ? bottom.n : top.n;
        const n2 = fromDenser ? top.n : bottom.n;
        let criticalAngle = fromDenser ? CanvasUtils.calculateCriticalAngle(n1, n2) : null;
        const refractedAngle = CanvasUtils.calculateSnellAngle(n1, n2, this.incidentAngle);
        const isTIR = fromDenser && criticalAngle !== null && this.incidentAngle >= criticalAngle;

        const rayLength = 140;
        const incidentRad = CanvasUtils.degToRad(this.incidentAngle);
        let incidentStartX = centerX - rayLength * Math.sin(incidentRad);
        let incidentStartY = fromDenser ? interfaceY + rayLength * Math.cos(incidentRad) : interfaceY - rayLength * Math.cos(incidentRad);

        CanvasUtils.drawArrow(ctx, incidentStartX, incidentStartY, centerX, interfaceY, CanvasUtils.colors.incident, 3);

        if (isTIR) {
            let reflectedEndX = centerX + rayLength * Math.sin(incidentRad);
            let reflectedEndY = fromDenser ? interfaceY + rayLength * Math.cos(incidentRad) : interfaceY - rayLength * Math.cos(incidentRad);
            CanvasUtils.drawArrow(ctx, centerX, interfaceY, reflectedEndX, reflectedEndY, CanvasUtils.colors.reflected, 3);
            ctx.font = 'bold 16px -apple-system'; ctx.fillStyle = CanvasUtils.colors.reflected; ctx.textAlign = 'center';
            ctx.fillText('Totalreflektion!', centerX, this.height - 30);
        } else if (refractedAngle !== null) {
            const refractedRad = CanvasUtils.degToRad(refractedAngle);
            let refractedEndX = centerX + rayLength * Math.sin(refractedRad);
            let refractedEndY = fromDenser ? interfaceY - rayLength * Math.cos(refractedRad) : interfaceY + rayLength * Math.cos(refractedRad);
            CanvasUtils.drawArrow(ctx, centerX, interfaceY, refractedEndX, refractedEndY, CanvasUtils.colors.refracted, 3);
        }

        CanvasUtils.drawLabel(ctx, `${top.name} (n=${top.n})`, 80, interfaceY - 100, this.isDark);
        CanvasUtils.drawLabel(ctx, `${bottom.name} (n=${bottom.n})`, 80, interfaceY + 100, this.isDark);
        CanvasUtils.drawLabel(ctx, fromDenser ? t('opticallyDenser') : t('opticallyThinner'), 80, interfaceY - 80, this.isDark);
        CanvasUtils.drawLabel(ctx, fromDenser ? t('opticallyThinner') : t('opticallyDenser'), 80, interfaceY + 120, this.isDark);

        ctx.font = '12px -apple-system'; ctx.fillStyle = CanvasUtils.colors.incident; ctx.textAlign = 'left';
        ctx.fillText(`θ₁=${this.incidentAngle}°`, centerX - 70, fromDenser ? interfaceY + 50 : interfaceY - 40);
        if (!isTIR && refractedAngle !== null) {
            ctx.fillStyle = CanvasUtils.colors.refracted;
            ctx.fillText(`θ₂=${refractedAngle.toFixed(1)}°`, centerX + 20, fromDenser ? interfaceY - 40 : interfaceY + 50);
        }

        document.getElementById('refractionIncident').textContent = this.incidentAngle + '°';
        document.getElementById('refractionRefracted').textContent = isTIR ? t('totalReflection') : (refractedAngle ? refractedAngle.toFixed(1) + '°' : '-');
        document.getElementById('refractionCritical').textContent = criticalAngle ? criticalAngle.toFixed(1) + '°' : t('notAvailable');
        document.getElementById('refractionStatus').textContent = isTIR ? t('totalReflectionShort') : t('refraction');
    }
};

// Prism Lab
const PrismLab = {
    canvas: null, ctx: null, width: 0, height: 0, isDark: false,
    prismAngle: 60, lightType: 'white',
    colors: {
        red: { color: '#ff0000', wavelength: 700, nameKey: 'colorRed', n: 1.513 },
        orange: { color: '#ff7f00', wavelength: 620, nameKey: 'colorOrange', n: 1.517 },
        yellow: { color: '#ffff00', wavelength: 580, nameKey: 'colorYellow', n: 1.519 },
        green: { color: '#00ff00', wavelength: 550, nameKey: 'colorGreen', n: 1.522 },
        blue: { color: '#0000ff', wavelength: 470, nameKey: 'colorBlue', n: 1.528 },
        indigo: { color: '#4b0082', wavelength: 445, nameKey: 'colorIndigo', n: 1.531 },
        violet: { color: '#9400d3', wavelength: 400, nameKey: 'colorViolet', n: 1.536 }
    },

    getColorName(key) {
        return t(this.colors[key].nameKey);
    },

    guidedSteps: [
        { text: "Nu ska vi studera DISPERSION - hur vitt ljus delas upp i sina färger av ett prisma!", concept: "Introduktion" },
        { text: "VITT LJUS består av ALLA färger i regnbågens spektrum blandade tillsammans.", concept: "Vitt ljus" },
        { text: "DISPERSION sker för att olika våglängder har olika brytningsindex. VIOLETT bryts MEST, RÖTT bryts MINST.", concept: "Dispersion" },
        { text: "Färgspektrumet: Rött-Orange-Gult-Grönt-Blått-Indigo-Violett. Rött ~700nm, Violett ~400nm.", concept: "Färgspektrum" },
        { text: "Ändra prismavinkeln - större vinkel ger mer separation mellan färgerna!", concept: "Prismavinkel" },
        { text: "Byt till enfärgat ljus (rött, grönt, blått) och se att det bara blir EN stråle!", concept: "Enfärgat ljus" },
        { text: "Regnbågar uppstår genom samma princip - solljus bryts i vattendroppar!", concept: "Regnbågar" },
        { text: "Våglängder: Synligt ljus är ~400-700nm. UV har kortare, IR har längre våglängd. Experimentera fritt!", concept: "Våglängder" }
    ],

    init() {
        this.canvas = document.getElementById('prismCanvas');
        if (!this.canvas) return;
        document.getElementById('prismAngle').addEventListener('input', (e) => {
            this.prismAngle = parseInt(e.target.value);
            document.getElementById('prismAngleValue').textContent = this.prismAngle;
            this.draw();
        });
        document.getElementById('prismLightType').addEventListener('change', (e) => { this.lightType = e.target.value; this.draw(); });
        this.resize();
    },

    resize() {
        const container = this.canvas.parentElement;
        const { width, height, ctx } = CanvasUtils.setupCanvas(this.canvas, container);
        this.width = width; this.height = height; this.ctx = ctx;
        this.draw();
    },

    setDarkMode(isDark) { this.isDark = isDark; this.draw(); },

    draw() {
        const ctx = this.ctx;
        CanvasUtils.clearCanvas(ctx, this.width, this.height, this.isDark);

        const centerX = this.width * 0.4;
        const centerY = this.height / 2;
        const prismSize = Math.min(this.width, this.height) * 0.5;
        const vertices = CanvasUtils.drawPrism(ctx, centerX, centerY, prismSize, this.prismAngle, this.isDark);

        const entryPoint = { x: (vertices.apex.x + vertices.bottomLeft.x) / 2, y: (vertices.apex.y + vertices.bottomLeft.y) / 2 };
        const exitPoint = { x: (vertices.apex.x + vertices.bottomRight.x) / 2, y: (vertices.apex.y + vertices.bottomRight.y) / 2 };

        const rayStartX = 20, rayStartY = entryPoint.y - 30;
        ctx.strokeStyle = this.lightType === 'white' ? (this.isDark ? '#ffffff' : '#333333') : this.colors[this.lightType].color;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(rayStartX, rayStartY); ctx.lineTo(entryPoint.x, entryPoint.y); ctx.stroke();
        CanvasUtils.drawLabel(ctx, this.lightType === 'white' ? t('whiteLightLabel') : this.getColorName(this.lightType) + ' ' + t('lightSuffix'), rayStartX + 30, rayStartY - 20, this.isDark);

        ctx.strokeStyle = this.isDark ? '#aaaaaa' : '#666666';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(entryPoint.x, entryPoint.y); ctx.lineTo(exitPoint.x, exitPoint.y); ctx.stroke();

        const rayLength = 220;
        if (this.lightType === 'white') {
            const colorKeys = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
            const baseAngle = Math.PI / 7;
            const angleSpread = 0.012 * (this.prismAngle / 60);
            colorKeys.forEach((key, i) => {
                const colorData = this.colors[key];
                const angle = baseAngle + i * angleSpread;
                const endX = exitPoint.x + rayLength * Math.cos(angle);
                const endY = exitPoint.y + rayLength * Math.sin(angle);
                ctx.strokeStyle = colorData.color; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.moveTo(exitPoint.x, exitPoint.y); ctx.lineTo(endX, endY); ctx.stroke();
                // Label every color for better visibility
                ctx.font = '11px -apple-system'; ctx.fillStyle = colorData.color; ctx.textAlign = 'left';
                ctx.fillText(`${t(colorData.nameKey)}`, endX + 8, endY + 4);
            });
        } else {
            const colorData = this.colors[this.lightType];
            const colorIndex = Object.keys(this.colors).indexOf(this.lightType);
            const angle = Math.PI / 7 + colorIndex * 0.012 * (this.prismAngle / 60);
            const endX = exitPoint.x + rayLength * Math.cos(angle);
            const endY = exitPoint.y + rayLength * Math.sin(angle);
            ctx.strokeStyle = colorData.color; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(exitPoint.x, exitPoint.y); ctx.lineTo(endX, endY); ctx.stroke();
            ctx.font = '14px -apple-system'; ctx.fillStyle = colorData.color; ctx.textAlign = 'left';
            ctx.fillText(`${t('wavelength')} ${colorData.wavelength} nm`, endX + 15, endY);
            ctx.fillText(`${t('refractiveIndexLabel')} ${colorData.n}`, endX + 15, endY + 18);
        }

        CanvasUtils.drawLabel(ctx, t('prismLabel'), centerX, centerY + prismSize * 0.35, this.isDark);

        document.getElementById('prismPhenomenon').textContent = this.lightType === 'white' ? t('dispersion') : t('singleRefraction');
        document.getElementById('prismMostBent').textContent = t('violetN');
        document.getElementById('prismLeastBent').textContent = t('redN');
    }
};
