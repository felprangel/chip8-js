class Chip8 {
  ENTRYPOINT = 0x200;
  WINDOW_WIDTH = 64;
  WINDOW_HEIGHT = 32;
  WINDOW_SCALE_FACTOR = 10;

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
            if (this.V[Y] <= this.V[X]) {
              this.V[0xf] = 1;
            }

            this.V[X] -= this.V[Y];
            break;

          case 6:
            this.V[0xf] = this.V[X] & 1;
            this.V[X] >>= 1;
            break;

          case 7:
            if (this.V[X] <= this.V[Y]) {
              this.V[0xf] = 1;
            }

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

      default:
        break;
    }
  }

  init() {
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

        const step = () => {
          for (let i = 0; i < 10; i++) {
            this.cpuCycle();
          }

          if (this.delayTimer > 0) this.delayTimer--;
          if (this.soundTimer > 0) this.soundTimer--;

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
          this.WINDOW_SCALE_FACTOR
        );

        continue;
      }

      context.fillStyle = "#000000";
      context.fillRect(
        xPosition,
        yPosition,
        this.WINDOW_SCALE_FACTOR,
        this.WINDOW_SCALE_FACTOR
      );
    }
  }
}

const chip8 = new Chip8();
chip8.init();
