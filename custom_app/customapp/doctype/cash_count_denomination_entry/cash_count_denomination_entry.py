# Copyright (c) 2024, joncsr and contributors
# For license information, please see license.txt


import frappe
from frappe.model.document import Document
from custom_app.customapp.utils.password import confirm_user_acc_user_password
from custom_app.customapp.doctype.passbook.passbook import update_cash_count_match_table


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
        new_entry.custom_check_sales = doc.custom_check_sales
        new_entry.custom_total_cashcheck_sales = doc.custom_total_cash_and_check_sales
        new_entry.custom_cash_check_voucher = doc.custom_cash_and_check_voucher
        new_entry.custom_sales_return = doc.custom_sales_return
        new_entry.custom_card_sales = doc.custom_card_sales
        new_entry.custom_qr_sales = doc.custom_qr_sales
        new_entry.custom_date =  doc.posting_date
        new_entry.custom_gift_certificate = doc.custom_gift_certificate
        
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
        frappe.throw(frappe._("Error occurred while fetching data: {0}").format(str(e)))
    finally:
        frappe.flags.ignore_permissions = False  # Reset the flag
        
@frappe.whitelist()
def update_cash_count_passbook(doc_id, passbook_entry):
    try:
        cash_count_doc = frappe.get_doc('Cash Count Denomination Entry', doc_id)
        cash_count_doc.custom_match_passbook = passbook_entry
        cash_count_doc.save()
        frappe.db.commit()
        return {
            'status': 'success',
            'message': 'Cash Count Denomination Entry updated successfully.',
            'doc_id': doc_id,
            'custom_match_passbook': passbook_entry
        }
        
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'Cash Count Denomination Entry Update Error')
        return {
            'status': 'error',
            'message': f'Failed to update Cash Count Denomination Entry: {str(e)}',
        }
        
@frappe.whitelist()
def update_cash_count_passbook_by_tags(doc_id, passbook_entry, tags):
    try:
        
        modified_tags = tags.replace(',', '').replace(' ', '')
        cash_count_docs = frappe.get_all(
            'Cash Count Denomination Entry', 
            filters={
                '_user_tags': ['like', f'%{tags}%']
            }, 
            fields=['name', 'custom_match_passbook', 'custom_cash_count_total']
        )

        if not cash_count_docs:
            return {
                'status': 'error',
                'message': 'No Cash Count Denomination Entries found with the specified tags.'
            }
        
        cash_count_total = 0;
        
        # Calculate the total of custom_cash_count_total for all filtered documents
        for cash_count in cash_count_docs:
            cash_count_total += cash_count.custom_cash_count_total
            
        # Fetch the Passbook documents that match the tags and cash_count_total
        passbook_docs = frappe.get_all(
            'Passbook',
            filters={
            'deposit_ref': ['like', f'%{modified_tags}%'],
            'amount': cash_count_total
            },
            fields=['name', 'amount', 'deposit_ref']
        )

        if not passbook_docs:
            return {
            'status': 'error',
            'message': 'No Passbook entries found with the specified tags and cash count total.'
            }
            
        # Compare the cash count total and tags with passbook_docs data
        matching_passbook = None
        for passbook in passbook_docs:
            if passbook.amount == cash_count_total and modified_tags in passbook.deposit_ref:
                matching_passbook = passbook
                break

        if not matching_passbook:
            return {
            'status': 'error',
            'message': 'No matching Passbook entry found with the specified tags and cash count total.'
            }
            
        # Loop through the filtered results and update the custom_match_passbook field
        for cash_count in cash_count_docs:
            # Fetch the document using the name (ID)
            cash_count_doc = frappe.get_doc('Cash Count Denomination Entry', cash_count.name)
            cash_count_doc.custom_match_passbook = passbook_entry
            update_cash_count_match_table(cash_count.name, 
                                          cash_count_doc.custom_total_cashcheck_sales, 
                                          cash_count_doc.custom_cashier, 
                                          cash_count_doc.custom_shift, 
                                          passbook_entry)
            cash_count_doc.save()

        # Commit the transaction after updating all records
        frappe.db.commit()

        return {
            'status': 'success',
            'message': 'Cash Count Denomination Entry updated successfully.',
            'doc_id': doc_id,
            'custom_match_passbook': passbook_entry
        }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'Cash Count Denomination Entry Update Error')
        return {
            'status': 'error',
            'message': f'Failed to update Cash Count Denomination Entry: {str(e)}',
        }
        
        
@frappe.whitelist()
def get_warehouse_banks(parent):
    frappe.flags.ignore_permissions = True  # Ignore permissions
    try:
        records = frappe.get_all(
            'Branch Banks', 
            filters={'parent': parent},
            fields=['bank', 'parent'] 
        )
        
        return records
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_warehouse_banks Error')
        frappe.throw(frappe._("Error occurred while fetching data: {0}").format(str(e)))
    finally:
        frappe.flags.ignore_permissions = False  # Reset the flag


def after_save(doc, method):
    passbook = doc.name
    cash_count  = doc.cash_count_match[0].cash_count    
    update_cash_count_passbook(cash_count, passbook)