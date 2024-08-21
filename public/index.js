const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('../routes/LoginRoutes');
const accountRoutes = require('../routes/AccountRoutes');
const TransRoutes = require('../routes/TransactionRoutes');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use('/auth', authRoutes);
app.use('/account', accountRoutes);
app.use('/Trans', TransRoutes);

const PORT = process.env.PORT || 3021;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
