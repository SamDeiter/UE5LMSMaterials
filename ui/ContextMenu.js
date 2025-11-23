/**
 * ContextMenu - Handles right-click context menus
 */
export class ContextMenu {
    constructor(app) {
        this.app = app;
        this.element = document.getElementById('context-menu');
        this.element.addEventListener('click', e => e.stopPropagation());
        document.addEventListener('click', () => this.hide());
    }
    show(x, y, items) {
        this.element.innerHTML = '';
        items.forEach(item => {
            if (item.separator) {
                const sep = document.createElement('div');
                sep.className = 'menu-separator';
                this.element.appendChild(sep);
            } else {
                const div = document.createElement('div');
                div.className = 'menu-item';
                div.textContent = item.label;
                div.onclick = () => {
                    item.callback();
                    this.hide();
                };
                this.element.appendChild(div);
            }
        });
        this.element.style.display = 'block';
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.app.actionMenu.hide();
    }
    hide() {
        this.element.style.display = 'none';
    }
}
