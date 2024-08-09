const sql = require('mssql');
const config = require('../config/database');
const jwt = require('jsonwebtoken');


async function executeQuery(query, inputs = []) {
    let dbConn;
    try {

        dbConn = await sql.connect(config.db);

        const request = dbConn.request();
        inputs.forEach(input => {
            request.input(input.name, input.value);
        });

        const result = await request.query(query);
        return result.recordsets;
    } catch (err) {
        console.error('Database query error:', err);
        return 'error';
    } finally {
        if (dbConn) {
            await dbConn.close();
        }
    }
}


exports.getTransactions = async (req, res) => {
    const userId = req.user.UserID;

    try {
        const query = 'SELECT A.AccountID,U.Username,A.TransactionType,A.Amount,A.TransactionDate,A.balanceAmount FROM Accounts A inner join Users U on A.UserID=U.UserID where A.UserID = 2 ORDER BY TransactionDate DESC';
        const inputs = [{ name: 'userID', value: userId }];
        const result = await executeQuery(query, inputs);

        if (result === 'error' || result.length === 0) {
            return res.status(404).json({ message: 'No transactions found' });
        }

        res.json(result[0]);
    } catch (err) {
        console.error('Error in getTransactions:', err);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.deposit = async (req, res) => {
    const userId = req.user.UserID;
    const { amount, TransDate } = req.body;

    try {
      
        if (amount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than zero' });
        }

        // Get the current balance of the user
        const balanceQuery = 'SELECT TOP(1) balanceAmount from Accounts WHERE userID = @userId ORDER BY TransactionDate DESC';
        const balanceResult = await executeQuery(balanceQuery, [{ name: 'userID', type: sql.Int, value: userId }]);
        console.log(balanceResult)
        if (balanceResult === 'error' || balanceResult.length === 0) {
            return res.status(404).json({ message: 'Account not found' });
        }

        const currentBalance = balanceResult[0][0].balanceAmount;
        console.log(currentBalance)
        const newBalance = parseInt(currentBalance) + parseInt(amount);
        console.log(newBalance)

        const updateQuery = `
            UPDATE Accounts SET balanceAmount = @newBalance WHERE userID = @userId;
            INSERT INTO Accounts (UserID,TransactionType, Amount, TransactionDate,balanceAmount) 
            VALUES (@userId, 'deposit',@amount,@TransDate,@newBalance);
        `;
        const inputs = [
            { name: 'newBalance', value: newBalance },
            { name: 'userID', value: userId },
            { name: 'amount', value: amount },
            { name: 'TransDate', value: TransDate }
        ];
        const updateResult = await executeQuery(updateQuery, inputs);
        console.log(updateResult)
        if (updateResult === 'error') {
            return res.status(500).json({ message: 'Error processing deposit' });
        }

        res.json({ message: 'Deposit successful', newBalance });
    } catch (err) {
        console.error('Error in deposit:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.withdraw = async (req, res) => {
    const userId = req.user.UserID;
    const { amount, Withdrawdate } = req.body;

    try {
      
        if (amount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than zero' });
        }

        
        const balanceQuery = 'SELECT TOP(1) balanceAmount FROM Accounts WHERE userID = @userId ORDER BY TransactionDate DESC';
        const balanceResult = await executeQuery(balanceQuery, [{ name: 'userId', value: userId }]);

        if (balanceResult === 'error' || balanceResult.length === 0) {
            return res.status(404).json({ message: 'Account not found' });
        }

        const currentBalance = balanceResult[0][0].balanceAmount;

        
        if (amount > currentBalance) {
            return res.status(400).json({ message: 'Insufficient funds' });
        }

        const newBalance = currentBalance - amount;

        
        const updateQuery = `
            UPDATE Accounts SET balanceAmount = @newBalance WHERE userID = @userId;
            INSERT INTO Accounts (userID, Amount, TransactionType, TransactionDate, balanceAmount) 
            VALUES (@userId, @amount, 'withdrawal', @Withdrawdate, @newBalance);
        `;
        const inputs = [
            { name: 'newBalance', value: newBalance },
            { name: 'userId', value: userId },
            { name: 'amount', value: amount },
            { name: 'Withdrawdate', value: Withdrawdate }
        ];
        const updateResult = await executeQuery(updateQuery, inputs);

        if (updateResult === 'error') {
            return res.status(500).json({ message: 'Error processing withdrawal' });
        }

        res.json({ message: 'Withdrawal successful', newBalance });
    } catch (err) {
        console.error('Error in withdraw:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

