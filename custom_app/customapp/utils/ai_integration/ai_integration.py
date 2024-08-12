import frappe
import requests

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
        
        
        

