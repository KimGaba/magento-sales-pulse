import { MagentoConnection } from "../_shared/database_types.ts";

// Function to fetch orders from Magento API
export async function fetchMagentoOrdersData(connection: MagentoConnection, page = 1, pageSize = 100) {
  try {
    console.log(`📦 Fetching Magento orders from ${connection.store_url}, page ${page}`);
    const url = `${connection.store_url}/rest/V1/orders?searchCriteria[pageSize]=${pageSize}&searchCriteria[currentPage]=${page}`;

    const headers = {
      'Authorization': `Bearer ${connection.access_token}`,
      'Content-Type': 'application/json'
    };

    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Magento API error (${response.status}): ${errorText}`);
      throw new Error(`Failed to fetch orders: ${response.statusText}`);
    }

    const data = await response.json();
    const orders = data.items || [];
    return {
      orders: orders.map((order: any) => ({
        external_id: order.increment_id,
        transaction_date: order.created_at,
        amount: parseFloat(order.grand_total),
        customer_id: order.customer_email,
        customer_name: order.customer_firstname ? `${order.customer_firstname} ${order.customer_lastname || ''}` : 'Guest Customer',
        store_view: order.store_id || 'default',
        customer_group: order.customer_group_id?.toString() || 'none',
        status: order.status,
        items: order.items?.length || 0,
        order_data: {
          payment_method: order.payment?.method || 'unknown',
          shipping_method: order.shipping_description || 'unknown'
        }
      })),
      totalCount: data.total_count || orders.length
    };
  } catch (error) {
    console.error(`❌ Error fetching Magento orders: ${error.message}`);
    throw error;
  }
}

export async function mockMagentoOrdersData() {
  const storeViews = ['dk', 'se', 'no', 'fi'];
  const customerGroups = ['retail', 'wholesale', 'vip'];
  const statuses = ['pending', 'processing', 'complete', 'canceled'];
  const payments = ['paypal', 'checkmo', 'banktransfer'];
  const shippings = ['GLS', 'Bring', 'PostNord'];

  const orders = Array.from({ length: 20 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      external_id: `mock-${i + 1}`,
      transaction_date: date.toISOString(),
      amount: 100 + i * 10,
      customer_id: `mock${i}@example.com`,
      customer_name: `Mock Customer ${i}`,
      store_view: storeViews[i % storeViews.length],
      customer_group: customerGroups[i % customerGroups.length],
      status: statuses[i % statuses.length],
      items: i % 5 + 1,
      order_data: {
        payment_method: payments[i % payments.length],
        shipping_method: shippings[i % shippings.length]
      }
    };
  });

  console.log(`🔧 Generated ${orders.length} mock orders`);
  return orders;
}

export async function fetchMagentoSalesData(connection: MagentoConnection, orderStatuses: string[]) {
  await new Promise(resolve => setTimeout(resolve, 1000));

  const statuses = ['pending', 'processing', 'complete', 'canceled'];
  const orders = Array.from({ length: 10 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const status = statuses[i % statuses.length];

    if (!orderStatuses.includes(status)) return null;

    return {
      increment_id: `sample-${i}`,
      created_at: date.toISOString(),
      customer_email: `sample${i}@example.com`,
      customer_name: `Sample ${i}`,
      grand_total: 100 + i * 5,
      store_view: 'dk',
      customer_group: 'retail',
      status
    };
  }).filter(Boolean);

  return orders;
}

export async function fetchAndStoreProductData(connection: MagentoConnection, storeId: string, supabase: any) {
  await new Promise(resolve => setTimeout(resolve, 800));

  const products = Array.from({ length: 10 }, (_, i) => ({
    external_id: `prod-${i}`,
    sku: `SKU-${i}`,
    name: `Product ${i}`,
    price: 100 + i * 10,
    special_price: i % 2 === 0 ? 90 + i * 5 : null,
    description: `Product description for item ${i}`,
    image_url: `https://via.placeholder.com/150?text=Product+${i}`,
    in_stock: true,
    status: 'enabled',
    type: 'simple',
    store_view: 'default'
  }));

  for (const product of products) {
    const { data: existing, error: fetchErr } = await supabase.from('products').select('*').eq('store_id', storeId).eq('external_id', product.external_id).maybeSingle();

    if (fetchErr) {
      console.error(`Error fetching product: ${fetchErr.message}`);
      continue;
    }

    if (existing) {
      await supabase.from('products').update({
        ...product,
        updated_at: new Date().toISOString()
      }).eq('id', existing.id);
    } else {
      await supabase.from('products').insert({
        ...product,
        store_id: storeId
      });
    }
  }

  return products;
}
