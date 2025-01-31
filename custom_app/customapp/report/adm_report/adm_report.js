frappe.query_reports["ADM Report"] = {
    "filters": [
        {
            "fieldname": "date_from",
            "label": __("From Date"),
            "fieldtype": "Date",
            "reqd": 1
        },
        {
            "fieldname": "date_to",
            "label": __("To Date"),
            "fieldtype": "Date",
            "reqd": 1
        },
		{
            "fieldname": "item_code",
            "label": __("Item Code"),
            "fieldtype": "Link",
			"options": "Item",
            "reqd": 0
        },
		{
            "fieldname": "warehouse",
            "label": __("Branch/Warehouse"),
            "fieldtype": "Link",
			"options": "Warehouse",
            "reqd": 0
        }
        
    ],

    "onload": function(report) {
        // Additional logic when the report is loaded, if needed
    },

    "formatter": function(value, row, column, data, default_formatter) {
        // Custom formatting logic if needed
        return default_formatter(value, row, column, data);
    }
};
