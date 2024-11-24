import frappe
from frappe.model.naming import make_autoname
from frappe.utils import nowdate
from frappe import get_doc, session
from frappe.utils import now_datetime

def before_save(doc, method):
    validate(doc)
    
def validate(self):
    # Conditional logic for setting price list and tax category based on customer group
    if self.customer_group == 'Senior Citizen' or self.customer_group == 'PWD':
        self.default_price_list = "Senior Citizen Selling"
        self.tax_category = "Senior"
    elif self.customer_group == "Zero Rated":
        self.default_price_list = "Zero Rated Selling"
        self.tax_category = "Zero Rated"


    