
from supabase import create_client

# Supabase project details
SUPABASE_URL = "https://vlkcnndgtarduplyedyp.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsa2NubmRndGFyZHVwbHllZHlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyNDY0ODYsImV4cCI6MjA1MTgyMjQ4Nn0.jr1HnmnBjlyabBUafz6gFpjpjGrYMq4E3XckB0XCovE"

# Initialize the Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def test_db_connection():
    """Test basic database connectivity"""
    response = supabase.table("transactions").select("id").limit(1).execute()
    assert response.data is not None

def test_connection_details():
    """Test detailed connection information"""
    response = supabase.rpc("version").execute()
    assert response is not None

def test_transaction_count():
    """Test getting transaction count"""
    response = (
        supabase.table("transactions")
        .select("*", count="exact")
        .limit(0)
        .execute()
    )
    assert isinstance(response.count, int)

def test_table_structure():
    """Test querying the table structure"""
    response = (
        supabase.table("information_schema.columns")
        .select("*")
        .eq("table_name", "transactions")
        .execute()
    )
    assert response.data is not None

def test_fetch_transactions():
    """Test fetching transactions with filters"""
    from_date = "2023-01-01"
    to_date = "2025-01-01"

    query = supabase.table("transactions")
    query = query.gte("transaction_date", from_date)
    query = query.lte("transaction_date", to_date)

    response = query.execute()
    data = response.data
    assert data is not None

