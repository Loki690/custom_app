# Copyright (c) 2024, joncsr and contributors
# For license information, please see license.txt

# import frappe
import frappe
from frappe.model.document import Document

class POSZReading(Document):
    pass

def on_submit(doc, method):
    update_pos_profile_last_z_reading(doc)

def update_pos_profile_last_z_reading(doc):
        pos_profile_doc = frappe.get_doc('POS Profile', doc.pos_profile)
        pos_profile_doc.custom_last_z_reading = doc.date_to
        pos_profile_doc.custom_old_accumulated_sales = pos_profile_doc.custom_old_accumulated_sales + doc.net_sales
        pos_profile_doc.save()
        
        
def before_insert(doc, method):
    total_items_count = 0  # Initialize a counter for the total items
    
    for transaction in doc.confirmed_transaction:
        pos_invoice = get_pos_invoice(transaction.pos_trasaction)
        if pos_invoice:
            # Fetch the POS Invoice items related to the invoice
            pos_invoice_items = get_pos_invoice_items(pos_invoice[0].name)
            # Count the number of items and add to the total count
            total_items_count += len(pos_invoice_items)
    
    doc.confirmed_transaction_item_total = total_items_count
    
def get_pos_invoice(invoice):
    try:
        record = frappe.get_all(
            'POS Invoice', 
            filters={'custom_invoice_series': invoice},
            fields=['name']
        )
        
        return record
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_pos_invoice Error')
        frappe.throw(frappe._("Error occurred while fetching data: {0}").format(str(e)))

@frappe.whitelist()
def get_pos_invoice_items(parent):
    frappe.flags.ignore_permissions = True 
    try:
        records = frappe.get_all(
            'POS Invoice Item', 
            filters={'parent': parent},
            fields=['name', 'parent', 'net_amount', 'amount']  # Specify the fields you want to fetch
        )
        
        return records
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_pos_invoice_items Error')
        frappe.throw(frappe._("Error occurred while fetching data: {0}").format(str(e)))
    finally:
        frappe.flags.ignore_permissions = False  # Reset the flag
        
@frappe.whitelist()
def get_pos_invoice_details(parent):
    frappe.flags.ignore_permissions = True 
    try:
        # Fetching POS Invoice Items
        invoice_items = frappe.get_all(
            'POS Invoice Item', 
            filters={'parent': parent},
            fields=['name', 'parent', 'net_amount', 'amount']  # Specify the fields you want to fetch
        )
        
        # Fetching Sales Invoice Payments
        payments = frappe.get_all(
            'Sales Invoice Payment', 
           filters={
                'parent': parent,
                # 'amount': ['>', 0]  # Filter to only include payments with amount > 0
            },
            fields=['name', 'parent', 'mode_of_payment', 'amount']  # Specify the fields you want to fetch
        )
        
        # Prepare the combined result
        result = {
            "invoice_items": invoice_items,
            "payments": payments
        }
        
        return result
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_pos_invoice_details Error')
        frappe.throw(frappe._("Error occurred while fetching data: {0}").format(str(e)))
    finally:
        frappe.flags.ignore_permissions = False  # Reset the flag

