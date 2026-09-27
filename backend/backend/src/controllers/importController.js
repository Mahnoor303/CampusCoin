const { processTransactionsCSV } = require('../services/csvImportService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * @desc    Import transactions from CSV file or raw CSV string
 * @route   POST /api/import/transactions
 * @access  Private
 */
const importTransactions = async (req, res, next) => {
  try {
    let csvData;

    // Check if uploaded via multipart/form-data
    if (req.file && req.file.buffer) {
      csvData = req.file.buffer.toString('utf-8');
    } else if (req.body && (req.body.csv || req.body.csvData)) {
      csvData = req.body.csv || req.body.csvData;
    } else if (typeof req.body === 'string' && req.body.trim() !== '') {
      csvData = req.body;
    }

    if (!csvData || csvData.trim() === '') {
      return sendError(
        res,
        400,
        'No CSV data provided. Please upload a CSV file or provide CSV string in request body.'
      );
    }

    const result = await processTransactionsCSV(csvData, req.user._id);

    return sendSuccess(
      res,
      200,
      `CSV processed: ${result.importedRows} of ${result.totalRows} transactions imported successfully.`,
      result
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  importTransactions,
};
