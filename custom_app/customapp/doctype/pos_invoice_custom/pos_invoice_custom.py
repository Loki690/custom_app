import frappe
from frappe.model.naming import make_autoname
from frappe.utils import nowdate

def before_insert(doc, method):
    # if not doc.custom_pl_series:
    #     doc.custom_pl_series = generate_pl_series(doc)
    set_custom_naming_series(doc)
    
    # Set the barcode field to the value of custom_pl_series
    # doc.barcode = doc.custom_pl_series

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

def before_save(doc, method):
    if not doc.name:
        doc.name = make_autoname(doc.naming_series)
    # Set the barcode to the document name
    # doc.barcode = doc.name
    doc.custom_barcode = doc.name


def before_submit(doc, method):
    doc.custom_invoice_series = set_new_custom_naming_series(doc)
    doc.is_printed = '1'
    
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