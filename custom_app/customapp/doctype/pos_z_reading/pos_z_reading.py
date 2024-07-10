# Copyright (c) 2024, joncsr and contributors
# For license information, please see license.txt

# import frappe
import frappe
from frappe.model.document import Document

class POSZReading(Document):
    pass

def on_submit(doc, method):
    update_pos_profile_last_z_reading(doc)

def update_pos_profile_last_z_reading(doc):
        # Fetch the POS Profile document
        pos_profile_doc = frappe.get_doc('POS Profile', doc.pos_profile)
        # Update the custom_last_z_reading field with the date_to value
        pos_profile_doc.custom_last_z_reading = doc.date_to
        # Save the changes
        pos_profile_doc.save()
