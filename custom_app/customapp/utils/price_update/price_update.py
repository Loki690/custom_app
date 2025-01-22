import frappe
import csv
from frappe.utils.file_manager import save_file
from frappe.utils import get_url

@frappe.whitelist()
def supplier_items(supplier=None, principal=None):
    filters = []
    sql_conditions = ""

    # Apply dynamic filtering
    if supplier:
        filters.append("s.name = %(supplier)s")
    if principal:
        filters.append("i.custom_principal = %(principal)s")  # Adjust field based on your schema

    # Combine filters if both provided
    if filters:
        sql_conditions = " AND " + " AND ".join(filters)

    item_prices = frappe.db.sql(
        f"""
        SELECT
            i.name AS item_code,
            i.item_name AS item_name,
            ip.uom AS uom,
            ip.price_list AS price_list,
            ip.price_list_rate AS selling_price,
            ip.name AS item_price_id
        FROM
            `tabItem Price` ip
        JOIN
            `tabItem` i ON ip.item_code = i.name
        LEFT JOIN
            `tabItem Supplier` it_supp ON it_supp.parent = i.name
        LEFT JOIN
            `tabSupplier` s ON s.name = it_supp.supplier
        WHERE
            i.disabled != 1
            {sql_conditions}
        ORDER BY
            i.name ASC
        """,
        {"supplier": supplier, "principal": principal},
        as_dict=True
    )

    # Filter only the standard price lists
    price_list = ["Standard Buying", "Standard Selling"]
    filtered_item_prices = [
        item for item in item_prices if item["price_list"] in price_list
    ]

    return filtered_item_prices



def update_buying_price_on_purchase_invoice(doc, method):
    """Update item buying price when a Purchase Invoice is submitted"""
    for item in doc.items:
        # Update the Item Price for buying
        item_price = frappe.get_value(
            "Item Price", {"item_code": item.item_code, "buying": 1}, "name"
        )

        if item_price:
            frappe.db.set_value(
                "Item Price", item_price, {"price_list_rate": item.rate}
            )
            frappe.msgprint(
                f"Updated buying price for Item: {item.item_code} to {item.rate}"
            )
        else:
            # If no existing buying price, create a new one
            new_item_price = frappe.get_doc(
                {
                    "doctype": "Item Price",
                    "item_code": item.item_code,
                    "price_list": doc.buying_price_list or "Standard Buying",
                    "price_list_rate": item.rate,
                    "buying": 1,
                    "currency": doc.currency,
                }
            )
            new_item_price.insert(ignore_permissions=True)
            frappe.msgprint(f"Created new buying price for Item: {item.item_code}")


def get_item_price(item_code, price_list, uom, supplier=None):
    filters = {"item_code": item_code, "price_list": price_list, "uom": uom}
    if supplier:
        filters["supplier"] = supplier

    try:
        item_price = frappe.get_value(
            "Item Price",
            filters,
            ["price_list_rate", "currency", "uom", "name", "item_name"],
            as_dict=True,
        )
        return item_price
    except Exception as e:
        frappe.log_error(f"Error fetching item price: {str(e)}", "get_item_price")
        return None





