import frappe
from frappe.utils import flt

@frappe.whitelist()
def calculate_vat_for_pos_invoice(invoice_name):
    try:
        invoice = frappe.get_doc("POS Invoice", invoice_name)
        tax_rate = 0.12

        for item in invoice.items:
            qty = item.qty or 1
            rate = item.rate or 0

            if qty == 0 or rate == 0:
                set_vat_fields_to_zero(item)
                continue

            price = rate * qty
            item_doc = frappe.get_doc("Item", item.item_code)
            custom_is_vatable = item_doc.custom_is_vatable

            no_vat = price / (1 + tax_rate)
            vat = price - no_vat
            discounted_price = no_vat

            if item.discount_percentage:
                discount_percentage = item.discount_percentage / 100
                discounted_price = no_vat * (1 - discount_percentage)
            elif item.discount_amount:
                discounted_price = no_vat - item.discount_amount

            if custom_is_vatable:
                if invoice.customer_group == 'Senior Citizen':
                    custom_is_vatable = 0
                elif not item.pricing_rules:
                    custom_is_vatable = 1

            item.custom_is_item_vatable = custom_is_vatable

            if invoice.customer_group == "Zero Rated":
                handle_zero_rated_item(item, discounted_price, vat, price, tax_rate, custom_is_vatable)
            elif invoice.customer_group == "Senior Citizen":
                handle_senior_citizen_item(item, discounted_price, vat, price, tax_rate, custom_is_vatable)
            elif invoice.customer_group == "Regular":
                handle_regular_item(item, discounted_price, vat, price, tax_rate, custom_is_vatable)
            else:
                handle_default_item(item, discounted_price, vat, price, tax_rate, custom_is_vatable)

        update_totals(invoice)

        invoice.save()
        return invoice

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Error calculating VAT for POS Invoice"))
        frappe.throw(frappe._("An error occurred while calculating VAT for POS Invoice: {0}").format(str(e)))

def set_vat_fields_to_zero(item):
    item.custom_vatable_amount = 0
    item.custom_vat_exempt_amount = 0
    item.custom_vat_amount = 0
    item.custom_ex_amount = 0
    item.custom_zero_rated_amount = 0
    item.custom_no_vat = 0

def handle_zero_rated_item(item, discounted_price, vat, price, tax_rate, is_vatable):
    if is_vatable:
        discounted_price = price / (1 + tax_rate)
        vat = price - discounted_price
        item.custom_zero_rated_amount = discounted_price
        item.custom_ex_amount = discounted_price
        item.custom_no_vat = 0
    else:
        item.custom_zero_rated_amount = price
        item.custom_ex_amount = price
        item.custom_no_vat = 0

def handle_senior_citizen_item(item, discounted_price, vat, price, tax_rate, is_vatable):
    if is_vatable:
        discounted_price = price / (1 + tax_rate)
        vat = price - discounted_price

        if item.custom_is_item_vatable == 0:
            item.custom_vat_exempt_amount = discounted_price
        else:
            item.custom_vatable_amount = discounted_price

        item.custom_no_vat = discounted_price
        item.custom_vat_amount = vat
        item.custom_ex_amount = price
    else:
        item.custom_ex_amount = price
        item.custom_vat_exempt_amount = price
        item.custom_no_vat = 0

def handle_regular_item(item, discounted_price, vat, price, tax_rate, is_vatable):
    if is_vatable:
        discounted_price = price / (1 + tax_rate)
        vat = price - discounted_price
        item.custom_vatable_amount = discounted_price
        item.custom_no_vat = discounted_price
        item.custom_vat_amount = vat
        item.custom_ex_amount = price
    else:
        item.custom_ex_amount = price
        item.custom_vat_exempt_amount = price
        item.custom_no_vat = 0

def handle_default_item(item, discounted_price, vat, price, tax_rate, is_vatable):
    if is_vatable:
        discounted_price = price / (1 + tax_rate)
        vat = price - discounted_price
        item.custom_vatable_amount = discounted_price
        item.custom_no_vat = discounted_price
        item.custom_vat_amount = vat
        item.custom_ex_amount = price
    else:
        item.custom_ex_amount = price
        item.custom_vat_exempt_amount = price
        item.custom_no_vat = 0

def update_totals(invoice):
    total_vatable = 0
    total_vat_exempt = 0
    total_vat = 0
    total_ex_amount = 0
    zero_rated_total = 0
    discount_total = 0

    for item in invoice.items:
        total_vatable += flt(item.custom_vatable_amount)
        total_vat_exempt += flt(item.custom_vat_exempt_amount)
        total_vat += flt(item.custom_vat_amount)
        total_ex_amount += flt(item.custom_ex_amount)
        zero_rated_total += flt(item.custom_zero_rated_amount)
        discount_total += flt(item.discount_amount)

    invoice.custom_vatable_sales = total_vatable
    invoice.custom_vat_exempt_sales = total_vat_exempt
    invoice.custom_vat_amount = total_vat
    invoice.custom_ex_total = total_ex_amount
    invoice.custom_zero_rated_sales = zero_rated_total
    invoice.custom_item_discount = discount_total
    invoice.grand_total = total_ex_amount  # Adjust as necessary
