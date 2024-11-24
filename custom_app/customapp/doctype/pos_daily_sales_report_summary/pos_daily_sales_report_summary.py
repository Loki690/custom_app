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
        
@frappe.whitelist()
def get_pos_invoices(pos_profile, from_date, to_date):
    try:
        # SQL query to fetch the required fields
        query = """
            SELECT
                name,
                custom_invoice_series,
                status,
                custom_vatable_sales,
                custom_vat_exempt_sales,
                custom_zero_rated_sales,
                custom_vat_amount,
                total_taxes_and_charges,
                net_total,
                grand_total,
                change_amount,
                custom_pa_name,
                customer,
                is_return,
                return_against,
                custom_date_time_posted
            FROM
                `tabPOS Invoice`
            WHERE
                pos_profile = %s
                AND posting_date BETWEEN %s AND %s
                AND status != 'Draft'
        """
        # Execute the query and get the records
        records = frappe.db.sql(query, (pos_profile, from_date, to_date), as_dict=True)

        # Initialize the total values
        totals = {
            'total_vatable_sales': 0,
            'total_vat_exempt_sales': 0,
            'total_zero_rated_sales': 0,
            'total_vat_amount': 0,
            'total_taxes_and_charges': 0,
            'total_net_total': 0,
            'total_grand_total': 0,
            'total_change_amount': 0
        }
        
        # Loop through the records to calculate the totals
        for record in records:
            totals['total_vatable_sales'] += record.get('custom_vatable_sales', 0)
            totals['total_vat_exempt_sales'] += record.get('custom_vat_exempt_sales', 0)
            totals['total_zero_rated_sales'] += record.get('custom_zero_rated_sales', 0)
            totals['total_vat_amount'] += record.get('custom_vat_amount', 0)
            totals['total_taxes_and_charges'] += record.get('total_taxes_and_charges', 0)
            totals['total_net_total'] += record.get('net_total', 0)
            totals['total_grand_total'] += record.get('grand_total', 0)
            totals['total_change_amount'] += record.get('change_amount', 0)
        
        # Return both the records and the calculated totals
        return {
            'records': records,
            'totals': totals
        }
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_pos_invoices Error')
        frappe.throw(frappe._("Error occurred while fetching data: {0}").format(str(e)))
        
def set_sales_details(doc, totals):
    
    for doc.sales_details in totals:
        doc.sales_details.total_vatable_sales = totals['total_vatable_sales']
        doc.sales_details.total_vat_exempt_sales = totals['total_vat_exempt_sales']
        doc.sales_details.total_zero_rated_sales = totals['total_zero_rated_sales']
        doc.sales_details.total_vat_amount = totals['total_vat_amount']
        doc.sales_details.total_taxes_and_charges = totals['total_taxes_and_charges']
        doc.sales_details.total_net_total = totals['total_net_total']
        doc.sales_details.total_grand_total = totals['total_grand_total']
        doc.sales_details.total_change_amount = totals['total_change_amount']