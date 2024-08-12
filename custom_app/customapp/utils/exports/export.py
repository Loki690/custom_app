# custom_app/customapp/utils/export_data.py
import frappe
import csv

def export_sales_orders():
    sales_orders = frappe.get_all('Sales Order', fields=['name', 'customer', 'transaction_date', 'total'])
    file_path = '/path/to/sales_orders.csv'
    
    with open(file_path, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['Name', 'Customer', 'Transaction Date', 'Total'])
        for so in sales_orders:
            writer.writerow([so.name, so.customer, so.transaction_date, so.total])
    
    return file_path

@frappe.whitelist()
def export_sales_orders_to_csv():
    file_path = export_sales_orders()
    return file_path
