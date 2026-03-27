# Node.js Accounting App

This folder contains a single-file Node.js implementation of the legacy COBOL student account application.

## Run

```bash
cd src/accounting
npm install
npm start
```

## Behavior Preserved

- Single in-memory student account balance
- Starting balance of `1000.00`
- Menu options for view, credit, debit, and exit
- Debit protection when funds are insufficient
- In-session balance updates through a read/write data flow