# Copyright (c) 2025, joncsr and contributors
# For license information, please see license.txt

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
            "width": 100,
        },
        {
            "label": "Principal",
            "fieldname": "custom_principal",
            "fieldtype": "Data",
            "width": 100,
        },
        {
            "label": "Item Code",
            "fieldname": "item_code",
            "fieldtype": "Link",
            "options": "Item",
            "width": 100,
        },
        {
            "label": "Item Name",
            "fieldname": "item_name",
            "fieldtype": "Data",
            "width": 200,
        },
        # {
        #     "label": "Generic Name",
        #     "fieldname": "generic_name",
        #     "fieldtype": "Data",
        #     "width": 200,
        # },
        {
            "label": "UOM Buying",
            "fieldname": "uom_buying",
            "fieldtype": "Link",
            "options": "UOM",
            "width": 100,
        },
        {
            "label": "Standard Buying Price",
            "fieldname": "standard_buying",
            "fieldtype": "Currency",
            "width": 200,
        },
        {
            "label": "PC Buying Conversion Qty",
            "fieldname": "conversion_factor_buying",
            "fieldtype": "Int",
            "width": 100,
        },
        {
            "label": "PC Buying Conversion Price",
            "fieldname": "buying_price_conversion",
            "fieldtype": "Currency",
            "width": 200,
        },
        {
            "label": "UOM Selling",
            "fieldname": "uom_selling",
            "fieldtype": "Link",
            "options": "UOM",
            "width": 100,
        },
        {
            "label": "Standard Selling",
            "fieldname": "standard_selling",
            "fieldtype": "Currency",
            "width": 200,
        },
        {
            "label": "PC Selling Conversion Qty",
            "fieldname": "conversion_factor_selling",
            "fieldtype": "Int",
            "width": 100,
        },
        {
            "label": "PC Selling Conversion Price",
            "fieldname": "selling_price_conversion",
            "fieldtype": "Currency",
            "width": 200,
        },
        {
            "label": "Difference",
            "fieldname": "difference",
            "fieldtype": "Currency",
            "width": 200,
        },
        {
            "label": "Markup",
            "fieldname": "markup_percentage",
            "fieldtype": "Percent",
            "width": 200,
        },
    ]


def get_data(filters):
    conditions = []
    query_filters = {}

    if filters.get("supplier"):
        conditions.append("it_supp.supplier = %(supplier)s")
        query_filters["supplier"] = filters.get("supplier")

    if filters.get("item"):
        conditions.append("i.name = %(item)s")
        query_filters["item"] = filters.get("item")

    if filters.get("custom_principal"):
        conditions.append("i.custom_principal = %(custom_principal)s")
        query_filters["custom_principal"] = filters.get("custom_principal")

    where_clause = " AND ".join(conditions) if conditions else "1=1"

    query = f"""
        SELECT 
            s.supplier_name AS supplier_name,
            i.custom_principal AS custom_principal,
            i.name AS item_code,
            i.item_name AS item_name,
            i.custom_generic_name AS generic_name,
            item_price_buying.uom AS uom_buying,
            item_price_buying.price_list_rate AS standard_buying,
            CASE 
                    WHEN item_price_buying.uom = 'PC' THEN 1
                    ELSE uom_conversion_buying.value
                END AS conversion_factor_buying,

              
                (item_price_buying.price_list_rate / 
                NULLIF(
                    CASE 
                        WHEN item_price_buying.uom = 'PC' THEN 1 
                        ELSE uom_conversion_buying.value 
                    END, 0)
                ) AS buying_price_conversion,
                
            item_price_selling.uom AS uom_selling, 
            item_price_selling.price_list_rate AS standard_selling,
            
            CASE 
                    WHEN item_price_selling.uom = 'PC' THEN 1
                    ELSE uom_conversion_selling.value
                END AS conversion_factor_selling,

              
                (item_price_selling.price_list_rate / 
                NULLIF(
                    CASE 
                        WHEN item_price_selling.uom = 'PC' THEN 1 
                        ELSE uom_conversion_selling.value 
                    END, 0)
                ) AS selling_price_conversion,
                
           -- Difference Calculation
            (
                (item_price_selling.price_list_rate / 
                NULLIF(
                    CASE 
                        WHEN item_price_selling.uom = 'PC' THEN 1 
                        ELSE uom_conversion_selling.value 
                    END, 0)
                ) 
                - 
                (item_price_buying.price_list_rate / 
                NULLIF(
                    CASE 
                        WHEN item_price_buying.uom = 'PC' THEN 1 
                        ELSE uom_conversion_buying.value 
                    END, 0)
                )
            ) AS difference,
            
           (
                (
                    (item_price_selling.price_list_rate / 
                    NULLIF(
                        CASE 
                            WHEN item_price_selling.uom = 'PC' THEN 1 
                            ELSE uom_conversion_selling.value 
                        END, 0)
                    ) 
                    - 
                    (item_price_buying.price_list_rate / 
                    NULLIF(
                        CASE 
                            WHEN item_price_buying.uom = 'PC' THEN 1 
                            ELSE uom_conversion_buying.value 
                        END, 0)
                    )
                ) 
                / 
                NULLIF(
                    (item_price_selling.price_list_rate / 
                    NULLIF(
                        CASE 
                            WHEN item_price_selling.uom = 'PC' THEN 1 
                            ELSE uom_conversion_selling.value 
                        END, 0)
                    ), 0)
            ) * 100 AS markup_percentage
            
            
        FROM
            `tabItem` i
        LEFT JOIN
            `tabItem Supplier` it_supp ON it_supp.parent = i.name
        LEFT JOIN
            `tabSupplier` s ON s.name = it_supp.supplier
        LEFT JOIN
            `tabItem Price` item_price_buying 
            ON i.name = item_price_buying.item_code
            AND item_price_buying.price_list = 'Standard Buying'
        LEFT JOIN 
            `tabItem Price` item_price_selling
            ON item_price_buying.item_code = item_price_selling.item_code 
            AND item_price_selling.price_list = 'Standard Selling'
        LEFT JOIN 
            `tabUOM Conversion Factor` uom_conversion_buying 
            ON item_price_buying.uom = uom_conversion_buying.from_uom
        LEFT JOIN 
            `tabUOM Conversion Factor` uom_conversion_selling 
            ON item_price_selling.uom = uom_conversion_selling.from_uom
        WHERE
            {where_clause}
        ORDER BY
            i.name, s.supplier_name
    """

    return frappe.db.sql(query, query_filters, as_dict=True)


def cosolidate_suppliers(fitters):
    pass


def get_conversion_factor(price_table):
    """
    Returns the SQL expression for fetching the conversion factor.
    If UOM is 'PC', return 1; otherwise, return the UOM conversion value.
    """
    return f"""
        CASE 
            WHEN {price_table}.uom = 'PC' THEN 1
            ELSE COALESCE(uom_conversion_{price_table.split('.')[0][-1]}.value, 1)
        END
    """


def get_converted_price(price_table):
    """
    Returns the SQL expression for fetching the converted price.
    The formula: standard price / conversion factor (with NULLIF to avoid division by zero).
    """
    return f"""
        ({price_table}.price_list_rate / 
         NULLIF({get_conversion_factor(price_table)}, 0))
    """
