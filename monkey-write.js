class MonkeyWrite extends HTMLElement {
  static observedAttributes = [
    'data-hint',
    'data-cheat',
    'data-label',
  ];

  static register(tagName) {
    if ('customElements' in window) {
      customElements.define(tagName || 'monkey-write', MonkeyWrite);
    }
  }

  static reactions = [ '🐵', '🙉', '🙊', '🙈' ];

  static #appendShadowTemplate = (node) => {
    const template = document.createElement('template');

    template.innerHTML = `
      <label part="label" for="editor" hidden><slot name="label"></slot></label>
      <textarea part="editor" id="editor"></textarea>
      <div part="hint hidden" aria-live="polite">
        <span part="hint-text"></span>
        <button part="hint-close" aria-label="close">ⓧ</button>
      </div>
    `;

    const shadowRoot = node.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(template.content.cloneNode(true));
  }

  static #adoptShadowStyles = (node) => {
    const shadowStyle = new CSSStyleSheet();

    shadowStyle.replaceSync(`
      * { box-sizing: border-box; }
      [hidden] { display: none !important; }

      :host {
        display: block;
        position: relative;
      }

      [part~=hint] {
        background: Canvas;
        border: thin solid;
        color: CanvasText;
        display: grid;
        grid-gap: 1ch;
        grid-template-columns: 1fr auto;
        inset: var(--hint-inset, auto 0 0 auto);
        margin: clamp(8px, 0.25lh, 24px);
        padding: clamp(8px, 0.25lh, 24px);
        position: absolute;
      }
      [part~=hidden] { display: none; }
    `);

    node.shadowRoot.adoptedStyleSheets = [shadowStyle];
  }

  srcText;
  editor;

  #stats = {
    progress: 0,
    wasted: 0,
    missed: 0,
  };

  #progress;
  #hint;
  #label;

  #writeEvent = (stats) => new CustomEvent('write', {
    bubbles: true,
    detail: stats
  });

  get isValid() {
    return this.srcText.startsWith(this.editor.value) || !this.editor.value;
  }

  get progress() { return this.#progress || ''; }
  get remaining() { return this.srcText.slice(this.#stats.progress); }
  get next() { return this.srcText.charAt(this.#stats.progress); }
  get nextIsSpecial() { return this.#isSpecial(this.next); }
  get stats() { return this.#stats; }

  set labelText(value) {
    if (!this.editor) return;

    if (value) {
      this.editor.setAttribute('aria-label', value);
    } else {
      this.editor.removeAttribute('aria-label');
    }
  }

  set hit(value) {
    if (value) {
      this.#stats.missed = 0;
    } else {
      this.#stats.missed += 1;
      this.#stats.wasted += 1;
    }

    this.#upDate();
  }

  set try(key) {
    this.#stats.prev = key;

    if (this.isValid) {
      this.hit = true;
      return;
    }

    // reset the editor to a valid state
    this.editor.value = this.progress;

    // attempt to cheat
    const cheat = this.#getCheat(key);

    if (cheat) {
      this.#stats.prev = cheat.charAt(cheat.length - 1);
      this.editor.value += cheat;
      this.hit = cheat.length;
    } else {
      this.hit = false;
    }
  }

  constructor() {
    super();
    MonkeyWrite.#appendShadowTemplate(this);
    MonkeyWrite.#adoptShadowStyles(this);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (newValue === oldValue || !this.editor) return;

    switch (name) {
      case 'data-label':
        this.labelText = newValue;
        break;
    }

    this.#upDate();
  }

  connectedCallback() {
    const src = this.querySelector('template');

    if (!src && !this.srcText) {
      console.error(
        'Give your monkeys some text to strive for (in a slotted template)'
      );
      return;
    }

    this.srcText = this.srcText || this.#unEscapeHTML(src.innerHTML).trim();
    this.editor = this.editor || this.shadowRoot.querySelector('[part~=editor]');
    this.#label = this.shadowRoot.querySelector('[part=label]');
    this.#showLabel();

    this.#hint = {
      main: this.shadowRoot.querySelector('[part~=hint]'),
      text: this.shadowRoot.querySelector('[part~=hint-text]'),
      btn: this.shadowRoot.querySelector('[part~=hint-close]'),
    }

    this.labelText = this.dataset.label;
    this.#stats.total = this.srcText.length;

    this.#upDate();

    this.editor.addEventListener('input', this.#onInput);
    this.#hint.btn.addEventListener('click', this.#closeHint);
  }

  disconnectedCallback() {
    this.editor.removeEventListener('input', this.#onInput);
    this.#hint.btn.removeEventListener('click', this.#closeHint);
  }

  #onInput = (event) => {
    this.try = event.data;
  }

  #upDate = () => {
    this.#progress = this.isValid ? this.editor.value : this.progress;
    this.#stats.progress = this.progress.length;
    this.#stats.remaining = this.remaining.length;
    this.#stats.next = this.next;

    const getReact = Math.min(
      Math.floor(this.#stats.missed / 15),
      MonkeyWrite.reactions.length - 1
    );
    this.#stats.reaction = MonkeyWrite.reactions[getReact];
    this.#doHint();

    this.dispatchEvent(this.#writeEvent(this.#stats));
  }

  #doHint = () => {
    if (this.#stats.missed === 0) { this.#hint.close = false; }

    if (
      this.dataset.hint !== 'false'
      && !this.#hint.close
      && this.#stats.missed >= (this.dataset.hint || 15)
    ) {
      this.#hint.main.setAttribute('part', 'hint');
      this.#hint.text.innerHTML = `Have you tried '${this.next}'?`;
    } else {
      this.#hint.main.setAttribute('part', 'hint hidden');
      this.#hint.text.innerHTML = '';
    }
  }

  #closeHint = () => {
    this.#hint.close = true;
    this.editor.focus();
    this.#doHint();
  }

  #isSpecial = (value) => (value.search(/[^\w\d]/g) !== -1);

  #getCheat = (value) => {
    if (!value) return;

    switch (this.dataset.cheat) {
      case 'false':
        return;
      case 'true':
        return this.next;
      case 'hyper':
        return this.remaining.slice(0, 4 + Math.floor(Math.random() * 20));
    }

    if (value === ' ' && this.nextIsSpecial) { return this.next; }
    if (value.toLowerCase() === this.next.toLowerCase()) { return this.next; }

    return false;
  }

  #showLabel = () => {
    const hasLabel = this.querySelector('[slot=label]');

    if (hasLabel) {
      this.#label.removeAttribute('hidden');
    } else {
      this.#label.setAttribute('hidden', '');
    }
  }

  #unEscapeHTML = (str) =>
    str.replace(
      /&amp;|&lt;|&gt;|&#39;|&quot;/g,
      tag =>
        ({
          '&amp;': '&',
          '&lt;': '<',
          '&gt;': '>',
          '&#39;': "'",
          '&quot;': '"'
        }[tag] || tag)
    );
}

MonkeyWrite.register();
