# Copyright (c) 2024, joncsr and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
# from custom_app.customapp.doctype.cash_count_denomination_entry.cash_count_denomination_entry import update_cash_count_passbook

class Passbook(Document):
	pass

@frappe.whitelist()
def update_cash_count_match_table(name, amount, cashier, shift, passbook_entry):

    try:
        # Fetch the Cash Count Denomination Entry document
        cash_count_doc = frappe.get_doc('Passbook', passbook_entry)
        # cash_count_doc.cash_count_match = []
        cash_count_doc.has_match = 1
        cash_count_doc.append('cash_count_match', {
            'cash_count': name,
            'amount': amount,
            'cashier_name': cashier,
            'shift': shift,
        })
        
        # Save the updated document
        cash_count_doc.save()
        frappe.db.commit()
        return {'status': 'success', 'message': 'Cash Count Denomination Entry updated successfully.'}
    
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'Cash Count Match Table Update Error')
        return {'status': 'error', 'message': f'Failed to update: {str(e)}'}

@frappe.whitelist()
def unmatched_passbook(name):
    try:
        passbook = frappe.get_doc("Passbook", name)  # Fetch the passbook document
        
        # Update the passbook document
        passbook.has_match = 0
        for entry in passbook.cash_count_match:
            unmatched_cashcount(entry.cash_count)
        passbook.cash_count_match = []
        passbook.save()
        frappe.db.commit()
        
        return {'status': 'success', 'message': 'Passbook updated successfully.'}
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'Unmatched Passbook Error')
        return {'status': 'error', 'message': f'Failed to update passbook: {str(e)}'}

def unmatched_cashcount(name):
    try:
        cash_count = frappe.get_doc("Cash Count Denomination Entry", name)  # Fetch the cash count document
        cash_count.custom_match_passbook = ""
        cash_count.save()
        frappe.db.commit()
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'Unmatched Cash Count Error')
        return {'status': 'error', 'message': f'Failed to update cash count: {str(e)}'}
