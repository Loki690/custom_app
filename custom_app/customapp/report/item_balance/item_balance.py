import frappe


def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    return columns, data


def get_columns():
    return [
        {
            "label": "Supplier Name",
            "fieldname": "supplier_name",
            "fieldtype": "Data",
            "width": 200,
        },
        {
            "label": "Principal",
            "fieldname": "custom_principal",
            "fieldtype": "Data",
            "width": 200,
        },
        {
            "label": "Warehouse",
            "fieldname": "warehouse",
            "fieldtype": "Link",
            "options": "Warehouse",
            "width": 150,
        },
        {
            "label": "Item Code",
            "fieldname": "item_code",
            "fieldtype": "Link",
            "options": "Item",
            "width": 150,
        },
        {
            "label": "Item Name",
            "fieldname": "item_name",
            "fieldtype": "Data",
            "width": 200,
        },
        {
            "label": "Generic Name",
            "fieldname": "generic_name",
            "fieldtype": "Data",
            "width": 200,
        },
        {
            "label": "UOM",
            "fieldname": "uom",
            "fieldtype": "Link",
            "options": "UOM",
            "width": 100,
        },
        {
            "label": "Stock Balance",
            "fieldname": "actual_qty",
            "fieldtype": "Int",
            "width": 120,
        },
         {
            "label": "Standard Selling",
            "fieldname": "standard_selling",
            "fieldtype": "Currency",
            "width": 100,
        },
    ]


def get_data(filters):
    conditions = []
    query_filters = {}

    if filters.get("warehouse"):
        conditions.append("b.warehouse = %(warehouse)s")
        query_filters["warehouse"] = filters.get("warehouse")

    if filters.get("supplier"):
        conditions.append("it_supp.supplier = %(supplier)s")
        query_filters["supplier"] = filters.get("supplier")

    if filters.get("item"):
        conditions.append("b.item_code = %(item)s")
        query_filters["item"] = filters.get("item")

    if filters.get("custom_principal"):
        conditions.append("i.custom_principal = %(custom_principal)s")
        query_filters["custom_principal"] = filters.get("custom_principal")

    where_clause = " AND ".join(conditions) if conditions else "1=1"

    query = f"""
        SELECT
            s.supplier_name AS supplier_name,
            i.custom_principal AS custom_principal,
            b.warehouse AS warehouse,
            b.item_code AS item_code,
            i.item_name AS item_name,
            i.custom_generic_name as generic_name,
            i.stock_uom AS uom,
            b.actual_qty AS actual_qty,
            item_price.price_list_rate AS standard_selling
        FROM
            `tabBin` b
        LEFT JOIN
            `tabItem` i ON b.item_code = i.name
        LEFT JOIN
            `tabItem Supplier` it_supp ON it_supp.parent = i.name
        LEFT JOIN
            `tabSupplier` s ON s.name = it_supp.supplier
        LEFT JOIN
            `tabItem Price` item_price ON i.name = item_price.item_code AND item_price.price_list = 'Standard Selling'
        WHERE
            {where_clause}
        ORDER BY
            b.item_code, b.warehouse
    """

    return frappe.db.sql(query, query_filters, as_dict=True)
