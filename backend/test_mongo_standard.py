import pymongo

uri = "mongodb://satyacmddeveloper_db_user:KKTiWeUruAFxhfT4@ac-bmst5ut-shard-00-00.xbjonic.mongodb.net:27017,ac-bmst5ut-shard-00-01.xbjonic.mongodb.net:27017,ac-bmst5ut-shard-00-02.xbjonic.mongodb.net:27017/?ssl=true&replicaSet=atlas-kjdasb-shard-0&authSource=admin&tlsAllowInvalidCertificates=true"

try:
    print("Testing connection with standard URL...")
    client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000)
    print(client.admin.command('ping'))
    print("Success!")
except Exception as e:
    print("Failed:", e)
