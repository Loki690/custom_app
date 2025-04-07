import frappe
from datetime import datetime
import io

def format_purchase_order_date(date_string):
    """
    Converts date from YYYY-MM-DD to YYYYMMDD format.
    """
    try:
        return datetime.strptime(date_string, "%Y-%m-%d").strftime("%Y%m%d")
    except ValueError:
        return "00000000"  # Default in case of an invalid date

@frappe.whitelist()
def export_purchase_order_txt(purchase_order, type):
    """
    Generates a purchase order TXT data and returns it as a string (no file storage).
    """
    # Set the report format based on type
    if type == "ZPC":
        report_format = "70070522724"
    elif type == "MDI":
        report_format = "70536683"
    else:
        report_format = ""
        
        
    purchase_orders = frappe.db.sql("""
        SELECT 
            poi.item_code AS client_material_number,
            CAST(poi.qty AS UNSIGNED) AS ordered_quantity,  
            CASE WHEN poi.is_free_item = 1 THEN 'B' ELSE '' END AS bonus_line,
            po.transaction_date AS purchase_order_date,  
            poi.rate AS unit_price,
            '' AS ship_to_number,  
            po.name AS purchase_order_number,  
            poi.is_free_item,  
            COALESCE(item_supplier.supplier_part_no, '') AS zpc_material_number  -- Ensure non-null value
        FROM 
            `tabPurchase Order Item` poi
        JOIN 
            `tabPurchase Order` po ON poi.parent = po.name
        LEFT JOIN
            `tabItem Supplier` item_supplier 
            ON poi.item_code = item_supplier.parent 
            AND item_supplier.supplier = po.supplier
        WHERE 
            po.name = %(purchase_order)s  -- Filter by Purchase Order
        ORDER BY 
            poi.item_code ASC
    """, {"purchase_order": purchase_order}, as_dict=True)

    if not purchase_orders:
        frappe.throw(f"No items found for Purchase Order: {purchase_order}")

    # Define field widths based on the fixed format (153 total width)
    field_widths = [8, 20, 6, 1, 20, 8, 9, 8, 20, 35, 18]  # Matches provided specs

    # Use StringIO to store the output as a string
    output = io.StringIO()

    for order in purchase_orders:
        # Convert date format
        formatted_date = format_purchase_order_date(str(order.get("purchase_order_date", "")).strip())

        # Format unit price properly with 2 decimal places
        unit_price = f"{float(order.get('unit_price', 0)):.2f}".ljust(field_widths[6])

        # Construct the fixed-width line
        line = "".join([
            " " * field_widths[0],  # SPACE 1
            str(order.get("client_material_number", "")).ljust(field_widths[1]),  # Material Number
            str(order.get("ordered_quantity", "")).ljust(field_widths[2]),  # Ordered Quantity
            order.get("bonus_line", " ").ljust(field_widths[3]),  # Bonus indicator
            " " * field_widths[4],  # SPACE 2
            formatted_date.ljust(field_widths[5]),  # Purchase Order Date
            unit_price,
            " " * field_widths[7],  # SPACE 3
            str(report_format).ljust(field_widths[8]),  # Ship To Number
            str(order.get("purchase_order_number", "")).ljust(field_widths[9]),  # PO Number
            str(order.get("zpc_material_number", "")).ljust(field_widths[10]),  # ZPC Material Number (ensured non-null)
        ]).ljust(153)  # Ensure total width is exactly 153 characters

        output.write(line + "\n\n\n")  # Add two blank lines after each data row

    return output.getvalue()  # Return the TXT data as a string
