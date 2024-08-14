# Copyright (c) 2024, joncsr and contributors
# For license information, please see license.txt


import frappe
from frappe.model.document import Document
from custom_app.customapp.utils.password import confirm_user_acc_user_password


class CashCountDenominationEntry(Document):
	pass

def on_submit(doc, method):
    """
    This function is triggered upon the submission of a document.
    It creates a 'Cash Count Denomination Entry' record.
    """
    try:
        create_cash_count_denomination_entry(doc.user, doc.pos_profile, doc.pos_opening_entry, doc.name, doc.custom_shift, doc)
    except frappe.exceptions.ValidationError as e:
        frappe.throw(frappe._("Validation Error: {0}").format(str(e)))
    except Exception as e:
        frappe.throw(frappe._("An error occurred during on_submit: {0}").format(str(e)))

def create_cash_count_denomination_entry(cashier, pos_profile, pos_opening_entry_id, pos_closing_entry_id, shift, doc):

    try:
        new_entry = frappe.new_doc('Cash Count Denomination Entry')
        new_entry.custom_cashier = cashier
        new_entry.custom_pos_profile = pos_profile
        new_entry.custom_pos_opening_entry_id = pos_opening_entry_id
        new_entry.custom_pos_closing_entry_id = pos_closing_entry_id
        new_entry.custom_shift = shift
        new_entry.custom_cash_sales = doc.custom_cash_sales
        new_entry.custom_check_sales = doc.custom_check_sales
        new_entry.custom_total_cashcheck_sales = doc.custom_total_cash_and_check_sales
        new_entry.custom_cash_check_voucher = doc.custom_cash_and_check_voucher
        new_entry.custom_sales_return = doc.custom_sales_return
        
        default_denominations = [
            {"amount": 1000, "name": "1000 PESOS"},
            {"amount": 500, "name": "500 PESOS"},
            {"amount": 200, "name": "200 PESOS"},
            {"amount": 100, "name": "100 PESOS"},
            {"amount": 50, "name": "50 PESOS"},
            {"amount": 20, "name": "20 PESOS"},
            {"amount": 10, "name": "10 PESOS"},
            {"amount": 5, "name": "5 PESOS"},
            {"amount": 1, "name": "1 PESO"},
            {"amount": 0.25, "name": "25 CENTAVOS"},
            {"amount": 0.10, "name": "10 CENTAVOS"},
            {"amount": 0.05, "name": "5 CENTAVOS"}
        ]

        # Loop through the default denominations and add them to the child table
        for denomination in default_denominations:
            child = new_entry.append('custom_cash_count_denomination_table', {})
            child.custom_cash_amount = denomination['amount']
            child.custom_denomination_name = denomination['name']
        # Insert the new document into the database
        new_entry.insert()
        frappe.db.commit()    
        
    except frappe.exceptions.ValidationError as e:
        frappe.throw(frappe._("Validation Error: {0}").format(str(e)))

    except Exception as e:
        frappe.throw(frappe._("An error occurred while creating the document: {0}").format(str(e)))
        
        #bench execute custom_app.customapp.doctype.cash_count_denomination_entry.cash_count_denomination_entry.create_cash_count_denomination_entry --kwargs "{'cashier': 'Administrator', 'pos_profile': 'Toril POS 01', 'pos_opening_entry_id': 'POS-OPE-2024-00091'}"
        

@frappe.whitelist()
def validate_cashier_password(user, password):
    """
    Function to validate the cashier's password.
    """
    return confirm_user_acc_user_password(user, password)


@frappe.whitelist()
def get_pos_closing_invoices(parent):
    frappe.flags.ignore_permissions = True  # Ignore permissions
    try:
        records = frappe.get_all(
            'Invoice Reference', 
            filters={'parent': parent},
            fields=['name', 'parent', 
                    'custom_invoice_series', 
                    'grand_total', 
                    'posting_date']
        )
        
        return records
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_pos_closing_invoices Error')
        frappe.throw(_("Error occurred while fetching data: {0}").format(str(e)))
    finally:
        frappe.flags.ignore_permissions = False  # Reset the flag
