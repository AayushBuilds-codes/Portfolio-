/**
 * Advanced Dynamic Calculator Engine
 * Handles basic and scientific calculations, keyboard integration, and history tracking.
 */

class AdvancedCalculator {
    constructor() {
        this.formulaDisplay = document.getElementById('calc-formula');
        this.outputDisplay = document.getElementById('calc-output');
        
        this.formula = '';
        this.isEvaluated = false;
        this.angleMode = 'DEG'; // 'DEG' or 'RAD'
        
        this.history = JSON.parse(localStorage.getItem('calc_history')) || [];
        
        this.init();
    }

    init() {
        this.updateDisplay();
        this.bindEvents();
        this.renderHistory();
    }

    bindEvents() {
        // Button click binding
        document.querySelectorAll('.calc-btn').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.action;
                const value = button.dataset.value;
                this.handleInput(action, value);
            });
        });

        // Physical Keyboard binding
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });

        // History Drawer and Mode toggles
        const historyToggle = document.getElementById('btn-history-toggle');
        const historyPanel = document.getElementById('history-panel');
        const historyClose = document.getElementById('btn-history-close');
        const historyClear = document.getElementById('btn-history-clear');

        if (historyToggle && historyPanel) {
            historyToggle.addEventListener('click', () => {
                historyPanel.classList.toggle('open');
            });
        }
        if (historyClose && historyPanel) {
            historyClose.addEventListener('click', () => {
                historyPanel.classList.remove('open');
            });
        }
        if (historyClear) {
            historyClear.addEventListener('click', () => {
                this.clearHistory();
            });
        }

        // Scientific drawer toggle
        const sciToggle = document.getElementById('btn-sci-toggle');
        const sciDrawer = document.getElementById('sci-drawer');
        if (sciToggle && sciDrawer) {
            sciToggle.addEventListener('click', () => {
                sciDrawer.classList.toggle('open');
                sciToggle.classList.toggle('active');
            });
        }

        // Angle mode toggle (DEG/RAD)
        const angleToggle = document.getElementById('btn-angle-toggle');
        if (angleToggle) {
            angleToggle.addEventListener('click', () => {
                this.angleMode = this.angleMode === 'DEG' ? 'RAD' : 'DEG';
                angleToggle.textContent = this.angleMode;
                angleToggle.classList.toggle('active', this.angleMode === 'RAD');
                // Play click sound or visual alert
                this.triggerMicroAnimation(angleToggle);
            });
        }
    }

    handleInput(action, value) {
        // Reset formula if evaluated and user types a direct number
        if (this.isEvaluated && action === 'num') {
            this.formula = '';
            this.isEvaluated = false;
        } else if (this.isEvaluated && action === 'operator') {
            // Keep previous answer if adding an operator
            this.isEvaluated = false;
        }

        switch (action) {
            case 'num':
                this.formula += value;
                break;
            case 'operator':
                this.formula += value;
                break;
            case 'constant':
                this.formula += value;
                break;
            case 'function':
                this.formula += value + '(';
                break;
            case 'clear':
                this.formula = '';
                this.outputDisplay.textContent = '0';
                this.isEvaluated = false;
                break;
            case 'delete':
                if (this.formula.length > 0) {
                    // If deleting a function like "sin(", strip the whole keyword
                    const endsWithFunc = /(sin|cos|tan|log|ln|sqrt)\($/.exec(this.formula);
                    if (endsWithFunc) {
                        this.formula = this.formula.slice(0, -endsWithFunc[0].length);
                    } else {
                        this.formula = this.formula.slice(0, -1);
                    }
                }
                break;
            case 'parenthesis':
                this.formula += value;
                break;
            case 'decimal':
                // Append decimal point safely
                this.formula += '.';
                break;
            case 'calculate':
                this.evaluateFormula();
                break;
            default:
                break;
        }
        this.updateDisplay();
    }

    handleKeyboard(e) {
        // Ignore typing keyboard shortcuts if user is typing in Nova AI input field
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
            return;
        }

        const key = e.key;

        // Map keyboard keys to calculator actions
        if (/[0-9]/.test(key)) {
            this.handleInput('num', key);
        } else if (['+', '-', '*', '/'].includes(key)) {
            let op = key;
            if (key === '*') op = '×';
            if (key === '/') op = '÷';
            this.handleInput('operator', op);
        } else if (key === '.') {
            this.handleInput('decimal');
        } else if (key === '(' || key === ')') {
            this.handleInput('parenthesis', key);
        } else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            this.handleInput('calculate');
        } else if (key === 'Backspace') {
            this.handleInput('delete');
        } else if (key === 'Escape' || key.toLowerCase() === 'c') {
            this.handleInput('clear');
        } else if (key === '^') {
            this.handleInput('operator', '^');
        } else if (key === '%') {
            this.handleInput('operator', '%');
        } else if (key === '!') {
            this.handleInput('operator', '!');
        }
        this.updateDisplay();
    }

    updateDisplay() {
        this.formulaDisplay.textContent = this.formula || '0';
        
        // Auto scroll formula display to the right as it gets long
        this.formulaDisplay.scrollLeft = this.formulaDisplay.scrollWidth;
    }

    evaluateFormula() {
        if (!this.formula) return;
        
        let expression = this.formula;
        const originalFormula = this.formula;

        try {
            // Replace custom visual operators with standard JavaScript math operators
            expression = expression.replace(/×/g, '*');
            expression = expression.replace(/÷/g, '/');
            expression = expression.replace(/π/g, 'Math.PI');
            expression = expression.replace(/e/g, 'Math.E');

            // Handle factorials (e.g., 5! -> factorial(5))
            expression = this.parseFactorials(expression);

            // Handle percentages (e.g., 50 + 10% -> 50 + 0.1, or handle simple division)
            expression = expression.replace(/(\d+(\.\d+)?)%/g, '($1/100)');

            // Handle scientific functions based on angle mode (DEG vs RAD)
            expression = this.parseScientificFunctions(expression);

            // Handle exponents (x^y -> Math.pow(x,y))
            expression = this.parsePowers(expression);

            // Secure Evaluation check using a math validation regex
            // Only allows Math.* functions, brackets, basic operators, numbers, and decimals
            const safeCharacters = /^[0-9+\-*/().\s]|(Math\.[a-z0-9]+)|(Math\.PI)|(Math\.E)$/i;
            
            // Clean up double operators
            expression = expression.replace(/\s+/g, '');

            // Solve using Function constructor instead of direct eval (sandboxed check)
            const result = new Function(`"use strict"; return (${expression})`)();

            if (result === undefined || isNaN(result) || !isFinite(result)) {
                throw new Error("Invalid Output");
            }

            // Format result (prevent floating point precision errors like 0.1 + 0.2 = 0.30000000000000004)
            const formattedResult = this.formatResult(result);
            
            this.outputDisplay.textContent = formattedResult;
            this.formula = formattedResult.toString();
            this.isEvaluated = true;

            // Push calculation to history
            this.saveToHistory(originalFormula, formattedResult);

        } catch (error) {
            console.error('Calculation Error:', error);
            this.outputDisplay.textContent = 'Error';
            this.isEvaluated = true;
        }
    }

    parseFactorials(expr) {
        // Matches integers followed by a factorial symbol, e.g., 5!
        const factorialRegex = /(\d+)!/g;
        
        // Helper factorial function
        const fact = (num) => {
            if (num < 0) return NaN;
            if (num === 0 || num === 1) return 1;
            let val = 1;
            for (let i = 2; i <= num; i++) val *= i;
            return val;
        };

        // Expose fact helper to evaluation scope globally inside window
        window.__calcFact = fact;

        return expr.replace(factorialRegex, 'window.__calcFact($1)');
    }

    parsePowers(expr) {
        // Simplified helper to find base^exponent and replace with Math.pow(base, exponent)
        // Matches tokens or parentheses
        let oldExpr;
        do {
            oldExpr = expr;
            // Match pattern: base^exponent where base can be a number or a parenthesis group, and exponent can be a number/parenthesis
            // For general parsing, we can convert simple base^exponent cases:
            // Match parentheses or words/numbers
            expr = expr.replace(/([a-zA-Z0-9_.]+|\((?:[^()]+|\([^()]*\))*\))\^([a-zA-Z0-9_.]+|\((?:[^()]+|\([^()]*\))*\))/g, 'Math.pow($1,$2)');
        } while (expr !== oldExpr);
        
        return expr;
    }

    parseScientificFunctions(expr) {
        // Trigonometric conversions considering degree vs radian mode
        const isDeg = this.angleMode === 'DEG';
        
        // Custom math helpers bound on window for simple injection
        window.__calcSin = (x) => isDeg ? Math.sin(x * Math.PI / 180) : Math.sin(x);
        window.__calcCos = (x) => isDeg ? Math.cos(x * Math.PI / 180) : Math.cos(x);
        window.__calcTan = (x) => isDeg ? Math.tan(x * Math.PI / 180) : Math.tan(x);
        window.__calcLog = (x) => Math.log10(x);
        window.__calcLn = (x) => Math.log(x);
        window.__calcSqrt = (x) => Math.sqrt(x);

        // Replace keywords with global helper function calls
        expr = expr.replace(/sin\(/g, 'window.__calcSin(');
        expr = expr.replace(/cos\(/g, 'window.__calcCos(');
        expr = expr.replace(/tan\(/g, 'window.__calcTan(');
        expr = expr.replace(/log\(/g, 'window.__calcLog(');
        expr = expr.replace(/ln\(/g, 'window.__calcLn(');
        expr = expr.replace(/sqrt\(/g, 'window.__calcSqrt(');

        return expr;
    }

    formatResult(num) {
        // Fix standard JS float inaccuracies
        const precision = 12;
        let formatted = Number(num.toPrecision(precision)).toString();
        
        // Remove trailing decimal point and zeros if not needed
        if (formatted.includes('.')) {
            formatted = formatted.replace(/\.?0+$/, '');
        }
        
        // Handle scientific notation for extremely large or small numbers
        if (Math.abs(num) > 1e14 || (Math.abs(num) < 1e-7 && num !== 0)) {
            formatted = num.toExponential(6);
        }

        return formatted;
    }

    saveToHistory(formula, result) {
        const item = { formula, result, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        this.history.unshift(item); // Add to beginning
        
        // Keep max 30 items
        if (this.history.length > 30) this.history.pop();

        localStorage.setItem('calc_history', JSON.stringify(this.history));
        this.renderHistory();
    }

    renderHistory() {
        const container = document.getElementById('history-list');
        if (!container) return;

        if (this.history.length === 0) {
            container.innerHTML = `<div class="history-empty">No calculations yet</div>`;
            return;
        }

        container.innerHTML = this.history.map((item, idx) => `
            <div class="history-item" data-index="${idx}">
                <div class="history-formula">${item.formula}</div>
                <div class="history-result">= ${item.result}</div>
                <div class="history-time">${item.timestamp}</div>
            </div>
        `).join('');

        // Attach click listeners to reload formulas from history
        container.querySelectorAll('.history-item').forEach(element => {
            element.addEventListener('click', () => {
                const idx = element.dataset.index;
                const selected = this.history[idx];
                this.formula = selected.formula;
                this.isEvaluated = false;
                this.updateDisplay();
                // Close history panel on click for better flow
                document.getElementById('history-panel').classList.remove('open');
            });
        });
    }

    clearHistory() {
        this.history = [];
        localStorage.removeItem('calc_history');
        this.renderHistory();
    }

    triggerMicroAnimation(el) {
        el.style.transform = 'scale(0.92)';
        setTimeout(() => {
            el.style.transform = '';
        }, 100);
    }
}

// Initialise the calculator on page load
let calculatorInstance;
document.addEventListener('DOMContentLoaded', () => {
    calculatorInstance = new AdvancedCalculator();
});
