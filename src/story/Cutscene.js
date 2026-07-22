/* ============================================================
   Cutscene — a self-contained dialogue player. Give it a scene
   (array of lines) and it renders a classic JRPG textbox with a
   typewriter effect, a portrait, and click/Space to advance.
   play(scene) returns a Promise that resolves when the scene ends.
   ============================================================ */

export class Cutscene {
  constructor() {
    this._build();
    this.active = false;
    this._resolve = null;
    this._onKey = (e) => {
      if (!this.active) return;
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        this._advance();
      }
    };
    window.addEventListener('keydown', this._onKey);
  }

  _build() {
    const root = document.createElement('div');
    root.id = 'cutscene';
    root.className = 'hidden';
    root.innerHTML = `
      <div class="cutscene-vignette"></div>
      <div class="cine-bar top"></div>
      <div class="cine-bar bottom"></div>
      <div class="cutscene-box">
        <div class="cutscene-portrait"></div>
        <div class="cutscene-body">
          <div class="cutscene-speaker"></div>
          <div class="cutscene-text"></div>
          <div class="cutscene-hint">▶ click / space</div>
        </div>
      </div>`;
    document.body.appendChild(root);

    this.root = root;
    this.box = root.querySelector('.cutscene-box');
    this.portraitEl = root.querySelector('.cutscene-portrait');
    this.speakerEl = root.querySelector('.cutscene-speaker');
    this.textEl = root.querySelector('.cutscene-text');

    root.addEventListener('click', () => this._advance());
  }

  play(scene) {
    return new Promise((resolve) => {
      this.scene = scene;
      this.index = -1;
      this._resolve = resolve;
      this.active = true;
      this.root.classList.remove('hidden');
      this._advance();
    });
  }

  _advance() {
    // If still typing, finish the line instantly instead of advancing
    if (this._typing) {
      this._finishTyping();
      return;
    }
    this.index++;
    if (this.index >= this.scene.length) {
      this._end();
      return;
    }
    this._renderLine(this.scene[this.index]);
  }

  _renderLine(line) {
    this.box.dataset.mood = line.mood || 'default';
    this.portraitEl.textContent = line.portrait || '';
    this.speakerEl.textContent = line.speaker || '';
    this._typeText(line.text || '');
  }

  _typeText(full) {
    this._typing = true;
    this._fullText = full;
    this.textEl.textContent = '';
    let i = 0;
    clearInterval(this._typer);
    this._typer = setInterval(() => {
      this.textEl.textContent = full.slice(0, ++i);
      if (i >= full.length) this._finishTyping();
    }, 18);
  }

  _finishTyping() {
    clearInterval(this._typer);
    this.textEl.textContent = this._fullText;
    this._typing = false;
  }

  _end() {
    this.active = false;
    this.root.classList.add('hidden');
    clearInterval(this._typer);
    const r = this._resolve;
    this._resolve = null;
    if (r) r();
  }
}
