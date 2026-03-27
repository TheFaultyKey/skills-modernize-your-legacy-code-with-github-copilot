const { spawnSync } = require('node:child_process');

const appDirectory = __dirname;

function runApplication(input) {
    const result = spawnSync(process.execPath, ['index.js'], {
        cwd: appDirectory,
        input,
        encoding: 'utf8',
    });

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);

    return result.stdout;
}

function countOccurrences(output, value) {
    return output.split(value).length - 1;
}

describe('COBOL accounting test plan coverage', () => {
    test('TC-001 displays the main account menu on startup', () => {
        const output = runApplication('4\n');

        expect(output).toContain('Account Management System');
        expect(output).toContain('1. View Balance');
        expect(output).toContain('2. Credit Account');
        expect(output).toContain('3. Debit Account');
        expect(output).toContain('4. Exit');
    });

    test('TC-002 shows the initial balance in a new session', () => {
        const output = runApplication('1\n4\n');

        expect(output).toContain('Current balance: 001000.00');
    });

    test('TC-003 credits the account and shows the new balance', () => {
        const output = runApplication('2\n100.00\n4\n');

        expect(output).toContain('Amount credited. New balance: 001100.00');
    });

    test('TC-004 debits the account when funds are available', () => {
        const output = runApplication('3\n100.00\n4\n');

        expect(output).toContain('Amount debited. New balance: 000900.00');
    });

    test('TC-005 rejects a debit when funds are insufficient', () => {
        const output = runApplication('3\n1000.01\n1\n4\n');

        expect(output).toContain('Insufficient funds for this debit.');
        expect(output).toContain('Current balance: 001000.00');
    });

    test('TC-006 allows a debit equal to the full balance', () => {
        const output = runApplication('3\n1000.00\n1\n4\n');

        expect(output).toContain('Amount debited. New balance: 000000.00');
        expect(output).toContain('Current balance: 000000.00');
    });

    test('TC-007 accepts a zero-value credit and leaves the balance unchanged', () => {
        const output = runApplication('2\n0.00\n1\n4\n');

        expect(output).toContain('Amount credited. New balance: 001000.00');
        expect(output).toContain('Current balance: 001000.00');
    });

    test('TC-008 accepts a zero-value debit and leaves the balance unchanged', () => {
        const output = runApplication('3\n0.00\n1\n4\n');

        expect(output).toContain('Amount debited. New balance: 001000.00');
        expect(output).toContain('Current balance: 001000.00');
    });

    test('TC-009 rejects an invalid menu option and continues the menu loop', () => {
        const output = runApplication('5\n4\n');

        expect(output).toContain('Invalid choice, please select 1-4.');
        expect(countOccurrences(output, 'Account Management System')).toBeGreaterThanOrEqual(2);
    });

    test('TC-010 exits the application cleanly', () => {
        const output = runApplication('4\n');

        expect(output).toContain('Exiting the program. Goodbye!');
    });

    test('TC-011 keeps a credited balance available later in the same session', () => {
        const output = runApplication('2\n250.00\n1\n4\n');

        expect(output).toContain('Amount credited. New balance: 001250.00');
        expect(output).toContain('Current balance: 001250.00');
    });

    test('TC-012 keeps a debited balance available later in the same session', () => {
        const output = runApplication('3\n250.00\n1\n4\n');

        expect(output).toContain('Amount debited. New balance: 000750.00');
        expect(output).toContain('Current balance: 000750.00');
    });

    test('TC-013 applies multiple sequential transactions to the same account balance', () => {
        const output = runApplication('2\n200.00\n3\n50.00\n1\n4\n');

        expect(output).toContain('Amount credited. New balance: 001200.00');
        expect(output).toContain('Amount debited. New balance: 001150.00');
        expect(output).toContain('Current balance: 001150.00');
    });

    test('TC-014 preserves the stored balance after an unsuccessful debit', () => {
        const output = runApplication('3\n1500.00\n1\n4\n');

        expect(output).toContain('Insufficient funds for this debit.');
        expect(output).toContain('Current balance: 001000.00');
    });

    test('TC-015 records the current Node.js behavior for invalid amount entry', () => {
        const output = runApplication('2\nABC\n1\n4\n');

        expect(output).toContain('Invalid amount. Please enter a non-negative number with up to 2 decimal places.');
        expect(output).toContain('Current balance: 001000.00');
    });
});