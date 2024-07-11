import frappe
from frappe.model.naming import make_autoname
from frappe.utils import nowdate
from frappe import get_doc, session
from frappe.utils import now_datetime

def before_insert(doc, method):
    set_custom_naming_series(doc)
    # if not doc.custom_pl_series:
    #     doc.custom_pl_series = generate_pl_series(doc)
    # set_custom_ex_total(doc)
    # Set the barcode field to the value of custom_pl_series
    # doc.barcode = doc.custom_pl_series
    # doc.custom_cashier = frappe.session.user

def generate_pl_series(doc):
    pos_profile = doc.pos_profile
    custom_series = frappe.db.get_value("POS Profile", pos_profile, "custom_pl_naming_series")
    pos_profile_warehouse = frappe.db.get_value("POS Profile", pos_profile, "warehouse")
    warehouse_abbreviation = frappe.db.get_value("Warehouse", pos_profile_warehouse, "custom_abbreviation")

    if not warehouse_abbreviation:
        warehouse_abbreviation = "DEFAULT"  # Use a default abbreviation if none is found

    series_pattern = f"{warehouse_abbreviation}-PL-.YYYY.-.MM.-.DD.-.######"
    return series_pattern

def set_custom_naming_series(doc):
    
    series_pattern = generate_pl_series(doc)
    
    if series_pattern:
        doc.naming_series = series_pattern
    else:
        # Set a default naming series if none is found in POS Profile
        doc.naming_series = 'POS-INV#-.YYYY.-.MM.-.#####'

def set_custom_ex_total(doc): 
    
    if doc.custom_ex_total:
        doc.grand_total = doc.custom_ex_total
        #doc.total = doc.custom_ex_total
    else:
        doc.grand_total = 00
    

def before_save(doc, method):
    if not doc.name:
        doc.name = make_autoname(doc.naming_series)
    # Set the barcode to the document name
    #doc.barcode = doc.name
    doc.custom_barcode = doc.name


def before_submit(doc, method):
    doc.custom_invoice_series = set_new_custom_naming_series(doc)
    doc.custom_cashier = frappe.session.user
    doc.custom_cashier_name = get_user_full_name(frappe.session.user)  # Set the user's full name
    doc.custom_date_time_posted = now_datetime()  # Set the current date and time
    doc.custom_is_printed = '1'
    
    
def get_user_full_name(user):
    user_doc = frappe.get_doc("User", user)
    return user_doc.full_name
    
def set_new_custom_naming_series(doc):
     # Retrieve the custom naming series for the POS Profile
    pos_profile = doc.pos_profile
    custom_invoice_series = frappe.db.get_value("POS Profile", pos_profile, "custom_naming_series")
    return make_autoname(custom_invoice_series)


@frappe.whitelist()
def export_pos_invoices(invoice_name):
    # Retrieve the POS Invoice document
    invoice = frappe.get_doc('POS Invoice', invoice_name)
    
    # Generate the text content
    content = f"POS Invoice: {invoice.name}\n"
    content += f"Customer: {invoice.customer}\n"
    content += f"Date: {invoice.posting_date}\n"
    content += f"Total: {invoice.grand_total}\n"
    content += "\nItems:\n"
    
    for item in invoice.items:
        content += f" - {item.item_name} ({item.qty} x {item.rate}): {item.amount}\n"
    
    return content

import json
@frappe.whitelist()
def export_multiple_pos_invoices(invoice_names):
    invoice_names = json.loads(invoice_names)  # Parse the JSON string into a list
    content = ""
    for invoice_name in invoice_names:
        # Retrieve the POS Invoice document
        invoice = frappe.get_doc('POS Invoice', invoice_name)
        
        # Append the invoice content
        content += f"POS Invoice: {invoice.custom_invoice_series}\n"
        content += f"Customer: {invoice.customer}\n"
        content += f"Date: {invoice.posting_date}\n"
        content += f"Total: {invoice.grand_total}\n"
        content += "\nItems:\n"
        
        for item in invoice.items:
            content += f" - {item.item_name} ({item.qty} x {item.rate}): {item.amount}\n"
        
        content += "\n---\n\n"

    return content

from frappe import _
@frappe.whitelist()
def get_sales_invoice_payment(parent):
    frappe.flags.ignore_permissions = True  # Ignore permissions
    try:
        records = frappe.get_all(
            'POS Payment Method', 
            filters={'parent': parent},
            fields=['name', 'parent', 'mode_of_payment']  # Specify the fields you want to fetch
        )
        
        return records
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_sales_invoice_payment Error')
        frappe.throw(_("Error occurred while fetching data: {0}").format(str(e)))
    finally:
        frappe.flags.ignore_permissions = False  # Reset the flag

@frappe.whitelist()
def get_sales_invoice_payment_amount(parent):
    frappe.flags.ignore_permissions = True  # Ignore permissions
    try:
        records = frappe.get_all(
            'Sales Invoice Payment', 
            filters={'parent': parent},
            fields=['name', 'parent', 'mode_of_payment', 'amount']  # Specify the fields you want to fetch
        )
        
        return records
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_sales_invoice_payment_amount Error')
        frappe.throw(_("Error occurred while fetching data: {0}").format(str(e)))
    finally:
        frappe.flags.ignore_permissions = False  # Reset the flag
        
@frappe.whitelist()
def get_pos_invoice_items(parent):
    frappe.flags.ignore_permissions = True  # Ignore permissions
    try:
        records = frappe.get_all(
            'POS Invoice Item', 
            filters={'parent': parent},
            fields=['name', 'parent', 'mode_of_payment', 'amount']  # Specify the fields you want to fetch
        )
        
        return records
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_sales_invoice_payment_amount Error')
        frappe.throw(_("Error occurred while fetching data: {0}").format(str(e)))
    finally:
        frappe.flags.ignore_permissions = False  # Reset the flag
        
@frappe.whitelist()
def get_pos_invoice_data(pos_invoice):
    try:
        # Fetch POS Invoice document
        pos_invoice_doc = frappe.get_doc("POS Invoice", pos_invoice)
        return pos_invoice_doc
        
    except Exception as e:
        frappe.log_error(f"Error fetching POS Invoice {pos_invoice}: {e}")
        return None
    

import requests
@frappe.whitelist()
def get_serial_number():
    try:
        response = requests.get('http://localhost:3000/serial-number')
        response.raise_for_status()  # Raise an HTTPError for bad responses (4xx and 5xx)
        serial_number = response.json().get('serialNumber', 'Unknown')
        return {'serialNumber': serial_number}
    except requests.exceptions.RequestException as e:
        # Log the error using Frappe's logger
        error_message = frappe.get_traceback()
        frappe.log_error(error_message, 'Error fetching serial number')
        # Print detailed error message for debugging
        print(f"Error fetching serial number: {error_message}")
        # Raise a Frappe exception to inform the user
        frappe.throw(_('Error fetching serial number: {0}').format(str(e)))
        
        
        
        
@frappe.whitelist()
def increment_print_count(pos_invoice):
    try:
        invoice = frappe.get_doc('POS Invoice', pos_invoice)
        current_printed_no = invoice.custom_printed_no or 0

        # Determine the new print count
        if not invoice.custom_is_printed:
            new_printed_no = 1
        else:
            new_printed_no = current_printed_no + 1

        # Directly update the database
        frappe.db.sql("""
            UPDATE `tabPOS Invoice`
            SET custom_printed_no = %s, custom_is_printed = 1
            WHERE name = %s
        """, (new_printed_no, pos_invoice))
        
        # Commit the transaction
        frappe.db.commit()
        
        return new_printed_no

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'Error incrementing print count')
        frappe.throw(_('Error incrementing print count: {0}').format(str(e)))
