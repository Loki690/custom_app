# Copyright (c) 2024, joncsr and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class WarehouseCustom(Document):
    def validate(self):
        warehouse_name = self.warehouse_name
        if not warehouse_name:
            return

        # Implement your custom abbreviation logic here
        # Example 1: Simple abbreviation based on first few characters
        abbreviation = warehouse_name[:3].upper()

        # Example 2: More complex abbreviation logic using a dictionary
        abbreviation_map = {
            "Central Warehouse": "CW",
            "North Warehouse": "NW",
            # Add more mappings as needed
        }
        abbreviation = abbreviation_map.get(warehouse_name, warehouse_name[:3].upper())

        # Update the custom field with the abbreviation
        self.custom_abbreviation = abbreviation

@frappe.whitelist()
def abbreviate_warehouse_name(warehouse_name):
    """
    Whitelisted function to abbreviate a warehouse name on demand.

    Args:
        warehouse_name (str): The name of the warehouse to abbreviate.

    Returns:
        str: The abbreviated warehouse name.
    """

    # Implement your custom abbreviation logic here (same as validate method)
    abbreviation = warehouse_name[:3].upper()  # Example for simplicity

    return abbreviation

def before_insert(doc, method):
    """
    Server-side hook to automatically abbreviate the warehouse name before insertion.

    Args:
        doc (Document): The document being inserted.
        method (str): The method being called (usually "insert").
    """

    if doc.get("doctype") == "Warehouse":
        warehouse_name = doc.get("warehouse_name")
        if warehouse_name:
            # Call the whitelisted function to get the abbreviation
            abbreviation = abbreviate_warehouse_name(warehouse_name)
            doc.custom_abbreviation = abbreviation
