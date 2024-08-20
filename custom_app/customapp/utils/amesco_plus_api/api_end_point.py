import frappe
import requests
import json
from datetime import datetime

# Helper function for making API requests
class AmescoPlusApiEndPoint:
    def __init__(self):
        self.base_url = 'https://amesco-files.loyaltynow.ph/api/'
        self.headers = {'Content-Type': 'application/json'}

    def make_api_request(self, endpoint, method, data=None):
        url = f'{self.base_url}{endpoint}'

        # Add the current timestamp to the data
        if data:
            data['Timestamp'] = datetime.now().isoformat()

        try:
            if method == 'POST':
                response = requests.post(url, headers=self.headers, data=json.dumps(data))
            elif method == 'PUT':
                response = requests.put(url, headers=self.headers, data=json.dumps(data))
            elif method == 'GET':
                response = requests.get(url, headers=self.headers)

            response.raise_for_status()  # Raise an exception for HTTP errors

            # Handle the response
            if response.status_code in [200, 204]:
                if response.text:
                    return response.json()
                return {"message": "Success, but no content returned by the API."}
            else:
                return {"message": f"Unexpected status code: {response.status_code}"}

        except requests.exceptions.HTTPError as e:
            frappe.log_error(message=response.text, title="HTTP Error Response Content")
            frappe.throw(f"HTTP Error: {e} - Response: {response.text}")
        
        except requests.exceptions.RequestException as e:
            frappe.log_error(message=str(e), title="API Request Error")
            frappe.throw(str(e))

    def post_member_points(self, data):
        endpoint = 'MemberPoint'
        return self.make_api_request(endpoint, 'POST', data)

    def redeem_member_transaction(self, data):
        endpoint = 'MemberTransaction'
        frappe.log_error(message=json.dumps(data, indent=4), title="API Request Data - Redeem Points")
        return self.make_api_request(endpoint, 'PUT', data)

    def return_member_item(self, user_id, trans_id):
        endpoint = f'MemberPoint/returnitem/{user_id}/{trans_id}'
        return self.make_api_request(endpoint, 'GET')


# Usage example
# api = AmescoPlusApiEndPoint()
# response = api.post_member_points(data)
# response = api.redeem_member_transaction(data)
# response = api.return_member_item(user_id, trans_id)