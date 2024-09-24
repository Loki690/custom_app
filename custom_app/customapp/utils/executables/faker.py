import frappe
from faker import Faker
from frappe.utils import flt
from datetime import date
import random

def generate_fake_passbook_entries(count=100):
    """
    Generate fake Passbook entries using Faker library
    """
    fake = Faker()
    passbook_entries = []
    banks = ["Philippine National Bank (SA)", 
             "Security Bank Corporation (QR)", 
             "Philippine National Bank (CA)", 
             "Union Bank Of The Philippines", 
             "Rizal Commercial Banking Corp"]

    for _ in range(count):
        # Create fake data for the Passbook entry
        entry = frappe.get_doc({
            "doctype": "Passbook",
            "date": fake.date_between(start_date=date(2023, 9, 1), end_date=date(2023, 9, 30)),
            "bank": random.choice(banks),
            "amount": flt(fake.random_number(digits=5, fix_len=False)), 
        })

        # Insert the fake entry into the Passbook doctype
        entry.insert(ignore_permissions=True)
        passbook_entries.append(entry.name)
    
    frappe.db.commit()

    return f"Generated {count} fake Passbook entries."


def delete_random_passbook_entries(count=50):
    """
    Deletes random Passbook entries.
    """
    try:
        passbook_entries = frappe.get_all('Passbook', fields=['name'])
        if len(passbook_entries) < count:
            count = len(passbook_entries)
        random_entries = random.sample(passbook_entries, count)
        for entry in random_entries:
            frappe.delete_doc('Passbook', entry.name, force=1, ignore_permissions=True)
        frappe.db.commit()
        return f"Deleted {count} random Passbook entries."
    except Exception as e:
        frappe.logger().error(f"Error deleting random Passbook entries: {str(e)}")
        return f"Failed to delete entries: {str(e)}"

