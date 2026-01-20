class Chip8 {
  constructor() {
    this.memory = new Uint8Array(4096);
    this.V = new Uint8Array(16);
    this.I = 0;
    this.stack = new Uint16Array(16);
    this.PC = 0x200; // entrypoint for memory
    this.stackPointer = 0;
    this.delayTimer = 0;
    this.soundTimer = 0;
  }
}
