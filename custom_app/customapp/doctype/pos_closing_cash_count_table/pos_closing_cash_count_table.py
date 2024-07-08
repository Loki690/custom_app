# Copyright (c) 2024, joncsr and contributors
# For license information, please see license.txt

# import frappe
import frappe
from frappe.model.document import Document


class POSClosingCashCountTable(Document):
	pass

@frappe.whitelist()
def get_pos_cash_counts(parent):
    frappe.flags.ignore_permissions = True  # Ignore permissions
    try:
        records = frappe.get_all(
            'Cash Count Denomination', 
            filters={'parent': parent},
            fields=['name', 'parent', 'custom_denomination_name', 'custom_cash_amount', 'quantity', 'total_amount']  # Specify the fields you want to fetch
        )
        
        return records
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_sales_invoice_payment_amount Error')
        frappe.throw(frappe._("Error occurred while fetching data: {0}").format(str(e)))
    finally:
        frappe.flags.ignore_permissions = False  # Reset the flag

