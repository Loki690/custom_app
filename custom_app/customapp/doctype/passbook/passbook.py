# Copyright (c) 2024, joncsr and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


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

    pass
