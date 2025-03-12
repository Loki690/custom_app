import frappe

@frappe.whitelist()
def get_reconciliation_report(date, branch):
    query = """
        SELECT
            bin.item_code AS item_code,
            pii.item_name AS item_name,
            bin.warehouse AS warehouse,
            bin.actual_qty AS system_qty,
            COALESCE(SUM(CASE 
                WHEN pi.status = 'Paid' AND pi.set_warehouse = bin.warehouse THEN pii.qty
                ELSE 0
            END), 0) AS paid_qty,
            (bin.actual_qty - COALESCE(SUM(CASE 
                WHEN pi.status = 'Paid' AND pi.set_warehouse = bin.warehouse THEN pii.qty
                ELSE 0
            END), 0)) AS discrepancy,
            CASE 
                WHEN COALESCE(SUM(CASE 
                    WHEN pi.status = 'Paid' AND pi.set_warehouse = bin.warehouse THEN pii.qty
                    ELSE 0
                END), 0) > bin.actual_qty THEN 'For Reconciliation'
                ELSE 'In Balance'
            END AS reconciliation_status
        FROM
            `tabBin` bin
        LEFT JOIN
            `tabPOS Invoice Item` pii ON pii.item_code = bin.item_code
        LEFT JOIN
            `tabPOS Invoice` pi ON pi.name = pii.parent
        WHERE
            pi.posting_date = %(date)s  -- Filter by specified date
            AND   bin.warehouse = %(branch)s
        GROUP BY
            bin.item_code, bin.warehouse
        HAVING
            COALESCE(SUM(CASE 
                WHEN pi.status = 'Paid' AND pi.set_warehouse = bin.warehouse THEN pii.qty
                ELSE 0
            END), 0) > bin.actual_qty
        ORDER BY
            bin.warehouse, bin.item_code;
    """
    data = frappe.db.sql(query, {"date": date, "branch":branch }, as_dict=True)
    return data
