import frappe
from frappe import _

def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    return columns, data

def get_columns():
    return [
        {
            "label": _("Warehouse"),
            "fieldname": "warehouse",
            "fieldtype": "Link",
            "options": "Warehouse",
            "width": 150
        },
        {
            "label": _("Item Code"),
            "fieldname": "item_code",
            "fieldtype": "Link",
            "options": "Item",
            "width": 150
        },
        {
            "label": _("Item Name"),
            "fieldname": "item_name",
            "fieldtype": "Data",
            "width": 200
        },
        {
            "label": _("Principal"),
            "fieldname": "principal",
            "fieldtype": "Data",
            "width": 150
        },
        {
            "label": _("Suppliers"),
            "fieldname": "suppliers",
            "fieldtype": "Data",
            "width": 200
        },
        {
            "label": _("Total Sold QTY"),
            "fieldname": "total_sold_qty",
            "fieldtype": "Float",
            "width": 150
        },
        {
            "label": _("UOM"),
            "fieldname": "uom",
            "fieldtype": "Data",
            "width": 100
        },
        {
            "label": _("In Transit Warehouse"),
            "fieldname": "in_transit_warehouse",
            "fieldtype": "Link",
            "options": "Warehouse",
            "width": 150
        },
        {
            "label": _("No. of Days"),
            "fieldname": "num_days",
            "fieldtype": "Int",
            "width": 120
        },
        {
            "label": _("ADM"),
            "fieldname": "adm",
            "fieldtype": "Float",
            "width": 120
        },
        {
            "label": _("QoH"),
            "fieldname": "qoh",
            "fieldtype": "Int",
            "width": 120
        },
        {
            "label": _("Incoming"),
            "fieldname": "incoming_qty",
            "fieldtype": "Int",
            "width": 120
        },
        {
            "label": _("Re-order Point"),
            "fieldname": "reorder_point",
            "fieldtype": "Int",
            "width": 120
        },
        {
            "label": _("Suggest Order"),
            "fieldname": "suggest_order",
            "fieldtype": "Int",
            "width": 120
        },
        {
            "label": _("Standard Buying UOM"),
            "fieldname": "standard_buying_uom",
            "fieldtype": "Data",
            "width": 150
        },
        {
            "label": _("UOM Conversion"),
            "fieldname": "uom_conversion",
            "fieldtype": "Float",
            "width": 120
        },
        {
            "label": _("Suggested Buying"),
            "fieldname": "suggested_buying",
            "fieldtype": "Float",
            "width": 150
        },
        {
            "label": _("Final Order"),
            "fieldname": "final_order",
            "fieldtype": "Data",
            "width": 150
        },
        {
            "label": _("Standard Buying Cost"),
            "fieldname": "standard_buying_cost",
            "fieldtype": "Currency",
            "width": 150
        },
        {
            "label": _("Total Buying Cost"),
            "fieldname": "total_buying_cost",
            "fieldtype": "Currency",
            "width": 150
        },
        {
            "label": _("Bounce Qty"),
            "fieldname": "bounce_qty",
            "fieldtype": "Float",
            "width": 120
        },
        {
            "label": _("Purchase Request Qty"),
            "fieldname": "purchase_request_qty",
            "fieldtype": "Float",
            "width": 150
        },
        {
            "label": _("Stock Last Sold Days"),
            "fieldname": "stock_last_sold_days",
            "fieldtype": "Int",
            "width": 150
        },
        {
            "label": _("Total Inventory Value"),
            "fieldname": "total_inventory_value",
            "fieldtype": "Currency",
            "width": 150
        }
    ]

def get_data(filters):
    conditions = []
    supplier_conditions = []

    query_filters = {}

    # Adding date filter to the conditions
    if filters.get("date_from"):
        conditions.append("si.posting_date >= %(date_from)s")
        query_filters["date_from"] = filters.get("date_from")

    if filters.get("date_to"):
        conditions.append("si.posting_date <= %(date_to)s")
        query_filters["date_to"] = filters.get("date_to")
        
    if filters.get("suppliers"):
        supplier_conditions.append("isup.supplier = %(suppliers)s")
        query_filters["suppliers"] = filters.get("suppliers")

    if not filters.get("include_transit_warehouses"):
        supplier_conditions.append("""
            bin.warehouse NOT IN (
                'Warehouse Transit - ADC',
                'Anda - Transit - ADC',
                'Agdao - Transit  - ADC',
                'Bangkal - Transit - ADC',
                'Bankerohan - Transit - ADC',
                'Bansalan - Transit - ADC',
                'Bonifacio - Transit - ADC',
                'Buhangin - Transit - ADC',
                'Bukidnon Quezon - Transit - ADC',
                'Bukidnon Valencia - Transit - ADC',
                'Cabantian - Transit - ADC',
                'Calinan - Transit - ADC',
                'Catalunan  Grande - Transit - ADC',
                'CSD - Transit - ADC',
                'DC-Vinzon - Transit - ADC',
                'Digos Lim - Transit - ADC',
                'Digos Rizal - Transit - ADC',
                'DLPC - Transit - ADC',
                'Gensan Lagao - Transit - ADC',
                'Gensan Santiago - Transit - ADC',
                'Guerrero - Transit - ADC',
                'Indangan - Transit - ADC',
                'Kidapawan Galang - Transit - ADC',
                'Kidapawan Quezon - Transit - ADC',
                'Koronadal - Transit - ADC',
                'Magsaysay - Transit - ADC',
                'Mangagoy - Transit - ADC',
                'Matina - Transit - ADC',
                'Mintal - Transit - ADC',
                'Nabunturan - Transit - ADC',
                'NHA Buhangin - Transit - ADC',
                'Panabo Cainglet Medical Hospital - Transit - ADC',
                'Panabo Quezon - Transit - ADC',
                'Panacan - Transit - ADC',
                'Polomolok - Transit - ADC',
                'Quirino - Transit - ADC',
                'SPMC 1 - Transit - ADC',
                'SPMC 2 - Transit - ADC',
                'Suazo - Transit - ADC',
                'Tagum Abad Santos - Transit - ADC',
                'Tagum Apokon - Transit - ADC',
                'Tagum Bonifacio - Transit - ADC',
                'Tagum Visayan Village - Transit - ADC',
                'Toril - Transit - ADC',
                'Milan - Transit - ADC',
                'Return - Transit  - ADC',
                'Re-Packing - Transit - ADC',
                'Agdao-Returns - ADC',
                'Anda-Returns - ADC',
                'Bangkal-Returns - ADC',
                'Bankerohan-Returns - ADC',
                'Bansalan-Returns - ADC',
                'Bonifacio-Returns - ADC',
                'Buhangin-Returns - ADC',
                'Cabantian-Returns - ADC',
                'Calinan-Returns - ADC',
                'Catalunan Grande-Returns - ADC',
                'Digos Lim-Returns - ADC',
                'Digos Rizal-Returns - ADC',
                'DLPC-Returns - ADC',
                'Gensan Santiago-Returns - ADC',
                'Gensan Lagao-Returns - ADC',
                'Guerrero-Returns - ADC',
                'Indangan-Returns - ADC',
                'Kidapawan Quezon-Returns - ADC',
                'Kidapawan Galang-Returns - ADC',
                'Koronadal-Returns - ADC',
                'Magsaysay-Returns - ADC',
                'Mangagoy-Returns - ADC',
                'Matina-Returns - ADC',
                'Milan-Returns - ADC',
                'Mintal-Returns - ADC',
                'Nabunturan-Returns - ADC',
                'NHA Buhangin-Returns - ADC',
                'Panabo Cainglet Medical Hospital-Returns - ADC',
                'Panabo Quezon-Returns - ADC',
                'Panacan-Returns - ADC',
                'Polomolok-Returns - ADC',
                'Bukidnon Quezon-Returns - ADC',
                'Quirino-Returns - ADC',
                'SPMC 1-Returns - ADC',
                'SPMC 2-Returns - ADC',
                'Suazo-Returns - ADC',
                'Tagum Bonifacio-Returns - ADC',
                'Tagum Abad Santos-Returns - ADC',
                'Tagum Apokon-Returns - ADC',
                'Tagum Visayan Village-Returns - ADC',
                'Toril-Returns - ADC',
                'Bukidnon Valencia-Returns - ADC',
                'CSD-Returns - ADC',
                'DC-Vinzon-Returns - ADC',
                'Main Returns - ADC'
            )
        """)

    # If no conditions, default to always true
    filters = " AND ".join(supplier_conditions) if conditions else "1=1"

    date_range =  " AND ".join(conditions) if conditions else "1=1"

    query = f"""
        SELECT
            bin.warehouse AS warehouse,
            bin.item_code AS item_code,
            i.item_name AS item_name, 
            i.custom_principal AS principal,
            GROUP_CONCAT(DISTINCT s.supplier_name SEPARATOR ', ') AS suppliers,
            COALESCE(total_sold.total_qty_sold, 0) AS total_sold_qty,
            'PC' AS uom,
            w.default_in_transit_warehouse AS in_transit_warehouse,
            DATEDIFF(%(date_to)s, %(date_from)s) + 1 AS  num_days,
                -- Average Daily Sold (ADM)
            COALESCE(total_sold.total_qty_sold / NULLIF(DATEDIFF(%(date_to)s, %(date_from)s) + 1, 0), 0) AS adm,
            bin.actual_qty AS qoh,
            COALESCE(transit_bin.actual_qty, 0) AS incoming_qty,
                -- Re-order Point Calculation
            COALESCE(total_sold.total_qty_sold / NULLIF(DATEDIFF(%(date_to)s, %(date_from)s) + 1, 0) * 37, 0) AS reorder_point,
                -- Suggested Order Calculation
            COALESCE(((total_sold.total_qty_sold / NULLIF(DATEDIFF(%(date_to)s, %(date_from)s) + 1, 0)) * 37) - 
            (bin.actual_qty + COALESCE(transit_bin.actual_qty, 0)), 0) AS suggest_order,
            ip.uom AS standard_buying_uom,
            CASE 
                WHEN ip.uom = 'PC' THEN 1
                ELSE COALESCE(ucf.value, 1)
            END AS uom_conversion,

            COALESCE(((total_sold.total_qty_sold / NULLIF(DATEDIFF(%(date_to)s, %(date_from)s) + 1, 0)) * 37 - 
            (bin.actual_qty + COALESCE(transit_bin.actual_qty, 0))) / 
            CASE 
                WHEN ip.uom = 'PC' THEN 1
                ELSE COALESCE(ucf.value, 1)
            END, 0) AS suggested_buying,

            CEIL(
                COALESCE(((total_sold.total_qty_sold / NULLIF(DATEDIFF(%(date_to)s, %(date_from)s) + 1, 0)) * 37 - 
                (bin.actual_qty + COALESCE(transit_bin.actual_qty, 0))) / 
                CASE 
                    WHEN ip.uom = 'PC' THEN 1
                    ELSE COALESCE(ucf.value, 1)
                END, 0)
            ) AS final_order,

            ip.price AS standard_buying_cost,

            CEIL(
                COALESCE(((total_sold.total_qty_sold / NULLIF(DATEDIFF(%(date_to)s, %(date_from)s) + 1, 0)) * 37 - 
                (bin.actual_qty + COALESCE(transit_bin.actual_qty, 0))) / 
                CASE 
                    WHEN ip.uom = 'PC' THEN 1
                    ELSE COALESCE(ucf.value, 1)
                END, 0)
            ) * ip.price AS total_buying_cost,



            COALESCE(bounce.bounce_qty, 0) AS bounce_qty,
            COALESCE(purchase.purchase_request_qty, 0) AS purchase_request_qty,

            -- Stock Ageing Subquery
            COALESCE(last_sale.days_since_last_sale, 0) AS stock_last_sold_days,
            
            (CEIL(
                COALESCE(((total_sold.total_qty_sold / NULLIF(DATEDIFF(%(date_to)s, %(date_from)s) + 1, 0)) * 37 - 
                (bin.actual_qty + COALESCE(transit_bin.actual_qty, 0))) / 
                CASE 
                    WHEN ip.uom = 'PC' THEN 1
                    ELSE COALESCE(ucf.value, 1)
                END, 0)
            ) + (bin.actual_qty / 
                CASE 
                    WHEN ip.uom = 'PC' THEN 1
                    ELSE COALESCE(ucf.value, 1)
                END)
            ) * ip.price AS total_inventory_value

        FROM
            `tabBin` bin
        JOIN
            `tabItem` i ON i.name = bin.item_code
        LEFT JOIN
            `tabWarehouse` w ON w.name = bin.warehouse
        LEFT JOIN
            `tabBin` transit_bin ON transit_bin.item_code = bin.item_code AND transit_bin.warehouse = w.default_in_transit_warehouse
        LEFT JOIN (
            SELECT parent AS item_code, MIN(supplier) AS supplier
            FROM `tabItem Supplier`
            GROUP BY parent
        ) isup ON isup.item_code = i.name
        LEFT JOIN `tabSupplier` s ON s.name = isup.supplier
        LEFT JOIN (
            SELECT item_code, MIN(price_list_rate) AS price, uom
            FROM `tabItem Price`
            WHERE price_list = 'Standard Buying'
            GROUP BY item_code
        ) ip ON ip.item_code = bin.item_code
        LEFT JOIN (
            SELECT from_uom, value
            FROM `tabUOM Conversion Factor`
            GROUP BY from_uom
        ) ucf ON ucf.from_uom = ip.uom
        LEFT JOIN (
            -- Subquery to get consolidated bounce quantities per item per warehouse
            SELECT 
                mri.item_code,
                mri.warehouse,
                SUM(mri.qty * mri.conversion_factor) AS bounce_qty
            FROM 
                `tabMaterial Request` mr
            JOIN 
                `tabMaterial Request Item` mri ON mri.parent = mr.name
            WHERE 
                mr.custom_is_bounce = 1
                AND mr.docstatus != 2
                AND mr.transaction_date BETWEEN %(date_from)s AND %(date_to)s
            GROUP BY 
                mri.item_code, mri.warehouse
        ) bounce ON bounce.item_code = bin.item_code AND bounce.warehouse = bin.warehouse

        LEFT JOIN (
            -- Subquery to get consolidated bounce quantities per item per warehouse
            SELECT 
                mri.item_code,
                mri.warehouse,
                SUM(mri.qty * mri.conversion_factor) AS purchase_request_qty
            FROM 
                `tabMaterial Request` mr
            JOIN 
                `tabMaterial Request Item` mri ON mri.parent = mr.name
            WHERE 
                mr.material_request_type = "Purchase"
                AND mr.docstatus != 2
                AND mr.transaction_date BETWEEN %(date_from)s AND %(date_to)s
            GROUP BY 
                mri.item_code, mri.warehouse
        ) purchase ON purchase.item_code = bin.item_code AND purchase.warehouse = bin.warehouse

        LEFT JOIN (
            -- Subquery to calculate days since last sale
            SELECT 
                sii.item_code,
                sii.warehouse,
                DATEDIFF(CURDATE(), MAX(si.posting_date)) AS days_since_last_sale
            FROM 
                `tabSales Invoice Item` sii
            JOIN 
                `tabSales Invoice` si ON si.name = sii.parent
            WHERE 
                si.docstatus = 1  -- Only include submitted invoices
            GROUP BY 
                sii.item_code, sii.warehouse
        ) last_sale ON last_sale.item_code = bin.item_code AND last_sale.warehouse = bin.warehouse

        LEFT JOIN (
            -- Subquery to get total quantity sold per item per warehouse within the date range
            SELECT 
                sii.item_code,
                sii.warehouse,
                SUM(sii.qty * sii.conversion_factor) AS total_qty_sold
            FROM 
                `tabSales Invoice Item` sii
            JOIN 
                `tabSales Invoice` si ON si.name = sii.parent
            WHERE 
                si.docstatus = 1
                AND {date_range}
            GROUP BY 
                sii.item_code, sii.warehouse
        ) total_sold ON total_sold.item_code = bin.item_code AND total_sold.warehouse = bin.warehouse

        WHERE
                {filters}
        GROUP BY
            bin.warehouse, bin.item_code, i.item_code, i.item_name, i.custom_principal, bin.actual_qty, w.default_in_transit_warehouse, transit_bin.actual_qty, ip.uom, ip.price, ucf.value, bin.creation

        ORDER BY
            bin.warehouse ASC, bin.item_code ASC;

    """

    return frappe.db.sql(query, query_filters, as_dict=True)
