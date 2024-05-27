const $canvas = document.querySelector('#canvas');
const $canvasResolution = document.querySelector('#canvas-resolution');
const $canvasResolutionLabel = document.querySelector('#canvas-resolution + label');
const $canvasLinesVisible = document.querySelector('#canvas-lines-visible');
const $canvasReset = document.querySelector('#canvas-reset');
const $canvasColor = document.querySelector('#canvas-color');
const $pencilColor = document.querySelector('#pencil-color');
const $canvasTools = document.querySelectorAll('input[name="canvas-tools"]');

$canvas.addEventListener('click', onCanvasPaint);
$canvas.addEventListener('touchmove', onCanvasPaint);
$canvas.addEventListener('mouseover', onCanvasPaint);
$canvasResolution.addEventListener('input', onCanvasResolutionChange);
$canvasLinesVisible.addEventListener('change', onCanvasLinesToggle);
$canvasReset.addEventListener('click', onCanvasReset);
$canvasColor.addEventListener('input', onCanvasColorChange);
$pencilColor.addEventListener('input', onPencilColorChange);

function onCanvasPaint(event) {
    event.preventDefault();

    const LEFT_MOUSE_BUTTON = 1;

    const isLeftMouseButtonPressed = event.type === 'click' || event.buttons === LEFT_MOUSE_BUTTON;
    const isMouseOverCanvasCell = event.target.classList.contains('canvas-cell');
    const isTouchMove = event.type === 'touchmove';

    if ((isLeftMouseButtonPressed && isMouseOverCanvasCell) || isTouchMove) {
        let cellToPaint = event.target;

        if (isTouchMove) {
            const target = document.elementFromPoint(event.touches[0].clientX, event.touches[0].clientY);
            if (target.classList.contains('canvas-cell')) cellToPaint = target;
        }

        paintFunction(cellToPaint);
    }
}

function onCanvasResolutionChange() {
    const resolution = Number($canvasResolution.value);

    $canvasResolutionLabel.classList.add('active');
    $canvasResolutionLabel.textContent = `${resolution}x${resolution}`;

    clearTimeout($canvasResolution.timeoutId);

    $canvasResolution.timeoutId = setTimeout(() => {
        $canvasResolutionLabel.classList.remove('active');
        document.documentElement.style.setProperty('--canvas-resolution', resolution);

        $canvas.innerHTML = '<div class="canvas-cell"></div>'.repeat(resolution * resolution);
    }, 1000);
}

function onCanvasLinesToggle() {
    $canvas.style.gap = $canvasLinesVisible.checked ? '1px' : '0rem';
}

function onCanvasReset() {
    const canvasCells = document.querySelectorAll('.canvas-cell');
    canvasCells.forEach((cell) => {
        cell.style.backgroundColor = '';
    });
}

function onCanvasColorChange() {
    document.documentElement.style.setProperty('--canvas-color', $canvasColor.value);
}

function onPencilColorChange() {
    document.documentElement.style.setProperty('--pencil-color', $pencilColor.value);
}

function paintFunction(cell) {
    const selectedTool = [...$canvasTools].find((tool) => tool.checked).id;

    const callback = {
        fill: paintFunctionFill,
        rainbow: paintFunctionRainbow,
        darken: paintFunctionDarken,
        lighten: paintFunctionLighten,
        eraser: paintFunctionEraser,
        pencil: paintFunctionPencil,
    }[selectedTool];

    callback(cell);
}

function paintFunctionFill(seedCell) {
    const resolution = Number($canvasResolution.value);

    const cells1d = [...$canvas.children];
    const cells2d = new Array(resolution)
        .fill()
        .map((_, index) => cells1d.slice(index * resolution, index * resolution + resolution));

    const seedCellIndex = cells1d.indexOf(seedCell);
    const seedCellColor = getCellColor(seedCell);
    const seedCellRow = Math.floor(seedCellIndex / resolution);
    const seedCellColumn = seedCellIndex % resolution;

    const visited = new Set();
    const directions = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
    ];
    const cellsToProcess = [[seedCellRow, seedCellColumn]];

    while (cellsToProcess.length > 0) {
        const [row, column] = cellsToProcess.pop();

        const cell = cells2d[row]?.[column];

        if (!cell || visited.has(cell) || getCellColor(cell) !== seedCellColor) continue;

        visited.add(cell);
        cell.style.backgroundColor = $pencilColor.value;

        directions.forEach(([dx, dy]) => void cellsToProcess.push([row + dx, column + dy]));
    }
}

function paintFunctionRainbow(cell) {
    const RGB_MAX_VALUE = 255;

    const [r, g, b] = [
        getRandomIntInclusive(RGB_MAX_VALUE),
        getRandomIntInclusive(RGB_MAX_VALUE),
        getRandomIntInclusive(RGB_MAX_VALUE),
    ];

    cell.style.backgroundColor = `rgba(${r}, ${g}, ${b})`;
}

function paintFunctionDarken(cell) {
    adjustCellColorTone(cell, 'darken');
}

function paintFunctionLighten(cell) {
    adjustCellColorTone(cell, 'lighten');
}

function paintFunctionEraser(cell) {
    cell.style.backgroundColor = $canvasColor.value;
}

function paintFunctionPencil(cell) {
    cell.style.backgroundColor = $pencilColor.value;
}

function getRandomIntInclusive(max, min = 0) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
}

function adjustCellColorTone(cell, direction) {
    const SHADE_DELTA = 255 * 0.05 * (direction === 'lighten' ? 1 : -1);

    const currentCellColor = getCellColor(cell);

    const [r, g, b] = currentCellColor
        .slice(4, -1)
        .split(', ')
        .map((value) => Number(value) + SHADE_DELTA);

    cell.style.backgroundColor = `rgba(${r}, ${g}, ${b})`;
}

function getCellColor(cell) {
    return window.getComputedStyle(cell).backgroundColor;
}
