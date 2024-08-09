const express = require('express');
const router = express.Router();
const transactionController = require('../Controller/TransactionController');
const authMiddleware = require('../middleware/authMiddleware');




router.get('/',authMiddleware, transactionController.getTransactions);


router.post('/deposit',authMiddleware, transactionController.deposit);


router.post('/withdraw',authMiddleware, transactionController.withdraw);

module.exports = router;
