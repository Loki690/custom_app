import frappe
from frappe.utils import cint

@frappe.whitelist()
def get_material_requests_by_supplier(supplier, date_from,  date_to):
    # Fetch data
    results = frappe.db.sql("""
        SELECT
            isup.supplier AS supplier_id,
            mr.name AS material_request,
            mr.transaction_date AS transaction_date,
            mr.material_request_type AS material_request_type,
            mr.set_warehouse AS set_warehouse,
            mri.item_code AS item_code,
            mri.item_name AS item_name,
            
            CASE 
                WHEN mri.custom_principal IS NULL THEN i.custom_principal
                ELSE mri.custom_principal
            END AS principal,
            
            CASE 
                WHEN mri.custom_supplier IS NULL THEN 
                    GROUP_CONCAT(DISTINCT s.supplier_name SEPARATOR ', ')
                ELSE mri.custom_supplier
            END AS supplier,
            
            mri.qty AS quantity,
            mri.uom AS uom
        FROM
            `tabMaterial Request` mr
        LEFT JOIN
            `tabMaterial Request Item` mri ON mri.parent = mr.name
        LEFT JOIN
            `tabItem Supplier` isup ON isup.parent = mri.item_code
        LEFT JOIN
            `tabSupplier` s ON s.name = isup.supplier
        LEFT JOIN
            `tabItem` i ON i.item_code = mri.item_code
        WHERE
            mr.material_request_type = 'Material Issue'
            AND isup.supplier = %(supplier)s    
            AND  mr.transaction_date BETWEEN %(date_from)s AND %(date_to)s
        GROUP BY
            mr.name, mr.transaction_date, mr.material_request_type, mr.set_warehouse,
            mri.item_code, mri.item_name, mri.custom_principal, i.custom_principal,
            mri.qty, mri.uom, mri.custom_supplier
        ORDER BY
            mr.transaction_date DESC, mr.name
    """, {"supplier": supplier, "date_from":date_from, "date_to": date_to}, as_dict=True)

    # Return results
    return results