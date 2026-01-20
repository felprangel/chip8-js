class Chip8 {
  entrypoint = 0x200;

  constructor() {
    this.ram = new Uint8Array(4096);
    this.V = new Uint8Array(16);
    this.I = 0;
    this.PC = this.entrypoint;
    this.stack = new Uint16Array(12);
    this.stackPointer = 0;
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.display = new Uint8Array(64 * 32);
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
      case 0x01:
        this.PC = NNN;
        break;

      case 0x06:
        this.V[X] = NN;
        break;

      case 0x07:
        this.V[X] += NN;
        break;

      default:
        break;
    }
  }

  init() {
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

    input.addEventListener("change", function (event) {
      const file = event.target.files[0];

      if (!file) {
        return;
      }

      const reader = new FileReader();

      reader.onload = function (event) {
        const buffer = event.target.result;
        const bytes = new Uint8Array(buffer);
        this.ram.set(bytes, this.entrypoint);
      };

      reader.readAsArrayBuffer(file);
    });
  }
}
