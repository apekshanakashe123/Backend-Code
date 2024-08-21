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
   

    try {

        const authHeader = req.headers['authorization'];
        const token = authHeader.split(' ')[1];
         
        const getIdQuery = `SELECT Id FROM Users WHERE access_token = @token`;
        const userIdResult = await executeQuery(getIdQuery, [{ name: 'token', value: token }]);
        if (userIdResult === 'error' || userIdResult.length === 0) {
            return res.status(404).json({ message: 'User not found' });
            
        }
        const userId = userIdResult[0][0].Id;
        const query = `SELECT A.AccountID,U.Username,A.TransactionType,A.Amount,A.TransactionDate,A.balanceAmount FROM Accounts A inner join Users U on A.Id=U.Id where A.Id =@userId   ORDER BY TransactionDate DESC`;
        const inputs = [{ name: 'userId', value: userId }];
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
    const userId = req.user.Id;
    const { amount, TransDate } = req.body;
    console.log(amount,TransDate)
    try {
      
        if (amount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than zero' });
        }

        // const authHeader = req.headers['authorization'];
        // const token = authHeader.split(' ')[1];
        //  console.log(token)
        // const getIdQuery = `SELECT Id FROM Users WHERE access_token = @token`;
        // const userIdResult = await executeQuery(getIdQuery, [{ name: 'token', value: token }]);
        // if (userIdResult === 'error' || userIdResult.length === 0) {
        //     return res.status(404).json({ message: 'User not found' });
        // }
        
        const balanceQuery = 'SELECT TOP(1) balanceAmount from Accounts WHERE Id = @userId ORDER BY TransactionDate DESC';
        const balanceResult = await executeQuery(balanceQuery, [{ name: 'userId', value: userId }]);
        console.log(balanceResult)
        if (balanceResult === 'error' || balanceResult.length === 0) {
            return res.status(404).json({ message: 'Account not found' });
        }

        const currentBalance = balanceResult[0][0].balanceAmount;
        console.log(currentBalance)
        const newBalance = parseInt(currentBalance) + parseInt(amount);
        console.log(newBalance)

        const updateQuery = `
            UPDATE Accounts SET balanceAmount = @newBalance WHERE Id = @userId;
            INSERT INTO Accounts (Id,TransactionType, Amount, TransactionDate,balanceAmount) 
            VALUES (@userId, 'deposit',@amount,@TransDate,@newBalance);
        `;
        const inputs = [
            { name: 'newBalance', value: newBalance },
            { name: 'userId', value: userId },
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
    const userId = req.user.Id;
    const { amount, Withdrawdate } = req.body;

    try {
      
        if (amount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than zero' });
        }

        // const authHeader = req.headers['authorization'];
        // const token = authHeader.split(' ')[1];
         
        // const getIdQuery = `SELECT Id FROM Users WHERE access_token = @token`;
        // const userIdResult = await executeQuery(getIdQuery, [{ name: 'token', value: token }]);
        // if (userIdResult === 'error' || userIdResult.length === 0) {
        //     return res.status(404).json({ message: 'User not found' });
        // }
        // const userId = userIdResult[0][0].Id;
        const balanceQuery = 'SELECT TOP(1) balanceAmount FROM Accounts WHERE Id = @userId ORDER BY TransactionDate DESC';
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
            UPDATE Accounts SET balanceAmount = @newBalance WHERE Id = @userId;
            INSERT INTO Accounts (Id, Amount, TransactionType, TransactionDate, balanceAmount) 
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
//

