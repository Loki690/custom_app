import frappe
import requests

from custom_app.customapp.doctype.amesco_gift_certificate.amesco_gift_certificate import update_gift_cert_code
@frappe.whitelist()
def get_ai_response():
    url = 'https://amesco-files.loyaltynow.ph/api/MemberPoint'
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for HTTP errors
        data = response.json()
        return data
    except requests.exceptions.RequestException as e:
        frappe.throw(str(e))

import json
from frappe.model.document import Document
from datetime import datetime

def post_member_points(data):
    url = 'https://amesco-files.loyaltynow.ph/api/MemberPoint'
    headers = {'Content-Type': 'application/json'}

    # Add the current timestamp to the data
    data['CreatedDate'] = datetime.now().isoformat()

    try:
        response = requests.post(url, headers=headers, data=json.dumps(data))
        response.raise_for_status()  # Raise an exception for HTTP errors
        return response.json()
    except requests.exceptions.RequestException as e:
        frappe.log_error(message=str(e), title="Error Posting Member Points")
        frappe.throw(str(e))
        
        
def redeem_member_transaction(data):
    url = 'https://amesco-files.loyaltynow.ph/api/MemberTransaction'
    headers = {'Content-Type': 'application/json'}

    # Add the current timestamp to the data
    data['TransactionDate'] = datetime.now().isoformat()

    # Log the data being sent for debugging
    frappe.log_error(message=json.dumps(data, indent=4), title="API Request Data - Redeem Points")

    try:
        # Send the PUT request to the API
        response = requests.put(url, headers=headers, data=json.dumps(data))

        # Handle the HTTP status code
        if response.status_code == 204:
            return {"message": "Success, but no content returned by the API."}
        elif response.status_code == 200:
            return response.json()  # Parse JSON if content is returned
        else:
            response.raise_for_status()  # Raise an exception for HTTP errors
    
    except requests.exceptions.HTTPError as e:
        # Log the exact response content for debugging
        frappe.log_error(message=response.text, title="HTTP Error Response Content")
        frappe.throw(f"HTTP Error: {e} - Response: {response.text}")
    
    except requests.exceptions.RequestException as e:
        frappe.log_error(message=str(e), title="Error Redeeming Member Points")
        frappe.throw(str(e))
        
def return_member_item(user_id, trans_id):
    # Construct the URL with userId and transId
    
    
    url = f'https://amesco-files.loyaltynow.ph/api/MemberPoint/returnitem/{user_id}/{trans_id}'
    headers = {'Content-Type': 'application/json'}

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raise an exception for HTTP errors
        
        # Check if the response has content
        if response.status_code == 204:
            return {"message": "Item returned successfully, no content returned by the API."}
        elif response.status_code == 200 and response.text:
            return response.json()  # Parse JSON if content is returned
        else:
            return {"message": f"Unexpected status code: {response.status_code}"}

    except requests.exceptions.HTTPError as e:
        # Log the exact response content for debugging
        frappe.log_error(message=response.text, title="HTTP Error Response Content")
        frappe.throw(f"HTTP Error: {e} - Response: {response.text}")
    
    except requests.exceptions.RequestException as e:
        frappe.log_error(message=str(e), title="Error Returning Member Item")
        frappe.msgprint(msg=f" {e}", title="Error")
        frappe.throw(str(e))   
        
def on_submit(doc, method):
    # Loop through each item in the POS Invoice
    if doc.custom_amesco_user_id and doc.custom_ameso_user and doc.is_return == 0: 
        for item in doc.items:
              
            data = {
                "UserId": doc.custom_amesco_user_id, 
                "Points": item.custom_amesco_plus_points,
                "Amount": item.amount,
                "Transaction": item.item_name, 
                "TransId": item.name, 
                "User": doc.custom_ameso_user, 
                "Voucher": 'Amesco Plus',
                "ItemCode": item.item_code, 
                "StoreBranch": doc.set_warehouse,  # Assuming the warehouse is the branch
                "awardedby": frappe.session.user 
            }
            # Post the data to the external API for the current item
            # response = post_member_points(data)
            post_member_points(data)
            frappe.msgprint(msg=f"Member Points for item {item.item_code} posted successfully.", title="Success")
            
    redeem_data = {}
    for payment in doc.payments:
        if payment.mode_of_payment == 'Amesco Plus':
            redeem_data = {
                    "userId": payment.custom_am_plus_user_id,  
                    "usedpoints": payment.amount,  
                    "user": payment.custom_am_plus_user_email,
                    "trailLog": payment.custom_am_voucher_code,  
                    "storeBranch": doc.set_warehouse,  
                    "transactionId": payment.name,  
                    "description": "Redemption of points via QR voucher",  
                    "used": True  
                    }
            if redeem_data and redeem_data.get('usedpoints') and redeem_data.get('trailLog'):
                redeem_member_transaction(redeem_data)

                # frappe.msgprint(msg=f"Redemption failed: 'Amesco Plus' {payment.mode_of_payment} payment mode must have a valid amount and voucher code.", title="Error")
            break  # Exit the loop once Amesco Plus is found
    
    # if doc.is_return == 1:
    #     for item in doc.items:
    #         data = {
    #         # Add any required fields here
    #         "remarks": "Item returned due to XYZ reason"
    #         }
    #         return_member_item(doc.custom_amesco_user_id, item.pos_invoice_item)
    #         frappe.msgprint(msg=f"Member Points return successfully. Response", title="Success")

# Link the script to the POS Invoice's on_submit event
def on_submit_pos_invoice(doc, method):
    on_submit(doc, method)
    update_gift_cert_code(doc, method)
