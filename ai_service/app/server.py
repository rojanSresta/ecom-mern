from fastapi import FastAPI
from pydantic import BaseModel # used this model for data validation
from app.mongodb_engine import products_collection

app = FastAPI(title='AI Service')

class QueryRequest(BaseModel):
    query: str
    max_price: float | None = None

@app.post('/search') 
def search_products(data: QueryRequest):
    mongo_query = {}

    if data.max_price:
        mongo_query["price"] = {"$lte": data.max_price}

    if data.query:
        mongo_query["name"] = {"$regex": data.query, "$options": "i"}

    print(type(products_collection))
    products = list(products_collection.find(mongo_query, {"_id": 0}))
    return {"results": products}