
// This file now exports all services from their respective domain files
// to maintain backward compatibility

export {
  fetchTransactionData
} from './transactionService';

export {
  fetchProductData,
  fetchProductsWithImages
} from './productService';

export {
  fetchStoreData
} from './storeService';

export {
  fetchDailySalesData,
  fetchAvailableDataMonths
} from './salesService';

export {
  addMagentoConnection,
  fetchMagentoConnections,
  updateMagentoConnection,
  triggerMagentoSync
} from './magentoService';

export {
  fetchUserProfile,
  updateUserProfile
} from './profileService';
