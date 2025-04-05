
import os
from supabase import create_client

# Supabase project details
SUPABASE_URL = "https://vlkcnndgtarduplyedyp.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsa2NubmRndGFyZHVwbHllZHlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyNDY0ODYsImV4cCI6MjA1MTgyMjQ4Nn0.jr1HnmnBjlyabBUafz6gFpjpjGrYMq4E3XckB0XCovE"

# Initialize the Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def test_db_connection():
    """Test basic database connectivity"""
    print("Testing basic Supabase connection...")
    
    try:
        # Simple query to fetch a single record
        response = supabase.table('transactions').select('id').limit(1).execute()
        
        # Print the full response for debugging
        print("Response:", response)
        
        # Check if data exists
        data = response.data
        print(f"Data: {data}")
        
        if data is not None:
            print("✅ Successfully connected to Supabase and retrieved data!")
            return True
        else:
            print("❌ Connected, but no data returned (table might be empty)")
            return False
            
    except Exception as e:
        print(f"❌ Error connecting to Supabase: {str(e)}")
        return False

def test_connection_details():
    """Test detailed connection information"""
    print("\nTesting detailed connection information...")
    
    try:
        # Try getting the server version to verify connection works
        response = supabase.rpc('version').execute()
        print(f"Database version info: {response}")
        print("✅ Successfully retrieved database version!")
        return True
            
    except Exception as e:
        print(f"❌ Error getting database details: {str(e)}")
        return False

def test_transaction_count():
    """Test getting transaction count"""
    print("\nTesting transaction count...")
    
    try:
        # Count query 
        response = supabase.table('transactions').select('*', count='exact').limit(0).execute()
        
        # Check if count exists
        count = response.count
        print(f"Transaction count: {count}")
        
        print("✅ Successfully retrieved transaction count!")
        return True
            
    except Exception as e:
        print(f"❌ Error getting transaction count: {str(e)}")
        return False

def test_table_structure():
    """Test querying the table structure"""
    print("\nTesting table structure...")
    
    try:
        # Information schema query to see column definitions
        # Note: This requires higher privileges and might not work with anon key
        response = supabase.from('information_schema.columns').select('*').eq('table_name', 'transactions').execute()
        
        # Check response
        data = response.data
        if data:
            print(f"Column information: {data}")
            print("✅ Successfully retrieved table structure!")
        else:
            print("No column information returned (might need higher privileges)")
        return True
            
    except Exception as e:
        print(f"❌ Error querying table structure: {str(e)}")
        return False

def test_fetch_transactions():
    """Test fetching transactions with filters"""
    print("\nTesting transaction fetching with filters...")
    
    try:
        # Sample date range
        from_date = "2023-01-01"
        to_date = "2025-01-01"
        
        # Build query with filters
        query = supabase.table('transactions')
        
        # Apply date filters
        query = query.gte('transaction_date', from_date)
        query = query.lte('transaction_date', to_date)
        
        # Execute query
        response = query.execute()
        
        # Print results
        data = response.data
        print(f"Retrieved {len(data)} transactions")
        
        # Print first transaction if available
        if data and len(data) > 0:
            print("First transaction:", data[0])
            print("✅ Successfully retrieved filtered transactions!")
            return True
        else:
            print("No transactions found in date range (might be empty data)")
            return True
            
    except Exception as e:
        print(f"❌ Error fetching transactions: {str(e)}")
        return False

if __name__ == "__main__":
    print("===== SUPABASE CONNECTION TEST =====")
    print(f"Testing connection to: {SUPABASE_URL}")
    test_db_connection()
    test_connection_details()
    test_transaction_count()
    test_table_structure()
    test_fetch_transactions()
    print("===================================")
