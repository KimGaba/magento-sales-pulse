import { MagentoConnection } from "../_shared/database_types.ts";

// Function to fetch orders from Magento API
export async function fetchMagentoOrdersData(connection: MagentoConnection) {
  try {
    console.log(`Connecting to Magento API at ${connection.store_url}`);
    
    // Build Magento REST API endpoint URL
    const apiUrl = `${connection.store_url}/rest/V1/orders`;
    const searchCriteria = new URLSearchParams({
      'searchCriteria[pageSize]': '100',
      'searchCriteria[currentPage]': '1'
    }).toString();
    
    const requestUrl = `${apiUrl}?${searchCriteria}`;
    console.log(`Making request to: ${requestUrl}`);
    
    // Set up authorization headers with the stored access token
    const headers = {
      'Authorization': `Bearer ${connection.access_token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('Sending request to Magento API...');
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: headers
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Magento API error (${response.status}): ${errorText}`);
      throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
    }
    
    const responseData = await response.json();
    
    // Extract the orders from the response
    const orders = responseData.items || [];
    console.log(`Successfully fetched ${orders.length} orders from Magento`);
    
    // Transform the Magento order data into our transaction format
    return orders.map((order: any) => ({
      external_id: order.increment_id,
      transaction_date: order.created_at,
      amount: parseFloat(order.grand_total),
      customer_id: order.customer_email,
      customer_name: order.customer_firstname 
        ? `${order.customer_firstname} ${order.customer_lastname || ''}`
        : 'Guest Customer',
      store_view: order.store_id || 'default',
      customer_group: order.customer_group_id?.toString() || 'none',
      status: order.status,
      items: order.items?.length || 0,
      order_data: {
        payment_method: order.payment?.method || 'unknown',
        shipping_method: order.shipping_description || 'unknown'
      }
    }));
    
  } catch (error) {
    console.error(`Error fetching data from Magento API: ${error.message}`);
    throw error;
  }
}

// Mock function for local testing without an actual Magento store
export async function mockMagentoOrdersData() {
  console.log('Using mock Magento orders data for testing');
  
  // Generate some sample data
  const storeViews = ['dk', 'se', 'no', 'fi'];
  const customerGroups = ['retail', 'wholesale', 'vip'];
  const possibleStatuses = ["pending", "processing", "complete", "closed", "canceled", "holded"];
  const paymentMethods = ["checkmo", "banktransfer", "free", "cashondelivery", "paypal"];
  const shippingMethods = ["flatrate", "freeshipping", "tablerate", "ups", "usps"];
  
  const orderCount = Math.floor(Math.random() * 20) + 10; // 10-30 orders
  const orders = [];
  
  const today = new Date();
  
  for (let i = 0; i < orderCount; i++) {
    // Generate dates within the last 30 days
    const orderDate = new Date(today);
    orderDate.setDate(today.getDate() - Math.floor(Math.random() * 30));
    
    const storeView = storeViews[Math.floor(Math.random() * storeViews.length)];
    const customerGroup = customerGroups[Math.floor(Math.random() * customerGroups.length)];
    const amount = (Math.floor(Math.random() * 10000) / 100) + 100; // Random amount between 100-200
    const status = possibleStatuses[Math.floor(Math.random() * possibleStatuses.length)];
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const shippingMethod = shippingMethods[Math.floor(Math.random() * shippingMethods.length)];
    const itemCount = Math.floor(Math.random() * 5) + 1; // 1-5 items per order
    
    orders.push({
      external_id: `10000${Math.floor(Math.random() * 10000)}`,
      transaction_date: orderDate.toISOString(),
      amount: amount,
      customer_id: `customer${i}@example.com`,
      customer_name: `Customer ${i}`,
      store_view: storeView,
      customer_group: customerGroup,
      status: status,
      items: itemCount,
      order_data: {
        payment_method: paymentMethod,
        shipping_method: shippingMethod
      }
    });
  }
  
  console.log(`Generated ${orders.length} mock orders`);
  return orders;
}

// Function to fetch sales data from Magento API
export async function fetchMagentoSalesData(connection: any, orderStatuses: string[]) {
  try {
    console.log(`Connecting to Magento API at ${connection.store_url}`);
    
    // In a real implementation, you would make actual API calls to Magento
    // For demonstration purposes, we'll simulate a response with sample data
    
    // Simulated API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate some sample data that includes store view and customer group
    const sampleOrders = [];
    const storeViews = ['dk', 'se', 'no', 'fi'];
    const customerGroups = ['retail', 'wholesale', 'vip'];
    const possibleStatuses = ["pending", "processing", "complete", "closed", "canceled", "holded"];
    const orderCount = Math.floor(Math.random() * 10) + 5; // 5-15 orders
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    for (let i = 0; i < orderCount; i++) {
      const orderDate = i % 2 === 0 ? today : yesterday;
      const storeView = storeViews[Math.floor(Math.random() * storeViews.length)];
      const customerGroup = customerGroups[Math.floor(Math.random() * customerGroups.length)];
      const amount = Math.floor(Math.random() * 10000) / 100; // Random amount between 0-100
      const status = possibleStatuses[Math.floor(Math.random() * possibleStatuses.length)];
      
      // Only include orders with the selected statuses
      if (orderStatuses.includes(status)) {
        sampleOrders.push({
          increment_id: `10000${Math.floor(Math.random() * 1000)}`,
          created_at: orderDate.toISOString(),
          customer_email: `customer${i}@example.com`,
          customer_name: `Customer ${i}`,
          grand_total: amount,
          store_view: storeView,
          customer_group: customerGroup,
          status: status
        });
      }
    }
    
    console.log(`Generated ${sampleOrders.length} sample orders with statuses: ${orderStatuses.join(', ')}`);
    return sampleOrders;
    
  } catch (error) {
    console.error(`Error fetching data from Magento API: ${error.message}`);
    throw error;
  }
}

// Function to fetch and store product data including images
export async function fetchAndStoreProductData(connection: MagentoConnection, storeId: string, supabase: any) {
  try {
    console.log(`Fetching product data for store ${connection.store_name}`);
    
    // In a real implementation, this would be an actual API call to Magento
    // For demonstration, we'll simulate fetching products with image URLs
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
    
    // Generate sample product data
    const sampleProducts = [];
    const productTypes = ['simple', 'configurable', 'bundle', 'virtual'];
    const productStatuses = ['enabled', 'disabled'];
    const storeViews = ['dk', 'se', 'no', 'fi'];
    const productCount = Math.floor(Math.random() * 10) + 5; // 5-15 products
    
    // Sample image URLs (in real implementation, these would come from Magento)
    const sampleImageUrls = [
      'https://example.com/images/product1.jpg',
      'https://example.com/images/product2.jpg',
      'https://example.com/images/product3.jpg',
      'https://example.com/images/product4.jpg',
      'https://example.com/images/product5.jpg',
      null, // Some products might not have images
    ];
    
    for (let i = 0; i < productCount; i++) {
      const productType = productTypes[Math.floor(Math.random() * productTypes.length)];
      const status = productStatuses[Math.floor(Math.random() * productStatuses.length)];
      const storeView = storeViews[Math.floor(Math.random() * storeViews.length)];
      const price = Math.floor(Math.random() * 10000) / 100; // Random price
      const imageUrl = sampleImageUrls[Math.floor(Math.random() * sampleImageUrls.length)];
      
      sampleProducts.push({
        external_id: `prod-${i + 1000}`,
        sku: `SKU-${1000 + i}`,
        name: `Sample Product ${i + 1}`,
        price: price,
        special_price: Math.random() > 0.7 ? price * 0.8 : null, // 30% chance of special price
        description: `This is a sample ${productType} product for demonstration purposes.`,
        image_url: imageUrl,
        in_stock: Math.random() > 0.2, // 80% chance of being in stock
        status: status,
        type: productType,
        store_view: storeView
      });
    }
    
    console.log(`Generated ${sampleProducts.length} sample products`);
    
    // Store or update each product in the database
    for (const product of sampleProducts) {
      // Check if product already exists (by external_id)
      const { data: existingProduct, error: checkError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('external_id', product.external_id)
        .maybeSingle();
        
      if (checkError) {
        console.error(`Error checking for existing product: ${checkError.message}`);
        continue;
      }
      
      if (existingProduct) {
        // Update existing product
        const { error: updateError } = await supabase
          .from('products')
          .update({
            name: product.name,
            sku: product.sku,
            price: product.price,
            description: product.description,
            image_url: product.image_url, // Store the image URL
            in_stock: product.in_stock,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProduct.id);
          
        if (updateError) {
          console.error(`Error updating product ${product.name}: ${updateError.message}`);
        } else {
          console.log(`Updated product ${product.name}`);
        }
      } else {
        // Insert new product
        const { error: insertError } = await supabase
          .from('products')
          .insert({
            store_id: storeId,
            external_id: product.external_id,
            name: product.name,
            sku: product.sku,
            price: product.price,
            description: product.description,
            image_url: product.image_url, // Store the image URL
            in_stock: product.in_stock
          });
          
        if (insertError) {
          console.error(`Error inserting product ${product.name}: ${insertError.message}`);
        } else {
          console.log(`Inserted product ${product.name}`);
        }
      }
    }
    
    return sampleProducts;
  } catch (error) {
    console.error(`Error fetching/storing product data: ${error.message}`);
    throw error;
  }
}
