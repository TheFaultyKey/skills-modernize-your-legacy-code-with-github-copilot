const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');

const STARTING_BALANCE = 1000.0;

function normalizeCurrency(amount) {
    return Math.round(amount * 100) / 100;
}

function formatBalance(balance) {
    const [whole, fractional] = normalizeCurrency(balance).toFixed(2).split('.');

    return `${whole.padStart(6, '0')}.${fractional}`;
}

function parseAmount(input) {
    const trimmedInput = input.trim();

    if (!/^\d+(\.\d{1,2})?$/.test(trimmedInput)) {
        return null;
    }

    return normalizeCurrency(Number(trimmedInput));
}

class DataProgram {
    constructor(startingBalance = STARTING_BALANCE) {
        this.storageBalance = normalizeCurrency(startingBalance);
    }

    readBalance() {
        return this.storageBalance;
    }

    writeBalance(balance) {
        this.storageBalance = normalizeCurrency(balance);
    }
}

class Operations {
    constructor(dataProgram, prompt) {
        this.dataProgram = dataProgram;
        this.prompt = prompt;
    }

    async execute(operationType) {
        if (operationType === 'TOTAL ') {
            const finalBalance = this.dataProgram.readBalance();
            console.log(`Current balance: ${formatBalance(finalBalance)}`);
            return;
        }

        if (operationType === 'CREDIT') {
            const amount = await this.requestAmount('Enter credit amount: ');

            if (amount === null) {
                console.log('Invalid amount. Please enter a non-negative number with up to 2 decimal places.');
                return;
            }

            const finalBalance = this.dataProgram.readBalance() + amount;
            this.dataProgram.writeBalance(finalBalance);
            console.log(`Amount credited. New balance: ${formatBalance(this.dataProgram.readBalance())}`);
            return;
        }

        if (operationType === 'DEBIT ') {
            const amount = await this.requestAmount('Enter debit amount: ');

            if (amount === null) {
                console.log('Invalid amount. Please enter a non-negative number with up to 2 decimal places.');
                return;
            }

            const finalBalance = this.dataProgram.readBalance();

            if (finalBalance >= amount) {
                this.dataProgram.writeBalance(finalBalance - amount);
                console.log(`Amount debited. New balance: ${formatBalance(this.dataProgram.readBalance())}`);
            } else {
                console.log('Insufficient funds for this debit.');
            }
        }
    }

    async requestAmount(message) {
        const rawAmount = await this.prompt(message);
        return parseAmount(rawAmount);
    }
}

class AccountingApplication {
    constructor(options = {}) {
        const input = options.input || stdin;
        const output = options.output || stdout;
        const terminal = Boolean(input.isTTY && output.isTTY);

        this.input = input;
        this.output = output;
        this.isInteractive = terminal;
        this.readline = readline.createInterface({
            input,
            output,
            terminal,
        });
        this.lineIterator = this.readline[Symbol.asyncIterator]();
        this.continueFlag = 'YES';
        this.dataProgram = new DataProgram(options.startingBalance ?? STARTING_BALANCE);
        this.operations = new Operations(this.dataProgram, (message) => this.prompt(message));
    }

    async run() {
        try {
            while (this.continueFlag !== 'NO') {
                this.displayMenu();

                const userChoice = await this.prompt('Enter your choice (1-4): ');

                if (userChoice === null) {
                    this.continueFlag = 'NO';
                    break;
                }

                switch (userChoice.trim()) {
                    case '1':
                        await this.operations.execute('TOTAL ');
                        break;
                    case '2':
                        await this.operations.execute('CREDIT');
                        break;
                    case '3':
                        await this.operations.execute('DEBIT ');
                        break;
                    case '4':
                        this.continueFlag = 'NO';
                        break;
                    default:
                        console.log('Invalid choice, please select 1-4.');
                        break;
                }
            }

            console.log('Exiting the program. Goodbye!');
        } finally {
            this.readline.close();
        }
    }

    displayMenu() {
        console.log('--------------------------------');
        console.log('Account Management System');
        console.log('1. View Balance');
        console.log('2. Credit Account');
        console.log('3. Debit Account');
        console.log('4. Exit');
        console.log('--------------------------------');
    }

    async prompt(message) {
        this.output.write(message);

        const { value, done } = await this.lineIterator.next();

        if (done) {
            this.output.write('\n');
            return null;
        }

        if (!this.isInteractive) {
            this.output.write(`${value}\n`);
        }

        return value;
    }
}

module.exports = {
    AccountingApplication,
    DataProgram,
    Operations,
    STARTING_BALANCE,
    formatBalance,
    parseAmount,
};

if (require.main === module) {
    const app = new AccountingApplication();

    app.run().catch((error) => {
        console.error('Unexpected application error:', error);
        process.exitCode = 1;
    });
}