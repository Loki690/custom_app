// Copyright (c) 2024, joncsr and contributors
// For license information, please see license.txt

frappe.query_reports["Item Balance"] = {
    "filters": [
        // {
        //     "fieldname": "from_date",
        //     "label": __("From Date"),
        //     "fieldtype": "Date",
        //     "default": frappe.datetime.add_months(frappe.datetime.get_today(), -1),
        //     "reqd": 1
        // },
        // {
        //     "fieldname": "to_date",
        //     "label": __("To Date"),
        //     "fieldtype": "Date",
        //     "default": frappe.datetime.get_today(),
        //     "reqd": 1
        // },
        {
			"fieldname": "warehouse",
			"label": __("Warehouse"),
			"fieldtype": "Link",
			"default": "DC-Vinzon - ADC",
			"options": "Warehouse",
			"reqd": 0,
			"read_only": 1
		},		
        {
            "fieldname": "supplier",
            "label": __("Supplier"),
            "fieldtype": "Link",
            "options": "Supplier",
            "reqd": 0
        },
		{
            "fieldname": "custom_principal",
            "label": __("Principal"),
            "fieldtype": "Link",
            "options": "Principal",
            "reqd": 0
        },
        {
            "fieldname": "item",
            "label": __("Item"),
            "fieldtype": "Link",
            "options": "Item",
            "reqd": 0
        }
    ]
};
erpnext.utils.add_inventory_dimensions("Item Balance", 8);