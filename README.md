# CHIP-8 Emulator (JS)

<img width="1323" height="641" alt="image" src="https://github.com/user-attachments/assets/7f5eff06-8fc8-4aeb-920f-2fd848bf9f12" />


Uma implementação robusta e performática do interpretador **CHIP-8** escrita puramente em JavaScript. Este projeto emula o hardware clássico dos anos 70, permitindo rodar jogos icônicos como Pong, Breakout e Space Invaders diretamente no navegador.

---

## 🚀 Sobre o Projeto

O CHIP-8 não é exatamente uma linguagem de programação, mas sim uma máquina virtual que rodava em computadores como o COSMAC VIP e o Telmac 1800. Este emulador recria a arquitetura necessária para interpretar as 35 instruções do sistema original.

### Especificações Implementadas:

* **Memória:** 4096 bytes de RAM.
* **Display:** Resolução de 64x32 pixels (monocromático).
* **Registradores:** 16 registros de 8 bits (V0-VF) + Registro de endereço (I) de 16 bits.
* **Stack:** Suporte para sub-rotinas (16 níveis).
* **Timers:** Delay timer e Sound timer (60Hz).

---

## 🛠️ Tecnologias Utilizadas

* **JavaScript (ES6+):** Lógica central e manipulação de bits.
* **HTML5 Canvas:** Para renderização gráfica de alta performance.
* **Web Audio API:** Para a reprodução dos bips característicos.
