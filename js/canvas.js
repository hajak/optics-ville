const CanvasUtils = {
    colors: {
        rayParallel: '#e53935',
        rayFocal: '#43a047',
        rayCenter: '#1e88e5',
        object: '#2196f3',
        imageReal: '#4caf50',
        imageVirtual: '#ff9800',
        opticalAxis: '#888888',
        lens: '#9c27b0',
        mirror: '#607d8b',
        label: '#333333',
        spectrum: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'],
        normal: '#888888',
        incident: '#e53935',
        refracted: '#43a047',
        reflected: '#1e88e5'
    },

    setupCanvas(canvas, container) {
        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        return { width: rect.width, height: rect.height, ctx, dpr };
    },

    clearCanvas(ctx, width, height, isDark) {
        ctx.fillStyle = isDark ? '#0f0f1a' : '#fafbfc';
        ctx.fillRect(0, 0, width, height);
    },

    drawOpticalAxis(ctx, width, height, isDark) {
        const y = height / 2;
        ctx.strokeStyle = isDark ? '#555566' : '#cccccc';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        ctx.setLineDash([]);
    },

    drawArrow(ctx, fromX, fromY, toX, toY, color, lineWidth = 2, dashed = false) {
        const headLength = 10;
        const angle = Math.atan2(toY - fromY, toX - fromX);

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = lineWidth;

        if (dashed) {
            ctx.setLineDash([6, 4]);
        }

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        if (dashed) {
            ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(
            toX - headLength * Math.cos(angle - Math.PI / 6),
            toY - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            toX - headLength * Math.cos(angle + Math.PI / 6),
            toY - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
    },

    drawObject(ctx, x, axisY, height, color) {
        const baseY = axisY;
        const topY = axisY - height;
        this.drawArrow(ctx, x, baseY, x, topY, color, 3);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, topY - 5, 5, 0, Math.PI * 2);
        ctx.fill();
    },

    drawImage(ctx, x, axisY, height, isReal, inverted) {
        const color = isReal ? this.colors.imageReal : this.colors.imageVirtual;
        const dashed = !isReal;
        const baseY = axisY;
        const topY = inverted ? axisY + Math.abs(height) : axisY - height;

        this.drawArrow(ctx, x, baseY, x, topY, color, 3, dashed);

        ctx.fillStyle = color;
        if (dashed) {
            ctx.globalAlpha = 0.6;
        }
        ctx.beginPath();
        ctx.arc(x, inverted ? topY + 5 : topY - 5, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    },

    drawRay(ctx, points, color, dashed = false, lineWidth = 2) {
        if (points.length < 2) return;

        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;

        if (dashed) {
            ctx.setLineDash([6, 4]);
        }

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();

        if (dashed) {
            ctx.setLineDash([]);
        }
    },

    drawConvexLens(ctx, x, axisY, height, isDark) {
        const color = isDark ? '#bb86fc' : '#9c27b0';
        const halfHeight = height / 2;
        const bulge = 20;

        ctx.strokeStyle = color;
        ctx.fillStyle = isDark ? 'rgba(187, 134, 252, 0.1)' : 'rgba(156, 39, 176, 0.1)';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(x, axisY - halfHeight);
        ctx.bezierCurveTo(
            x - bulge, axisY - halfHeight / 2,
            x - bulge, axisY + halfHeight / 2,
            x, axisY + halfHeight
        );
        ctx.bezierCurveTo(
            x + bulge, axisY + halfHeight / 2,
            x + bulge, axisY - halfHeight / 2,
            x, axisY - halfHeight
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        this.drawLensArrows(ctx, x, axisY, halfHeight, true);
    },

    drawConcaveLens(ctx, x, axisY, height, isDark) {
        const color = isDark ? '#bb86fc' : '#9c27b0';
        const halfHeight = height / 2;
        const edgeThickness = 15;
        const curveDepth = 12;

        ctx.strokeStyle = color;
        ctx.fillStyle = isDark ? 'rgba(187, 134, 252, 0.2)' : 'rgba(156, 39, 176, 0.15)';
        ctx.lineWidth = 3;

        ctx.beginPath();
        // Left edge (curves inward - bowing right)
        ctx.moveTo(x - edgeThickness, axisY - halfHeight);
        ctx.quadraticCurveTo(
            x - edgeThickness + curveDepth, axisY,
            x - edgeThickness, axisY + halfHeight
        );
        // Bottom edge
        ctx.lineTo(x + edgeThickness, axisY + halfHeight);
        // Right edge (curves inward - bowing left)
        ctx.quadraticCurveTo(
            x + edgeThickness - curveDepth, axisY,
            x + edgeThickness, axisY - halfHeight
        );
        // Top edge
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        this.drawLensArrows(ctx, x, axisY, halfHeight, false);
    },

    drawLensArrows(ctx, x, axisY, halfHeight, outward) {
        const arrowSize = 8;
        const offset = halfHeight + 5;
        const dir = outward ? 1 : -1;

        ctx.fillStyle = ctx.strokeStyle;

        [axisY - offset, axisY + offset].forEach((y, i) => {
            const yDir = i === 0 ? -1 : 1;
            ctx.beginPath();
            ctx.moveTo(x - arrowSize, y);
            ctx.lineTo(x, y + yDir * arrowSize * dir);
            ctx.lineTo(x + arrowSize, y);
            ctx.closePath();
            ctx.fill();
        });
    },

    drawConcaveMirror(ctx, x, axisY, height, focalLength, isDark) {
        const halfHeight = height / 2;
        const curvature = focalLength / 2;

        const gradient = ctx.createLinearGradient(x - 10, axisY, x + 10, axisY);
        if (isDark) {
            gradient.addColorStop(0, '#78909c');
            gradient.addColorStop(0.3, '#cfd8dc');
            gradient.addColorStop(0.5, '#eceff1');
            gradient.addColorStop(0.7, '#cfd8dc');
            gradient.addColorStop(1, '#78909c');
        } else {
            gradient.addColorStop(0, '#90a4ae');
            gradient.addColorStop(0.3, '#cfd8dc');
            gradient.addColorStop(0.5, '#ffffff');
            gradient.addColorStop(0.7, '#cfd8dc');
            gradient.addColorStop(1, '#90a4ae');
        }

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(x - curvature * 0.3, axisY - halfHeight);
        ctx.quadraticCurveTo(x + curvature * 0.2, axisY, x - curvature * 0.3, axisY + halfHeight);
        ctx.stroke();

        ctx.fillStyle = isDark ? '#b0bec5' : '#607d8b';
        const topOffset = (halfHeight * halfHeight) / (4 * curvature) * 0.3;
        ctx.beginPath();
        ctx.arc(x - topOffset - curvature * 0.3, axisY - halfHeight, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x - topOffset - curvature * 0.3, axisY + halfHeight, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineCap = 'butt';
    },

    drawConvexMirror(ctx, x, axisY, height, focalLength, isDark) {
        const halfHeight = height / 2;
        const curvature = focalLength / 2;

        const gradient = ctx.createLinearGradient(x - 10, axisY, x + 10, axisY);
        if (isDark) {
            gradient.addColorStop(0, '#78909c');
            gradient.addColorStop(0.3, '#cfd8dc');
            gradient.addColorStop(0.5, '#eceff1');
            gradient.addColorStop(0.7, '#cfd8dc');
            gradient.addColorStop(1, '#78909c');
        } else {
            gradient.addColorStop(0, '#90a4ae');
            gradient.addColorStop(0.3, '#cfd8dc');
            gradient.addColorStop(0.5, '#ffffff');
            gradient.addColorStop(0.7, '#cfd8dc');
            gradient.addColorStop(1, '#90a4ae');
        }

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(x + curvature * 0.3, axisY - halfHeight);
        ctx.quadraticCurveTo(x - curvature * 0.2, axisY, x + curvature * 0.3, axisY + halfHeight);
        ctx.stroke();

        ctx.fillStyle = isDark ? '#b0bec5' : '#607d8b';
        const topOffset = (halfHeight * halfHeight) / (4 * curvature) * 0.3;
        ctx.beginPath();
        ctx.arc(x + topOffset + curvature * 0.3, axisY - halfHeight, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + topOffset + curvature * 0.3, axisY + halfHeight, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineCap = 'butt';
    },

    drawPlaneMirror(ctx, x, axisY, height, isDark) {
        const halfHeight = height / 2;

        const gradient = ctx.createLinearGradient(x - 5, axisY, x + 5, axisY);
        if (isDark) {
            gradient.addColorStop(0, '#78909c');
            gradient.addColorStop(0.3, '#cfd8dc');
            gradient.addColorStop(0.5, '#eceff1');
            gradient.addColorStop(0.7, '#cfd8dc');
            gradient.addColorStop(1, '#78909c');
        } else {
            gradient.addColorStop(0, '#90a4ae');
            gradient.addColorStop(0.3, '#cfd8dc');
            gradient.addColorStop(0.5, '#ffffff');
            gradient.addColorStop(0.7, '#cfd8dc');
            gradient.addColorStop(1, '#90a4ae');
        }

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(x, axisY - halfHeight);
        ctx.lineTo(x, axisY + halfHeight);
        ctx.stroke();

        ctx.fillStyle = isDark ? '#b0bec5' : '#607d8b';
        ctx.beginPath();
        ctx.arc(x, axisY - halfHeight, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, axisY + halfHeight, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineCap = 'butt';
    },

    drawLabel(ctx, text, x, y, isDark, align = 'center') {
        ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = isDark ? '#b0b0c0' : '#333333';
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
    },

    drawFocalPoint(ctx, x, y, label, isDark) {
        ctx.fillStyle = isDark ? '#ffd54f' : '#f57c00';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        if (label) {
            this.drawLabel(ctx, label, x, y + 20, isDark);
        }
    },

    drawAngleArc(ctx, x, y, radius, startAngle, endAngle, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, startAngle, endAngle);
        ctx.stroke();
    },

    drawAngleLabel(ctx, x, y, radius, angle, label, isDark) {
        const midAngle = angle / 2;
        const labelX = x + (radius + 15) * Math.sin(midAngle);
        const labelY = y - (radius + 15) * Math.cos(midAngle);
        this.drawLabel(ctx, label, labelX, labelY, isDark);
    },

    drawPrism(ctx, centerX, centerY, size, angle, isDark) {
        const halfAngle = (angle * Math.PI / 180) / 2;
        const height = size * Math.sin(halfAngle);
        const baseHalf = size * Math.cos(halfAngle);

        const apex = { x: centerX, y: centerY - height / 2 };
        const bottomLeft = { x: centerX - baseHalf, y: centerY + height / 2 };
        const bottomRight = { x: centerX + baseHalf, y: centerY + height / 2 };

        ctx.fillStyle = isDark ? 'rgba(100, 200, 255, 0.15)' : 'rgba(100, 200, 255, 0.25)';
        ctx.strokeStyle = isDark ? '#64b5f6' : '#1976d2';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(apex.x, apex.y);
        ctx.lineTo(bottomLeft.x, bottomLeft.y);
        ctx.lineTo(bottomRight.x, bottomRight.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        return { apex, bottomLeft, bottomRight };
    },

    degToRad(degrees) {
        return degrees * Math.PI / 180;
    },

    radToDeg(radians) {
        return radians * 180 / Math.PI;
    },

    calculateSnellAngle(n1, n2, angle1Deg) {
        const angle1Rad = this.degToRad(angle1Deg);
        const sinAngle2 = (n1 / n2) * Math.sin(angle1Rad);

        if (Math.abs(sinAngle2) > 1) {
            return null;
        }

        return this.radToDeg(Math.asin(sinAngle2));
    },

    calculateCriticalAngle(n1, n2) {
        if (n1 <= n2) return null;
        return this.radToDeg(Math.asin(n2 / n1));
    }
};
