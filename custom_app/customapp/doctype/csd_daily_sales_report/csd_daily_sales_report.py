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

@frappe.whitelist()
def get_payments_sales_invoice(reference_name):
    """
    Retrieve the payment entry and its corresponding Payment Entry Reference details
    based on the payment entry name and reference name.
    
    :param payment_name: The name of the payment entry.
    :param reference_name: The reference name in the Payment Entry Reference.
    :return: Payment Entry and Payment Entry Reference details.
    """
    try:
        # Define the query using Frappe ORM
        result = frappe.db.sql("""
            SELECT 
                pe.name AS payment_entry_name,
                pe.posting_date,
                pe.party_type,
                pe.party,
                pe.paid_amount,
                per.reference_name,
                per.reference_doctype,
                per.allocated_amount,
                pe.mode_of_payment
            FROM 
                `tabPayment Entry` pe
            JOIN 
                `tabPayment Entry Reference` per ON pe.name = per.parent
            WHERE 
                per.reference_name = %s
        """, (reference_name), as_dict=True)

        # Return the result
        return result

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), frappe._("Error fetching payment entry details"))
        frappe.throw(frappe._("An error occurred while fetching payment entry details: {0}").format(str(e))) 

