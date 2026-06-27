// Simple RISC-V Simulator - Student Version (Only I-type & R-type)
// Easy to read and explain

let registers = new Array(32).fill(0);
let memory = new Array(1024).fill(0);
let instructions = [];
let labels = {};
let currentStep = 0;

const consoleEl = document.getElementById('console');
const registersEl = document.getElementById('registers');
const memoryEl = document.getElementById('memory');
const programEl = document.getElementById('program');

function log(msg, error = false) {
    consoleEl.textContent += (error ? "❌ " : "➤ ") + msg + "\n";
    consoleEl.scrollTop = consoleEl.scrollHeight;
}

function clearConsole() {
    consoleEl.textContent = "";
}

// Register mapping (easy for students)
const regNames = {
    zero: 0, ra: 1, sp: 2, gp: 3, tp: 4,
    t0: 5, t1: 6, t2: 7, t3: 28, t4: 29, t5: 30, t6: 31,
    s0: 8, s1: 9, s2: 18, s3: 19, s4: 20, s5: 21, s6: 22, s7: 23, s8: 24, s9: 25, s10: 26, s11: 27,
    a0: 10, a1: 11, a2: 12, a3: 13, a4: 14, a5: 15, a6: 16, a7: 17
};

function getReg(reg) {
    reg = reg.toLowerCase().trim();
    if (reg.startsWith('x')) return parseInt(reg.slice(1)) || 0;
    return regNames[reg] !== undefined ? regNames[reg] : -1;
}

function updateRegisters() {
    let html = `<tr><th>Reg</th><th>Name</th><th>Value</th></tr>`;
    for (let i = 0; i < 32; i++) {
        let name = Object.keys(regNames).find(k => regNames[k] === i) || `x${i}`;
        html += `<tr><td>x${i}</td><td>${name}</td><td>${registers[i]}</td></tr>`;
    }
    registersEl.innerHTML = html;
}

function updateMemory() {
    let text = "";
    for (let i = 0; i < 16; i++) {
        text += `0x${(i*4).toString(16).padStart(3,'0')}: ${memory[i]}\n`;
    }
    memoryEl.textContent = text;
}

function updateProgram() {
    let text = "";
    instructions.forEach((inst, i) => {
        const arrow = i === currentStep ? "→ " : "  ";
        const cls = i === currentStep ? ' class="current"' : '';
        text += `<span${cls}>${arrow}${inst.original}</span>\n`;
    });
    programEl.innerHTML = text;
}

// Simple assembler with error handling
function assemble(code) {
    instructions = [];
    labels = {};
    const lines = code.split('\n');
    let addr = 0;

    // Pass 1: Labels
    lines.forEach((line, idx) => {
        line = line.trim().split('#')[0];
        if (line.endsWith(':')) {
            labels[line.slice(0, -1).trim()] = addr;
        } else if (line) addr += 4;
    });

    // Pass 2: Instructions
    addr = 0;
    lines.forEach((line, lineNum) => {
        const original = line;
        line = line.trim().split('#')[0];
        if (!line || line.endsWith(':')) return;

        const parts = line.replace(/,/g, ' ').split(/\s+/).filter(p => p);
        const opcode = parts[0].toLowerCase();

        instructions.push({
            opcode,
            args: parts.slice(1),
            original: original.trim(),
            lineNumber: lineNum + 1,
            addr
        });
        addr += 4;
    });
}

// Execute single instruction
function execute(inst) {
    try {
        const {opcode, args, lineNumber} = inst;
        const rd = getReg(args[0]);

        switch (opcode) {
            case 'addi':
                registers[rd] = registers[getReg(args[1])] + parseInt(args[2]);
                break;
            case 'add':
                registers[rd] = registers[getReg(args[1])] + registers[getReg(args[2])];
                break;
            case 'sub':
                registers[rd] = registers[getReg(args[1])] - registers[getReg(args[2])];
                break;
            case 'and': case 'or': case 'xor':
                const op1 = registers[getReg(args[1])];
                const op2 = registers[getReg(args[2])];
                if (opcode === 'and') registers[rd] = op1 & op2;
                if (opcode === 'or')  registers[rd] = op1 | op2;
                if (opcode === 'xor') registers[rd] = op1 ^ op2;
                break;
            case 'beq': case 'bne':
                const r1 = getReg(args[0]);
                const r2 = getReg(args[1]);
                const target = labels[args[2]];
                if (target === undefined) throw new Error("Label not found");
                if ((opcode === 'beq' && registers[r1] === registers[r2]) ||
                    (opcode === 'bne' && registers[r1] !== registers[r2])) {
                    currentStep = instructions.findIndex(i => i.addr === target);
                    return true;
                }
                break;
            default:
                throw new Error(`Instruction not supported yet: ${opcode}`);
        }
    } catch (e) {
        log(`Error at line ${inst.lineNumber}: ${e.message}`, true);
        return false;
    }
    return true;
}

function step() {
    if (currentStep >= instructions.length) {
        log("Program finished.");
        return;
    }
    const success = execute(instructions[currentStep]);
    if (success) currentStep++;
    updateRegisters();
    updateMemory();
    updateProgram();
}

function assembleAndRun() {
    resetSimulator();
    const code = document.getElementById('editor').value;
    assemble(code);
    log(`Loaded ${instructions.length} instructions.`);
    updateProgram();
    while (currentStep < instructions.length) {
        if (!execute(instructions[currentStep])) break;
        currentStep++;
    }
    updateRegisters();
    updateMemory();
    updateProgram();
}

function resetSimulator() {
    registers = new Array(32).fill(0);
    memory = new Array(1024).fill(0);
    instructions = [];
    labels = {};
    currentStep = 0;
    consoleEl.textContent = "";
    updateRegisters();
    updateMemory();
    updateProgram();
}

// Init
updateRegisters();
updateMemory();
updateProgram();
