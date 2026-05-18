export function getTextBounds(text, fontSize) {
    const span = document.createElement('span');
    span.style.visibility = 'hidden';
    span.style.position = 'absolute';
    span.style.whiteSpace = 'nowrap';
    span.style.fontFamily = "Albert Sans";
    span.style.fontSize = `${fontSize || 16}px`;
    span.textContent = text;

    document.body.appendChild(span);

    const width = span.offsetWidth;
    const height = span.offsetHeight;

    document.body.removeChild(span);

    return { width, height };
}
