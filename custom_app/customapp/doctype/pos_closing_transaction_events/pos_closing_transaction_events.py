# Copyright (c) 2024, joncsr and contributors
# For license information, please see license.txt

# import frappe
import frappe
from frappe import _
from frappe.model.document import Document


class POSClosingTransactionEvents(Document):
    
    pass


@frappe.whitelist()
def get_card_transactions(parent):
    frappe.flags.ignore_permissions = True  # Ignore permissions
    try:
        records = frappe.get_all(
            'Sales Invoice Payment',
            filters={
                'parent': parent,
                'mode_of_payment': 'Cards',  # Add filter for mode_of_payment
                'amount': ['!=', 0]  
                
                
                # Add filter for amount not equal to 0
                     
            },
            fields=['name', 'parent', 'mode_of_payment', 'amount', 'custom_card_name', 'reference_no']  # Specify the fields you want to fetch
        )
        return records
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_card_transactions Error')
        frappe.throw(_("Error occurred while fetching data: {0}").format(str(e)))
    finally:
        frappe.flags.ignore_permissions = False  # Reset the flag
        
@frappe.whitelist()
def get_check_transactions(parent):
    frappe.flags.ignore_permissions = True  # Ignore permissions
    try:
        records = frappe.get_all(
            'Sales Invoice Payment',
            filters={
                'parent': parent,
                'mode_of_payment': 'Cheque',  # Add filter for mode_of_payment
                'amount': ['!=', 0]
                # Add filter for amount not equal to 0
                     
            },
            fields=['name', 'parent', 'mode_of_payment', 'amount', 'custom_name_on_check', 'reference_no']  # Specify the fields you want to fetch
        )
        return records
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_card_transactions Error')
        frappe.throw(_("Error occurred while fetching data: {0}").format(str(e)))
    finally:
        frappe.flags.ignore_permissions = False  # Reset the flag

@frappe.whitelist()
def get_cash_transactions(parent):
    frappe.flags.ignore_permissions = True  # Ignore permissions
    try:
        records = frappe.get_all(
            'Sales Invoice Payment',
            filters={
                'parent': parent,
                'mode_of_payment': 'Cash',  # Add filter for mode_of_payment
                'amount': ['!=', 0]
                # Add filter for amount not equal to 0
                     
            },
            fields=['name', 'parent', 'mode_of_payment', 'amount']  # Specify the fields you want to fetch
        )
        return records
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_card_transactions Error')
        frappe.throw(_("Error occurred while fetching data: {0}").format(str(e)))
    finally:
        frappe.flags.ignore_permissions = False  # Reset the flag