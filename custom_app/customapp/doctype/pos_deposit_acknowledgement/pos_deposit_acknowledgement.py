# Copyright (c) 2024, joncsr and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class POSDepositAcknowledgement(Document):
	pass


@frappe.whitelist()
def update_printed_deposit(deposit_acknowledgement):
    try:
        # Directly update the database
        frappe.db.sql("""
            UPDATE `tabPOS Deposit Acknowledgement`
            SET printed = 1
            WHERE name = %s
        """, (deposit_acknowledgement))
        
        # Commit the transaction
        frappe.db.commit()
        return True

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'Error updating printed deposit status')
        frappe.throw(frappe._('Error updating printed deposit status: {0}').format(str(e)))
        
        
@frappe.whitelist()
def check_printed_deposit(deposit_acknowledgement):
    try:
        # Directly update the database
        frappe.db.sql("""
            UPDATE `tabPOS Deposit Acknowledgement`
            SET printed = 1
            WHERE name = %s
        """, (deposit_acknowledgement))
        
        # Commit the transaction
        frappe.db.commit()
        return True

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'Error updating printed deposit status')
        frappe.throw(frappe._('Error updating printed deposit status: {0}').format(str(e)))

