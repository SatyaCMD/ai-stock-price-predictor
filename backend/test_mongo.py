import pymongo

uri = "mongodb+srv://satyacmddeveloper_db_user:KKTiWeUruAFxhfT4@cluster0.xbjonic.mongodb.net/?appName=Cluster0"

try:
    print("Testing connection without additional kwargs...")
    client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=5000)
    print(client.admin.command('ping'))
    print("Success!")
except Exception as e:
    print("Failed 1:", e)

try:
    import certifi
    print("Testing connection with certifi...")
    client2 = pymongo.MongoClient(uri, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
    print(client2.admin.command('ping'))
    print("Success!")
except Exception as e:
    print("Failed 2:", e)

try:
    print("Testing connection with tlsAllowInvalidCertificates=True ...")
    client3 = pymongo.MongoClient(uri, tlsAllowInvalidCertificates=True, serverSelectionTimeoutMS=5000)
    print(client3.admin.command('ping'))
    print("Success!")
except Exception as e:
    print("Failed 3:", e)
