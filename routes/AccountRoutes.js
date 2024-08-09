const express = require('express');
const router = express.Router();
const accountController = require('../Controller/AccountController');
const authMiddleware = require('../middleware/authMiddleware');


router.get('/',authMiddleware, accountController.getAllAccounts);
router.get('/:userId/transactions',authMiddleware, accountController.getUserTransactions);
module.exports = router;
