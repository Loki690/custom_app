# Copyright (c) 2024, joncsr and contributors
# For license information, please see license.txt

import frappe
from frappe.model.naming import make_autoname
from frappe.model.document import Document


class AmescoGiftCertificate(Document):
	pass

def before_save(doc, method):
    if not doc.code:
        code = "CC-.######"
        doc.code = make_autoname(code)
    doc.barcode = doc.code
    
def update_gift_cert_code(doc, method):
    for payment in doc.payments:
        if payment.mode_of_payment == "Gift Certificate":
            for gift_code in doc.custom_gift_cert_used:
                if(gift_code.code):
                    gift_cert_doc = frappe.get_doc("Amesco Gift Certificate", gift_code.code)
                    gift_cert_doc.is_used = 1
                    gift_cert_doc.redeem_by = doc.customer
                    gift_cert_doc.cashier = doc.custom_cashier_name
                    gift_cert_doc.save()
                    frappe.msgprint(f"Gift Certificate {gift_code.code} has been marked as used.")