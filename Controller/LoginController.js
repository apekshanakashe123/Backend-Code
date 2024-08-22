const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sql = require('mssql');
const config = require('../config/database');
const crypto = require('crypto');
//chnages in 

function generateRandomString(length) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

const poolPromise = new sql.ConnectionPool(config.db)
  .connect()
  .catch(err => console.error('Datebase Connection Failed:', err));

exports.login = async (req, res) => {
  const { username, password } = req.body;
  console.log(username, password)
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('username', username)
      .query('SELECT * FROM Users WHERE email = @username');

    let user = result.recordset[0];
    console.log('Provided Password:', password);
    console.log('Stored  Password:', user.Password);

    if (!user || password !== user.Password) {
      console.log('Password mismatch or user not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    

 
    const accessToken = generateRandomString(36);

   
    const tokenPayload = {
        email: user.email,
        access_token: accessToken 
    };
    console.log(tokenPayload);
   
    const jwtToken = jwt.sign(tokenPayload, 'SECRET', { expiresIn: '1h' });
   console.log(jwtToken);

await pool.request()
.input('jwtToken', jwtToken)
.input('userId', user.Id)
.query('UPDATE Users SET access_token = @jwtToken WHERE Id = @userId');

res.json({ token: jwtToken, role: user.UserType });
console.log('Token is send')
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
