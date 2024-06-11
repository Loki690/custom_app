import frappe
from frappe.model.document import Document

class POSInvoice(Document):
    def validate(self):
        frappe.msgprint("POS Invoice validated")

def custom_validate(doc, method):
    frappe.msgprint(f"Validating {doc.doctype}: {doc.name}")

def custom_on_submit(doc, method):
    frappe.msgprint(f"Submitting {doc.doctype}: {doc.name}")
