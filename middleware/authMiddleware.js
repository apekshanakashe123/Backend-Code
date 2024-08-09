const sql = require('mssql');
const config=require('../config/database')

async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    try {
        const poolPromise = new sql.ConnectionPool(config.db)
  .connect()
  .catch(err => console.error('Database connection failed:', err));


      const pool = await poolPromise;
      const result = await pool.request()
      .input('accessToken', sql.NVarChar, token)
        .query(`SELECT * FROM Users WHERE access_token = @accessToken`);
  
        if (result.recordset.length > 0) {
            req.user = result.recordset[0]; 
            next();
        } else {
            res.sendStatus(403);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = authenticateToken;
