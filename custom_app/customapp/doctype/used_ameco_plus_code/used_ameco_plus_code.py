# Copyright (c) 2024, joncsr and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class UsedAmecoPlusCode(Document):
	pass


@frappe.whitelist()
def check_used_amesco_plus_code(code):
    # Query the 'Used Ameco Plus Code' child DocType to check if the code exists and docstatus is 1
    exists = frappe.db.exists({
        "doctype": "Used Ameco Plus Code",
        "code": code,
        "docstatus": 1
    })

    # Return True if the code exists with docstatus 1, otherwise return False
    return True if exists else False

