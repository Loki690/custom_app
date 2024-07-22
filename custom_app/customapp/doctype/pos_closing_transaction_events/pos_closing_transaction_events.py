# Copyright (c) 2024, joncsr and contributors
# For license information, please see license.txt

# import frappe
import frappe
from frappe import _
from frappe.model.document import Document


class POSClosingTransactionEvents(Document):
    
    pass


@frappe.whitelist()
def get_card_transactions(parent):
    frappe.flags.ignore_permissions = True  # Ignore permissions
    try:
        records = frappe.get_all(
            'Sales Invoice Payment',
            filters={
                'parent': parent,
                'mode_of_payment': ['in', ['Cards','Debit Card', 'Credit Card']],  # Filter for both Debit Card and Credit Card
                'amount': ['!=', 0]  # Filter for amount not equal to 0
            },
            fields=['name', 'parent', 'custom_bank_name', 'mode_of_payment', 'amount', 'custom_card_name', 'custom_approval_code','reference_no']  # Specify the fields you want to fetch
        )
        return records
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_card_transactions Error')
        frappe.throw(_("Error occurred while fetching data: {0}").format(str(e)))
    finally:
        frappe.flags.ignore_permissions = False  # Reset the flag

@frappe.whitelist()
def get_epayment_transactions(parent):
    frappe.flags.ignore_permissions = True  # Ignore permissions
    try:
        records = frappe.get_all(
            'Sales Invoice Payment',
            filters={
                'parent': parent,
                'mode_of_payment': ['in', ['GCash','PayMaya']],  # Filter for both Debit Card and Credit Card
                'amount': ['!=', 0]  # Filter for amount not equal to 0
            },
            fields=['name', 'parent', 'mode_of_payment','custom_phone_number', 'amount', 'reference_no']  # Specify the fields you want to fetch
        )
        return records
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_card_transactions Error')
        frappe.throw(_("Error occurred while fetching data: {0}").format(str(e)))
    finally:
        frappe.flags.ignore_permissions = False  # Reset the flag


@frappe.whitelist()
def get_check_transactions(parent):
    frappe.flags.ignore_permissions = True  # Ignore permissions
    try:
        records = frappe.get_all(
            'Sales Invoice Payment',
            filters={
                'parent': parent,
                'mode_of_payment': 'Cheque',  # Add filter for mode_of_payment
                'amount': ['!=', 0]
                # Add filter for amount not equal to 0
                     
            },
            fields=['name', 'parent', 'mode_of_payment', 'amount', 'custom_name_on_check', 'custom_check_bank_name','custom_check_number']  # Specify the fields you want to fetch
        )
        return records
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_check_transactions Error')
        frappe.throw(_("Error occurred while fetching data: {0}").format(str(e)))
    finally:
        frappe.flags.ignore_permissions = False  # Reset the flag

@frappe.whitelist()
def get_qr_payment_transactions(parent):
    frappe.flags.ignore_permissions = True  # Ignore permissions
    try:
        records = frappe.get_all(
            'Sales Invoice Payment',
            filters={
                'parent': parent,
                'mode_of_payment': 'QR Payment',  # Add filter for mode_of_payment
                'amount': ['!=', 0]
                # Add filter for amount not equal to 0
                     
            },
            fields=['name', 'parent', 'mode_of_payment', 'amount', 'custom_payment_type', 'custom_bank_type','custom_qr_reference_number']  # Specify the fields you want to fetch
        )
        return records
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_qr_payment_transactions Error')
        frappe.throw(_("Error occurred while fetching data: {0}").format(str(e)))
    finally:
        frappe.flags.ignore_permissions = False  # Reset the flag


@frappe.whitelist()
def get_cash_transactions(parent):
    frappe.flags.ignore_permissions = True  # Ignore permissions
    try:
        records = frappe.get_all(
            'Sales Invoice Payment',
            filters={
                'parent': parent,
                'mode_of_payment': 'Cash',  # Add filter for mode_of_payment
                'amount': ['!=', 0]
                # Add filter for amount not equal to 0
                     
            },
            fields=['name', 'parent', 'mode_of_payment', 'amount']  # Specify the fields you want to fetch
        )
        return records
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'get_cash_transactions( Error')
        frappe.throw(_("Error occurred while fetching data: {0}").format(str(e)))
    finally:
        frappe.flags.ignore_permissions = False  # Reset the flag