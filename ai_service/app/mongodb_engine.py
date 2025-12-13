import os
from pymongo import MongoClient
import dotenv

dotenv.load_dotenv()

client = MongoClient(os.getenv("MONGO_URI"))
if not client:
    raise Exception("MONGO_URI is not defined")

db_name = os.getenv("MONGO_DB_NAME")
if not db_name:
    raise Exception("MONGO_DB_NAME is not defined")

db = client[db_name]

products_collection = db.get_collection("products")