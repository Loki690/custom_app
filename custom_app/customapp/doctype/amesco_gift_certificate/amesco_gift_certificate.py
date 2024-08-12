# Copyright (c) 2024, joncsr and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.naming import make_autoname
from frappe.model.document import Document


class AmescoGiftCertificate(Document):
	pass

def before_save(doc, method):
    if not doc.code:
        code = "CC-.######"
        doc.code = make_autoname(code)
    doc.barcode = doc.code

        
