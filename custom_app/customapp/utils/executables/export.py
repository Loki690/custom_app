import json
import frappe
from frappe.utils import cint, format_datetime
import os
import zipfile

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
def export_multiple_pos_invoices_all_warehouse(from_date, to_date, pos_profile):
    
    
    # Fetch all POS Invoices POS Profile under the warehouse
    
    
    try:
        # Build base query with required fields
        query = """
            SELECT 
                pos.name AS invoice_name,
                pos.custom_invoice_series,
                pos.set_warehouse,
                pos.company,
                pos.posting_date,
                pos.customer,
                pos.customer_name,
                pos.total_qty,
                pos.net_total,
                pos.grand_total,
                pos.paid_amount,
                pos.change_amount,
                pos.status,
                pos.custom_vat_reg_tin,
                pos.custom_min,
                pos.custom_sn,
                pos.custom_pa_name,
                pos.custom_cashier_name,
                pos.creation,
                pos.custom_accr,
                pos.custom_ptu,
                pos.custom_printed_no,
                pos.address_display,
                pos.contact_mobile,
                pos.customer_group,
                pos.pos_profile,
                pos.custom_vatable_sales,
                pos.custom_vat_exempt_sales,
                pos.custom_zero_rated_sales,
                pos.total_taxes_and_charges,
                company.country AS company_country,
                company.tax_id AS company_tax_id,
                customer.custom_osca_id,
                customer.custom_pwd_id
            FROM 
                `tabPOS Invoice` pos
            LEFT JOIN 
                `tabCompany` company ON pos.company = company.name
            LEFT JOIN 
                `tabCustomer` customer ON pos.customer = customer.name
            WHERE 
                pos.posting_date BETWEEN %(from_date)s AND %(to_date)s
                AND pos.docstatus != 2
        """

        # If a warehouse is specified, add it to the query
        if pos_profile:
            query += " AND pos.pos_profile = %(pos_profile)s"

        # Order by invoice series
        query += " ORDER BY pos.custom_invoice_series ASC"

        # Execute the query
        pos_invoices = frappe.db.sql(query, {"from_date": from_date, "to_date": to_date, "pos_profile": pos_profile}, as_dict=True)

        if not pos_invoices:
            return {"message": "No invoices found for the specified criteria."}

        # Dictionary to hold the content for each warehouse
        profile_contents = {}
        processed_series = set()

        for invoice in pos_invoices:
            # Check if this invoice's series has already been processed
            if invoice['custom_invoice_series'] in processed_series:
                continue

            # Mark this series as processed
            processed_series.add(invoice['custom_invoice_series'])

          # Initialize content for the POS Profile if not already initialized
            if invoice['pos_profile'] not in profile_contents:
                profile_contents[invoice['pos_profile']] = ""

            # Prepare content string for the invoice
            content = profile_contents[invoice['pos_profile']]

            # Fetch customer ID (OSCA or PWD)
            customer_id = invoice.get('custom_osca_id') or invoice.get('custom_pwd_id', '')

            # Construct the invoice details
            content += f"{invoice['company']}\n"
            content += f"VAT REG. TIN: {invoice['custom_vat_reg_tin']}\n"
            content += f"{invoice['address_display']}\n"
            # content += f"{invoice['contact_mobile']}\n"
            content += f"MIN:{invoice['custom_min']}\n"
            content += f"SN:{invoice['custom_sn']}\n"
            content += f"\nStatus: {invoice['status']}\n"
            content += f"Branch: {invoice['set_warehouse']}\n"
            content += f"POS Profile: {invoice['pos_profile']}\n"
            content += f"POS Invoice: {invoice['custom_invoice_series']}\n"
            content += f"Date: {invoice['posting_date']}\n"
            content += f"Sold To: {invoice['customer_name']}\n"
            content += f"OSCA/PWD ID: {customer_id}\n"
            content += "Address: \nTIN#: \n"
            content += f"Business Type: {invoice['customer_group']}\n"
            content += "Signature: \nRewards Card Serial: \nPoints Earned: \n"
            content += "\nPARTICULARS\n"
            
                    # Fetch and list the invoice items
            items_query = """
                SELECT 
                    item_code, item_name, qty, rate, amount, discount_percentage, item_tax_template, serial_no, custom_batch_number, custom_batch_expiry, uom
                FROM 
                    `tabPOS Invoice Item`
                WHERE 
                    parent = %(invoice_name)s
            """
            items = frappe.db.sql(items_query, {"invoice_name": invoice['invoice_name']}, as_dict=True)
            
            # Check the customer group and categorize items
            if invoice.get('customer_group') == "Zero Rated":
                # Zero Rated Sales Section
                content += "\nZERO RATED SALES\n"
                for item in items:
                    content += f"{item['item_name']} - {item['qty']}/{item['uom']} "
                    if item.get('discount_percentage'):
                        content += f"L{item['discount_percentage']}% "
                    content += f" {item['rate']}   {item['amount']}\n"
                    if item.get('custom_batch_number'):
                        content += f"Batch: {item['custom_batch_number']} Exp: {item.get('custom_batch_expiry')}\n"
            elif any(item.get('item_tax_template') == 'Philippines Tax - ADC' for item in items):
                # VAT Sales Section
                content += "\nVAT SALES\n"
                for item in items:
                    if item.get('item_tax_template') == 'Philippines Tax - ADC':
                        content += f"{item['item_name']}  {item['qty']}/{item['uom']}"
                        if item.get('discount_percentage'):
                            content += f" L{item['discount_percentage']}%"
                        content += f" {item['rate']}   {item['amount']}\n"
                        if item.get('custom_batch_number'):
                            content += f"Batch: {item['custom_batch_number']} Exp: {item.get('custom_batch_expiry')}\n"
            elif any(item.get('item_tax_template') == 'Philippines Tax Exempt - ADC' for item in items):
                # VAT Exempt Sales Section
                content += "\nVAT EXEMPT SALES\n"
                for item in items:
                    if item.get('item_tax_template') == 'Philippines Tax Exempt - ADC':
                        content += f"{item['item_name']}  {item['qty']}/{item['uom']}"
                        if item.get('discount_percentage'):
                            if invoice.get('customer_group') in ["Senior Citizen", "PWD"]:
                                content += f" LV{item['discount_percentage']}%"
                            else:
                                content += f"L{item['discount_percentage']}%"
                        content += f" {item['rate']}   {item['amount']}\n"
                        if item.get('custom_batch_number'):
                            content += f"Batch: {item['custom_batch_number']} Exp: {item.get('custom_batch_expiry')}\n"

            # Summaries
            content += f"\nNo of Items: {invoice['total_qty']}\n"
            content += f"Subtotal: {invoice['net_total']}\n"
            content += f"AMOUNT DUE: {invoice['grand_total']}\n"

            # Payments (fetch payments using a separate query if needed)
            payments_query = """
                SELECT mode_of_payment, amount
                FROM `tabSales Invoice Payment`
                WHERE parent = %(invoice_name)s
            """
            payments = frappe.db.sql(payments_query, {"invoice_name": invoice['invoice_name']}, as_dict=True)
            for payment in payments:
                if payment['amount'] != 0:
                    content += f"{payment['mode_of_payment']}: {payment['amount']}\n"

            content += f"TOTAL PAYMENTS: {invoice['paid_amount']}\n"
            content += f"CHANGE: {invoice['change_amount']}\n"

            # Sales Summary
            content += "\nSALES SUMMARY:\n"
            content += f"VAtable: {invoice['custom_vatable_sales']}\n"
            content += f"Vat Exempt: {invoice['custom_vat_exempt_sales']}\n"
            content += f"Zero Rated: {invoice['custom_zero_rated_sales']}\n"
            content += f"Government: {invoice['custom_zero_rated_sales']}\n"
            content += f"VAT 12%: {invoice['total_taxes_and_charges']}\n"

            # Footer details
            content += f"\nClerk: {invoice['custom_pa_name']}\n"
            content += f"Cashier: {invoice['custom_cashier_name']}\n"
            content += f"\nPrinted: {format_datetime(invoice['creation'])}\n"
            content += "THIS SERVES AS YOUR OFFICIAL RECEIPT\n"
            content += f"{invoice['company']}\n"
            content += f"{invoice['company_country']}\n"
            content += f"VAT REG. TIN: {invoice['company_tax_id']}\n"
            content += "Corner R Magsaysay Ave. & D. Suazo St. Davao City\n"
            content += f"ACCR.NO:{invoice['custom_accr']}\n"
            content += f"PTU:{invoice['custom_ptu']}\n"
            if invoice['custom_printed_no'] != 0:
                content += f"REPRINTED: {invoice['custom_printed_no']}\n"
            content += "\n-----------------------------------------------------\n\n"

            # Update warehouse content
            profile_contents[invoice['pos_profile']] = content

        return profile_contents

    except Exception as e:
        frappe.log_error(f"Error exporting POS invoices: {str(e)}", "POS Invoice Export Error")
        return {"message": f"An error occurred while exporting invoices: {str(e)}"}


@frappe.whitelist()
def export_all_pos_profile_data():
    from_date = "2024-12-01" 
    to_date = "2024-12-31"

    pos_profiles = frappe.get_all('POS Profile', filters={'disabled': 0}, fields=['name'])

    all_files = []
    temp_dir = "/tmp/pos_profiles"

    # Create a temporary directory to store the text files
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)

    for profile in pos_profiles:
        profile_name = profile['name']
        profile_content = export_multiple_pos_invoices_all_warehouse(from_date, to_date, profile_name)
        profile_content = json.dumps(profile_content, indent=4)  # Convert dictionary to a formatted string

        file_path = os.path.join(temp_dir, f"{profile_name}.txt")
        with open(file_path, "w") as file:
            file.write(profile_content)

        all_files.append(file_path)

    # Return all file paths directly
    return all_files
