import frappe
from frappe.model.naming import make_autoname
from frappe.utils import nowdate
from frappe import get_doc, session
from frappe.utils import now_datetime

def before_insert(doc, method):
    set_custom_naming_series(doc)
    for item in doc.items:
        item_tax_template = item.get("item_tax_template")  # Safely get item_tax_template, returns None if missing
        if not item_tax_template:
            item_tax_template = 'Philippines Tax - ADC'
            frappe.db.set_value("POS Invoice Item", item.name, { 
                    "item_tax_template": item_tax_template
                    })
        calculate_vat_fields(doc, item)
    calculate_summary(doc)

def generate_pl_series(doc):
    pos_profile = doc.pos_profile
    custom_series = frappe.db.get_value("POS Profile", pos_profile, "custom_pl_naming_series")
    pos_profile_warehouse = frappe.db.get_value("POS Profile", pos_profile, "warehouse")
    warehouse_abbreviation = frappe.db.get_value("Warehouse", pos_profile_warehouse, "custom_abbreviation")

    if not warehouse_abbreviation:
        warehouse_abbreviation = "DEFAULT"  # Use a default abbreviation if none is found

    series_pattern = f"{warehouse_abbreviation}-.########"
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
    else:
        doc.grand_total = 00
    

def before_save(doc, method):
    if not doc.name:
        doc.name = make_autoname(doc.naming_series)
        
    if not doc.custom_pharmacist_assistant:
        doc.custom_pharmacist_assistant = frappe.session.user
        doc.custom_pa_name = get_user_full_name(doc.custom_pharmacist_assistant)
        
    doc.custom_barcode = doc.name
    excluded_customer_groups = ['Senior Citizen', 'PWD', 'Government', 'Corporate']
    for item in doc.items:
        if item.discount_amount > 0 or doc.customer_group in excluded_customer_groups:
            item.custom_amesco_plus_points = 0
        else:
            # Calculate Amesco Plus points if payment mode is 'Credit Card'
            amesco_points = calculate_amesco_plus_points(item.amount, doc.payments)
            if amesco_points:
                item.custom_amesco_plus_points = amesco_points
                
def calculate_amesco_plus_points(amount, payments):
    """Calculate Amesco Plus points based on the payment method and amount."""
    
    # Check if the payment mode is 'Credit Card' and the amount is greater than 0
    mode_of_payment = ["Credit Card", "Wire Transfer", "Bank Draft", "Debit Card", "Cards", "QR Payment"]
    for payment in payments:
        if payment.mode_of_payment in mode_of_payment and payment.amount > 0:
            return (amount / 200) * 0.75
        elif payment.mode_of_payment == "Charge" and payment.amount > 0:
            return 0
    # Return the default value if the payment mode is not in the specified list
    return (amount / 200)

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
    invoices = []

    # Retrieve and sort invoices by custom_invoice_series
    for invoice_name in invoice_names:
        # Retrieve the POS Invoice document
        invoice = frappe.get_doc('POS Invoice', invoice_name)
        invoices.append(invoice)

    # Sort invoices by custom_invoice_series in ascending order
    invoices = sorted(invoices, key=lambda x: x.custom_invoice_series)

    content = ""
    for invoice in invoices:
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
        
        
@frappe.whitelist()   
def pos_opening_validation(doc, method):
    # Check if there is already an open POS Opening Entry for the given pos_profile
    open_pos_entries = frappe.get_all("POS Opening Entry", 
        filters={
            "pos_profile": doc.pos_profile,
            "status": "Open",
            "docstatus": 1
            },
            fields=["name"])

    if open_pos_entries:
        frappe.throw(_("There is already an open POS Opening Entry for the POS Profile {0}. Please close it before opening a new one.").format(doc.pos_profile))
        
        
        
from frappe.utils import get_files_path

@frappe.whitelist()
def export_pos_invoices_as_txt():
    try:
        content = ""

        # Fetch all POS Profiles
        pos_profiles = frappe.get_all('POS Profile', fields=['name'])

        # Loop through each POS Profile
        for profile in pos_profiles:
            # Fetch all submitted POS Invoices for the current profile
            pos_invoices = frappe.get_all('POS Invoice', filters={
                'pos_profile': profile.name,
                'docstatus': 1
            }, fields=['name', 'customer', 'posting_date', 'grand_total', 'custom_invoice_series'])

            # Loop through each POS Invoice and format the content
            for invoice in pos_invoices:
                invoice_doc = frappe.get_doc('POS Invoice', invoice.name)
                content += f"POS Invoice: {invoice_doc.custom_invoice_series}\n"
                content += f"Customer: {invoice_doc.customer}\n"
                content += f"Date: {invoice_doc.posting_date}\n"
                content += f"Total: {invoice_doc.grand_total}\n"
                content += "\nItems:\n"

                for item in invoice_doc.items:
                    content += f" - {item.item_name} ({item.qty} x {item.rate}): {item.amount}\n"

                content += "\n---\n\n"

        # Save the content as a text file
        file_path = get_files_path('POS_Invoices.txt')
        with open(file_path, 'w') as file:
            file.write(content)
        return file_path
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Error exporting POS invoices as text file"))
        frappe.throw(_("An error occurred while exporting POS invoices: {0}").format(str(e)))
    
def validate(doc, method):
    # Check if the document is a return and the customer is set to 'Cash'
    default_company = frappe.defaults.get_defaults().get("company")
    company_customer_return = frappe.get_value("Company", default_company, "custom_return_customer_exclude")
    
    if doc.return_against and doc.customer == company_customer_return:
        frappe.throw(frappe._("Please change the customer from {0} to the actual customer's name before saving.").format(company_customer_return))
    
    # Check if the customer field is empty
    if not doc.customer:  # Check if the customer field is empty or None
        frappe.throw(frappe._("Customer cannot be empty. Please specify the actual customer's name before saving."))
def calculate_summary(doc):
    total_vatable = 0
    total_vat_exempt = 0
    total_zero_rated = 0  # Total for zero-rated sales

    # Loop through each item in the 'items' table
    for item in doc.items:
        if doc.customer_group == 'Zero Rated':
            total_zero_rated += item.custom_zero_rated_amount or item.amount or 0
        else:
            if item.item_tax_template == 'Philippines Tax - ADC':
                total_vatable += item.custom_vatable_amount or 0
            elif item.item_tax_template == 'Philippines Tax Exempt - ADC':
                total_vat_exempt += item.custom_vat_exempt_amount or 0

    # Make sure total amounts are negative if this is a return
    if doc.is_return:
        total_vatable = -abs(total_vatable)
        total_vat_exempt = -abs(total_vat_exempt)
        total_zero_rated = -abs(total_zero_rated)

    # Set the calculated totals to the appropriate summary fields
    doc.custom_vatable_sales = round(total_vatable, 2)
    doc.custom_vat_exempt_sales = round(total_vat_exempt, 2)
    if doc.customer_group == 'Zero Rated':
        doc.custom_zero_rated_sales = round(total_zero_rated, 2)
        
    validate_discrepancy(doc)
        
def calculate_vat_fields(doc, item):
    # If customer group is Zero Rated, all items should be VAT Exempt
    if doc.customer_group == 'Zero Rated':
        set_zero_rated_amount(doc, item)
    else:
        # Check the tax template and calculate VAT or VAT-exempt accordingly
        if item.item_tax_template == 'Philippines Tax - ADC':
            set_vat_vatable_amount(doc, item)
        elif item.item_tax_template == 'Philippines Tax Exempt - ADC':
            set_vat_exempt_amount(doc, item)
            
def set_vat_vatable_amount(doc, item):
    # Calculate the amount after applying discount percentage
    amount = item.net_amount
    if doc.is_return:
        amount = -amount
        
    item.custom_vatable_amount = amount
    
def set_vat_exempt_amount(doc, item):
    amount = item.net_amount
    if doc.is_return:
        amount = -amount
    item.custom_vat_exempt_amount = amount

def set_zero_rated_amount(doc, item):
    amount = item.net_amount
    if doc.is_return:
        amount = -amount
    item.custom_zero_rated_amount = amount

def validate_discrepancy(doc):
    total_sales = (
        doc.custom_vatable_sales +
        doc.custom_vat_exempt_sales +
        doc.custom_zero_rated_sales +
        doc.total_taxes_and_charges
    )
    discrepancy = doc.grand_total - total_sales
    if abs(discrepancy) <= 0.01:
        if discrepancy > 0:
            doc.custom_vatable_sales += discrepancy
        else:
            doc.custom_vatable_sales -= abs(discrepancy)