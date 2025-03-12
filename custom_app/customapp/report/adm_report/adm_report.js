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
            "fieldname": "suppliers",
            "label": __("Suppliers"),
            "fieldtype": "Link",
			"options": "Supplier",
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
