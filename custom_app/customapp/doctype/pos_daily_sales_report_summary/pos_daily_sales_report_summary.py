# Copyright (c) 2024, joncsr and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class POSDailySalesReportSummary(Document):
	pass

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

def get_pos_invoice_items(parent):
    frappe.flags.ignore_permissions = True 
    try:
        records = frappe.get_all(
            'POS Invoice Item', 
            filters={'parent': parent},
            fields=['name', 'parent']  # Specify the fields you want to fetch
        )
        
        return records
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_pos_invoice_items Error')
        frappe.throw(frappe._("Error occurred while fetching data: {0}").format(str(e)))
    finally:
        frappe.flags.ignore_permissions = False  # Reset the flag

