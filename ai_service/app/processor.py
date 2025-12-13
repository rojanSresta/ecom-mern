def search_products(query: str, max_price: float | None = None):
    filters = {}
    if max_price:
        filters["price"] = {"$lte": max_price}
    
    return list(filters), query