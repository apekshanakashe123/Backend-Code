const sql = require('mssql');
const config = require('../config/database');


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


exports.getAllAccounts = async (req, res) => {
    try {
   
        if (req.user.UserType !== 'banker') {
            return res.status(403).json({ message: 'Access denied' });
        }

       
        const query = `SELECT UserID, username, Email FROM Users WHERE UserType = 'customer' `;
        const result = await executeQuery(query);

        if (result === 'error') {
            return res.status(500).json({ message: 'Error fetching accounts' });
        }

        res.json(result[0]);
    } catch (err) {
        console.error('Error in getAllAccounts:', err);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.getUserTransactions = async (req, res) => {
    const userId = req.params.userId;

    try {
        
        if (req.user.UserType !== 'banker') {
            return res.status(403).json({ message: 'Access denied' });
        }

        
        const query = 'SELECT * FROM Accounts WHERE UserID = @userId';
        const inputs = [{ name: 'userID', value: userId }];
        const result = await executeQuery(query, inputs);
        console.log(result)
        if (result === 'error' || result.length === 0) {
            return res.status(404).json({ message: 'No transactions found for this user' });
        }

        
        res.json(result[0]);
    } catch (err) {
        console.error('Error in getUserTransactions:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

