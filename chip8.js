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
}
