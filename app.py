from flask import Flask, jsonify, request
import pyodbc # type: ignore
import json

app = Flask(__name__)

data = [
    {"id": 1, "name":"Item 1"},
    {"id": 2, "name":"Item 2"},
]

SERVER = 'studentplanner-db-server.database.windows.net,1433'
DATABASE = 'studentplanner-db'
USERNAME = 'studentplanner-db-admin@studentplanner-db-server'
PASSWORD = 'SweetHome4425'

connectionString = f'DRIVER={{ODBC Driver 18 for SQL Server}};SERVER={SERVER};DATABASE={DATABASE};UID={USERNAME};PWD={PASSWORD}'

class Database:
    def __init__(self, host, user, password, database):
        self.host = host
        self.user = user
        self.password = password
        self.database = database
        self.connection = self.connect_to_database()

    def connect_to_database(self):
        try:
            connection = pyodbc.connect(connectionString)
            return connection
        except Exception as e:
            print(f"Error: {e}")
            return None
    def fetch_data(self,query,params):
        try:
            cursor = self.connection.cursor()
            cursor.execute('''Select * from PlannerUser where email_id=?''', params)
            rows = cursor.fetchall()
            # Get column names
            columns = [column[0] for column in cursor.description]

            # Convert rows to a list of dictionaries
            records = [dict(zip(columns, row)) for row in rows]

            # Convert to JSON
            records_json = json.dumps(records, default=str)  # Use default=str to handle non-serializable data types

            cursor.close()
            return records
        except Exception as e:
            print(f"Error: {e}")
            return None
    def close_connection(self):
        if self.connection:
            self.connection.close()
            print("Connection Closed !!")    

db = Database(host='studentplanner-db-server.database.windows.net', user='studentplanner-db-admin@studentplanner-db-server', password='SweetHome4425', database='studentplanner-db')
                        

@app.route('/api/getusertype', methods=['GET'])
def get_usertype():
    query = "'''Select * from PlannerUser where email_id=?'''"
    params = ('omplays3889@gmail.com',)
    results = db.fetch_data(query, params)
    return jsonify(results)



if __name__ == '__main__':
    app.run(debug=True)    