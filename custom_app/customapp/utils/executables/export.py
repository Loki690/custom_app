import json
import frappe
from frappe.utils import cint, format_datetime

@frappe.whitelist()
def export_multiple_pos_invoices(from_date, to_date, warehouse):
    """
    Retrieves POS Invoices for a specified warehouse and date range, sorted by custom_invoice_series.
    Returns the details as a text string.
    """
    try:
        # Fetch all POS Invoices within the specified date range and warehouse
        pos_invoices = frappe.get_all('POS Invoice', 
                                      filters={
                                          'posting_date': ['between', [from_date, to_date]],
                                          'set_warehouse': warehouse,  # Assuming 'set_warehouse' stores the warehouse name
                                          'docstatus': 1  # Only consider submitted invoices
                                      },
                                      fields=['name', 'custom_invoice_series'],
                                      order_by='custom_invoice_series asc')

        if not pos_invoices:
            return "No invoices found for the specified criteria."

        content = ""
        processed_series = set()

        for pos_invoice in pos_invoices:
            invoice_name = pos_invoice['name']
            # Retrieve the full document for each invoice
            invoice = frappe.get_doc('POS Invoice', invoice_name)

            # Check if this invoice's series has already been processed
            if invoice.custom_invoice_series in processed_series:
                continue

            # Mark this series as processed
            processed_series.add(invoice.custom_invoice_series)

            # Append the invoice content
            content += f"Status: {invoice.status}\n"
            content += f"Branch: {invoice.set_warehouse}\n"
            content += f"POS Profile: {invoice.pos_profile}\n"
            content += f"POS Invoice: {invoice.custom_invoice_series}\n"
            content += f"Date: {invoice.posting_date}\n"
            content += f"Sold To: {invoice.customer}\n"
            content += f"ID: \n"  # Placeholder for ID field
            content += f"Address: \n"  # Placeholder for Address field
            content += f"TIN#: \n"  # Placeholder for TIN# field
            content += f"Business Type: {invoice.customer_group}\n"
            content += f"Signature: \n"  # Placeholder for Signature field
            content += f"Rewards Card Serial: \n"  # Placeholder for Rewards Card Serial field
            content += f"Points Earned: \n"  # Placeholder for Points Earned field
            content += f"Redeemed Points: \n"  # Placeholder for Redeemed Points field
            content += f"Total Points: \n"  # Placeholder for Total Points field
            content += "PARTICULARS\n\n"

            content += "Items:\n"
            for item in invoice.items:
                content += f" - {item.item_name} ({cint(item.qty)} x {item.rate}): {item.amount}\n"
            
            content += f"\nNo of Items: {invoice.total_qty}\n"
            content += f"Subtotal: {invoice.net_total}\n"
            content += f"AMOUNT DUE: {invoice.grand_total}\n"

            for payment in invoice.payments:
                if payment.amount != 0:
                    content += f"{payment.mode_of_payment}: {payment.amount}\n"

            content += f"TOTAL PAYMENTS: {invoice.paid_amount}\n"
            content += f"CHANGE: {invoice.change_amount}\n"
            
            content += "\nSALES SUMMARY:\n"
            content += f"VATable:  {invoice.custom_vatable_sales}\n"
            content += f"VAT Exempt: {invoice.custom_vat_exempt_sales}\n"
            content += f"Zero Rated: {invoice.custom_zero_rated_sales}\n"
            content += f"VAT 12%: {invoice.total_taxes_and_charges}\n"
                
            content += f"Clerk: {invoice.custom_pa_name}\n"
            content += f"Cashier: {invoice.custom_cashier_name}\n"
            content += f"Printed: {format_datetime(invoice.creation)}\n"
            content += "\n---\n\n"

        return content

    except Exception as e:
        frappe.log_error(f"Error exporting POS invoices: {str(e)}", "POS Invoice Export Error")
        return f"An error occurred while exporting invoices: {str(e)}"

@frappe.whitelist()
def export_multiple_pos_invoices_all_warehouse(from_date, to_date, warehouse=None):
    """
    Retrieves POS Invoices for a specified date range, optionally filtered by warehouse, and sorted by custom_invoice_series.
    Returns the details as a dictionary where keys are warehouse names and values are text strings.
    """
    try:
        # Define filters based on the parameters
        filters = {
            'posting_date': ['between', [from_date, to_date]],
            'docstatus': 1  # Only consider submitted invoices
        }
        if warehouse:
            filters['set_warehouse'] = warehouse

        # Fetch all POS Invoices within the specified date range and warehouse (if provided)
        pos_invoices = frappe.get_all('POS Invoice', 
                                      filters=filters,
                                      fields=['name', 'custom_invoice_series', 'set_warehouse'],
                                      order_by='custom_invoice_series asc')

        if not pos_invoices:
            return {"message": "No invoices found for the specified criteria."}

        # Dictionary to hold the content for each warehouse
        warehouse_contents = {}
        processed_series = set()

        for pos_invoice in pos_invoices:
            invoice_name = pos_invoice['name']
            invoice_warehouse = pos_invoice['set_warehouse']

            # Retrieve the full document for each invoice
            invoice = frappe.get_doc('POS Invoice', invoice_name)

            # Check if this invoice's series has already been processed
            if invoice.custom_invoice_series in processed_series:
                continue

            # Mark this series as processed
            processed_series.add(invoice.custom_invoice_series)

            # Initialize content for the warehouse if not already initialized
            if invoice_warehouse not in warehouse_contents:
                warehouse_contents[invoice_warehouse] = ""

            # Append the invoice content
            content = warehouse_contents[invoice_warehouse]
            company_country = frappe.db.get_value("Company", invoice.company, "country")
            tax_id = frappe.db.get_value("Company", invoice.company, "tax_id")
            customer_osca_id = frappe.db.get_value("Customer", invoice.customer, 'custom_osca_id')
            customer_custom_pwd_id = frappe.db.get_value("Customer", invoice.customer, 'custom_osca_id')
            customer_id = customer_osca_id or customer_custom_pwd_id or ''
            
            content += f"{invoice.company}\n"
            content += f"VAT REG. TIN: {invoice.custom_vat_reg_tin }\n"
            content += f"{invoice.address_display }\n"
            content += f"{invoice.contact_mobile }\n"
            content += f"MIN:{invoice.custom_min},SN:{invoice.custom_sn}\n"
            
            content += f"Status: {invoice.status}\n"
            content += f"Branch: {invoice.set_warehouse}\n"
            content += f"POS Profile: {invoice.pos_profile}\n"
            content += f"POS Invoice: {invoice.custom_invoice_series}\n"
            content += f"Date: {invoice.posting_date}\n"
            content += f"Sold To: {invoice.customer}\n"
            content += f"OSCA/PWD ID: {customer_id} \n"  # Placeholder for ID field
            content += f"Address: \n"  # Placeholder for Address field
            content += f"TIN#: \n"  # Placeholder for TIN# field
            content += f"Business Type: {invoice.customer_group}\n"
            content += f"Signature: \n"  # Placeholder for Signature field
            content += f"Rewards Card Serial: \n"  # Placeholder for Rewards Card Serial field
            content += f"Points Earned: \n"  # Placeholder for Points Earned field
            content += f"Redeemed Points: \n"  # Placeholder for Redeemed Points field
            content += f"Total Points: \n"  # Placeholder for Total Points field
            content += "PARTICULARS\n"

            zero_rated_items = []
            vat_sales_items = []
            vat_exempt_items = []

            for item in invoice.items:
                item_str = ""
                if item.discount_percentage != 0:
                    item_str = f" - {item.item_name} {cint(item.qty)} x {item.rate} {item.discount_percentage}% : {item.amount}\n"
                else:
                    item_str = f" - {item.item_name} {cint(item.qty)} x {item.rate}: {item.amount}\n"

                if invoice.customer_group == "Zero Rated":
                    zero_rated_items.append(item_str)
                else:
                    if item.item_tax_template == 'Philippines Tax - ADC':
                        vat_sales_items.append(item_str)
                    elif item.item_tax_template == 'Philippines Tax Exempt - ADC':
                        if invoice.customer_group == "Senior Citizen" or invoice.customer_group == "PWD":
                            if "L" in item_str:
                                item_str = item_str.replace("L", "LV")
                        vat_exempt_items.append(item_str)

            if zero_rated_items:
                content += "ZERO RATED:\n"
                content += "".join(zero_rated_items)

            if vat_sales_items:
                content += "VAT SALES\n"
                content += "".join(vat_sales_items)

            if vat_exempt_items:
                content += "VAT EXEMPT SALES\n"
                content += "".join(vat_exempt_items)
                                

            content += f"\nNo of Items: {invoice.total_qty}\n"
            content += f"Subtotal: {invoice.net_total}\n"
            content += f"AMOUNT DUE: {invoice.grand_total}\n"

            for payment in invoice.payments:
                if payment.amount != 0:
                    content += f"{payment.mode_of_payment}: {payment.amount}\n"

            content += f"TOTAL PAYMENTS: {invoice.paid_amount}\n"
            content += f"CHANGE: {invoice.change_amount}\n"

            content += "\nSALES SUMMARY:\n"
            content += f"VATable: {invoice.custom_vatable_sales}\n"
            content += f"VAT Exempt: {invoice.custom_vat_exempt_sales}\n"
            content += f"Zero Rated: {invoice.custom_zero_rated_sales}\n"
            content += f"VAT 12%: {invoice.total_taxes_and_charges}\n"

            content += f"Clerk: {invoice.custom_pa_name}\n"
            content += f"Cashier: {invoice.custom_cashier_name}\n"
            content += f"Printed: {format_datetime(invoice.creation)}\n"
            content += "THIS SERVES AS YOUR OFFICIAL RECEIPT"
            content += "\nDefective or Damaged items may be returned within 7 days. \nBring this receipt. Conditions Apply.\n"
            content += f"{invoice.company}\n"
            content += f"{company_country}\n"
            content += f"VAT REG. TIN: {tax_id}\n"
            content += f"Corner R Magsaysay Ave. & D. Suazo St. Davao City\n"
            content += f"ACCR.NO:{invoice.custom_accr}\n"
            content += f"PTU:{invoice.custom_ptu}\n"
            
            if invoice.custom_printed_no != 0:
                content += f"REPRINTED: { invoice.custom_printed_no }\n"
            content += "\n-----------------------------------------------------\n\n"
          

            # Update the warehouse's content
            warehouse_contents[invoice_warehouse] = content

        return warehouse_contents

    except Exception as e:
        frappe.log_error(f"Error exporting POS invoices: {str(e)}", "POS Invoice Export Error")
        return {"message": f"An error occurred while exporting invoices: {str(e)}"}

