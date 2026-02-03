class Chip8 {
  ENTRYPOINT = 0x200;
  WINDOW_WIDTH = 64;
  WINDOW_HEIGHT = 32;
  WINDOW_SCALE_FACTOR = 10;

  KEY_MAP = {
    1: 0x1,
    2: 0x2,
    3: 0x3,
    4: 0xc,
    q: 0x4,
    w: 0x5,
    e: 0x6,
    r: 0xd,
    a: 0x7,
    s: 0x8,
    d: 0x9,
    f: 0xe,
    z: 0xa,
    x: 0x0,
    c: 0xb,
    v: 0xf,
  };

  constructor() {
    this.ram = new Uint8Array(4096);
    this.V = new Uint8Array(16);
    this.I = 0;
    this.PC = this.ENTRYPOINT;
    this.stack = new Uint16Array(12);
    this.stackPointer = 0;
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.display = new Uint8Array(64 * 32);
    this.keyboard = new Uint8Array(16);
    this.isMuted = false;
    this.volume = 0.3;
    this.audioContext = null;
    this.oscillator = null;
    this.gainNode = null;
    this.audioInitialized = false;
  }

  cpuCycle() {
    const opcode = (this.ram[this.PC] << 8) | this.ram[this.PC + 1];
    this.PC += 2;

    const NNN = opcode & 0x0fff;
    const NN = opcode & 0x0ff;
    const N = opcode & 0x0f;
    const X = (opcode >> 8) & 0x0f;
    const Y = (opcode >> 4) & 0x0f;

    const type = (opcode >> 12) & 0x0f;

    let positiveResult = false;

    switch (type) {
      case 0x00:
        if (NN === 0xe0) {
          this.display.fill(0);
          this.updateScreen();
        }

        if (NN === 0xee) {
          this.PC = this.stack[--this.stackPointer];
        }
        break;

      case 0x01:
        this.PC = NNN;
        break;

      case 0x02:
        this.stack[this.stackPointer++] = this.PC;
        this.PC = NNN;
        break;

      case 0x03:
        if (this.V[X] === NN) {
          this.PC += 2;
        }
        break;

      case 0x04:
        if (this.V[X] !== NN) {
          this.PC += 2;
        }
        break;

      case 0x05:
        if (this.V[X] === this.V[Y]) {
          this.PC += 2;
        }
        break;

      case 0x06:
        this.V[X] = NN;
        break;

      case 0x07:
        this.V[X] += NN;
        break;

      case 0x08:
        switch (N) {
          case 0:
            this.V[X] = this.V[Y];
            break;

          case 1:
            this.V[X] |= this.V[Y];
            break;

          case 2:
            this.V[X] &= this.V[Y];
            break;

          case 3:
            this.V[X] ^= this.V[Y];
            break;

          case 4:
            if (this.V[X] + this.V[Y] > 255) {
              this.V[0xf] = 1;
            }

            this.V[X] += this.V[Y];
            break;

          case 5:
            positiveResult = this.V[Y] <= this.V[X];
            this.V[0xf] = positiveResult ? 1 : 0;

            this.V[X] -= this.V[Y];
            break;

          case 6:
            this.V[0xf] = this.V[X] & 1;
            this.V[X] >>= 1;
            break;

          case 7:
            positiveResult = this.V[X] <= this.V[Y];
            this.V[0xf] = positiveResult ? 1 : 0;

            this.V[X] = this.V[Y] - this.V[X];
            break;

          case 0xe:
            this.V[0xf] = (this.V[X] & 0x80) >> 7;
            this.V[X] <<= 1;
            break;

          default:
            break;
        }
        break;

      case 0x09:
        if (this.V[X] !== this.V[Y]) {
          this.PC += 2;
        }
        break;

      case 0x0a:
        this.I = NNN;
        break;

      case 0x0b:
        this.PC = this.V[0] + NNN;
        break;

      case 0x0c:
        const rand = Math.floor(Math.random() * 0xff);

        this.V[X] = rand & (opcode & 0xff);
        break;

      case 0x0d:
        let xCoord = this.V[X] % this.WINDOW_WIDTH;
        let yCoord = this.V[Y] % this.WINDOW_HEIGHT;

        const width = 8;
        const height = N;

        this.V[0xf] = 0;

        for (let row = 0; row < height; row++) {
          let spriteByte = this.ram[this.I + row];
          let currentY = yCoord + row;

          if (currentY >= this.WINDOW_HEIGHT) break;

          for (let col = 0; col < width; col++) {
            let currentX = xCoord + col;

            if (currentX >= this.WINDOW_WIDTH) break;

            const spriteBit = spriteByte & (0x80 >> col) ? 1 : 0;

            if (spriteBit === 1) {
              let index = currentY * this.WINDOW_WIDTH + currentX;

              if (this.display[index] === 1) {
                this.V[0xf] = 1;
              }

              this.display[index] ^= spriteBit;
            }
          }
        }
        this.updateScreen();
        break;

      case 0x0e:
        if (NN === 0x9e) {
          if (this.keyboard[this.V[X]]) {
            this.PC += 2;
          }
        }

        if (NN === 0xa1) {
          if (!this.keyboard[this.V[X]]) {
            this.PC += 2;
          }
        }
        break;

      case 0x0f:
        switch (NN) {
          case 0x07:
            this.V[X] = this.delayTimer;
            break;

          case 0x0a:
            if (!this.keyboard.includes(1)) {
              this.PC -= 2;
              break;
            }

            this.V[X] = this.keyboard.indexOf(1);
            break;

          case 0x15:
            this.delayTimer = this.V[X];
            break;

          case 0x18:
            this.soundTimer = this.V[X];
            break;

          case 0x1e:
            this.I += this.V[X];
            break;

          case 0x29:
            this.I = this.V[X] * 5;
            break;

          case 0x33:
            let value = this.V[X];

            this.ram[this.I] = Math.floor(value / 100); // Centena
            this.ram[this.I + 1] = Math.floor((value / 10) % 10); // Dezena
            this.ram[this.I + 2] = value % 10; // Unidade
            break;

          case 0x55:
            for (let index = 0; index <= X; index++) {
              this.ram[this.I + index] = this.V[index];
            }
            break;

          case 0x65:
            for (let index = 0; index <= X; index++) {
              this.V[index] = this.ram[this.I + index];
            }
            break;

          default:
            break;
        }
        break;

      default:
        break;
    }
  }

  init() {
    window.addEventListener("keydown", (event) => {
      const validKeys = Object.keys(this.KEY_MAP);

      if (!validKeys.includes(event.key)) {
        return;
      }

      this.keyboard[this.KEY_MAP[event.key]] = 1;
    });

    window.addEventListener("keyup", (event) => {
      const validKeys = Object.keys(this.KEY_MAP);

      if (!validKeys.includes(event.key)) {
        return;
      }

      this.keyboard[this.KEY_MAP[event.key]] = 0;
    });

    const soundToggle = document.querySelector("#soundToggle");
    const soundVolume = document.querySelector("#soundVolume");

    soundToggle.addEventListener("change", () => {
      this.isMuted = !soundToggle.checked;
      this.syncAudio();
    });

    soundVolume.addEventListener("input", () => {
      this.volume = Number(soundVolume.value) / 100;
      this.syncAudio();
    });

    this.display.fill(0);
    this.updateScreen();
    this.loadFont();
    this.loadROM();
  }

  loadFont() {
    const font = new Uint8Array([
      0xf0,
      0x90,
      0x90,
      0x90,
      0xf0, // 0
      0x20,
      0x60,
      0x20,
      0x20,
      0x70, // 1
      0xf0,
      0x10,
      0xf0,
      0x80,
      0xf0, // 2
      0xf0,
      0x10,
      0xf0,
      0x10,
      0xf0, // 3
      0x90,
      0x90,
      0xf0,
      0x10,
      0x10, // 4
      0xf0,
      0x80,
      0xf0,
      0x10,
      0xf0, // 5
      0xf0,
      0x80,
      0xf0,
      0x90,
      0xf0, // 6
      0xf0,
      0x10,
      0x20,
      0x40,
      0x40, // 7
      0xf0,
      0x90,
      0xf0,
      0x90,
      0xf0, // 8
      0xf0,
      0x90,
      0xf0,
      0x10,
      0xf0, // 9
      0xf0,
      0x90,
      0xf0,
      0x90,
      0x90, // A
      0xe0,
      0x90,
      0xe0,
      0x90,
      0xe0, // B
      0xf0,
      0x80,
      0x80,
      0x80,
      0xf0, // C
      0xe0,
      0x90,
      0x90,
      0x90,
      0xe0, // D
      0xf0,
      0x80,
      0xf0,
      0x80,
      0xf0, // E
      0xf0,
      0x80,
      0xf0,
      0x80,
      0x80, // F
    ]);

    this.ram.set(font);
  }

  loadROM() {
    const input = document.querySelector("#romInput");

    input.addEventListener("change", (event) => {
      const file = event.target.files[0];

      if (!file) {
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        const buffer = event.target.result;
        const bytes = new Uint8Array(buffer);
        this.ram.set(bytes, this.ENTRYPOINT);

        this.initAudio();
        if (this.audioContext && this.audioContext.state === "suspended") {
          this.audioContext.resume();
        }

        const step = () => {
          for (let i = 0; i < 10; i++) {
            this.cpuCycle();
          }

          if (this.delayTimer > 0) this.delayTimer--;
          if (this.soundTimer > 0) this.soundTimer--;
          this.syncAudio();

          requestAnimationFrame(step);
        };

        requestAnimationFrame(step);
      };

      reader.readAsArrayBuffer(file);
    });
  }

  updateScreen() {
    const canvas = document.querySelector("#display");
    const context = canvas.getContext("2d");

    for (let index = 0; index < this.display.length; index++) {
      const x = index % this.WINDOW_WIDTH;
      const y = Math.floor(index / this.WINDOW_WIDTH);
      const xPosition = x * this.WINDOW_SCALE_FACTOR;
      const yPosition = y * this.WINDOW_SCALE_FACTOR;

      if (this.display[index]) {
        context.fillStyle = "#FFFFFF";
        context.fillRect(
          xPosition,
          yPosition,
          this.WINDOW_SCALE_FACTOR,
          this.WINDOW_SCALE_FACTOR,
        );

        continue;
      }

      context.fillStyle = "#000000";
      context.fillRect(
        xPosition,
        yPosition,
        this.WINDOW_SCALE_FACTOR,
        this.WINDOW_SCALE_FACTOR,
      );
    }
  }

  initAudio() {
    if (this.audioInitialized) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.audioContext = new AudioContext();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 0;
    this.gainNode.connect(this.audioContext.destination);

    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.type = "square";
    this.oscillator.frequency.value = 440;
    this.oscillator.connect(this.gainNode);
    this.oscillator.start();

    this.audioInitialized = true;
  }

  syncAudio() {
    if (!this.audioInitialized || !this.gainNode || !this.audioContext) return;

    const shouldBeep = this.soundTimer > 0 && !this.isMuted;
    const targetGain = shouldBeep ? this.volume : 0;
    const now = this.audioContext.currentTime;

    this.gainNode.gain.setTargetAtTime(targetGain, now, 0.02);
  }
}

const chip8 = new Chip8();
chip8.init();
