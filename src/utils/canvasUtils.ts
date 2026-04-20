/**
 * Draws wrapped text on a canvas context.
 */
export function drawText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, currentY);
    return currentY + lineHeight;
}

/**
 * Draws an image with 'cover' logic but anchors it towards the top
 * to ensure faces aren't cut off in portrait photos.
 */
export function drawRoundedImage(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
) {
    ctx.save();
    
    // Create the rounded Clipping path
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.clip();
    
    const imgAspect = img.width / img.height;
    const canvasAspect = width / height;
    let renderWidth, renderHeight, renderX, renderY;

    if (imgAspect > canvasAspect) {
        // Image is wider than the box - crop the sides
        renderHeight = height;
        renderWidth = height * imgAspect;
        renderX = x + (width - renderWidth) / 2;
        renderY = y;
    } else {
        // Image is taller than the box (Portrait) - KEEP THE TOP
        renderWidth = width;
        renderHeight = width / imgAspect;
        renderX = x;
        // Instead of centering ( (height - renderHeight) / 2 ), 
        // we anchor closer to the top (15% offset) to keep the head in view.
        renderY = y + Math.max((height - renderHeight) * 0.15, height - renderHeight);
    }

    ctx.drawImage(img, renderX, renderY, renderWidth, renderHeight);
    ctx.restore();
}
