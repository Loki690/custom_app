# Copyright (c) 2024, joncsr and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class CSDDailySalesReport(Document):
	pass


@frappe.whitelist()
def get_sales_invoice_payment(parent):
    frappe.flags.ignore_permissions = True  # Ignore permissions
    try:
        records = frappe.get_all(
            'Payment Entry', 
            filters={'parent': parent},
            fields=['name', 'parent', 'total_allocated_amount', 'paid_amount', 'mode_of_payment']  # Specify the fields you want to fetch
        )
        
        return records
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_sales_invoice_payment Error')
        frappe.throw(frappe._("Error occurred while fetching data: {0}").format(str(e)))
    finally:
        frappe.flags.ignore_permissions = False  # Reset the flag
        
@frappe.whitelist()
def get_sales_invoice_items(parent):
    frappe.flags.ignore_permissions = True  # Ignore permissions
    try:
        records = frappe.get_all(
            'Sales Invoice Item', 
            filters={
                'parent': parent,
                # 'sales_order': ['!=', '']  # Ensure that sales_order is not empty
            },
            fields=['name', 'parent', 'sales_order'],  # Specify the fields you want to fetch
            order_by='name asc'  # Sort the results by the 'name' field in ascending order
        )
        
        return records
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'Error')
        frappe.throw(frappe._("Error occurred while fetching data: {0}").format(str(e)))
    finally:
        frappe.flags.ignore_permissions = False  # Reset the flag


@frappe.whitelist()
def get_daily_sales_cash_report(parent):
    frappe.flags.ignore_permissions = True  # Ignore permissions
    try:
        records = frappe.get_all(
            'CSD Daily Sales Report Detail Table', 
            filters={
                'parent': parent,
                # 'sales_order': ['!=', '']  # Ensure that sales_order is not empty
            },
            fields=['name', 'parent', 'date', 'customer', 'sales_order', 'invoice_type', 'sales_invoice', 'check_detail', 'check_date', 'amount','paid_out' ],  # Specify the fields you want to fetch
            order_by='name asc'  # Sort the results by the 'name' field in ascending order
        )
        
        return records
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'Error')
        frappe.throw(frappe._("Error occurred while fetching data: {0}").format(str(e)))
    finally:
        frappe.flags.ignore_permissions = False  # Reset the flag 

        
