
// This file now exports all services from their respective domain files
// to maintain backward compatibility

// Transaction service exports
export {
  fetchTransactionData,
  testDatabaseConnection,
  getTransactionCount,
  fetchBasketOpenerProducts,
  fetchSyncProgress,
  fetchSyncHistory
} from './transactionService';

// Product service exports
export {
  fetchProductData,
  fetchProductsWithImages
} from './productService';

// Store service exports
export {
  fetchStoreData,
  getStoresForUser
} from './storeService';

// Sales service exports
export {
  fetchDailySalesData,
  fetchAvailableDataMonths
} from './salesService';

// Magento service exports
export {
  addMagentoConnection,
  fetchMagentoConnections,
  fetchOrderStatuses,
  triggerMagentoSync
} from './magentoService';

// Profile service exports
export {
  fetchUserProfile,
  updateUserProfile
} from './profileService';
